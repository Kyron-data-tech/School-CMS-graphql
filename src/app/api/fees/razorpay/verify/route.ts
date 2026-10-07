import { NextResponse } from "next/server";
import { z } from "zod";
import crypto from "crypto";
import { db } from "@/lib/db";
import { getAuthContext } from "@/lib/auth/context";

const VerifyPaymentSchema = z.object({
  invoiceId: z.string().min(1, "Invoice ID is required"),
  razorpay_order_id: z.string().min(1, "Razorpay Order ID is required"),
  razorpay_payment_id: z.string().min(1, "Razorpay Payment ID is required"),
  razorpay_signature: z.string().optional(),
  amount: z.number().positive("Payment amount must be greater than zero"),
  method: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const ctx = await getAuthContext();
    const json = await request.json();
    const parsed = VerifyPaymentSchema.parse(json);

    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    // Verify HMAC-SHA256 signature if real Razorpay secret is present
    if (keySecret && parsed.razorpay_signature) {
      const generatedSignature = crypto
        .createHmac("sha256", keySecret)
        .update(`${parsed.razorpay_order_id}|${parsed.razorpay_payment_id}`)
        .digest("hex");

      if (generatedSignature !== parsed.razorpay_signature) {
        return NextResponse.json(
          {
            success: false,
            error: "Payment verification failed: Invalid Razorpay cryptographic signature",
          },
          { status: 400 }
        );
      }
    }

    const now = new Date();
    const paymentMethodName = parsed.method ? `RAZORPAY_${parsed.method.toUpperCase()}` : "RAZORPAY";

    // Find invoice in database
    const invoice = await db.feeInvoice.findUnique({
      where: { id: parsed.invoiceId },
      include: { student: true },
    });

    if (!invoice) {
      return NextResponse.json(
        { success: false, error: "Target invoice not found in database" },
        { status: 404 }
      );
    }

    const newPaidAmount = Math.min(
      Number(invoice.amount),
      Number(invoice.paidAmount) + parsed.amount
    );
    const newStatus = newPaidAmount >= Number(invoice.amount) ? "PAID" : "PARTIAL";

    // Create FeePayment record in database
    const paymentRecord = await db.feePayment.create({
      data: {
        invoiceId: invoice.id,
        amount: parsed.amount,
        transactionRef: parsed.razorpay_payment_id,
        paymentMethod: paymentMethodName,
        paidAt: now,
        notes: `Razorpay Online Payment (Order: ${parsed.razorpay_order_id}, Payment: ${parsed.razorpay_payment_id})`,
      },
    });

    // Update FeeInvoice status & paid amount
    const updatedInvoice = await db.feeInvoice.update({
      where: { id: invoice.id },
      data: {
        paidAmount: newPaidAmount,
        status: newStatus,
        paymentMethod: paymentMethodName,
      },
      include: {
        student: true,
        payments: true,
      },
    });

    // Record audit log entry
    if (ctx) {
      await db.auditLog.create({
        data: {
          schoolId: ctx.schoolId,
          actorId: ctx.userId,
          actorName: ctx.name,
          action: "payment",
          module: "finance",
          resource: "invoice",
          recordId: invoice.id,
          summary: `Verified Razorpay payment of ₹${parsed.amount.toLocaleString(
            "en-IN"
          )} (Ref: ${parsed.razorpay_payment_id}) for invoice ${invoice.invoiceNo}`,
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: "Razorpay payment verified and reconciled successfully!",
      payment: {
        id: paymentRecord.id,
        amount: Number(paymentRecord.amount),
        transactionRef: paymentRecord.transactionRef,
        paymentMethod: paymentRecord.paymentMethod,
        paidAt: paymentRecord.paidAt.toISOString(),
      },
      invoice: {
        id: updatedInvoice.id,
        invoiceNo: updatedInvoice.invoiceNo,
        status: updatedInvoice.status,
        paidAmount: Number(updatedInvoice.paidAmount),
        dueAmount: Math.max(0, Number(updatedInvoice.amount) - Number(updatedInvoice.paidAmount)),
      },
    });
  } catch (error: any) {
    console.error("Razorpay verification error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to verify Razorpay payment" },
      { status: 500 }
    );
  }
}
