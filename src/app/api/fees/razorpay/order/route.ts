import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getAuthContext } from "@/lib/auth/context";

const CreateOrderSchema = z.object({
  invoiceId: z.string().min(1, "Invoice ID is required"),
  amount: z.number().positive().optional(),
});

export async function POST(request: Request) {
  try {
    const ctx = await getAuthContext();
    const json = await request.json();
    const parsed = CreateOrderSchema.parse(json);

    // Fetch the invoice and student details
    const invoice = await db.feeInvoice.findUnique({
      where: { id: parsed.invoiceId },
      include: {
        student: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!invoice) {
      return NextResponse.json(
        { success: false, error: "Invoice not found in system" },
        { status: 404 }
      );
    }

    const dueAmount = Math.max(0, Number(invoice.amount) - Number(invoice.paidAmount));
    const finalAmount = parsed.amount && parsed.amount <= dueAmount ? parsed.amount : dueAmount;

    if (finalAmount <= 0) {
      return NextResponse.json(
        { success: false, error: "This invoice is already fully paid" },
        { status: 400 }
      );
    }

    // Razorpay requires amount in Paise (1 INR = 100 Paise)
    const amountInPaise = Math.round(finalAmount * 100);

    const keyId = process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    let razorpayOrderId = `order_${invoice.invoiceNo.replace(/[^a-zA-Z0-9]/g, "")}_${Date.now()}`;
    let isLiveApi = false;

    // If real Razorpay API keys are configured, generate a live order on Razorpay servers
    if (keyId && keySecret && !keyId.includes("placeholder")) {
      try {
        const authHeader = `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}`;
        const rzpRes = await fetch("https://api.razorpay.com/v1/orders", {
          method: "POST",
          headers: {
            Authorization: authHeader,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            amount: amountInPaise,
            currency: "INR",
            receipt: invoice.invoiceNo,
            notes: {
              invoiceId: invoice.id,
              studentId: invoice.studentId,
              studentName: `${invoice.student.firstName} ${invoice.student.lastName}`,
              invoiceTitle: invoice.title,
            },
          }),
        });

        if (rzpRes.ok) {
          const rzpData = await rzpRes.json();
          razorpayOrderId = rzpData.id;
          isLiveApi = true;
        } else {
          const errText = await rzpRes.text();
          console.warn("Razorpay API order error, falling back to sandbox order:", errText);
        }
      } catch (apiErr) {
        console.warn("Razorpay API fetch failed, using sandbox fallback:", apiErr);
      }
    }

    const studentFullName = `${invoice.student.firstName} ${invoice.student.lastName}`;
    const studentEmail = invoice.student.user?.email || "student@greenfield.edu";

    return NextResponse.json({
      success: true,
      orderId: razorpayOrderId,
      amount: amountInPaise,
      amountInRupees: finalAmount,
      currency: "INR",
      keyId: keyId || "rzp_test_schoolcms",
      isLiveApi,
      invoice: {
        id: invoice.id,
        invoiceNo: invoice.invoiceNo,
        title: invoice.title,
        studentName: studentFullName,
        studentEmail: studentEmail,
        studentPhone: "9876543210",
        dueAmount: dueAmount,
      },
    });
  } catch (error: any) {
    console.error("Razorpay order creation error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create Razorpay order" },
      { status: 500 }
    );
  }
}
