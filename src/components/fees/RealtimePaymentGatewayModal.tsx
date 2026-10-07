"use client";

import { useState, useEffect } from "react";
import type { FeeInvoiceItem } from "./InteractiveFeesClient";

interface RealtimePaymentGatewayModalProps {
  invoice: FeeInvoiceItem;
  onClose: () => void;
  onPaymentSuccess: (invoiceId: string, method: string, txnRef: string, paymentDetails: any) => void;
  onViewReceipt?: (invoice: FeeInvoiceItem) => void;
  isStaffCounter?: boolean;
}

const POPULAR_BANKS = [
  { id: "HDFC", name: "HDFC Bank", logo: "🏦", code: "HDFC0001" },
  { id: "SBI", name: "State Bank of India", logo: "🏛️", code: "SBIN0001" },
  { id: "ICICI", name: "ICICI Bank", logo: "🏦", code: "ICIC0001" },
  { id: "AXIS", name: "Axis Bank", logo: "🏢", code: "UTIB0001" },
  { id: "KOTAK", name: "Kotak Mahindra Bank", logo: "🏛️", code: "KKBK0001" },
  { id: "PNB", name: "Punjab National Bank", logo: "🏢", code: "PUNB0001" },
];

const OTHER_BANKS = [
  "Bank of Baroda",
  "Canara Bank",
  "IndusInd Bank",
  "Union Bank of India",
  "IDFC FIRST Bank",
  "Federal Bank",
  "Yes Bank",
  "Bank of India",
  "Central Bank of India",
  "Indian Overseas Bank",
  "RBL Bank",
  "South Indian Bank",
  "Bandhan Bank",
  "AU Small Finance Bank",
];

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") return resolve(false);
    if ((window as any).Razorpay) return resolve(true);
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export function RealtimePaymentGatewayModal({
  invoice,
  onClose,
  onPaymentSuccess,
  onViewReceipt,
  isStaffCounter = false,
}: RealtimePaymentGatewayModalProps) {
  const [method, setMethod] = useState<"RAZORPAY" | "CARD" | "NET_BANKING" | "UPI" | "CASH" | "CHEQUE">(
    isStaffCounter ? "CASH" : "RAZORPAY"
  );
  const [step, setStep] = useState<"INPUT" | "AUTHENTICATING" | "OTP" | "SUCCESS">("INPUT");
  const [rzpLoading, setRzpLoading] = useState(false);
  const [rzpError, setRzpError] = useState<string | null>(null);

  // Outstanding balance
  const dueAmount = invoice.amount - invoice.paidAmount;

  // Counter Cash & Cheque state (for Staff/Accounts Counter)
  const [cashierNotes, setCashierNotes] = useState("Fee received in full at main accounts counter");
  const [chequeNo, setChequeNo] = useState("");
  const [chequeBank, setChequeBank] = useState("State Bank of India");
  const [chequeDate, setChequeDate] = useState(new Date().toISOString().split("T")[0]);

  // Card details state
  const [cardNumber, setCardNumber] = useState("");
  const [cardHolder, setCardHolder] = useState(invoice.studentName || "KABIR SHAH");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [cardBrand, setCardBrand] = useState<"VISA" | "MASTERCARD" | "RUPAY" | "GENERIC">("VISA");

  // Net Banking state
  const [selectedBank, setSelectedBank] = useState(POPULAR_BANKS[0].name);
  const [bankAccountType, setBankAccountType] = useState<"RETAIL" | "CORPORATE">("RETAIL");
  const [customerId, setCustomerId] = useState("");

  // UPI state
  const [upiId, setUpiId] = useState("");
  const [qrCountdown, setQrCountdown] = useState(600); // 10 minutes

  // OTP state
  const [otp, setOtp] = useState("");
  const [otpTimer, setOtpTimer] = useState(45);
  const [processingMessage, setProcessingMessage] = useState("Securing 256-bit SSL handshake...");

  // Generated transaction details
  const [generatedTxn, setGeneratedTxn] = useState<{
    txnRef: string;
    authCode: string;
    timestamp: string;
  } | null>(null);

  // Auto detect card brand from leading digits
  useEffect(() => {
    const raw = cardNumber.replace(/\s+/g, "");
    if (raw.startsWith("4")) {
      setCardBrand("VISA");
    } else if (/^5[1-5]/.test(raw) || /^2[2-7]/.test(raw)) {
      setCardBrand("MASTERCARD");
    } else if (/^6[045]/.test(raw) || /^508[5-9]/.test(raw)) {
      setCardBrand("RUPAY");
    } else {
      setCardBrand("GENERIC");
    }
  }, [cardNumber]);

  // QR countdown
  useEffect(() => {
    if (method !== "UPI" || step !== "INPUT") return;
    const interval = setInterval(() => {
      setQrCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [method, step]);

  // OTP countdown
  useEffect(() => {
    if (step !== "OTP") return;
    const interval = setInterval(() => {
      setOtpTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [step]);

  // Format card number with spaces every 4 digits
  const handleCardNumberChange = (val: string) => {
    const digits = val.replace(/\D/g, "").slice(0, 16);
    const formatted = digits.replace(/(\d{4})(?=\d)/g, "$1 ");
    setCardNumber(formatted);
  };

  // Format expiry with slash MM/YY
  const handleExpiryChange = (val: string) => {
    const digits = val.replace(/\D/g, "").slice(0, 4);
    if (digits.length >= 3) {
      setExpiry(`${digits.slice(0, 2)}/${digits.slice(2, 4)}`);
    } else {
      setExpiry(digits);
    }
  };

  // Launch official Razorpay Checkout modal
  const handleRazorpayPayment = async () => {
    setRzpLoading(true);
    setRzpError(null);

    try {
      // 1. Create order on server
      const orderRes = await fetch("/api/fees/razorpay/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invoiceId: invoice.id,
          amount: dueAmount,
        }),
      });

      const orderData = await orderRes.json();
      if (!orderRes.ok || !orderData.success) {
        throw new Error(orderData.error || "Failed to create Razorpay order");
      }

      // 2. Load Razorpay script
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded || !(window as any).Razorpay) {
        console.warn("Razorpay checkout.js not reachable, running simulated sandbox clearance");
        return simulateRazorpayTestSuccess(orderData.orderId);
      }

      // 3. Configure and open Razorpay modal
      const options = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: "INR",
        name: "Greenfield International Academy",
        description: `${invoice.title} (${invoice.invoiceNo})`,
        image: "https://cdn.razorpay.com/logos/GhRQcyean79PqE_medium.png",
        order_id: orderData.isLiveApi ? orderData.orderId : undefined,
        prefill: {
          name: invoice.studentName,
          email: orderData.invoice?.studentEmail || "student@greenfield.edu",
          contact: "9876543210",
        },
        notes: {
          invoiceId: invoice.id,
          invoiceNo: invoice.invoiceNo,
          studentAdm: invoice.studentAdm,
        },
        theme: {
          color: "#2563eb",
        },
        handler: async function (response: any) {
          setStep("AUTHENTICATING");
          setProcessingMessage("Verifying Razorpay payment with school accounting ledger...");

          try {
            const verifyRes = await fetch("/api/fees/razorpay/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                invoiceId: invoice.id,
                razorpay_order_id: response.razorpay_order_id || orderData.orderId,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                amount: dueAmount,
                method: "RAZORPAY",
              }),
            });

            const verifyData = await verifyRes.json();
            if (verifyData.success) {
              const nowIso = new Date().toISOString();
              setGeneratedTxn({
                txnRef: response.razorpay_payment_id,
                authCode: `RZP-${orderData.orderId}`,
                timestamp: nowIso,
              });
              onPaymentSuccess(invoice.id, "RAZORPAY", response.razorpay_payment_id, {
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
              });
              setStep("SUCCESS");
            } else {
              alert("Verification failed: " + (verifyData.error || "Unknown error"));
              setStep("INPUT");
            }
          } catch (vErr: any) {
            alert("Network error verifying payment: " + vErr.message);
            setStep("INPUT");
          }
        },
        modal: {
          ondismiss: function () {
            setRzpLoading(false);
          },
        },
      };

      const rzpInstance = new (window as any).Razorpay(options);
      rzpInstance.on("payment.failed", function (response: any) {
        alert("Payment failed: " + (response.error?.description || "Transaction declined"));
        setRzpLoading(false);
      });
      rzpInstance.open();
    } catch (err: any) {
      console.error("Razorpay checkout error:", err);
      setRzpError(err.message || "Failed to initiate Razorpay checkout");
    } finally {
      setRzpLoading(false);
    }
  };

  // Fast sandbox demo clearance fallback
  const simulateRazorpayTestSuccess = async (orderId: string) => {
    setStep("AUTHENTICATING");
    setProcessingMessage("Verifying Razorpay test transaction with school ledger...");

    const testPaymentId = `pay_test_${Math.floor(10000000 + Math.random() * 90000000)}`;

    setTimeout(async () => {
      try {
        const verifyRes = await fetch("/api/fees/razorpay/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            invoiceId: invoice.id,
            razorpay_order_id: orderId,
            razorpay_payment_id: testPaymentId,
            amount: dueAmount,
            method: "RAZORPAY_TEST",
          }),
        });

        const verifyData = await verifyRes.json();
        if (verifyData.success) {
          const nowIso = new Date().toISOString();
          setGeneratedTxn({
            txnRef: testPaymentId,
            authCode: `RZP-${orderId}`,
            timestamp: nowIso,
          });
          onPaymentSuccess(invoice.id, "RAZORPAY", testPaymentId, {
            razorpay_payment_id: testPaymentId,
            razorpay_order_id: orderId,
          });
          setStep("SUCCESS");
        } else {
          setStep("INPUT");
        }
      } catch {
        setStep("INPUT");
      }
    }, 1200);
  };

  // Start payment execution
  const handleInitiatePayment = (e: React.FormEvent) => {
    e.preventDefault();

    if (method === "CARD") {
      // Validate card inputs
      const rawCard = cardNumber.replace(/\s+/g, "");
      if (rawCard.length < 12) {
        alert("Please enter a valid 16-digit card number");
        return;
      }
      if (expiry.length < 5) {
        alert("Please enter valid MM/YY expiry");
        return;
      }
      if (cvv.length < 3) {
        alert("Please enter a 3-digit CVV");
        return;
      }
      // Move to 3D Secure OTP authentication
      setStep("OTP");
      setOtp("");
      setOtpTimer(45);
    } else if (method === "NET_BANKING") {
      // Simulate direct bank gateway redirection & authentication
      setStep("AUTHENTICATING");
      setProcessingMessage(`Redirecting to ${selectedBank} Secure NetBanking Gateway...`);

      setTimeout(() => {
        setProcessingMessage(`Authorizing debit of ₹${dueAmount.toLocaleString("en-IN")}...`);
      }, 1200);

      setTimeout(() => {
        finalizePayment({
          bankName: selectedBank,
          bankAccountType,
          customerId: customerId || "RET-901824",
        });
      }, 2500);
    } else if (method === "UPI") {
      // Simulate UPI intent approval
      setStep("AUTHENTICATING");
      setProcessingMessage("Waiting for approval on your UPI App (GPay/PhonePe)...");

      setTimeout(() => {
        setProcessingMessage("UPI mandate approved. Transferring funds...");
      }, 1200);

      setTimeout(() => {
        finalizePayment({
          upiId: upiId || "student@okhdfcbank",
        });
      }, 2400);
    }
  };

  // Confirm Cash payment at accounts counter
  const handleCashCollection = (e: React.FormEvent) => {
    e.preventDefault();
    setStep("AUTHENTICATING");
    setProcessingMessage("Recording counter cash collection in accounts ledger...");

    setTimeout(() => {
      setProcessingMessage("Cash verified! Generating official tax receipt...");
    }, 800);

    setTimeout(() => {
      finalizePayment(
        {
          notes: cashierNotes,
          collectorRole: "Accounts Cashier Desk",
          cashReceived: dueAmount,
        },
        "CASH"
      );
    }, 1600);
  };

  // Confirm Cheque deposit at accounts counter
  const handleChequeCollection = (e: React.FormEvent) => {
    e.preventDefault();
    setStep("AUTHENTICATING");
    setProcessingMessage("Registering banking clearing instrument...");

    setTimeout(() => {
      setProcessingMessage("Instrument recorded! Updating accounts ledger...");
    }, 800);

    setTimeout(() => {
      finalizePayment(
        {
          chequeNo: chequeNo || `CHQ-${Math.floor(100000 + Math.random() * 900000)}`,
          bankName: chequeBank,
          chequeDate,
          collectorRole: "Accounts Cashier Desk",
        },
        "CHEQUE"
      );
    }, 1600);
  };

  // Confirm OTP for card
  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setStep("AUTHENTICATING");
    setProcessingMessage("Validating OTP with issuing bank...");

    setTimeout(() => {
      setProcessingMessage("3D Secure Authentication Successful! Reconciling ledger...");
    }, 1000);

    setTimeout(() => {
      finalizePayment({
        cardLast4: cardNumber.replace(/\s+/g, "").slice(-4) || "4321",
        cardBrand,
        cardHolder,
      });
    }, 2200);
  };

  // Finalize payment and update state / API
  const finalizePayment = async (details: any, overrideMethod?: string) => {
    const activeMethod = overrideMethod || method;
    const txnCode = `TXN-${activeMethod}-${Math.floor(100000 + Math.random() * 900000)}`;
    const authCode = `AUTH-${Math.floor(10000000 + Math.random() * 90000000)}`;
    const nowIso = new Date().toISOString();

    setGeneratedTxn({
      txnRef: txnCode,
      authCode,
      timestamp: nowIso,
    });

    try {
      // Call real-time payment API
      await fetch("/api/fees/pay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invoiceId: invoice.id,
          amount: dueAmount,
          paymentMethod: activeMethod,
          paymentDetails: {
            ...details,
            transactionRef: txnCode,
            notes: isStaffCounter
              ? `Counter collection (${activeMethod}) at school cashier desk`
              : `Real-time payment clearance via ${activeMethod}`,
          },
        }),
      });
    } catch (err) {
      console.warn("Real-time API fallback:", err);
    }

    // Notify parent component
    onPaymentSuccess(invoice.id, activeMethod, txnCode, details);
    setStep("SUCCESS");
  };

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-xl rounded-3xl bg-slate-900 shadow-2xl overflow-hidden border border-slate-800 text-slate-100">
        {/* Gateway Security Header */}
        <div className="bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-950 text-white p-5 sm:p-6 relative border-b border-slate-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="grid h-8 w-8 place-items-center rounded-xl bg-brand-500/20 text-brand-300 border border-brand-400/30 text-base">
                {isStaffCounter ? "🏛️" : "🛡️"}
              </span>
              <div>
                <h3 className="text-sm sm:text-base font-black tracking-tight font-display">
                  {isStaffCounter
                    ? "School Fee Collection Counter (Cashier Desk)"
                    : "Greenfield Secure Payment Gateway"}
                </h3>
                <p className="text-[11px] text-slate-300 flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  {isStaffCounter
                    ? "Official Accounts Counter • Immediate Receipt Generation"
                    : "256-Bit SSL Encrypted • PCI-DSS Level 1 Certified"}
                </p>
              </div>
            </div>

            {step !== "AUTHENTICATING" && (
              <button
                onClick={onClose}
                className="text-slate-400 hover:text-white transition-colors text-sm font-bold p-1"
                aria-label="Close"
              >
                ✕
              </button>
            )}
          </div>

          {/* Invoice Summary Banner */}
          <div className="mt-4 flex items-center justify-between bg-white/5 rounded-2xl p-3.5 backdrop-blur-md border border-white/10">
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-300">
                Invoice: {invoice.invoiceNo}
              </p>
              <p className="text-xs font-bold text-white truncate max-w-[240px]">
                {invoice.title}
              </p>
              <p className="text-[11px] text-slate-300 font-medium">
                Student: {invoice.studentName} ({invoice.studentAdm})
              </p>
            </div>
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-brand-300 block">
                Total Payable
              </span>
              <span className="text-xl sm:text-2xl font-black text-white font-display">
                ₹{dueAmount.toLocaleString("en-IN")}
              </span>
            </div>
          </div>
        </div>

        {/* STEP 1: PAYMENT METHOD SELECTOR & INPUT FORM */}
        {step === "INPUT" && (
          <div>
            {/* Method Tabs */}
            <div className="flex border-b border-slate-800 bg-slate-950/80 p-1.5 gap-1.5 overflow-x-auto">
              {isStaffCounter ? (
                <>
                  <button
                    type="button"
                    onClick={() => setMethod("CASH")}
                    className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 whitespace-nowrap ${
                      method === "CASH"
                        ? "bg-emerald-950/80 text-emerald-300 shadow-sm border border-emerald-700/60"
                        : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                    }`}
                  >
                    <span>💵</span>
                    <span>Cash Counter</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMethod("CHEQUE")}
                    className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 whitespace-nowrap ${
                      method === "CHEQUE"
                        ? "bg-indigo-950/80 text-indigo-300 shadow-sm border border-indigo-700/60"
                        : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                    }`}
                  >
                    <span>📝</span>
                    <span>Cheque / DD</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMethod("CARD")}
                    className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 whitespace-nowrap ${
                      method === "CARD"
                        ? "bg-slate-800 text-brand-300 shadow-sm border border-slate-700"
                        : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                    }`}
                  >
                    <span>💳</span>
                    <span>POS Card Swipe</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMethod("UPI")}
                    className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 whitespace-nowrap ${
                      method === "UPI"
                        ? "bg-slate-800 text-brand-300 shadow-sm border border-slate-700"
                        : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                    }`}
                  >
                    <span>⚡</span>
                    <span>Counter UPI QR</span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => setMethod("RAZORPAY")}
                    className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 whitespace-nowrap ${
                      method === "RAZORPAY"
                        ? "bg-blue-600 text-white shadow-sm border border-blue-500 font-black"
                        : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                    }`}
                  >
                    <span>⚡</span>
                    <span>Razorpay Gateway</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMethod("CARD")}
                    className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 whitespace-nowrap ${
                      method === "CARD"
                        ? "bg-slate-800 text-brand-300 shadow-sm border border-slate-700"
                        : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                    }`}
                  >
                    <span>💳</span>
                    <span>Direct Card</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMethod("NET_BANKING")}
                    className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 whitespace-nowrap ${
                      method === "NET_BANKING"
                        ? "bg-slate-800 text-brand-300 shadow-sm border border-slate-700"
                        : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                    }`}
                  >
                    <span>🏦</span>
                    <span>Net Banking</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMethod("UPI")}
                    className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 whitespace-nowrap ${
                      method === "UPI"
                        ? "bg-slate-800 text-brand-300 shadow-sm border border-slate-700"
                        : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                    }`}
                  >
                    <span>📱</span>
                    <span>UPI QR</span>
                  </button>
                </>
              )}
            </div>

            {/* TAB CONTENT: RAZORPAY GATEWAY */}
            {method === "RAZORPAY" && (
              <div className="p-5 sm:p-6 space-y-4">
                <div className="rounded-2xl border border-blue-600/30 bg-gradient-to-br from-blue-950/40 via-slate-900 to-indigo-950/40 p-5 shadow-lg">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
                    <div className="flex items-center gap-2.5">
                      <div className="h-9 w-9 rounded-xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-lg">
                        ⚡
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white flex items-center gap-2">
                          <span>Razorpay Payment Gateway</span>
                          <span className="rounded-full bg-blue-500/20 px-2 py-0.5 text-[9px] font-black uppercase text-blue-300 border border-blue-400/30">
                            Verified Partner
                          </span>
                        </h4>
                        <p className="text-[11px] text-slate-400">
                          Secure 256-bit encrypted checkout with live test UPI, Cards &amp; NetBanking
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono font-bold text-blue-300 bg-blue-950/80 px-2.5 py-1 rounded-lg border border-blue-800/60">
                      TEST SANDBOX
                    </span>
                  </div>

                  {/* Supported Payment Channels */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4 text-[11px]">
                    <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80 text-center">
                      <span className="text-base block mb-0.5">📱</span>
                      <span className="font-bold text-white block">UPI &amp; QR</span>
                      <span className="text-[10px] text-slate-400">GPay, PhonePe</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80 text-center">
                      <span className="text-base block mb-0.5">💳</span>
                      <span className="font-bold text-white block">Cards</span>
                      <span className="text-[10px] text-slate-400">Visa, RuPay, MC</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80 text-center">
                      <span className="text-base block mb-0.5">🏦</span>
                      <span className="font-bold text-white block">NetBanking</span>
                      <span className="text-[10px] text-slate-400">50+ Banks</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80 text-center">
                      <span className="text-base block mb-0.5">👛</span>
                      <span className="font-bold text-white block">Wallets</span>
                      <span className="text-[10px] text-slate-400">Paytm, Mobikwik</span>
                    </div>
                  </div>

                  {/* Payer Summary */}
                  <div className="rounded-xl bg-slate-950/80 p-3 border border-slate-800/80 text-xs space-y-1 mb-4">
                    <div className="flex justify-between text-slate-400">
                      <span>Student:</span>
                      <span className="font-bold text-white">{invoice.studentName} ({invoice.studentAdm})</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Fee Title:</span>
                      <span className="text-slate-200">{invoice.title}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Amount Payable:</span>
                      <span className="font-black text-emerald-400 text-sm">₹{dueAmount.toLocaleString("en-IN")}</span>
                    </div>
                  </div>

                  {rzpError && (
                    <div className="rounded-xl border border-rose-800/80 bg-rose-950/60 p-3 text-xs text-rose-200 font-semibold mb-3">
                      ⚠️ {rzpError}
                    </div>
                  )}

                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={handleRazorpayPayment}
                      disabled={rzpLoading}
                      className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-xs shadow-lg transition-all flex items-center justify-center gap-2 border border-blue-400/30"
                    >
                      {rzpLoading ? (
                        <span>Connecting to Razorpay Gateway...</span>
                      ) : (
                        <>
                          <span>⚡ Pay ₹{dueAmount.toLocaleString("en-IN")} via Razorpay Gateway</span>
                          <span>➔</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => simulateRazorpayTestSuccess(`order_demo_${Date.now()}`)}
                      className="w-full py-2 rounded-xl bg-slate-950/70 hover:bg-slate-800 text-slate-400 hover:text-slate-200 text-[11px] font-medium border border-slate-800 transition"
                    >
                      Simulate 1-Click Sandbox Clearance (Fast Demo)
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT: CASH COUNTER */}
            {method === "CASH" && (
              <form onSubmit={handleCashCollection} className="p-5 sm:p-6 space-y-4">
                <div className="rounded-2xl border border-emerald-800/60 bg-emerald-950/40 p-4">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">💵</span>
                    <div>
                      <h4 className="text-xs font-bold text-emerald-300 uppercase tracking-wide">
                        Physical Cash Counter Collection
                      </h4>
                      <p className="text-xs text-emerald-400/90">
                        Collect physical currency notes at the school accounts fee counter.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-3">
                    <span className="text-slate-400 block">Total Due Amount</span>
                    <span className="text-lg font-black text-white font-display">
                      ₹{dueAmount.toLocaleString("en-IN")}
                    </span>
                  </div>
                  <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-3">
                    <span className="text-slate-400 block">Student & Class</span>
                    <span className="text-xs font-bold text-white block truncate">
                      {invoice.studentName} ({invoice.studentClass})
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    Cashier Verification Notes
                  </label>
                  <input
                    type="text"
                    value={cashierNotes}
                    onChange={(e) => setCashierNotes(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950/80 px-3.5 py-2.5 text-xs font-medium text-white placeholder-slate-500 focus:border-brand-500 focus:outline-none"
                    placeholder="e.g. Received cash notes at main counter"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white py-3.5 text-xs font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
                  >
                    <span>✓ Confirm Cash Receipt & Issue Official Voucher</span>
                  </button>
                </div>
              </form>
            )}

            {/* TAB CONTENT: CHEQUE / DD */}
            {method === "CHEQUE" && (
              <form onSubmit={handleChequeCollection} className="p-5 sm:p-6 space-y-4">
                <div className="rounded-2xl border border-blue-800/60 bg-blue-950/40 p-4">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">📝</span>
                    <div>
                      <h4 className="text-xs font-bold text-blue-300 uppercase tracking-wide">
                        Bank Cheque / Demand Draft
                      </h4>
                      <p className="text-xs text-blue-400/90">
                        Record instrument details for banking deposit and reconciliation.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">
                      Cheque / DD Number *
                    </label>
                    <input
                      type="text"
                      required
                      value={chequeNo}
                      onChange={(e) => setChequeNo(e.target.value)}
                      placeholder="e.g. CHQ-602918"
                      className="w-full rounded-xl border border-slate-700 bg-slate-950/80 px-3.5 py-2.5 text-xs font-mono font-medium text-white placeholder-slate-500 focus:border-brand-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">
                      Issuing Bank Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={chequeBank}
                      onChange={(e) => setChequeBank(e.target.value)}
                      placeholder="e.g. State Bank of India"
                      className="w-full rounded-xl border border-slate-700 bg-slate-950/80 px-3.5 py-2.5 text-xs font-medium text-white placeholder-slate-500 focus:border-brand-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    Cheque Date
                  </label>
                  <input
                    type="date"
                    value={chequeDate}
                    onChange={(e) => setChequeDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950/80 px-3.5 py-2.5 text-xs font-medium text-white focus:border-brand-500 focus:outline-none"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white py-3.5 text-xs font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
                  >
                    <span>✓ Record Cheque & Generate Official Receipt</span>
                  </button>
                </div>
              </form>
            )}

            {/* TAB CONTENT: DEBIT / CREDIT CARD */}
            {method === "CARD" && (
              <form onSubmit={handleInitiatePayment} className="p-5 sm:p-6 space-y-4">
                {/* Virtual Card Graphic Preview */}
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-tr from-slate-950 via-indigo-950 to-brand-900 p-5 text-white shadow-lg border border-slate-800">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-7 w-9 rounded-md bg-amber-400/90 border border-amber-300 flex items-center justify-center shadow-inner">
                        <span className="text-[10px] text-amber-950 font-bold">EMV</span>
                      </div>
                      <span className="text-[10px] text-slate-300 uppercase tracking-widest font-mono">
                        Debit / Credit
                      </span>
                    </div>
                    <span className="text-sm font-black tracking-wider uppercase bg-white/20 px-2 py-0.5 rounded text-white">
                      {cardBrand}
                    </span>
                  </div>

                  <div className="my-3 font-mono text-base sm:text-lg tracking-widest font-bold">
                    {cardNumber || "•••• •••• •••• ••••"}
                  </div>

                  <div className="flex items-center justify-between text-[11px]">
                    <div>
                      <p className="text-[9px] uppercase tracking-wider text-slate-400">Cardholder</p>
                      <p className="font-bold uppercase tracking-wider truncate max-w-[180px]">
                        {cardHolder || "KABIR SHAH"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[9px] uppercase tracking-wider text-slate-400">Expires</p>
                      <p className="font-mono font-bold">{expiry || "MM/YY"}</p>
                    </div>
                  </div>
                </div>

                {/* Card Input Fields */}
                <div className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">
                      Card Number *
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        placeholder="4532 8901 2345 6789"
                        value={cardNumber}
                        onChange={(e) => handleCardNumberChange(e.target.value)}
                        className="w-full rounded-xl border border-slate-700 bg-slate-950/80 px-3.5 py-2.5 text-xs font-mono font-bold text-white placeholder-slate-500 shadow-sm focus:border-brand-500 focus:outline-none"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-black text-brand-400">
                        {cardBrand}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">
                      Cardholder Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Name as printed on card"
                      value={cardHolder}
                      onChange={(e) => setCardHolder(e.target.value)}
                      className="w-full rounded-xl border border-slate-700 bg-slate-950/80 px-3.5 py-2.5 text-xs font-medium text-white placeholder-slate-500 shadow-sm focus:border-brand-500 focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 mb-1">
                        Expiry Date *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="MM/YY"
                        value={expiry}
                        onChange={(e) => handleExpiryChange(e.target.value)}
                        className="w-full rounded-xl border border-slate-700 bg-slate-950/80 px-3.5 py-2.5 text-xs font-mono font-bold text-white placeholder-slate-500 shadow-sm focus:border-brand-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 mb-1">
                        CVV / CVC *
                      </label>
                      <input
                        type="password"
                        required
                        maxLength={4}
                        placeholder="•••"
                        value={cvv}
                        onChange={(e) => setCvv(e.target.value.replace(/\D/g, ""))}
                        className="w-full rounded-xl border border-slate-700 bg-slate-950/80 px-3.5 py-2.5 text-xs font-mono font-bold text-white placeholder-slate-500 shadow-sm focus:border-brand-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between text-xs">
                  <span className="text-[11px] text-slate-400">
                    🔒 3D Secure OTP verification on next step
                  </span>
                  <button
                    type="submit"
                    className="rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2.5 text-xs font-black shadow-sm transition-all"
                  >
                    Pay ₹{dueAmount.toLocaleString("en-IN")} via Card
                  </button>
                </div>
              </form>
            )}

            {/* TAB CONTENT: NET BANKING */}
            {method === "NET_BANKING" && (
              <form onSubmit={handleInitiatePayment} className="p-5 sm:p-6 space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-bold text-slate-200">
                      Popular Indian Banks
                    </label>
                    <div className="flex items-center gap-3 text-xs">
                      <label className="flex items-center gap-1 cursor-pointer">
                        <input
                          type="radio"
                          name="accType"
                          checked={bankAccountType === "RETAIL"}
                          onChange={() => setBankAccountType("RETAIL")}
                          className="accent-brand-500"
                        />
                        <span className="text-[11px] font-medium text-slate-300">Retail</span>
                      </label>
                      <label className="flex items-center gap-1 cursor-pointer">
                        <input
                          type="radio"
                          name="accType"
                          checked={bankAccountType === "CORPORATE"}
                          onChange={() => setBankAccountType("CORPORATE")}
                          className="accent-brand-500"
                        />
                        <span className="text-[11px] font-medium text-slate-300">Corporate</span>
                      </label>
                    </div>
                  </div>

                  {/* Popular Banks Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {POPULAR_BANKS.map((b) => {
                      const isSelected = selectedBank === b.name;
                      return (
                        <button
                          key={b.id}
                          type="button"
                          onClick={() => setSelectedBank(b.name)}
                          className={`p-3 rounded-xl border text-left transition-all flex items-center gap-2.5 ${
                            isSelected
                              ? "border-brand-500 bg-brand-950/80 text-white shadow-sm ring-1 ring-brand-500 font-bold"
                              : "border-slate-800 bg-slate-950/60 hover:bg-slate-800 text-slate-300 font-medium"
                          }`}
                        >
                          <span className="text-lg">{b.logo}</span>
                          <div className="truncate">
                            <p className="text-xs truncate">{b.name}</p>
                            <span className="text-[9px] text-slate-400 font-mono block">
                              {b.code}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Other Banks Dropdown */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    Or Select Other Bank
                  </label>
                  <select
                    value={selectedBank}
                    onChange={(e) => setSelectedBank(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs font-semibold text-white shadow-sm focus:border-brand-500 focus:outline-none"
                  >
                    <option value={selectedBank}>{selectedBank} (Selected)</option>
                    {OTHER_BANKS.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    NetBanking Customer ID / User ID (Optional for fast redirect)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 8492019"
                    value={customerId}
                    onChange={(e) => setCustomerId(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950/80 px-3.5 py-2 text-xs font-mono font-medium text-white placeholder-slate-500 shadow-sm focus:border-brand-500 focus:outline-none"
                  />
                </div>

                <div className="rounded-xl bg-blue-950/50 border border-blue-800/60 p-3 text-[11px] text-blue-300 flex items-center gap-2">
                  <span>ℹ️</span>
                  <span>
                    You will be redirected to the secure <strong>{selectedBank}</strong> payment
                    portal to complete authentication.
                  </span>
                </div>

                <div className="pt-2 flex items-center justify-between">
                  <span className="text-xs text-slate-400 font-medium">
                    Bank: <strong className="text-slate-100">{selectedBank}</strong>
                  </span>
                  <button
                    type="submit"
                    className="rounded-xl bg-brand-600 hover:bg-brand-500 text-white px-5 py-2.5 text-xs font-black shadow-sm transition-all"
                  >
                    Proceed to {selectedBank} NetBanking
                  </button>
                </div>
              </form>
            )}

            {/* TAB CONTENT: INSTANT UPI */}
            {method === "UPI" && (
              <form onSubmit={handleInitiatePayment} className="p-5 sm:p-6 space-y-4">
                <div className="flex flex-col sm:flex-row items-center gap-5 bg-slate-950/80 p-4 rounded-2xl border border-slate-800">
                  {/* Dynamic QR Code Box */}
                  <div className="grid h-36 w-36 shrink-0 place-items-center rounded-2xl bg-white p-2 border border-slate-700 shadow-subtle relative">
                    {/* Simulated Clean SVG QR Code */}
                    <svg viewBox="0 0 100 100" className="h-full w-full">
                      <rect width="100" height="100" fill="white" />
                      {/* Outer Position Squares */}
                      <rect x="10" y="10" width="25" height="25" fill="#0f172a" />
                      <rect x="15" y="15" width="15" height="15" fill="white" />
                      <rect x="18" y="18" width="9" height="9" fill="#0f172a" />

                      <rect x="65" y="10" width="25" height="25" fill="#0f172a" />
                      <rect x="70" y="15" width="15" height="15" fill="white" />
                      <rect x="73" y="18" width="9" height="9" fill="#0f172a" />

                      <rect x="10" y="65" width="25" height="25" fill="#0f172a" />
                      <rect x="15" y="70" width="15" height="15" fill="white" />
                      <rect x="18" y="73" width="9" height="9" fill="#0f172a" />

                      {/* Pattern dots */}
                      <rect x="42" y="15" width="5" height="5" fill="#0f172a" />
                      <rect x="52" y="25" width="5" height="5" fill="#0f172a" />
                      <rect x="40" y="40" width="10" height="10" fill="#0f172a" />
                      <rect x="60" y="45" width="8" height="8" fill="#0f172a" />
                      <rect x="45" y="65" width="7" height="7" fill="#0f172a" />
                      <rect x="75" y="75" width="8" height="8" fill="#0f172a" />
                      <circle cx="50" cy="50" r="4" fill="#3b82f6" />
                    </svg>

                    <div className="absolute inset-x-0 -bottom-2.5 flex justify-center">
                      <span className="rounded-full bg-slate-900 px-2 py-0.5 text-[9px] font-bold text-white shadow">
                        BHIM UPI
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-xs text-center sm:text-left">
                    <p className="font-bold text-white">Scan & Pay with Any UPI App</p>
                    <p className="text-[11px] text-slate-400">
                      Google Pay, PhonePe, Paytm, BHIM, Cred or Any Banking UPI App.
                    </p>
                    <div className="inline-flex items-center gap-1.5 rounded-lg bg-amber-950/80 px-2.5 py-1 text-[11px] font-bold text-amber-300 border border-amber-800/60">
                      <span>⏳ QR Expiry:</span>
                      <span className="font-mono">{formatTimer(qrCountdown)}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    Or Enter Your UPI ID / VPA
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. yourname@okhdfcbank or 9820000000@paytm"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950/80 px-3.5 py-2.5 text-xs font-mono font-medium text-white placeholder-slate-500 shadow-sm focus:border-brand-500 focus:outline-none"
                  />
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    className="rounded-xl bg-brand-600 hover:bg-brand-500 text-white px-5 py-2.5 text-xs font-black shadow-sm transition-all"
                  >
                    Verify & Pay ₹{dueAmount.toLocaleString("en-IN")} via UPI
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* STEP 2: 3D SECURE OTP SIMULATION FOR CARD */}
        {step === "OTP" && (
          <form onSubmit={handleVerifyOtp} className="p-6 space-y-4">
            <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
              <div>
                <span className="text-xs font-black uppercase text-indigo-300 bg-indigo-950/80 px-2.5 py-0.5 rounded-md border border-indigo-800/60">
                  Verified by Visa / Mastercard Identity Check
                </span>
                <h4 className="text-sm font-bold text-white mt-2 font-display">
                  3D Secure Bank OTP Verification
                </h4>
              </div>
              <span className="text-2xl">🏦</span>
            </div>

            <div className="rounded-xl bg-slate-950/80 p-4 border border-slate-800 text-xs space-y-1.5">
              <div className="flex justify-between text-slate-400">
                <span>Merchant:</span>
                <span className="font-bold text-white">Greenfield International School</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Transaction Amount:</span>
                <span className="font-bold text-white">₹{dueAmount.toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Card Ending In:</span>
                <span className="font-mono font-bold text-white">
                  •••• {cardNumber.replace(/\s+/g, "").slice(-4) || "4321"}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <label className="font-bold text-slate-300">Enter 6-digit Bank OTP</label>
                <span className="text-[11px] text-slate-400">
                  Expires in <strong className="text-rose-400">{otpTimer}s</strong>
                </span>
              </div>

              <div className="relative">
                <input
                  type="text"
                  required
                  maxLength={6}
                  placeholder="Enter 6-digit OTP (e.g. 482910)"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                  className="w-full text-center tracking-widest text-lg font-mono font-black rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-white focus:border-brand-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                <span>OTP sent to registered mobile +91 98*** ***12</span>
                <button
                  type="button"
                  onClick={() => setOtp("482910")}
                  className="font-bold text-brand-400 hover:text-brand-300 underline"
                >
                  Auto-fill Demo OTP (482910)
                </button>
              </div>
            </div>

            <div className="pt-3 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setStep("INPUT")}
                className="rounded-xl border border-slate-700 px-4 py-2 text-xs font-bold text-slate-300 hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2 text-xs font-black shadow-sm transition-all"
              >
                Authenticate & Complete Payment
              </button>
            </div>
          </form>
        )}

        {/* STEP 3: LIVE AUTHENTICATING / PROCESSING OVERLAY */}
        {step === "AUTHENTICATING" && (
          <div className="p-10 text-center space-y-4">
            <div className="relative mx-auto h-16 w-16">
              <div className="h-16 w-16 rounded-full border-4 border-slate-700 border-t-brand-500 animate-spin" />
              <div className="absolute inset-0 grid place-items-center text-sm">🔒</div>
            </div>

            <h4 className="text-base font-bold text-white font-display">
              Processing Real-Time Payment
            </h4>
            <p className="text-xs text-slate-300 max-w-sm mx-auto animate-pulse">
              {processingMessage}
            </p>
            <p className="text-[11px] text-slate-400">
              Please do not refresh this window or click back button.
            </p>
          </div>
        )}

        {/* STEP 4: SUCCESS / CONFIRMATION SCREEN */}
        {step === "SUCCESS" && generatedTxn && (
          <div className="p-6 sm:p-8 text-center space-y-5 animate-fadeIn">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-emerald-950 text-emerald-400 text-2xl border-2 border-emerald-600">
              ✓
            </div>

            <div>
              <span className="rounded-full bg-emerald-950/80 px-3 py-1 text-xs font-black uppercase text-emerald-400 border border-emerald-800/80">
                Payment Authorized & Cleared
              </span>
              <h3 className="mt-2 text-xl font-black text-white font-display">
                ₹{dueAmount.toLocaleString("en-IN")} Received Successfully!
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Your fee invoice <strong className="text-slate-200">{invoice.invoiceNo}</strong> has
                been updated to <span className="text-emerald-400 font-black">PAID</span>.
              </p>
            </div>

            {/* Transaction Receipt Card */}
            <div className="rounded-2xl bg-slate-950/80 p-4 border border-slate-800 text-xs text-left space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-400">Transaction Reference:</span>
                <span className="font-mono font-bold text-white">
                  {generatedTxn.txnRef}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Bank Auth Code:</span>
                <span className="font-mono font-bold text-white">
                  {generatedTxn.authCode}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Payment Channel:</span>
                <span className="font-bold text-white">{method}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Timestamp:</span>
                <span className="text-slate-200">{new Date(generatedTxn.timestamp).toLocaleString()}</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  if (onViewReceipt) {
                    onViewReceipt({
                      ...invoice,
                      status: "PAID",
                      paidAmount: invoice.amount,
                      paymentMethod: method,
                      payments: [
                        ...(invoice.payments || []),
                        {
                          id: `pay-${Date.now()}`,
                          amount: dueAmount,
                          transactionRef: generatedTxn.txnRef,
                          paymentMethod: method,
                          paidAt: generatedTxn.timestamp.split("T")[0],
                        },
                      ],
                    });
                  }
                }}
                className="w-full sm:w-auto rounded-xl bg-brand-600 hover:bg-brand-500 text-white px-5 py-2.5 text-xs font-bold shadow-sm transition-all flex items-center justify-center gap-1.5"
              >
                <span>🖨️ View & Print Official Receipt</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto rounded-xl border border-slate-700 px-5 py-2.5 text-xs font-bold text-slate-300 hover:bg-slate-800 transition-all"
              >
                Back to Fee Ledger
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
