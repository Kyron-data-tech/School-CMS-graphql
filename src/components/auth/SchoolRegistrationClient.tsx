"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui";

export interface RegistrationMetadata {
  school: { id: string; name: string };
  sections: Array<{ id: string; name: string; gradeLevel: number; gradeName: string }>;
  departments: Array<{ id: string; name: string }>;
}

export type RegistrationRole = "student" | "teacher" | "principal";

export interface RegisteredAccountData {
  applicationNo: string;
  admissionNo?: string;
  employeeId?: string;
  name: string;
  email: string;
  role: RegistrationRole;
  gradeOrDept?: string;
  date: string;
  phone?: string;
}

export function SchoolRegistrationClient() {
  const [role, setRole] = useState<RegistrationRole>("student");
  const [metadata, setMetadata] = useState<RegistrationMetadata>({
    school: { id: "sch-1", name: "Greenfield International Academy" },
    sections: [
      { id: "sec-6a", name: "6-A", gradeLevel: 6, gradeName: "Class 6" },
      { id: "sec-7a", name: "7-A", gradeLevel: 7, gradeName: "Class 7" },
      { id: "sec-8a", name: "8-A", gradeLevel: 8, gradeName: "Class 8" },
      { id: "sec-8b", name: "8-B", gradeLevel: 8, gradeName: "Class 8" },
      { id: "sec-9a", name: "9-A", gradeLevel: 9, gradeName: "Class 9" },
      { id: "sec-10a", name: "10-A", gradeLevel: 10, gradeName: "Class 10" },
      { id: "sec-11a", name: "11-A", gradeLevel: 11, gradeName: "Class 11" },
      { id: "sec-12a", name: "12-A", gradeLevel: 12, gradeName: "Class 12" },
    ],
    departments: [
      { id: "dept-1", name: "Science" },
      { id: "dept-2", name: "Mathematics" },
      { id: "dept-3", name: "Computer Science" },
      { id: "dept-4", name: "English" },
      { id: "dept-5", name: "Humanities" },
    ],
  });

  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<RegisteredAccountData | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  // Common Fields
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("SchoolPass2026!");
  const [confirmPassword, setConfirmPassword] = useState("SchoolPass2026!");
  const [phone, setPhone] = useState("");
  const [agreedTerms, setAgreedTerms] = useState(true);

  // Student Fields
  const [admissionNo, setAdmissionNo] = useState(() => `ADM-${Math.floor(1000 + Math.random() * 9000)}`);
  const [sectionId, setSectionId] = useState("");
  const [gender, setGender] = useState("MALE");
  const [dateOfBirth, setDateOfBirth] = useState("2011-05-15");

  // Teacher Fields
  const [employeeId, setEmployeeId] = useState(() => `EMP-${Math.floor(1000 + Math.random() * 9000)}`);
  const [departmentId, setDepartmentId] = useState("");
  const [designation, setDesignation] = useState("Subject Teacher");
  const [qualifications, setQualifications] = useState("M.Sc., B.Ed.");


  // Principal Fields
  const [securityPasscode, setSecurityPasscode] = useState("GREENFIELD2026");

  // Fetch live sections and departments
  useEffect(() => {
    fetch("/api/auth/register")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) {
          setMetadata(data.data);
          if (data.data.sections?.length > 0 && !sectionId) {
            setSectionId(data.data.sections[0].id);
          }
          if (data.data.departments?.length > 0 && !departmentId) {
            setDepartmentId(data.data.departments[0].id);
          }
        }
      })
      .catch((err) => console.warn("Using default fallback metadata:", err));
  }, []);

  // Auto-suggest institutional email
  useEffect(() => {
    const f = firstName.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
    const l = lastName.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
    if (f && (!email || email.includes("@greenfield.edu") || email.includes("@student.greenfield.edu"))) {
      const domain = role === "student" ? "student.greenfield.edu" : "greenfield.edu";
      setEmail(`${f}${l ? "." + l : ""}@${domain}`);
    }
  }, [role, firstName, lastName]);

  // 1-Click Fast Fill for quick reviewer / user testing
  function fastFillDemo() {
    setErrorMessage(null);
    if (role === "student") {
      setFirstName("Aarav");
      setLastName("Sharma");
      const rnd = Math.floor(1000 + Math.random() * 9000);
      setEmail(`aarav.sharma.${rnd}@student.greenfield.edu`);
      setPassword("SchoolPass2026!");
      setConfirmPassword("SchoolPass2026!");
      setPhone("+91 98712 34567");
      setAdmissionNo(`ADM-${rnd}`);
      setGender("MALE");
      setDateOfBirth("2011-04-18");
      if (metadata.sections.length > 0) setSectionId(metadata.sections[0].id);
    } else if (role === "teacher") {
      setFirstName("Dr. Sunita");
      setLastName("Rao");
      const rnd = Math.floor(1000 + Math.random() * 9000);
      setEmail(`sunita.rao.${rnd}@greenfield.edu`);
      setPassword("FacultyPass2026!");
      setConfirmPassword("FacultyPass2026!");
      setPhone("+91 98220 98765");
      setEmployeeId(`EMP-${rnd}`);
      setDesignation("Senior Subject Teacher (Physics)");
      setQualifications("Ph.D. Physics, B.Ed.");
      if (metadata.departments.length > 0) setDepartmentId(metadata.departments[0].id);

    } else if (role === "principal") {
      setFirstName("Alistair");
      setLastName("Vance");
      const rnd = Math.floor(1000 + Math.random() * 9000);
      setEmail(`principal.${rnd}@greenfield.edu`);
      setPassword("AdminPass2026!");
      setConfirmPassword("AdminPass2026!");
      setSecurityPasscode("GREENFIELD2026");
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMessage(null);

    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match. Please verify both password fields.");
      return;
    }

    if (password.length < 8) {
      setErrorMessage("Password must be at least 8 characters long.");
      return;
    }

    if (!agreedTerms) {
      setErrorMessage("Please accept the terms and institutional code of conduct.");
      return;
    }

    setSubmitting(true);

    const payload: any = {
      role,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim().toLowerCase(),
      password: password.trim(),
      phone: phone.trim() || undefined,
    };

    if (role === "student") {
      payload.admissionNo = admissionNo.trim();
      payload.dateOfBirth = dateOfBirth;
      payload.gender = gender;
      payload.sectionId = sectionId || undefined;
    } else if (role === "teacher") {
      payload.employeeId = employeeId.trim();
      payload.departmentId = departmentId || undefined;
      payload.designation = designation;
      payload.qualifications = qualifications;

    } else if (role === "principal") {
      payload.securityPasscode = securityPasscode.trim();
    }

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to register account.");
      }

      const chosenSection = metadata.sections.find((s) => s.id === sectionId);
      const chosenDept = metadata.departments.find((d) => d.id === departmentId);
      const appRef = `GIA-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

      setSuccessData({
        applicationNo: appRef,
        admissionNo: data.student?.admissionNo || admissionNo,
        employeeId: data.teacher?.employeeId || employeeId,
        name: `${firstName.trim()} ${lastName.trim()}`,
        email: email.trim().toLowerCase(),
        role,
        gradeOrDept: role === "student" ? (chosenSection ? `Class ${chosenSection.name}` : "Class 9-A") : (chosenDept?.name || "Academics"),
        date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
        phone: phone.trim() || undefined,
      });

      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err: any) {
      setErrorMessage(err.message || "An unexpected error occurred during registration. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  function resetForm() {
    setSuccessData(null);
    setFirstName("");
    setLastName("");
    setEmail("");
    setPhone("");
    setErrorMessage(null);
    setAdmissionNo(`ADM-${Math.floor(1000 + Math.random() * 9000)}`);
  }

  return (
    <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8 flex flex-col justify-between relative font-sans">
      {/* ── TOP HEADER / BRAND ── */}
      <header className="max-w-xl w-full mx-auto mb-6 flex items-center justify-between text-xs text-white">
        <Link href="/" className="flex items-center gap-2.5 font-bold hover:opacity-90 transition">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-amber-400 via-amber-500 to-amber-700 p-0.5 shadow-sm">
            <div className="h-full w-full rounded-[10px] bg-slate-950 flex items-center justify-center font-serif text-amber-400 font-black text-sm">
              G
            </div>
          </div>
          <div>
            <span className="font-display font-black text-sm text-white tracking-tight block">Greenfield Academy</span>
            <span className="text-[10px] text-slate-300 font-normal">Admissions &amp; Registration Portal</span>
          </div>
        </Link>

        <Link
          href="/login"
          className="font-bold text-xs bg-white/10 hover:bg-white/20 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-white/15 transition text-white"
        >
          Sign In →
        </Link>
      </header>

      {/* ── MAIN REGISTRATION CARD ── */}
      <main className="max-w-xl w-full mx-auto my-auto">
        {successData ? (
          /* ── SUCCESS VIEW: SIMPLE & EFFECTIVE SLIP ── */
          <div className="card p-6 sm:p-8 bg-slate-900/95 backdrop-blur-xl shadow-2xl border border-slate-800 rounded-3xl text-slate-100 space-y-6 animate-in fade-in">
            <div className="text-center space-y-2">
              <div className="h-14 w-14 rounded-full bg-emerald-950/60 text-emerald-400 font-black text-2xl flex items-center justify-center mx-auto border border-emerald-800">
                ✓
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white font-display">
                Registration Successful!
              </h2>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Welcome to Greenfield International Academy. Your account has been created.
              </p>
            </div>

            {/* Account Details Box */}
            <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3 text-xs">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                <span className="text-slate-400 font-medium">Application Reference</span>
                <span className="font-mono font-bold text-brand-400">{successData.applicationNo}</span>
              </div>

              {successData.admissionNo && (
                <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                  <span className="text-slate-400 font-medium">Assigned Admission No</span>
                  <span className="font-mono font-bold text-white">{successData.admissionNo}</span>
                </div>
              )}

              {successData.employeeId && (
                <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                  <span className="text-slate-400 font-medium">Employee ID</span>
                  <span className="font-mono font-bold text-white">{successData.employeeId}</span>
                </div>
              )}

              <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                <span className="text-slate-400 font-medium">Applicant Name</span>
                <span className="font-bold text-white">{successData.name}</span>
              </div>

              <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                <span className="text-slate-400 font-medium">Registration Category</span>
                <Badge color="blue">{successData.role.toUpperCase()}</Badge>
              </div>

              <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                <span className="text-slate-400 font-medium">Assigned Grade / Dept</span>
                <span className="font-semibold text-slate-200">{successData.gradeOrDept}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-medium">Login Email</span>
                <span className="font-mono font-semibold text-brand-400">{successData.email}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-2">
              <Link
                href="/login"
                className="btn-primary w-full py-3 text-xs font-black shadow-md flex items-center justify-center gap-2"
              >
                Sign In to Dashboard ➔
              </Link>
              <div className="flex items-center justify-between gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="btn-ghost flex-1 py-2 text-xs font-semibold text-slate-300 hover:text-white"
                >
                  🖨️ Print Slip
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="btn-ghost flex-1 py-2 text-xs font-semibold text-slate-300 hover:text-white"
                >
                  ← Register Another
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* ── STANDARD FORM CARD (LIKE OTHER WEBSITES ON THE INTERNET) ── */
          <div className="card p-6 sm:p-8 bg-slate-900/95 backdrop-blur-xl shadow-2xl border border-slate-800 rounded-3xl text-slate-100 space-y-6">
            {/* Header */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <h1 className="text-xl sm:text-2xl font-black text-white font-display">
                  Create an Account
                </h1>
                <span className="text-[11px] font-bold text-emerald-400 bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-800">
                  Admissions 2026–27
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Join Greenfield International Academy as a student, faculty member, or administrator.
              </p>
            </div>

            {/* Simple Role Selector Tabs */}
            <div className="grid grid-cols-3 gap-1.5 p-1 rounded-2xl bg-slate-950/80 border border-slate-800 text-xs font-bold text-center">
              {[
                { id: "student", label: "Student", icon: "🎓" },
                { id: "teacher", label: "Teacher", icon: "👩‍🏫" },
                { id: "principal", label: "Admin", icon: "🏛️" },
              ].map((t) => {
                const isActive = role === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => {
                      setRole(t.id as RegistrationRole);
                      setErrorMessage(null);
                    }}
                    className={`py-2 px-1 rounded-xl transition-all flex flex-col sm:flex-row items-center justify-center gap-1 ${
                      isActive
                        ? "bg-brand-600 text-white shadow-sm font-black border border-brand-500"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    <span>{t.icon}</span>
                    <span className="text-[11px]">{t.label}</span>
                  </button>
                );
              })}
            </div>

            {/* 1-Click Fast Fill (Try Demo) Button */}
            <div className="flex items-center justify-between text-xs bg-brand-950/50 border border-brand-800/60 p-2.5 rounded-xl text-brand-200">
              <span className="text-[11px] text-brand-300">
                Evaluating? Fill sample data instantly:
              </span>
              <button
                type="button"
                onClick={fastFillDemo}
                className="px-2.5 py-1 rounded-lg bg-brand-600 hover:bg-brand-700 text-white font-bold text-[11px] shadow-sm transition active:scale-95"
              >
                ⚡ Auto-Fill Sample {role === "student" ? "Student" : role === "teacher" ? "Teacher" : "Admin"}
              </button>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="p-3.5 rounded-xl bg-rose-950/50 border border-rose-800 text-rose-200 text-xs font-semibold flex items-center justify-between">
                <span>⚠️ {errorMessage}</span>
                <button
                  type="button"
                  onClick={() => setErrorMessage(null)}
                  className="text-slate-400 hover:text-white ml-2 font-bold"
                >
                  ✕
                </button>
              </div>
            )}

            {/* ── REGISTRATION FORM ── */}
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              {/* Full Name */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="label text-xs font-bold text-slate-300">First Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Aarav"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="input w-full py-2.5 text-xs font-medium"
                  />
                </div>
                <div>
                  <label className="label text-xs font-bold text-slate-300">Last Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Sharma"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="input w-full py-2.5 text-xs font-medium"
                  />
                </div>
              </div>

              {/* Email Address */}
              <div>
                <label className="label text-xs font-bold text-slate-300">Email Address *</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. aarav.sharma@student.greenfield.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input w-full py-2.5 text-xs font-mono font-medium"
                />
              </div>

              {/* Passwords */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="label mb-0 text-xs font-bold text-slate-300">Password *</label>
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-[10px] text-brand-400 hover:underline font-semibold"
                    >
                      {showPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input w-full py-2.5 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="label text-xs font-bold text-slate-300">Confirm Password *</label>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="input w-full py-2.5 text-xs font-mono"
                  />
                </div>
              </div>

              {/* ── ROLE-SPECIFIC QUICK FIELDS ── */}
              {role === "student" && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800">
                  <div>
                    <label className="label text-xs font-bold text-slate-300">Class / Section *</label>
                    <select
                      value={sectionId}
                      onChange={(e) => setSectionId(e.target.value)}
                      className="input w-full py-2 text-xs font-semibold"
                    >
                      {metadata.sections.map((sec) => (
                        <option key={sec.id} value={sec.id}>
                          Class {sec.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="label text-xs font-bold text-slate-300">Gender</label>
                    <select
                      value={gender}
                      onChange={(e) => setGender(e.target.value)}
                      className="input w-full py-2 text-xs"
                    >
                      <option value="MALE">Male</option>
                      <option value="FEMALE">Female</option>
                      <option value="OTHER">Other</option>
                      <option value="UNSPECIFIED">Prefer not to say</option>
                    </select>
                  </div>
                  <div>
                    <label className="label text-xs font-bold text-slate-300">Date of Birth</label>
                    <input
                      type="date"
                      value={dateOfBirth}
                      onChange={(e) => setDateOfBirth(e.target.value)}
                      className="input w-full py-2 text-xs"
                    />
                  </div>
                </div>
              )}

              {role === "teacher" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800">
                  <div>
                    <label className="label text-xs font-bold text-slate-300">Department *</label>
                    <select
                      value={departmentId}
                      onChange={(e) => setDepartmentId(e.target.value)}
                      className="input w-full py-2 text-xs font-semibold"
                    >
                      {metadata.departments.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="label text-xs font-bold text-slate-300">Designation</label>
                    <input
                      type="text"
                      value={designation}
                      onChange={(e) => setDesignation(e.target.value)}
                      placeholder="e.g. Subject Teacher"
                      className="input w-full py-2 text-xs"
                    />
                  </div>
                </div>
              )}

              {role === "principal" && (
                <div className="p-3.5 rounded-2xl bg-amber-950/30 border border-amber-800/60 space-y-1.5">
                  <label className="label text-xs font-bold text-amber-300">
                    Administrative Clearance Key *
                  </label>
                  <input
                    type="password"
                    required
                    value={securityPasscode}
                    onChange={(e) => setSecurityPasscode(e.target.value)}
                    className="input w-full py-2 text-xs font-mono bg-slate-950 text-slate-100"
                  />
                  <span className="text-[10px] text-amber-400 block">
                    Default institutional deployment key: <code>GREENFIELD2026</code>
                  </span>
                </div>
              )}

              {/* Optional Phone */}
              <div>
                <label className="label text-xs font-bold text-slate-300">Mobile Phone (Optional)</label>
                <input
                  type="tel"
                  placeholder="+91 98712 34567"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="input w-full py-2.5 text-xs font-mono"
                />
              </div>

              {/* Terms Checkbox */}
              <div className="flex items-start gap-2 pt-1">
                <input
                  type="checkbox"
                  id="terms"
                  checked={agreedTerms}
                  onChange={(e) => setAgreedTerms(e.target.checked)}
                  className="h-4 w-4 mt-0.5 rounded text-brand-600 border-slate-700 bg-slate-900 focus:ring-brand-500"
                />
                <label htmlFor="terms" className="text-[11px] text-slate-400 select-none cursor-pointer leading-tight">
                  I agree to the institutional rules, academic attendance policies, and code of conduct of Greenfield International Academy.
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submitting}
                className="btn-primary w-full py-3 text-xs sm:text-sm font-black shadow-md flex items-center justify-center gap-2 mt-2"
              >
                {submitting ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Creating Account...</span>
                  </>
                ) : (
                  <>
                    <span>Create Account &amp; Register ➔</span>
                  </>
                )}
              </button>

              {/* Sign in link */}
              <div className="text-center pt-2 text-xs text-slate-400">
                Already registered?{" "}
                <Link href="/login" className="font-bold text-brand-400 hover:text-brand-300 hover:underline">
                  Sign in here →
                </Link>
              </div>
            </form>
          </div>
        )}
      </main>

      {/* ── SIMPLE FOOTER ── */}
      <footer className="max-w-xl w-full mx-auto mt-6 text-center text-xs text-slate-400">
        © 2026 Greenfield International Academy · CBSE Affiliated (1930482)
      </footer>
    </div>
  );
}
