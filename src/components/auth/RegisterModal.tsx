"use client";

import { useState, useEffect } from "react";

export interface RegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (account: { email: string; role: string; name: string }) => void;
  initialRole?: "student" | "teacher" | "principal";
}

interface Metadata {
  sections: Array<{ id: string; name: string; gradeLevel: number; gradeName: string }>;
  departments: Array<{ id: string; name: string }>;
}

export function RegisterModal({
  isOpen,
  onClose,
  onSuccess,
  initialRole = "student",
}: RegisterModalProps) {
  const [role, setRole] = useState<"student" | "teacher" | "principal">(initialRole);
  const [loadingMeta, setLoadingMeta] = useState(false);
  const [metadata, setMetadata] = useState<Metadata>({ sections: [], departments: [] });

  // Common Form Fields
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("SchoolPass2026!");
  const [phone, setPhone] = useState("");

  // Student specific
  const [admissionNo, setAdmissionNo] = useState(`ADM-${Math.floor(1000 + Math.random() * 9000)}`);
  const [gender, setGender] = useState("UNSPECIFIED");
  const [sectionId, setSectionId] = useState("");
  const [rollNumber, setRollNumber] = useState("");

  // Teacher specific
  const [employeeId, setEmployeeId] = useState(`EMP-${Math.floor(1000 + Math.random() * 9000)}`);
  const [departmentId, setDepartmentId] = useState("");
  const [designation, setDesignation] = useState("Subject Teacher");

  // Principal specific
  const [securityPasscode, setSecurityPasscode] = useState("GREENFIELD2026");

  // Status & Feedback
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Fetch sections and departments on open
  useEffect(() => {
    if (isOpen) {
      setLoadingMeta(true);
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
        .catch((err) => console.error("Failed to load registration metadata:", err))
        .finally(() => setLoadingMeta(false));
    }
  }, [isOpen]);

  // Adjust suggested email when role or name changes
  useEffect(() => {
    if (!email || email.includes("@")) {
      const cleanFirst = firstName.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
      const cleanLast = lastName.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
      if (cleanFirst) {
        const domain = role === "student" ? "student.greenfield.edu" : "greenfield.edu";
        setEmail(`${cleanFirst}${cleanLast ? "." + cleanLast : ""}@${domain}`);
      }
    }
  }, [role, firstName, lastName]);

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setFeedback(null);

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
      payload.gender = gender;
      payload.sectionId = sectionId || undefined;
      payload.rollNumber = rollNumber ? parseInt(rollNumber, 10) : undefined;
    } else if (role === "teacher") {
      payload.employeeId = employeeId.trim();
      payload.departmentId = departmentId || undefined;
      payload.designation = designation.trim();
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
        setFeedback({
          type: "error",
          text: data.error || "Registration failed. Please check inputs.",
        });
      } else {
        setFeedback({
          type: "success",
          text: `🎉 Registration successful! Created ${role.toUpperCase()} account for "${payload.firstName} ${payload.lastName}" (${data.user.email}).`,
        });

        if (onSuccess) {
          onSuccess({
            email: data.user.email,
            role: data.user.role,
            name: `${payload.firstName} ${payload.lastName}`,
          });
        }
      }
    } catch (err: any) {
      setFeedback({
        type: "error",
        text: err.message || "Network error while completing registration.",
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm animate-in fade-in">
      <div className="card w-full max-w-xl overflow-hidden bg-slate-900 border border-slate-800 shadow-2xl max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-gradient-to-r from-slate-950 to-brand-950/40 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 font-bold text-white shadow-sm">
              📝
            </span>
            <div>
              <h2 className="text-base font-bold text-white">School Registration Window</h2>
              <p className="text-xs text-slate-400">
                Register a new Student, Teacher, or Principal into Greenfield CMS
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition"
          >
            ✕
          </button>
        </div>

        {/* Role Selector Tabs */}
        <div className="border-b border-slate-800 bg-slate-950/80 px-6 pt-3">
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => {
                setRole("student");
                setFeedback(null);
              }}
              className={`flex items-center justify-center gap-2 rounded-t-lg border-b-2 py-2.5 text-xs font-semibold transition ${
                role === "student"
                  ? "border-brand-500 bg-slate-900 text-brand-400 shadow-sm"
                  : "border-transparent text-slate-400 hover:bg-slate-800 hover:text-slate-200"
              }`}
            >
              <span>🎓</span> Student
            </button>
            <button
              type="button"
              onClick={() => {
                setRole("teacher");
                setFeedback(null);
              }}
              className={`flex items-center justify-center gap-2 rounded-t-lg border-b-2 py-2.5 text-xs font-semibold transition ${
                role === "teacher"
                  ? "border-brand-500 bg-slate-900 text-brand-400 shadow-sm"
                  : "border-transparent text-slate-400 hover:bg-slate-800 hover:text-slate-200"
              }`}
            >
              <span>👩‍🏫</span> Teacher
            </button>
            <button
              type="button"
              onClick={() => {
                setRole("principal");
                setFeedback(null);
              }}
              className={`flex items-center justify-center gap-2 rounded-t-lg border-b-2 py-2.5 text-xs font-semibold transition ${
                role === "principal"
                  ? "border-brand-500 bg-slate-900 text-brand-400 shadow-sm"
                  : "border-transparent text-slate-400 hover:bg-slate-800 hover:text-slate-200"
              }`}
            >
              <span>👑</span> Principal
            </button>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Name Row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label text-xs">First Name *</label>
              <input
                required
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="e.g. Vinay"
                className="input text-xs"
              />
            </div>
            <div>
              <label className="label text-xs">Last Name *</label>
              <input
                required
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="e.g. Bansode"
                className="input text-xs"
              />
            </div>
          </div>

          {/* Email & Password */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="label text-xs">Login Email *</label>
              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={role === "student" ? "name@student.greenfield.edu" : "name@greenfield.edu"}
                className="input text-xs font-mono"
              />
            </div>
            <div>
              <div className="flex items-center justify-between">
                <label className="label text-xs">Password * (Min 8 chars)</label>
                <button
                  type="button"
                  onClick={() => setPassword(`School@${Math.floor(1000 + Math.random() * 9000)}!`)}
                  className="text-[11px] text-brand-400 hover:underline"
                >
                  🎲 Auto-gen
                </button>
              </div>
              <input
                required
                minLength={8}
                type="text"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input text-xs font-mono"
              />
            </div>
          </div>

          {/* ROLE SPECIFIC FIELDS */}
          {role === "student" && (
            <div className="rounded-xl border border-brand-800/60 bg-brand-950/40 p-3.5 space-y-3">
              <div className="text-xs font-bold text-brand-300 flex items-center gap-1.5">
                <span>🎓</span> Student Enrollment Details
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <div className="flex items-center justify-between">
                    <label className="label text-xs">Admission No *</label>
                    <button
                      type="button"
                      onClick={() => setAdmissionNo(`ADM-${Math.floor(1000 + Math.random() * 9000)}`)}
                      className="text-[10px] text-brand-400 hover:underline"
                    >
                      🎲 Gen
                    </button>
                  </div>
                  <input
                    required
                    type="text"
                    value={admissionNo}
                    onChange={(e) => setAdmissionNo(e.target.value)}
                    className="input text-xs font-mono uppercase"
                  />
                </div>

                <div>
                  <label className="label text-xs">Assign Section / Class *</label>
                  <select
                    value={sectionId}
                    onChange={(e) => setSectionId(e.target.value)}
                    className="input text-xs"
                    disabled={loadingMeta}
                  >
                    {metadata.sections.map((sec) => (
                      <option key={sec.id} value={sec.id}>
                        {sec.gradeName} - Section {sec.name.split("-")[1] || sec.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="label text-xs">Gender</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="input text-xs"
                  >
                    <option value="UNSPECIFIED">Unspecified</option>
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label text-xs">Roll Number (Optional - Auto-assigned)</label>
                  <input
                    type="number"
                    min={1}
                    value={rollNumber}
                    onChange={(e) => setRollNumber(e.target.value)}
                    placeholder="Auto-assigned if empty"
                    className="input text-xs"
                  />
                </div>
                <div>
                  <label className="label text-xs">Guardian Phone (Optional)</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="input text-xs"
                  />
                </div>
              </div>
            </div>
          )}

          {role === "teacher" && (
            <div className="rounded-xl border border-indigo-800/60 bg-indigo-950/40 p-3.5 space-y-3">
              <div className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
                <span>👩‍🏫</span> Teacher Faculty Profile
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <div className="flex items-center justify-between">
                    <label className="label text-xs">Employee ID *</label>
                    <button
                      type="button"
                      onClick={() => setEmployeeId(`EMP-${Math.floor(1000 + Math.random() * 9000)}`)}
                      className="text-[10px] text-indigo-400 hover:underline"
                    >
                      🎲 Gen
                    </button>
                  </div>
                  <input
                    required
                    type="text"
                    value={employeeId}
                    onChange={(e) => setEmployeeId(e.target.value)}
                    className="input text-xs font-mono uppercase"
                  />
                </div>

                <div>
                  <label className="label text-xs">Department *</label>
                  <select
                    value={departmentId}
                    onChange={(e) => setDepartmentId(e.target.value)}
                    className="input text-xs"
                    disabled={loadingMeta}
                  >
                    {metadata.departments.map((dept) => (
                      <option key={dept.id} value={dept.id}>
                        {dept.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="label text-xs">Designation</label>
                  <input
                    type="text"
                    value={designation}
                    onChange={(e) => setDesignation(e.target.value)}
                    placeholder="e.g. Senior Teacher"
                    className="input text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="label text-xs">Contact Phone</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="input text-xs"
                />
              </div>
            </div>
          )}

          {role === "principal" && (
            <div className="rounded-xl border border-amber-800/60 bg-amber-950/30 p-3.5 space-y-3">
              <div className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                <span>👑</span> School Leadership & Administrative Access
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="label text-xs">Administrative Passcode</label>
                  <input
                    type="password"
                    value={securityPasscode}
                    onChange={(e) => setSecurityPasscode(e.target.value)}
                    className="input text-xs font-mono"
                    placeholder="GREENFIELD2026"
                  />
                  <p className="mt-1 text-[10px] text-amber-400">
                    Default demo passcode: <code className="font-mono font-bold">GREENFIELD2026</code>
                  </p>
                </div>
                <div>
                  <label className="label text-xs">Official Phone</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="input text-xs"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Feedback Alert */}
          {feedback && (
            <div
              className={`rounded-xl p-3.5 text-xs flex items-start gap-2.5 ${
                feedback.type === "success"
                  ? "border border-emerald-800/80 bg-emerald-950/60 text-emerald-200"
                  : "border border-rose-800/80 bg-rose-950/60 text-rose-200"
              }`}
            >
              <span className="text-base">{feedback.type === "success" ? "✅" : "⚠️"}</span>
              <div className="flex-1">{feedback.text}</div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="btn-ghost text-xs"
            >
              Close
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="btn bg-brand-600 text-xs font-semibold text-white hover:bg-brand-700 shadow-sm disabled:opacity-50 flex items-center gap-1.5"
            >
              {submitting ? (
                <>⏳ Registering {role}...</>
              ) : (
                <>✓ Complete {role.charAt(0).toUpperCase() + role.slice(1)} Registration</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
