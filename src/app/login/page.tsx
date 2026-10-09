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
  const [regRole, setRegRole] = useState<"student" | "teacher" | "principal">("student");
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
    <div
      className="min-h-screen font-sans flex flex-col items-center justify-center p-4 sm:p-6 text-slate-100 relative bg-cover bg-center bg-no-repeat bg-fixed"
      style={{
        backgroundImage: "linear-gradient(to bottom, rgba(15, 23, 42, 0.65), rgba(2, 6, 23, 0.82)), url('/campus-background.jpg')",
      }}
    >
      {/* ── SIMPLE & EFFECTIVE AUTHENTICATION WINDOW ── */}
      <div className="w-full max-w-md rounded-3xl bg-slate-900/90 backdrop-blur-xl border border-slate-700/60 p-6 sm:p-8 shadow-2xl relative z-10">
        {/* School Crest & Title Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-amber-400 via-amber-500 to-amber-700 p-0.5 shadow-lg mb-3">
            <div className="h-full w-full rounded-[14px] bg-slate-950 flex items-center justify-center">
              <span className="font-serif font-black text-amber-400 text-lg tracking-wider">GIA</span>
            </div>
          </div>
          <h1 className="text-xl font-black text-white tracking-tight font-display">
            Greenfield International Academy
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            School Management &amp; Academic Portal
          </p>
        </div>

        {/* Clean Segmented Window Tabs: Sign In / Register */}
        <div className="grid grid-cols-2 p-1 rounded-2xl bg-slate-950 border border-slate-800 text-xs font-bold mb-6">
          <button
            type="button"
            onClick={() => {
              setActiveTab("login");
              setRegFeedback(null);
            }}
            className={`py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              activeTab === "login"
                ? "bg-brand-600 text-white shadow-sm font-black"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <span>🔐</span>
            <span>Sign In</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab("register");
            }}
            className={`py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              activeTab === "register"
                ? "bg-brand-600 text-white shadow-sm font-black"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <span>📝</span>
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
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm">✉️</span>
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
                    className="text-[11px] font-semibold text-brand-400 hover:underline"
                  >
                    Forgot Password?
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
                    className="input w-full pl-10 pr-10 font-mono text-xs"
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    {showPassword ? "🙈" : "👁️"}
                  </button>
                </div>
              </div>

              {state?.error && (
                <div
                  role="alert"
                  className="rounded-xl border border-rose-800/80 bg-rose-950/60 p-3 text-xs font-semibold text-rose-200 flex items-center gap-2"
                >
                  <span>⚠️</span>
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

            {/* Quick 1-Click Demo Login Pills: Clean & Compact */}
            <div className="mt-6 pt-5 border-t border-slate-800">
              <div className="text-[11px] font-medium text-slate-400 mb-2.5 text-center">
                Quick Demo Login:
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
                    className="flex items-center justify-center gap-1 py-2 px-1.5 rounded-xl border border-slate-800 bg-slate-950/70 hover:bg-slate-800 hover:border-slate-700 text-xs text-slate-300 font-medium transition"
                  >
                    <span>{acc.icon}</span>
                    <span className="truncate">{acc.role}</span>
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
                Select Role
              </label>
              <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-slate-950 border border-slate-800 text-center font-bold">
                {[
                  { id: "student", label: "Student", icon: "🎓" },
                  { id: "teacher", label: "Teacher", icon: "👩‍🏫" },
                  { id: "principal", label: "Admin", icon: "👑" },
                ].map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => {
                      setRegRole(r.id as any);
                      setRegFeedback(null);
                    }}
                    className={`py-1.5 rounded-lg transition-all flex items-center justify-center gap-1 ${
                      regRole === r.id
                        ? "bg-brand-600 text-white shadow-sm font-black"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-sm rounded-3xl bg-slate-900 shadow-2xl border border-slate-800 p-6 text-slate-100">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
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
                    className="text-[11px] text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1 transition"
                  >
                    <span>{showResetPassword ? "🙈 Hide" : "👁️ Show"}</span>
                  </button>
                </div>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm">🔒</span>
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
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                    aria-label={showResetPassword ? "Hide password" : "Show password"}
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
