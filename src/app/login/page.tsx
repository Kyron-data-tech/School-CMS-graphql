"use client";

import { useActionState, useState, useEffect } from "react";
import { loginAction } from "@/lib/auth/actions";

interface Metadata {
  sections: Array<{ id: string; name: string; gradeLevel: number; gradeName: string }>;
  departments: Array<{ id: string; name: string }>;
}

const demoAccounts = [
  { role: "Principal", email: "principal@greenfield.edu", icon: "👑", badge: "bg-purple-500/20 text-purple-300 border-purple-500/30" },
  { role: "Teacher", email: "rao@greenfield.edu", icon: "👩‍🏫", badge: "bg-blue-500/20 text-blue-300 border-blue-500/30" },
  { role: "Student", email: "arjun@student.greenfield.edu", icon: "🎓", badge: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" },
];

export default function LoginPage() {
  const [state, action, pending] = useActionState(loginAction, null as { error?: string } | null);

  // Active Window Tab: "login" or "register"
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");

  // Sign In Form States
  const [emailInput, setEmailInput] = useState("principal@greenfield.edu");
  const [passwordInput, setPasswordInput] = useState("Password123!");
  const [showPassword, setShowPassword] = useState(false);

  // Registration Form States
  const [regRole, setRegRole] = useState<"student" | "teacher" | "staff" | "principal">("student");
  const [regFirstName, setRegFirstName] = useState("");
  const [regLastName, setRegLastName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("SchoolPass2026!");
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [regAdmissionNo, setRegAdmissionNo] = useState(`ADM-${Math.floor(1000 + Math.random() * 9000)}`);
  const [regGender, setRegGender] = useState<"MALE" | "FEMALE" | "OTHER">("FEMALE");
  const [regSectionId, setRegSectionId] = useState("");
  const [regEmployeeId, setRegEmployeeId] = useState(`EMP-${Math.floor(1000 + Math.random() * 9000)}`);
  const [regDepartmentId, setRegDepartmentId] = useState("");
  const [regStaffDesignation, setRegStaffDesignation] = useState("School Accountant");
  const [regPasscode, setRegPasscode] = useState("GREENFIELD2026");
  const [regSubmitting, setRegSubmitting] = useState(false);
  const [regFeedback, setRegFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Metadata for sections & departments
  const [metadata, setMetadata] = useState<Metadata>({ sections: [], departments: [] });

  // Reset Password Modal State
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetEmail, setResetEmail] = useState("principal@greenfield.edu");
  const [newPassword, setNewPassword] = useState("NewPass2026!");
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [resetFeedback, setResetFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Check URL query parameters for initial tab on client mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("tab") === "register") {
        setActiveTab("register");
      }
    }
  }, []);

  // Fetch sections and departments when Register tab is opened
  useEffect(() => {
    if (activeTab === "register" && metadata.sections.length === 0) {
      fetch("/api/auth/register")
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.data) {
            setMetadata(data.data);
            if (data.data.sections?.length > 0 && !regSectionId) {
              setRegSectionId(data.data.sections[0].id);
            }
            if (data.data.departments?.length > 0 && !regDepartmentId) {
              setRegDepartmentId(data.data.departments[0].id);
            }
          }
        })
        .catch(() => {});
    }
  }, [activeTab, metadata.sections.length, regSectionId, regDepartmentId]);

  // Auto-suggest registration email
  useEffect(() => {
    const f = regFirstName.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
    const l = regLastName.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
    if (f) {
      const domain = regRole === "student" ? "student.greenfield.edu" : "greenfield.edu";
      setRegEmail(`${f}${l ? "." + l : ""}@${domain}`);
    }
  }, [regRole, regFirstName, regLastName]);

  // Handle Registration
  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setRegSubmitting(true);
    setRegFeedback(null);

    const payload: any = {
      role: regRole,
      firstName: regFirstName.trim(),
      lastName: regLastName.trim(),
      email: regEmail.trim().toLowerCase(),
      password: regPassword.trim(),
    };

    if (regRole === "student") {
      payload.admissionNo = regAdmissionNo.trim();
      payload.sectionId = regSectionId || undefined;
      payload.gender = regGender;
    } else if (regRole === "teacher") {
      payload.employeeId = regEmployeeId.trim();
      payload.departmentId = regDepartmentId || undefined;
      payload.designation = "Subject Teacher";
    } else if (regRole === "staff") {
      payload.employeeId = regEmployeeId.trim();
      payload.departmentId = regDepartmentId || undefined;
      payload.designation = regStaffDesignation.trim();
    } else if (regRole === "principal") {
      payload.securityPasscode = regPasscode.trim();
    }

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setRegFeedback({
          type: "error",
          text: data.error || "Registration failed. Please check inputs.",
        });
      } else {
        setRegFeedback({
          type: "success",
          text: `Account created for ${payload.firstName} ${payload.lastName} (${data.user.email}). You can now sign in!`,
        });
        setEmailInput(data.user.email);
        setPasswordInput(payload.password);
      }
    } catch (err: any) {
      setRegFeedback({
        type: "error",
        text: err.message || "Network error during registration.",
      });
    } finally {
      setRegSubmitting(false);
    }
  }

  // Handle Password Reset
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
          text: `Password for (${data.email}) reset to: "${newPassword}".`,
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
    <div className="min-h-screen font-sans flex flex-col items-center justify-center p-4 sm:p-6 text-slate-100 relative overflow-hidden bg-slate-950">
      {/* ── HIGH RESOLUTION CAMPUS BACKGROUND IMAGE WITH RICH ATMOSPHERIC OVERLAY ── */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat transform scale-105 filter brightness-95 contrast-105"
        style={{ backgroundImage: `url('/campus-background.jpg')` }}
      />
      {/* Dark modern gradient overlay for crisp legibility and high contrast */}
      <div className="absolute inset-0 bg-gradient-to-tr from-slate-950/95 via-slate-950/85 to-slate-900/80 backdrop-blur-[2px]" />
      <div className="absolute top-1/4 left-1/3 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[500px] rounded-full bg-brand-500/15 blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-[500px] h-[400px] rounded-full bg-indigo-600/15 blur-[120px] pointer-events-none" />

      {/* ── TWO-COLUMN MODERN ACADEMIC PRESENTATION CONTAINER ── */}
      <div className="relative z-10 w-full max-w-5xl my-auto grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center py-6">
        
        {/* LEFT COLUMN: School Identity, Accolades & Highlights (Visible on larger screens) */}
        <div className="hidden lg:flex lg:col-span-6 flex-col justify-center space-y-6 text-left pr-4">
          <div className="inline-flex items-center gap-2.5 rounded-full bg-white/[0.08] backdrop-blur-xl border border-white/[0.15] px-4 py-1.5 text-xs font-bold text-white shadow-lg w-fit">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>CBSE Affiliation #1930482 · Academic Session 2026–27</span>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-tr from-brand-500 via-indigo-500 to-cyan-400 p-[2px] shadow-[0_0_30px_rgba(99,102,241,0.6)]">
                <div className="h-full w-full rounded-[14px] bg-[#090d16] flex items-center justify-center">
                  <span className="font-display font-black text-white text-lg tracking-wider">GIA</span>
                </div>
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight font-display">
                  Greenfield International Academy
                </h1>
                <p className="text-xs font-semibold text-cyan-300 uppercase tracking-widest mt-0.5">
                  Central Academic SIS &amp; Administration Portal
                </p>
              </div>
            </div>
            <p className="text-sm text-slate-300 leading-relaxed max-w-lg pt-1">
              Next-generation institutional management platform connecting students, educators, and administrators with realtime grading, automated fee billing, and AI learning assistance.
            </p>
          </div>

          {/* Key Feature Highlights */}
          <div className="space-y-3 pt-2">
            <div className="flex items-start gap-3.5 p-3 rounded-2xl bg-white/[0.04] border border-white/[0.08] backdrop-blur-md">
              <div className="h-9 w-9 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-300 shrink-0 text-base">
                🎓
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">Automated Student Information System</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">Biometric attendance records, CBSE marksheets, and interactive student rosters.</p>
              </div>
            </div>

            <div className="flex items-start gap-3.5 p-3 rounded-2xl bg-white/[0.04] border border-white/[0.08] backdrop-blur-md">
              <div className="h-9 w-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-300 shrink-0 text-base">
                💳
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">Live Payment Gateway &amp; Dynamic UPI</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">Official Razorpay checkout and live scannable SBI UPI QR codes for seamless fee settlement.</p>
              </div>
            </div>

            <div className="flex items-start gap-3.5 p-3 rounded-2xl bg-white/[0.04] border border-white/[0.08] backdrop-blur-md">
              <div className="h-9 w-9 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-300 shrink-0 text-base">
                🤖
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">AI Academic Copilot &amp; Quiz Engine</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">Deep multi-subject test generation across Science, Math, Civics, and Computer Science.</p>
              </div>
            </div>
          </div>

          {/* System status pill */}
          <div className="flex items-center gap-4 text-xs text-slate-400 pt-2 font-mono">
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              <span>Campus Network: Online</span>
            </div>
            <span>•</span>
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-cyan-400" />
              <span>CBSE Portal: Synchronized</span>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Modern Frosted Glass Authentication Card */}
        <div className="w-full max-w-md mx-auto lg:col-span-6">
          <div className="rounded-3xl bg-slate-900/80 backdrop-blur-2xl border border-white/[0.12] p-6 sm:p-8 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)] relative ring-1 ring-inset ring-white/[0.05]">
            
            {/* Header for Mobile Devices (when left column is hidden) */}
            <div className="lg:hidden flex flex-col items-center text-center mb-6">
              <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-brand-500 via-indigo-500 to-cyan-400 p-[1.5px] shadow-[0_0_25px_rgba(99,102,241,0.5)] mb-3">
                <div className="h-full w-full rounded-[14px] bg-[#090d16] flex items-center justify-center">
                  <span className="font-display font-black text-white text-base tracking-wider">GIA</span>
                </div>
              </div>
              <h1 className="text-xl font-black text-white tracking-tight font-display">
                Greenfield International Academy
              </h1>
              <p className="text-xs text-slate-400 mt-1">
                Central Academic SIS &amp; Administration Portal
              </p>
            </div>

            {/* Clean Segmented Window Tabs: Sign In / Register */}
            <div className="grid grid-cols-2 p-1.5 rounded-2xl bg-white/[0.04] border border-white/[0.08] text-xs font-bold mb-6">
              <button
                type="button"
                onClick={() => {
                  setActiveTab("login");
                  setRegFeedback(null);
                }}
                className={`py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 ${
                  activeTab === "login"
                    ? "bg-gradient-to-r from-brand-600 via-indigo-600 to-indigo-700 text-white shadow-[0_4px_16px_rgba(99,102,241,0.4)] font-bold ring-1 ring-white/10"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                </svg>
                <span>Sign In</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab("register");
                }}
                className={`py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 ${
                  activeTab === "register"
                    ? "bg-gradient-to-r from-brand-600 via-indigo-600 to-indigo-700 text-white shadow-[0_4px_16px_rgba(99,102,241,0.4)] font-bold ring-1 ring-white/10"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.765z" />
                </svg>
                <span>Register</span>
              </button>
            </div>

            {/* ── TAB 1: SIGN IN WINDOW ── */}
            {activeTab === "login" && (
              <div>
                {/* Quick 1-Click Demo Login: Prominent at Top for Quick Review */}
                <div className="mb-5 p-3 rounded-2xl bg-white/[0.03] border border-white/[0.08]">
                  <div className="text-[10px] font-bold text-slate-400 mb-2 text-center uppercase tracking-wider font-display flex items-center justify-center gap-1.5">
                    <span>⚡ Quick 1-Click Demo Profiles</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {demoAccounts.map((acc) => (
                      <button
                        key={acc.email}
                        type="button"
                        onClick={() => {
                          setEmailInput(acc.email);
                          setPasswordInput("Password123!");
                        }}
                        className="flex flex-col items-center justify-center gap-1 py-2 px-1.5 rounded-xl border border-white/[0.08] bg-white/[0.04] hover:bg-white/[0.1] hover:border-brand-500/50 text-xs text-slate-200 font-semibold transition group backdrop-blur-sm"
                        title={`Sign in as ${acc.role}`}
                      >
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${acc.badge}`}>
                          {acc.icon} {acc.role}
                        </span>
                        <span className="text-[10px] text-slate-400 group-hover:text-cyan-300 font-mono transition">Auto-Fill</span>
                      </button>
                    ))}
                  </div>
                </div>

                <form action={action} className="space-y-4 text-xs">
                  <div>
                    <label className="label text-xs font-bold text-slate-300" htmlFor="email">
                      Institutional Email Address
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                        </svg>
                      </span>
                      <input
                        id="email"
                        name="email"
                        type="email"
                        required
                        autoComplete="username"
                        className="input w-full pl-10 text-xs font-medium"
                        value={emailInput}
                        onChange={(e) => setEmailInput(e.target.value)}
                        placeholder="e.g. principal@greenfield.edu"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="label mb-0 text-xs font-bold text-slate-300" htmlFor="password">
                        Account Password
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowResetModal(true)}
                        className="text-[11px] font-semibold text-brand-400 hover:text-brand-300 transition"
                      >
                        Forgot Password?
                      </button>
                    </div>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                        </svg>
                      </span>
                      <input
                        id="password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        required
                        autoComplete="current-password"
                        className="input w-full pl-10 pr-10 font-mono text-xs"
                        value={passwordInput}
                        onChange={(e) => setPasswordInput(e.target.value)}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition"
                        title={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? (
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                          </svg>
                        ) : (
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>

                  {state?.error && (
                    <div
                      role="alert"
                      className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs font-semibold text-rose-200 flex items-center gap-2 backdrop-blur-md"
                    >
                      <span className="h-2 w-2 rounded-full bg-rose-400" />
                      <span>{state.error}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    className="btn-primary w-full py-3 text-xs font-bold shadow-lg flex items-center justify-center gap-2"
                    disabled={pending}
                  >
                    {pending ? (
                      <span className="flex items-center gap-2">
                        <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Authenticating Credentials...
                      </span>
                    ) : (
                      <span>Sign In to School Portal ➔</span>
                    )}
                  </button>
                </form>
              </div>
            )}

            {/* ── TAB 2: REGISTER WINDOW ── */}
            {activeTab === "register" && (
              <form onSubmit={handleRegister} className="space-y-3.5 text-xs">
                {/* Role Switcher */}
                <div>
                  <label className="label text-[11px] font-bold text-slate-300 mb-1.5">
                    Select Role to Register
                  </label>
                  <div className="grid grid-cols-4 gap-1 p-1 rounded-xl bg-white/[0.04] border border-white/[0.08] text-center font-bold">
                    {[
                      { id: "student", label: "Student", icon: "🎓" },
                      { id: "teacher", label: "Teacher", icon: "👩‍🏫" },
                      { id: "staff", label: "Staff", icon: "💼" },
                      { id: "principal", label: "Admin", icon: "👑" },
                    ].map((r) => (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => {
                          setRegRole(r.id as any);
                          setRegFeedback(null);
                        }}
                        className={`py-1.5 rounded-lg transition-all flex items-center justify-center gap-1 text-[11px] ${
                          regRole === r.id
                            ? "bg-gradient-to-r from-brand-600 to-indigo-600 text-white shadow-sm font-bold"
                            : "text-slate-400 hover:text-white"
                        }`}
                      >
                        <span>{r.icon}</span>
                        <span>{r.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Name Fields */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="label text-[11px] font-bold text-slate-300">First Name *</label>
                    <input
                      required
                      type="text"
                      placeholder="e.g. Aarav"
                      value={regFirstName}
                      onChange={(e) => setRegFirstName(e.target.value)}
                      className="input w-full text-xs"
                    />
                  </div>
                  <div>
                    <label className="label text-[11px] font-bold text-slate-300">Last Name *</label>
                    <input
                      required
                      type="text"
                      placeholder="e.g. Sharma"
                      value={regLastName}
                      onChange={(e) => setRegLastName(e.target.value)}
                      className="input w-full text-xs"
                    />
                  </div>
                </div>

                {/* Email Field */}
                <div>
                  <label className="label text-[11px] font-bold text-slate-300">Email Address *</label>
                  <input
                    required
                    type="email"
                    placeholder={regRole === "student" ? "aarav@student.greenfield.edu" : "name@greenfield.edu"}
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    className="input w-full font-mono text-xs"
                  />
                </div>

                {/* Password Field */}
                <div>
                  <div className="flex items-center justify-between pb-1">
                    <label className="label text-[11px] font-bold text-slate-300">Password * (Min 8 chars)</label>
                    <button
                      type="button"
                      onClick={() => setShowRegPassword((prev) => !prev)}
                      className="text-[11px] text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1 transition"
                    >
                      <span>{showRegPassword ? "Hide" : "Show"}</span>
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      required
                      minLength={8}
                      type={showRegPassword ? "text" : "password"}
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="Enter secure password"
                      className="input w-full pr-10 font-mono text-xs"
                    />
                  </div>
                </div>

                {/* Role-Specific Fields */}
                {regRole === "student" && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="label text-[11px] font-bold text-slate-300">Admission No</label>
                        <input
                          type="text"
                          value={regAdmissionNo}
                          onChange={(e) => setRegAdmissionNo(e.target.value)}
                          className="input w-full font-mono text-xs uppercase"
                        />
                      </div>
                      <div>
                        <label className="label text-[11px] font-bold text-slate-300">Class &amp; Section</label>
                        <select
                          value={regSectionId}
                          onChange={(e) => setRegSectionId(e.target.value)}
                          className="input w-full text-xs bg-slate-900"
                        >
                          {metadata.sections.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.gradeName} - {s.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Student Gender Selection */}
                    <div>
                      <label className="label text-[11px] font-bold text-slate-300 mb-1">
                        Student Gender *
                      </label>
                      <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-white/[0.04] border border-white/[0.08] text-center font-bold text-xs">
                        {[
                          { id: "MALE", label: "Male", icon: "👦" },
                          { id: "FEMALE", label: "Female", icon: "👧" },
                          { id: "OTHER", label: "Other", icon: "🧑" },
                        ].map((g) => (
                          <button
                            key={g.id}
                            type="button"
                            onClick={() => setRegGender(g.id as any)}
                            className={`py-1.5 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                              regGender === g.id
                                ? "bg-brand-600 text-white shadow-sm font-black"
                                : "text-slate-400 hover:text-white"
                            }`}
                          >
                            <span>{g.icon}</span>
                            <span>{g.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {regRole === "teacher" && (
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="label text-[11px] font-bold text-slate-300">Employee ID</label>
                      <input
                        type="text"
                        value={regEmployeeId}
                        onChange={(e) => setRegEmployeeId(e.target.value)}
                        className="input w-full font-mono text-xs uppercase"
                      />
                    </div>
                    <div>
                      <label className="label text-[11px] font-bold text-slate-300">Department</label>
                      <select
                        value={regDepartmentId}
                        onChange={(e) => setRegDepartmentId(e.target.value)}
                        className="input w-full text-xs bg-slate-900"
                      >
                        {metadata.departments.map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                {regRole === "staff" && (
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="label text-[11px] font-bold text-slate-300">Employee ID</label>
                        <input
                          type="text"
                          value={regEmployeeId}
                          onChange={(e) => setRegEmployeeId(e.target.value)}
                          className="input w-full font-mono text-xs uppercase"
                        />
                      </div>
                      <div>
                        <label className="label text-[11px] font-bold text-slate-300">Department</label>
                        <select
                          value={regDepartmentId}
                          onChange={(e) => setRegDepartmentId(e.target.value)}
                          className="input w-full text-xs bg-slate-900"
                        >
                          {metadata.departments.map((d) => (
                            <option key={d.id} value={d.id}>
                              {d.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="label text-[11px] font-bold text-slate-300">Designation / Role Title *</label>
                      <input
                        type="text"
                        required
                        value={regStaffDesignation}
                        onChange={(e) => setRegStaffDesignation(e.target.value)}
                        placeholder="e.g. School Accountant, Librarian, Transport Coordinator"
                        className="input w-full text-xs"
                      />
                    </div>
                  </div>
                )}

                {regRole === "principal" && (
                  <div>
                    <label className="label text-[11px] font-bold text-slate-300">Admin Clearance Key *</label>
                    <input
                      type="password"
                      required
                      value={regPasscode}
                      onChange={(e) => setRegPasscode(e.target.value)}
                      className="input w-full font-mono text-xs"
                    />
                  </div>
                )}

                {regFeedback && (
                  <div
                    className={`rounded-xl p-3 text-xs font-semibold ${
                      regFeedback.type === "success"
                        ? "border border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
                        : "border border-rose-500/30 bg-rose-500/10 text-rose-200"
                    }`}
                  >
                    {regFeedback.text}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={regSubmitting}
                  className="btn-primary w-full py-3 text-xs font-bold shadow-md flex items-center justify-center gap-2 mt-2"
                >
                  {regSubmitting ? "Creating Account..." : "Create Account ➔"}
                </button>

                {regFeedback?.type === "success" && (
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab("login");
                      setRegFeedback(null);
                    }}
                    className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition text-center block shadow-md"
                  >
                    Proceed to Sign In ➔
                  </button>
                )}
              </form>
            )}
          </div>
        </div>
      </div>

      {/* Modern Institutional Footer */}
      <footer className="mt-4 text-center text-xs text-slate-400 drop-shadow relative z-10 font-medium">
        © 2026 Greenfield International Academy · Official SIS Portal · CBSE Affiliation #1930482
      </footer>

      {/* ── RESET PASSWORD MODAL ── */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-xl animate-in fade-in">
          <div className="w-full max-w-sm rounded-3xl bg-slate-900/90 shadow-[0_20px_50px_rgba(0,0,0,0.8)] border border-white/[0.12] p-6 text-slate-100 backdrop-blur-2xl ring-1 ring-inset ring-white/[0.05]">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3 mb-4">
              <h4 className="text-sm font-bold text-white font-display">Reset Account Password</h4>
              <button
                type="button"
                onClick={() => {
                  setShowResetModal(false);
                  setResetFeedback(null);
                }}
                className="text-slate-400 hover:text-white font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleResetPassword} className="space-y-3.5 text-xs">
              <div>
                <label className="label text-xs text-slate-300">Registered Email Address *</label>
                <input
                  required
                  type="email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  className="input w-full font-mono text-xs"
                />
              </div>

              <div>
                <div className="flex items-center justify-between pb-1">
                  <label className="label text-xs text-slate-300">New Password * (Min 8 chars)</label>
                  <button
                    type="button"
                    onClick={() => setShowResetPassword((prev) => !prev)}
                    className="text-[11px] text-brand-400 hover:text-brand-300 font-semibold transition"
                  >
                    {showResetPassword ? "Hide" : "Show"}
                  </button>
                </div>
                <div className="relative">
                  <input
                    required
                    minLength={8}
                    type={showResetPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    className="input w-full pr-10 font-mono text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => setShowResetPassword((prev) => !prev)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition"
                    title={showResetPassword ? "Hide password" : "Show password"}
                  >
                    {showResetPassword ? "🙈" : "👁️"}
                  </button>
                </div>
              </div>

              {resetFeedback && (
                <div
                  className={`rounded-xl p-3 text-xs font-semibold ${
                    resetFeedback.type === "success"
                      ? "border border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
                      : "border border-rose-500/30 bg-rose-500/10 text-rose-200"
                  }`}
                >
                  {resetFeedback.text}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
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
                  {resetting ? "Resetting..." : "Reset Password"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
