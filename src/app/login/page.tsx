"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { loginAction } from "@/lib/auth/actions";

const demoAccounts = [
  { role: "Principal", email: "principal@greenfield.edu", icon: "👑", desc: "Full School-Wide Admin Access", badge: "Admin Scope" },
  { role: "Class Teacher 8-A", email: "rao@greenfield.edu", icon: "👩‍🏫", desc: "Grade 8-A Section Teacher", badge: "Section Lead" },
  { role: "Math Teacher", email: "sharma@greenfield.edu", icon: "📐", desc: "Subject Teacher & Exam Grader", badge: "Faculty" },
  { role: "Student", email: "arjun@student.greenfield.edu", icon: "🎓", desc: "Student Arjun Mehta (Class 8-A)", badge: "Student" },

  { role: "System Auditor", email: "admin@greenfield.edu", icon: "🛡️", desc: "Security & Compliance Desk", badge: "Auditor" },
];

export default function LoginPage() {
  const [state, action, pending] = useActionState(loginAction, null as { error?: string } | null);

  // Form states
  const [emailInput, setEmailInput] = useState("principal@greenfield.edu");
  const [passwordInput, setPasswordInput] = useState("Password123!");
  const [showPassword, setShowPassword] = useState(false);
  const [selectedDemo, setSelectedDemo] = useState("principal@greenfield.edu");

  // Reset Password Modal state
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetEmail, setResetEmail] = useState("principal@greenfield.edu");
  const [newPassword, setNewPassword] = useState("NewPass2026!");
  const [resetting, setResetting] = useState(false);
  const [resetFeedback, setResetFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    setResetting(true);
    setResetFeedback(null);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: resetEmail.trim(),
          newPassword: newPassword.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setResetFeedback({ type: "error", text: data.error || "Failed to reset password." });
      } else {
        setResetFeedback({
          type: "success",
          text: `Success! Password for ${data.role || "User"} (${data.email}) reset to: "${newPassword}".`,
        });
        setEmailInput(data.email);
        setPasswordInput(newPassword);
      }
    } catch (err: any) {
      setResetFeedback({ type: "error", text: err.message || "Network error while calling reset API." });
    } finally {
      setResetting(false);
    }
  }

  return (
    <div className="min-h-screen bg-transparent font-sans selection:bg-brand-500 selection:text-white relative flex flex-col justify-between p-3 sm:p-6 lg:p-8 overflow-x-hidden">
      {/* Dynamic ambient background glows */}
      <div className="fixed -top-40 -left-40 h-[500px] w-[500px] rounded-full bg-brand-600/15 blur-[140px] pointer-events-none" />
      <div className="fixed -bottom-40 -right-40 h-[500px] w-[500px] rounded-full bg-indigo-500/15 blur-[140px] pointer-events-none" />
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[600px] rounded-full bg-slate-900/40 blur-[160px] pointer-events-none" />

      {/* ── TOP INSTITUTIONAL TRUST BAR ── */}
      <header className="max-w-6xl w-full mx-auto mb-6 flex flex-wrap items-center justify-between gap-3 bg-white/5 backdrop-blur-xl px-4 sm:px-6 py-3 rounded-2xl border border-white/10 shadow-2xl text-xs relative z-20">
        <div className="flex items-center gap-2.5 text-slate-300">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-bold text-white tracking-wide">Greenfield Institutional Network</span>
          <span className="text-slate-600 hidden sm:inline">|</span>
          <span className="text-slate-400 hidden sm:inline">CBSE Affiliation: 1930482 · School Code: 40219</span>
        </div>

        <div className="flex items-center gap-3 ml-auto">
          <span className="text-slate-400 text-[11px] hidden md:inline">Academic Session: 2026–2027</span>
          <Link
            href="/register"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 text-white font-bold text-xs shadow-glow hover:from-brand-500 hover:to-indigo-500 transition"
          >
            <span>📝</span> Online Admissions Open →
          </Link>
        </div>
      </header>

      {/* ── MAIN AUTHENTICATION CONTAINER ── */}
      <main className="max-w-6xl w-full mx-auto grid lg:grid-cols-12 overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/90 backdrop-blur-2xl shadow-2xl relative z-10 my-auto">
        {/* LEFT COLUMN: INSTITUTIONAL BRANDING & HERITAGE */}
        <div className="lg:col-span-5 bg-gradient-to-br from-slate-950 via-slate-900 to-brand-950/80 p-8 sm:p-10 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-slate-800/80 relative overflow-hidden">
          {/* Subtle blueprint grid overlay */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b08_1px,transparent_1px),linear-gradient(to_bottom,#1e293b08_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

          <div className="relative z-10">
            {/* School Crest Badge */}
            <div className="flex items-center gap-3.5 mb-8">
              <div className="relative h-13 w-13 p-0.5 rounded-2xl bg-gradient-to-tr from-amber-400 via-amber-500 to-amber-700 shadow-glow shrink-0">
                <div className="h-full w-full rounded-[14px] bg-slate-950 flex flex-col items-center justify-center p-1 text-center border border-amber-300/30">
                  <span className="font-serif font-black text-amber-400 text-xl tracking-wider">GIA</span>
                  <span className="text-[8px] font-mono text-amber-200/80 uppercase">1984</span>
                </div>
              </div>
              <div>
                <h1 className="text-base sm:text-lg font-black text-white tracking-tight font-display">
                  Greenfield International
                </h1>
                <p className="text-xs text-amber-300/90 font-medium">Academy &amp; Centenary Campus</p>
              </div>
            </div>

            {/* Title & Tagline */}
            <div className="space-y-3 my-6">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[11px] font-bold text-brand-200 backdrop-blur-md border border-white/10">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                Enterprise SIS &amp; Academic Intelligence
              </div>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white font-display leading-tight">
                Secure Academic Portal Authentication.
              </h2>
              <p className="text-xs text-slate-300 leading-relaxed font-normal">
                Engineered with strict multi-role relational permissions, effective-dated academic records, timetable matrices, and comprehensive report cards.
              </p>
            </div>

            {/* Institutional Feature Highlights */}
            <div className="space-y-2.5 pt-2">
              <div className="flex items-center gap-3 text-xs text-slate-300 bg-white/5 p-2.5 rounded-xl border border-white/5">
                <span className="grid h-6 w-6 place-items-center rounded-lg bg-brand-500/20 text-brand-400 text-xs font-bold shrink-0">
                  ✓
                </span>
                <span>Student Information System &amp; Daily Attendance</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-300 bg-white/5 p-2.5 rounded-xl border border-white/5">
                <span className="grid h-6 w-6 place-items-center rounded-lg bg-brand-500/20 text-brand-400 text-xs font-bold shrink-0">
                  ✓
                </span>
                <span>Automated Gradebooks &amp; CBSE Examination Registers</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-300 bg-white/5 p-2.5 rounded-xl border border-white/5">
                <span className="grid h-6 w-6 place-items-center rounded-lg bg-brand-500/20 text-brand-400 text-xs font-bold shrink-0">
                  ✓
                </span>
                <span>Faculty Coursework Hub &amp; Institutional Circulars</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-300 bg-white/5 p-2.5 rounded-xl border border-white/5">
                <span className="grid h-6 w-6 place-items-center rounded-lg bg-brand-500/20 text-brand-400 text-xs font-bold shrink-0">
                  ✓
                </span>
                <span>Direct Parent Guardian Progress Monitoring Desk</span>
              </div>
            </div>
          </div>

          {/* Bottom Latin Motto & Security Badge */}
          <div className="relative z-10 mt-8 pt-6 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
            <span className="italic font-serif text-amber-200/80">&ldquo;Veritas, Virtus et Scientia&rdquo;</span>
            <span className="font-semibold text-brand-300 bg-brand-950 px-2 py-0.5 rounded border border-brand-800/60">
              Argon2id Encrypted
            </span>
          </div>
        </div>

        {/* RIGHT COLUMN: LOGIN FORM & 1-CLICK DEMO ACCESS */}
        <div className="lg:col-span-7 bg-white p-7 sm:p-10 flex flex-col justify-between text-slate-800">
          <div>
            {/* Header info */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 font-display">
                  Sign In to Academic Portal
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Enter your verified institutional credentials to access your dashboard.
                </p>
              </div>
              <span className="hidden sm:inline-flex rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-bold text-emerald-700 border border-emerald-200">
                Session Active
              </span>
            </div>

            {/* Login Form */}
            <form action={action} className="space-y-4">
              <div>
                <label className="label text-xs font-bold text-slate-700" htmlFor="email">
                  Institutional Email Address
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm">✉️</span>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    autoComplete="username"
                    className="input pl-10 text-xs sm:text-sm font-medium"
                    value={emailInput}
                    onChange={(e) => {
                      setEmailInput(e.target.value);
                      setSelectedDemo("");
                    }}
                    placeholder="e.g. principal@greenfield.edu"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="label mb-0 text-xs font-bold text-slate-700" htmlFor="password">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowResetModal(true)}
                    className="text-xs font-bold text-brand-600 hover:text-brand-800 hover:underline"
                  >
                    Forgot Password? 🔑
                  </button>
                </div>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm">🔒</span>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    required
                    autoComplete="current-password"
                    className="input pl-10 pr-11 font-mono text-xs sm:text-sm"
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-slate-400 hover:text-slate-700 transition"
                    title={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? "🙈" : "👁️"}
                  </button>
                </div>
              </div>

              {state?.error && (
                <div
                  role="alert"
                  className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-800 flex items-center gap-2.5 shadow-sm animate-in fade-in"
                >
                  <span className="text-base">⚠️</span>
                  <span>{state.error}</span>
                </div>
              )}

              <button
                type="submit"
                className="btn-primary w-full py-3 text-xs sm:text-sm font-black shadow-lg flex items-center justify-center gap-2"
                disabled={pending}
              >
                {pending ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Authenticating Session…</span>
                  </>
                ) : (
                  <>
                    <span>Sign In to Academic Dashboard ➔</span>
                  </>
                )}
              </button>

              <Link
                href="/register"
                className="w-full rounded-2xl border border-brand-200/90 bg-gradient-to-r from-brand-50/80 to-indigo-50/80 py-2.5 px-4 text-xs font-bold text-brand-800 shadow-sm transition hover:bg-brand-100 flex items-center justify-between group"
              >
                <div className="flex items-center gap-2">
                  <span className="text-base">📝</span>
                  <span>New Student or Faculty? Apply for Admission (2026–27)</span>
                </div>
                <span className="group-hover:translate-x-1 transition-transform font-black">→</span>
              </Link>
            </form>

            {/* ── 1-CLICK DEMO ACCESS BAR (EVALUATOR & SUPERVISOR TOOL) ── */}
            <div className="mt-8 pt-6 border-t border-slate-100">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-700">
                    ⚡ 1-Click Reviewer Access
                  </span>
                  <span className="rounded bg-amber-100 px-1.5 py-0.2 text-[10px] font-bold text-amber-800">
                    Auto-Fill
                  </span>
                </div>
                <span className="text-[11px] text-slate-500">
                  Password: <code className="bg-slate-100 px-1.5 py-0.5 rounded font-mono font-bold text-slate-800">Password123!</code>
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {demoAccounts.map((acc) => {
                  const isSelected = selectedDemo === acc.email || emailInput === acc.email;
                  return (
                    <button
                      key={acc.email}
                      type="button"
                      onClick={() => {
                        setEmailInput(acc.email);
                        setPasswordInput("Password123!");
                        setSelectedDemo(acc.email);
                      }}
                      className={`flex flex-col text-left p-3 rounded-2xl border transition-all text-xs relative ${
                        isSelected
                          ? "border-brand-600 bg-brand-50/90 shadow-sm ring-2 ring-brand-300"
                          : "border-slate-200/90 bg-slate-50/60 hover:bg-slate-100 hover:border-slate-300"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-base">{acc.icon}</span>
                        <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-white border border-slate-200 text-slate-600">
                          {acc.badge}
                        </span>
                      </div>
                      <span className="font-bold text-slate-900 mt-1.5 truncate text-[11px]">{acc.role}</span>
                      <span className="text-[10px] text-slate-500 font-mono truncate mt-0.5">{acc.email}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ── FOOTER TRUST NOTES ── */}
      <footer className="max-w-6xl w-full mx-auto mt-6 text-center text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-3 relative z-20">
        <div>
          © 2026 Greenfield International Academy · All Rights Reserved.
        </div>
        <div className="flex items-center gap-4 text-slate-400">
          <Link href="/register" className="hover:text-brand-400 transition">Online Admissions</Link>
          <span>·</span>
          <span>Admissions Desk: +91 (011) 4982-7700</span>
          <span>·</span>
          <span>admissions@greenfield.edu</span>
        </div>
      </footer>

      {/* ════════════════════════════════════════════════════════════
          RESET PASSWORD MODAL
         ════════════════════════════════════════════════════════════ */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md animate-in fade-in">
          <div className="card w-full max-w-md overflow-hidden bg-white shadow-2xl border border-slate-100 rounded-3xl">
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/80 px-6 py-4">
              <div>
                <h4 className="text-sm font-bold text-slate-900 font-display">Reset Account Password</h4>
                <p className="text-xs text-slate-500">Argon2id Encrypted via POST /api/auth/reset-password</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowResetModal(false);
                  setResetFeedback(null);
                }}
                className="grid h-7 w-7 place-items-center rounded-lg text-slate-400 hover:bg-slate-200 hover:text-slate-700 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleResetPassword} className="p-6 space-y-4 text-xs">
              <div>
                <label className="label text-xs mb-1.5">Target Account</label>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setResetEmail("principal@greenfield.edu")}
                    className={`rounded-xl border p-2 text-xs font-semibold transition ${
                      resetEmail === "principal@greenfield.edu"
                        ? "border-brand-600 bg-brand-50 text-brand-700"
                        : "border-slate-200 hover:bg-slate-50 text-slate-600"
                    }`}
                  >
                    👑 Principal
                  </button>
                  <button
                    type="button"
                    onClick={() => setResetEmail("arjun@student.greenfield.edu")}
                    className={`rounded-xl border p-2 text-xs font-semibold transition ${
                      resetEmail === "arjun@student.greenfield.edu"
                        ? "border-brand-600 bg-brand-50 text-brand-700"
                        : "border-slate-200 hover:bg-slate-50 text-slate-600"
                    }`}
                  >
                    🎓 Student
                  </button>
                  <button
                    type="button"
                    onClick={() => setResetEmail("admin@greenfield.edu")}
                    className={`rounded-xl border p-2 text-xs font-semibold transition ${
                      resetEmail === "admin@greenfield.edu"
                        ? "border-brand-600 bg-brand-50 text-brand-700"
                        : "border-slate-200 hover:bg-slate-50 text-slate-600"
                    }`}
                  >
                    🛡️ Admin
                  </button>
                </div>
              </div>

              <div>
                <label className="label text-xs">Email Address *</label>
                <input
                  required
                  type="email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  className="input font-mono text-xs"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="label text-xs mb-0">New Password * (Min 8 chars)</label>
                  <button
                    type="button"
                    onClick={() => setNewPassword(`Pass@${Math.floor(1000 + Math.random() * 9000)}!`)}
                    className="text-[11px] font-bold text-brand-600 hover:underline"
                  >
                    🎲 Generate Random
                  </button>
                </div>
                <input
                  required
                  minLength={8}
                  type="text"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="input font-mono text-xs"
                />
              </div>

              {resetFeedback && (
                <div
                  className={`rounded-xl p-3 text-xs font-semibold ${
                    resetFeedback.type === "success"
                      ? "border border-emerald-200 bg-emerald-50 text-emerald-800"
                      : "border border-rose-200 bg-rose-50 text-rose-800"
                  }`}
                >
                  {resetFeedback.text}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowResetModal(false);
                    setResetFeedback(null);
                  }}
                  className="btn-ghost text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={resetting}
                  className="btn-primary text-xs font-bold"
                >
                  {resetting ? "Resetting via API..." : "Reset Password via API ↵"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
