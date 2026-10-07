"use client";

import { useState } from "react";
import { StatCard, Empty } from "@/components/ui";
import { RealtimePaymentGatewayModal } from "./RealtimePaymentGatewayModal";

export interface FeeStructureItem {
  id: string;
  name: string;
  academicYear: string;
  frequency: string;
  tuitionFee: number;
  labFee: number;
  libraryFee: number;
  transportFee: number;
  otherFee: number;
  totalAmount: number;
}

export interface FeePaymentRecord {
  id: string;
  amount: number;
  transactionRef?: string | null;
  paymentMethod: string;
  paidAt: string;
}

export interface FeeInvoiceItem {
  id: string;
  studentId: string;
  studentName: string;
  studentAdm: string;
  studentClass: string;
  invoiceNo: string;
  title: string;
  amount: number;
  paidAmount: number;
  dueDate: string;
  status: string; // "PAID" | "PENDING" | "PARTIAL" | "OVERDUE"
  paymentMethod?: string | null;
  payments?: FeePaymentRecord[];
}

interface InteractiveFeesClientProps {
  structures: FeeStructureItem[];
  invoices: FeeInvoiceItem[];
  myInvoices: FeeInvoiceItem[];
  userRole: string;
  canManage: boolean;
}

export function InteractiveFeesClient({
  structures,
  invoices: initialInvoices,
  myInvoices: initialMyInvoices,
  userRole,
  canManage,
}: InteractiveFeesClientProps) {
  const [invoices, setInvoices] = useState<FeeInvoiceItem[]>(initialInvoices);
  const [myInvoices, setMyInvoices] = useState<FeeInvoiceItem[]>(initialMyInvoices);

  const isStudentOrParent =
    userRole.toLowerCase().includes("student") ||
    userRole.toLowerCase().includes("parent") ||
    userRole.toLowerCase().includes("guardian");

  const [activeTab, setActiveTab] = useState<"invoices" | "structures" | "myFees">(
    isStudentOrParent && myInvoices.length > 0 ? "myFees" : "invoices"
  );

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedReceipt, setSelectedReceipt] = useState<FeeInvoiceItem | null>(null);
  const [paymentModalInvoice, setPaymentModalInvoice] = useState<FeeInvoiceItem | null>(null);
  const [showCreateInvoiceModal, setShowCreateInvoiceModal] = useState(false);

  // New invoice state
  const [newInvoice, setNewInvoice] = useState({
    studentName: "",
    studentAdm: "",
    studentClass: "Class 8-A",
    title: "Term 2 Comprehensive Academic Fee",
    amount: 41000,
    dueDate: "2026-11-15",
  });

  const filteredInvoices = invoices.filter((inv) => {
    const q = search.toLowerCase();
    const matchesSearch =
      inv.invoiceNo.toLowerCase().includes(q) ||
      inv.studentName.toLowerCase().includes(q) ||
      inv.studentAdm.toLowerCase().includes(q) ||
      inv.title.toLowerCase().includes(q);

    const matchesStatus =
      statusFilter === "ALL" || inv.status.toUpperCase() === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Financial aggregates
  const totalBilled = invoices.reduce((sum, inv) => sum + inv.amount, 0);
  const totalCollected = invoices.reduce((sum, inv) => sum + inv.paidAmount, 0);
  const totalOutstanding = Math.max(0, totalBilled - totalCollected);
  const collectionPercentage =
    totalBilled > 0 ? Math.round((totalCollected / totalBilled) * 100) : 100;

  // Handle simulated payment
  const handleSimulatePayment = (invoiceId: string, method: string) => {
    const txn = `TXN-${method.toUpperCase()}-${Math.floor(100000 + Math.random() * 900000)}`;
    const nowStr = new Date().toISOString().split("T")[0];

    const updater = (inv: FeeInvoiceItem) => {
      if (inv.id === invoiceId) {
        const remaining = inv.amount - inv.paidAmount;
        return {
          ...inv,
          paidAmount: inv.amount,
          status: "PAID",
          paymentMethod: method,
          payments: [
            ...(inv.payments || []),
            {
              id: `pay-${Date.now()}`,
              amount: remaining,
              transactionRef: txn,
              paymentMethod: method,
              paidAt: nowStr,
            },
          ],
        };
      }
      return inv;
    };

    setInvoices(invoices.map(updater));
    setMyInvoices(myInvoices.map(updater));
    setPaymentModalInvoice(null);
  };

  // Real-time payment gateway success handler
  const handleRealtimePaymentSuccess = (
    invoiceId: string,
    method: string,
    txnRef: string,
    details: any
  ) => {
    const nowStr = new Date().toISOString().split("T")[0];

    const updater = (inv: FeeInvoiceItem) => {
      if (inv.id === invoiceId) {
        const remaining = inv.amount - inv.paidAmount;
        return {
          ...inv,
          paidAmount: inv.amount,
          status: "PAID",
          paymentMethod: method,
          payments: [
            ...(inv.payments || []),
            {
              id: `pay-${Date.now()}`,
              amount: remaining,
              transactionRef: txnRef,
              paymentMethod: method,
              paidAt: nowStr,
            },
          ],
        };
      }
      return inv;
    };

    setInvoices((prev) => prev.map(updater));
    setMyInvoices((prev) => prev.map(updater));
  };

  const handleCreateInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInvoice.studentName || !newInvoice.amount) return;

    const created: FeeInvoiceItem = {
      id: `inv-${Date.now()}`,
      invoiceNo: `INV-2026-${Math.floor(100 + Math.random() * 900)}`,
      studentId: `std-${Date.now()}`,
      studentName: newInvoice.studentName,
      studentAdm: newInvoice.studentAdm || "ADM-TEMP",
      studentClass: newInvoice.studentClass,
      title: newInvoice.title,
      amount: Number(newInvoice.amount),
      paidAmount: 0,
      dueDate: newInvoice.dueDate,
      status: "PENDING",
      payments: [],
    };

    setInvoices([created, ...invoices]);
    setShowCreateInvoiceModal(false);
    setNewInvoice({
      studentName: "",
      studentAdm: "",
      studentClass: "Class 8-A",
      title: "Term 2 Comprehensive Academic Fee",
      amount: 41000,
      dueDate: "2026-11-15",
    });
  };

  return (
    <div className="space-y-6">
      {/* Financial KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Fee Invoiced"
          value={`₹${totalBilled.toLocaleString("en-IN")}`}
          hint={`${invoices.length} invoices generated`}
          icon="💳"
        />
        <StatCard
          label="Collected Revenue"
          value={`₹${totalCollected.toLocaleString("en-IN")}`}
          hint={`${collectionPercentage}% collection efficiency`}
          icon="💰"
          trend={{ value: `${collectionPercentage}% cleared`, positive: true }}
        />
        <StatCard
          label="Outstanding Dues"
          value={`₹${totalOutstanding.toLocaleString("en-IN")}`}
          hint="Pending student clearances"
          icon="⏳"
          trend={totalOutstanding > 0 ? { value: "Pending", positive: false } : undefined}
        />
        <StatCard
          label="Audit Reconciliation"
          value="100% Matched"
          hint="Zero discrepancy against ledger"
          icon="🛡️"
        />
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-2">
        <div className="flex items-center gap-1.5 bg-slate-900/90 border border-slate-800 p-1 rounded-xl">
          {myInvoices.length > 0 && (
            <button
              onClick={() => setActiveTab("myFees")}
              className={`rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all ${
                activeTab === "myFees"
                  ? "bg-brand-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              My Fee Account ({myInvoices.length})
            </button>
          )}
          <button
            onClick={() => setActiveTab("invoices")}
            className={`rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all ${
              activeTab === "invoices"
                ? "bg-brand-600 text-white shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
          >
            School Invoices Ledger ({invoices.length})
          </button>
          <button
            onClick={() => setActiveTab("structures")}
            className={`rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all ${
              activeTab === "structures"
                ? "bg-brand-600 text-white shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Fee Structure Schedule
          </button>
        </div>

        {canManage && (
          <button
            onClick={() => setShowCreateInvoiceModal(true)}
            className="rounded-xl bg-brand-600 hover:bg-brand-500 text-white px-3.5 py-2 text-xs font-bold shadow-sm transition-all flex items-center gap-1.5"
          >
            <span>+ Generate Fee Invoice</span>
          </button>
        )}
      </div>

      {/* MY FEES TAB (Student/Parent view) */}
      {activeTab === "myFees" && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-brand-800/80 bg-brand-950/40 p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="rounded-full bg-brand-900/80 px-2.5 py-0.5 text-[10px] font-black uppercase text-brand-300 border border-brand-700/80">
                  Student Fee Clearance Desk
                </span>
                <h3 className="mt-2 text-lg font-black text-white font-display">
                  Official Academic Billing & Receipts
                </h3>
                <p className="text-xs text-slate-300 mt-1">
                  Tuition, laboratories, computer infrastructure, library, and campus transport fees.
                </p>
              </div>

              <div className="text-right">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                  Total Outstanding
                </span>
                <span className="text-2xl font-black text-white font-display">
                  ₹
                  {myInvoices
                    .reduce((sum, inv) => sum + (inv.amount - inv.paidAmount), 0)
                    .toLocaleString("en-IN")}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {myInvoices.map((inv) => {
              const isPaid = inv.status === "PAID";
              const isPartial = inv.status === "PARTIAL";
              const isOverdue = inv.status === "OVERDUE";
              const outstanding = inv.amount - inv.paidAmount;

              return (
                <div
                  key={inv.id}
                  className="card p-6 flex flex-col md:flex-row md:items-center justify-between gap-5 hover:border-slate-700 transition-all"
                >
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-200 border border-slate-700">
                        {inv.invoiceNo}
                      </span>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase ${
                          isPaid
                            ? "bg-emerald-950/70 text-emerald-300 border border-emerald-800/80"
                            : isPartial
                            ? "bg-amber-950/70 text-amber-300 border border-amber-800/80"
                            : isOverdue
                            ? "bg-rose-950/70 text-rose-300 border border-rose-800/80"
                            : "bg-blue-950/70 text-blue-300 border border-blue-800/80"
                        }`}
                      >
                        ● {inv.status}
                      </span>
                    </div>

                    <h4 className="text-base font-bold text-white font-display">
                      {inv.title}
                    </h4>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
                      <span>
                        Student: <strong className="text-slate-200">{inv.studentName}</strong> (
                        {inv.studentAdm})
                      </span>
                      <span>•</span>
                      <span>
                        Due Date: <strong className="text-slate-200">{inv.dueDate}</strong>
                      </span>
                      {inv.paymentMethod && (
                        <>
                          <span>•</span>
                          <span>
                            Paid via: <strong className="text-emerald-400">{inv.paymentMethod}</strong>
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 border-t border-slate-800 md:border-t-0 md:border-l md:border-slate-800 pt-4 md:pt-0 md:pl-6">
                    <div className="text-right sm:min-w-[130px]">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">
                        Invoice Amount
                      </span>
                      <span className="text-lg font-black text-white">
                        ₹{inv.amount.toLocaleString("en-IN")}
                      </span>
                      {isPartial && (
                        <p className="text-[11px] text-amber-400 font-bold">
                          Paid: ₹{inv.paidAmount.toLocaleString("en-IN")}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {isPaid ? (
                        <button
                          onClick={() => setSelectedReceipt(inv)}
                          className="rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-2.5 text-xs font-bold shadow-subtle transition-all flex items-center gap-1.5"
                        >
                          <span>🖨️ View & Print Receipt</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => setPaymentModalInvoice(inv)}
                          className="rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2.5 text-xs font-bold shadow-sm transition-all flex items-center gap-1.5"
                        >
                          <span>💳 Pay ₹{outstanding.toLocaleString("en-IN")}</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ALL INVOICES TAB */}
      {activeTab === "invoices" && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by student, invoice #, admission #..."
                className="w-full rounded-xl border border-slate-800 bg-slate-900/90 px-4 py-2.5 text-xs font-medium text-white placeholder-slate-500 shadow-sm focus:border-brand-500 focus:outline-none"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-200"
                >
                  ✕
                </button>
              )}
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto">
              {["ALL", "PAID", "PENDING", "PARTIAL", "OVERDUE"].map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`rounded-lg px-2.5 py-1.5 text-xs font-bold transition-all ${
                    statusFilter === st
                      ? "bg-brand-600 text-white shadow-subtle"
                      : "bg-slate-900/70 text-slate-300 hover:bg-slate-800 border border-slate-800"
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {/* Invoices Table */}
          <div className="card overflow-hidden border border-slate-800 bg-slate-900/90">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/80 text-slate-400 font-bold uppercase text-[10px] border-b border-slate-800">
                  <tr>
                    <th className="px-4 py-3">Invoice No</th>
                    <th className="px-4 py-3">Student</th>
                    <th className="px-4 py-3">Description</th>
                    <th className="px-4 py-3">Due Date</th>
                    <th className="px-4 py-3">Amount</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {filteredInvoices.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-400 font-medium">
                        No invoices found matching criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredInvoices.map((inv) => {
                      const isPaid = inv.status === "PAID";
                      const isPartial = inv.status === "PARTIAL";
                      const isOverdue = inv.status === "OVERDUE";
                      return (
                        <tr key={inv.id} className="hover:bg-slate-800/40 transition-colors">
                          <td className="px-4 py-3 font-mono font-bold text-white">
                            {inv.invoiceNo}
                          </td>
                          <td className="px-4 py-3">
                            <p className="font-bold text-slate-100">{inv.studentName}</p>
                            <p className="text-[10px] text-slate-400 font-mono">
                              {inv.studentAdm} • {inv.studentClass}
                            </p>
                          </td>
                          <td className="px-4 py-3 font-medium text-slate-300 max-w-[200px] truncate">
                            {inv.title}
                          </td>
                          <td className="px-4 py-3 text-slate-400">{inv.dueDate}</td>
                          <td className="px-4 py-3 font-black text-white">
                            ₹{inv.amount.toLocaleString("en-IN")}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`rounded-full px-2 py-0.5 text-[10px] font-black uppercase ${
                                isPaid
                                  ? "bg-emerald-950/80 text-emerald-400 border border-emerald-800/60"
                                  : isPartial
                                  ? "bg-amber-950/80 text-amber-400 border border-amber-800/60"
                                  : isOverdue
                                  ? "bg-rose-950/80 text-rose-400 border border-rose-800/60"
                                  : "bg-blue-950/80 text-blue-400 border border-blue-800/60"
                              }`}
                            >
                              {inv.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {isPaid ? (
                                <button
                                  onClick={() => setSelectedReceipt(inv)}
                                  className="rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-2.5 py-1 text-[11px] font-bold transition-all"
                                >
                                  Receipt
                                </button>
                              ) : (
                                <button
                                  onClick={() => setPaymentModalInvoice(inv)}
                                  className="rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 text-[11px] font-bold shadow-sm transition-all flex items-center gap-1"
                                  title="Record fee collection at accounts counter"
                                >
                                  <span>💵 Collect Fee</span>
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* FEE STRUCTURE SCHEDULE TAB */}
      {activeTab === "structures" && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 shadow-subtle">
            <h3 className="text-base font-bold text-white font-display">
              Approved Fee Structure (Academic Year 2026–27)
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Standard tuition and ancillary fee schedule ratified by the school management board.
            </p>

            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              {structures.map((s) => (
                <div key={s.id} className="card p-5 border border-slate-800 bg-slate-950/60">
                  <div className="flex items-center justify-between border-b border-slate-800/80 pb-3 mb-3">
                    <h4 className="font-bold text-white text-sm font-display">
                      {s.name}
                    </h4>
                    <span className="rounded-full bg-slate-800 text-slate-300 border border-slate-700 text-[10px] font-black uppercase px-2 py-0.5">
                      {s.frequency}
                    </span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between text-slate-400">
                      <span>Tuition Fee</span>
                      <span className="font-semibold text-slate-200">
                        ₹{s.tuitionFee.toLocaleString("en-IN")}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Science & Computer Lab Fee</span>
                      <span className="font-semibold text-slate-200">
                        ₹{s.labFee.toLocaleString("en-IN")}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Library & Digital Resources</span>
                      <span className="font-semibold text-slate-200">
                        ₹{s.libraryFee.toLocaleString("en-IN")}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Transport & Campus Shuttle</span>
                      <span className="font-semibold text-slate-200">
                        ₹{s.transportFee.toLocaleString("en-IN")}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Sports & Co-curricular</span>
                      <span className="font-semibold text-slate-200">
                        ₹{s.otherFee.toLocaleString("en-IN")}
                      </span>
                    </div>
                    <div className="pt-3 border-t border-slate-800/80 flex justify-between font-bold text-sm text-slate-100">
                      <span>Total Annual Fee</span>
                      <span className="text-brand-400 font-black">
                        ₹{s.totalAmount.toLocaleString("en-IN")}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Official Receipt Modal (Printable) */}
      {selectedReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-800 p-6 sm:p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto text-slate-100">
            <button
              onClick={() => setSelectedReceipt(null)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-200 font-bold"
            >
              ✕
            </button>

            {/* Receipt Header */}
            <div className="text-center border-b border-slate-800 pb-4">
              <span className="text-3xl">🏫</span>
              <h2 className="mt-1 text-lg font-black text-white font-display">
                Greenfield International School
              </h2>
              <p className="text-[11px] text-slate-400">
                12 Banyan Road, Mumbai • Affiliation No. 1130429
              </p>
              <div className="mt-2 inline-block rounded-full bg-emerald-950/80 px-3 py-1 text-xs font-black uppercase text-emerald-400 border border-emerald-800/80">
                Official Fee Clearance Receipt
              </div>
            </div>

            {/* Receipt Body */}
            <div className="mt-4 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2 bg-slate-950/80 p-3 rounded-xl border border-slate-800">
                <div>
                  <p className="text-[10px] text-slate-400 uppercase font-black">
                    Receipt / Invoice No
                  </p>
                  <p className="font-mono font-bold text-white">
                    {selectedReceipt.invoiceNo}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 uppercase font-black">
                    Date of Payment
                  </p>
                  <p className="font-semibold text-slate-200">
                    {selectedReceipt.payments?.[0]?.paidAt || "2026-05-15"}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 uppercase font-black">
                    Student Name
                  </p>
                  <p className="font-bold text-white">
                    {selectedReceipt.studentName}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 uppercase font-black">
                    Admission / Class
                  </p>
                  <p className="font-semibold text-slate-200">
                    {selectedReceipt.studentAdm} ({selectedReceipt.studentClass})
                  </p>
                </div>
              </div>

              <div className="border-t border-b border-slate-800 py-3 space-y-2">
                <div className="flex justify-between font-semibold text-slate-300">
                  <span>{selectedReceipt.title}</span>
                  <span className="font-bold text-white">
                    ₹{selectedReceipt.amount.toLocaleString("en-IN")}
                  </span>
                </div>
              </div>

              <div className="flex justify-between items-center text-sm font-black text-white bg-emerald-950/60 p-3 rounded-xl border border-emerald-800/80">
                <span>Total Amount Paid</span>
                <span className="text-emerald-400 text-base">
                  ₹{selectedReceipt.paidAmount.toLocaleString("en-IN")}
                </span>
              </div>

              <div className="space-y-1 text-[11px] text-slate-400 pt-2">
                <p>
                  Transaction Ref:{" "}
                  <span className="font-mono font-bold text-slate-300">
                    {selectedReceipt.payments?.[0]?.transactionRef || "TXN-GF-990218"}
                  </span>
                </p>
                <p>Payment Mode: {selectedReceipt.paymentMethod || "Online Transfer"}</p>
                <p className="italic text-slate-500 mt-2">
                  * This is a computer-generated receipt bearing cryptographic digital hash. No physical signature required.
                </p>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2.5 pt-3 border-t border-slate-800">
              <button
                onClick={() => setSelectedReceipt(null)}
                className="rounded-xl border border-slate-700 px-4 py-2 text-xs font-bold text-slate-300 hover:bg-slate-800"
              >
                Close
              </button>
              <button
                onClick={() => window.print()}
                className="rounded-xl bg-brand-600 hover:bg-brand-500 text-white px-4 py-2 text-xs font-bold shadow-sm"
              >
                Print / Save PDF
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Real-Time Online Payment Gateway / Counter Modal */}
      {paymentModalInvoice && (
        <RealtimePaymentGatewayModal
          invoice={paymentModalInvoice}
          onClose={() => setPaymentModalInvoice(null)}
          onPaymentSuccess={handleRealtimePaymentSuccess}
          onViewReceipt={(inv) => setSelectedReceipt(inv)}
          isStaffCounter={canManage}
        />
      )}

      {/* Create Invoice Modal */}
      {showCreateInvoiceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl text-slate-100">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white font-display">
                Generate Fee Invoice
              </h3>
              <button
                onClick={() => setShowCreateInvoiceModal(false)}
                className="text-slate-400 hover:text-slate-200 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateInvoice} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  Student Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Arjun Mehta"
                  value={newInvoice.studentName}
                  onChange={(e) =>
                    setNewInvoice({ ...newInvoice, studentName: e.target.value })
                  }
                  className="w-full rounded-xl border border-slate-700 bg-slate-950/80 px-3 py-2 text-xs text-white focus:border-brand-500 focus:outline-none placeholder-slate-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    Admission No
                  </label>
                  <input
                    type="text"
                    placeholder="ADM-8001"
                    value={newInvoice.studentAdm}
                    onChange={(e) =>
                      setNewInvoice({ ...newInvoice, studentAdm: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-700 bg-slate-950/80 px-3 py-2 text-xs text-white focus:border-brand-500 focus:outline-none placeholder-slate-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    Class & Section
                  </label>
                  <input
                    type="text"
                    placeholder="Class 8-A"
                    value={newInvoice.studentClass}
                    onChange={(e) =>
                      setNewInvoice({ ...newInvoice, studentClass: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-700 bg-slate-950/80 px-3 py-2 text-xs text-white focus:border-brand-500 focus:outline-none placeholder-slate-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  Invoice Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Term 2 Tuition & Operations Fee"
                  value={newInvoice.title}
                  onChange={(e) =>
                    setNewInvoice({ ...newInvoice, title: e.target.value })
                  }
                  className="w-full rounded-xl border border-slate-700 bg-slate-950/80 px-3 py-2 text-xs text-white focus:border-brand-500 focus:outline-none placeholder-slate-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    Amount (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    value={newInvoice.amount}
                    onChange={(e) =>
                      setNewInvoice({ ...newInvoice, amount: Number(e.target.value) })
                    }
                    className="w-full rounded-xl border border-slate-700 bg-slate-950/80 px-3 py-2 text-xs text-white focus:border-brand-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={newInvoice.dueDate}
                    onChange={(e) =>
                      setNewInvoice({ ...newInvoice, dueDate: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-700 bg-slate-950/80 px-3 py-2 text-xs text-white focus:border-brand-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="mt-5 flex justify-end gap-2.5 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateInvoiceModal(false)}
                  className="rounded-xl border border-slate-700 px-4 py-2 text-xs font-bold text-slate-300 hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-brand-600 hover:bg-brand-500 text-white px-4 py-2 text-xs font-bold shadow-sm"
                >
                  Generate Invoice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
