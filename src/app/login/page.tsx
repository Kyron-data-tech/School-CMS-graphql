"use client";

import { useActionState, useState, useEffect } from "react";
import { loginAction } from "@/lib/auth/actions";

interface Metadata {
  sections: Array<{ id: string; name: string; gradeLevel: number; gradeName: string }>;
  departments: Array<{ id: string; name: string }>;
}

const demoAccounts = [
  { role: "Principal", email: "principal@greenfield.edu", icon: "👑" },
  { role: "Teacher", email: "rao@greenfield.edu", icon: "👩‍🏫" },
  { role: "Student", email: "arjun@student.greenfield.edu", icon: "🎓" },
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
    <div className="min-h-screen font-sans flex flex-col items-center justify-center p-4 sm:p-6 text-slate-100 relative bg-[#07090e] overflow-hidden">
      {/* ── Ambient Background Lighting ── */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] rounded-full bg-brand-600/15 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-[400px] h-[300px] rounded-full bg-indigo-600/10 blur-[100px] pointer-events-none" />

      {/* ── MODERN GLASS AUTHENTICATION CARD ── */}
      <div className="w-full max-w-md rounded-3xl bg-slate-900/50 backdrop-blur-2xl border border-white/[0.08] p-6 sm:p-8 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.7)] relative z-10 ring-1 ring-inset ring-white/[0.03]">
        {/* School Crest & Title Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-brand-500 via-indigo-500 to-cyan-400 p-[1.5px] shadow-[0_0_25px_-3px_rgba(99,102,241,0.5)] mb-3">
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
        <div className="grid grid-cols-2 p-1 rounded-xl bg-white/[0.03] border border-white/[0.08] text-xs font-bold mb-6">
          <button
            type="button"
            onClick={() => {
              setActiveTab("login");
              setRegFeedback(null);
            }}
            className={`py-2 rounded-lg transition-all flex items-center justify-center gap-2 ${
              activeTab === "login"
                ? "bg-gradient-to-r from-brand-600 to-indigo-600 text-white shadow-[0_0_15px_-2px_rgba(99,102,241,0.4)] font-bold"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
            </svg>
            <span>Sign In</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab("register");
            }}
            className={`py-2 rounded-lg transition-all flex items-center justify-center gap-2 ${
              activeTab === "register"
                ? "bg-gradient-to-r from-brand-600 to-indigo-600 text-white shadow-[0_0_15px_-2px_rgba(99,102,241,0.4)] font-bold"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.765z" />
            </svg>
            <span>Register</span>
          </button>
        </div>

        {/* ── TAB 1: SIGN IN WINDOW ── */}
        {activeTab === "login" && (
          <div>
            <form action={action} className="space-y-4 text-xs">
              <div>
                <label className="label text-xs font-bold text-slate-300" htmlFor="email">
                  Email Address
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
                <div className="flex items-center justify-between mb-1">
                  <label className="label mb-0 text-xs font-bold text-slate-300" htmlFor="password">
                    Password
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
                className="btn-primary w-full py-2.5 text-xs font-bold shadow-md flex items-center justify-center gap-2"
                disabled={pending}
              >
                {pending ? "Signing in..." : "Sign In to Portal ➔"}
              </button>
            </form>

            {/* Quick 1-Click Demo Login: Modern Frosted Cards */}
            <div className="mt-6 pt-5 border-t border-white/[0.08]">
              <div className="text-[11px] font-bold text-slate-400 mb-2.5 text-center uppercase tracking-wider font-display">
                Quick Demo Accounts
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { role: "Principal", email: "principal@greenfield.edu", badge: "bg-purple-500/15 text-purple-300 border-purple-500/30" },
                  { role: "Teacher", email: "rao@greenfield.edu", badge: "bg-blue-500/15 text-blue-300 border-blue-500/30" },
                  { role: "Student", email: "arjun@student.greenfield.edu", badge: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30" },
                ].map((acc) => (
                  <button
                    key={acc.email}
                    type="button"
                    onClick={() => {
                      setEmailInput(acc.email);
                      setPasswordInput("Password123!");
                    }}
                    className="flex flex-col items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl border border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.08] hover:border-brand-500/40 text-xs text-slate-200 font-semibold transition group backdrop-blur-sm"
                  >
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${acc.badge}`}>
                      {acc.role}
                    </span>
                    <span className="text-[10px] text-slate-400 group-hover:text-white transition">Auto Fill ↵</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 2: REGISTER WINDOW ── */}
        {activeTab === "register" && (
          <form onSubmit={handleRegister} className="space-y-3.5 text-xs">
            {/* Role Switcher */}
            <div>
              <label className="label text-[11px] font-bold text-slate-400 mb-1">
                Select Role to Register
              </label>
              <div className="grid grid-cols-4 gap-1 p-1 rounded-xl bg-white/[0.03] border border-white/[0.08] text-center font-bold">
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
                <label className="label text-[11px] font-bold text-slate-400">First Name *</label>
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
                <label className="label text-[11px] font-bold text-slate-400">Last Name *</label>
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
              <label className="label text-[11px] font-bold text-slate-400">Email Address *</label>
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
                <label className="label text-[11px] font-bold text-slate-400">Password * (Min 8 chars)</label>
                <button
                  type="button"
                  onClick={() => setShowRegPassword((prev) => !prev)}
                  className="text-[11px] text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1 transition"
                >
                  <span>{showRegPassword ? "🙈 Hide" : "👁️ Show"}</span>
                </button>
              </div>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm">🔒</span>
                <input
                  required
                  minLength={8}
                  type={showRegPassword ? "text" : "password"}
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  placeholder="Enter secure password"
                  className="input w-full pl-10 pr-10 font-mono text-xs"
                />
                <button
                  type="button"
                  onClick={() => setShowRegPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  aria-label={showRegPassword ? "Hide password" : "Show password"}
                  title={showRegPassword ? "Hide password" : "Show password"}
                >
                  {showRegPassword ? "🙈" : "👁️"}
                </button>
              </div>
            </div>

            {/* Role-Specific Field */}
            {regRole === "student" && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="label text-[11px] font-bold text-slate-400">Admission No</label>
                    <input
                      type="text"
                      value={regAdmissionNo}
                      onChange={(e) => setRegAdmissionNo(e.target.value)}
                      className="input w-full font-mono text-xs uppercase"
                    />
                  </div>
                  <div>
                    <label className="label text-[11px] font-bold text-slate-400">Section</label>
                    <select
                      value={regSectionId}
                      onChange={(e) => setRegSectionId(e.target.value)}
                      className="input w-full text-xs"
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
                  <label className="label text-[11px] font-bold text-slate-400 mb-1">
                    Student Gender *
                  </label>
                  <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-slate-950 border border-slate-800 text-center font-bold text-xs">
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
                  <label className="label text-[11px] font-bold text-slate-400">Employee ID</label>
                  <input
                    type="text"
                    value={regEmployeeId}
                    onChange={(e) => setRegEmployeeId(e.target.value)}
                    className="input w-full font-mono text-xs uppercase"
                  />
                </div>
                <div>
                  <label className="label text-[11px] font-bold text-slate-400">Department</label>
                  <select
                    value={regDepartmentId}
                    onChange={(e) => setRegDepartmentId(e.target.value)}
                    className="input w-full text-xs"
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
                    <label className="label text-[11px] font-bold text-slate-400">Employee ID</label>
                    <input
                      type="text"
                      value={regEmployeeId}
                      onChange={(e) => setRegEmployeeId(e.target.value)}
                      className="input w-full font-mono text-xs uppercase"
                    />
                  </div>
                  <div>
                    <label className="label text-[11px] font-bold text-slate-400">Department</label>
                    <select
                      value={regDepartmentId}
                      onChange={(e) => setRegDepartmentId(e.target.value)}
                      className="input w-full text-xs"
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
                  <label className="label text-[11px] font-bold text-slate-400">Designation / Role Title *</label>
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
                <label className="label text-[11px] font-bold text-slate-400">Admin Clearance Key *</label>
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
                    ? "border border-emerald-800/80 bg-emerald-950/60 text-emerald-200"
                    : "border border-rose-800/80 bg-rose-950/60 text-rose-200"
                }`}
              >
                {regFeedback.text}
              </div>
            )}

            <button
              type="submit"
              disabled={regSubmitting}
              className="btn-primary w-full py-2.5 text-xs font-bold shadow-md flex items-center justify-center gap-2 mt-2"
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
                className="w-full py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition text-center block"
              >
                Proceed to Sign In ➔
              </button>
            )}
          </form>
        )}
      </div>

      {/* Clean & Minimal Footer */}
      <footer className="mt-6 text-center text-xs text-slate-400 drop-shadow relative z-10">
        © 2026 Greenfield International Academy · All Rights Reserved.
      </footer>

      {/* ── RESET PASSWORD MODAL ── */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-xl animate-in fade-in">
          <div className="w-full max-w-sm rounded-3xl bg-slate-900/80 shadow-[0_20px_50px_rgba(0,0,0,0.8)] border border-white/[0.1] p-6 text-slate-100 backdrop-blur-2xl ring-1 ring-inset ring-white/[0.03]">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3 mb-4">
              <h4 className="text-sm font-bold text-white font-display">Reset Password</h4>
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
                <label className="label text-xs text-slate-300">Email Address *</label>
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
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 00-2.25 2.25z" />
                    </svg>
                  </span>
                  <input
                    required
                    minLength={8}
                    type={showResetPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    className="input w-full pl-10 pr-10 font-mono text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => setShowResetPassword((prev) => !prev)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition"
                    aria-label={showResetPassword ? "Hide password" : "Show password"}
                    title={showResetPassword ? "Hide password" : "Show password"}
                  >
                    {showResetPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              {resetFeedback && (
                <div
                  className={`rounded-xl p-3 text-xs font-semibold ${
                    resetFeedback.type === "success"
                      ? "border border-emerald-800/80 bg-emerald-950/60 text-emerald-200"
                      : "border border-rose-800/80 bg-rose-950/60 text-rose-200"
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
