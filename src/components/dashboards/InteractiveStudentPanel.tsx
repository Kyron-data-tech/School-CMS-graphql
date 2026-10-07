"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { gqlRequest, GQL_MUTATIONS } from "@/lib/graphql/client";

export function InteractiveStudentPanel() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Form state
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [admissionNo, setAdmissionNo] = useState(`ADM-${Math.floor(1000 + Math.random() * 9000)}`);
  const [gender, setGender] = useState("MALE");

  async function handleCreateStudent(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const data = await gqlRequest(GQL_MUTATIONS.CREATE_STUDENT, {
        input: {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          admissionNo: admissionNo.trim(),
          gender,
        },
      });

      setMessage({
        type: "success",
        text: `Student ${data.createStudent.fullName} (${data.createStudent.admissionNo}) enrolled successfully!`,
      });
      setFirstName("");
      setLastName("");
      setAdmissionNo(`ADM-${Math.floor(1000 + Math.random() * 9000)}`);
      router.refresh();
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Failed to enroll student." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card overflow-hidden p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Admissions &amp; Enrollment
            </span>
          </div>
          <h3 className="mt-1 text-base sm:text-lg font-black text-white font-display">
            Admissions Desk &amp; Rapid Enrollment
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Enroll new applicants, generate admission numbers, and manage student onboarding.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="btn bg-brand-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-brand-500 shadow-sm transition-all"
          >
            {isOpen ? "Close Form" : "+ Enroll Student"}
          </button>
          <Link
            href="/students"
            className="btn-ghost px-3 py-1.5 text-xs text-slate-300 hover:text-white font-medium"
          >
            Full Student Directory →
          </Link>
          <Link
            href="/register"
            className="btn-ghost px-3 py-1.5 text-xs text-brand-400 hover:text-brand-300 font-semibold"
          >
            Open Public Admissions Portal ↗
          </Link>
        </div>
      </div>

      {/* Quick Add Student Collapsible Form */}
      {isOpen && (
        <form onSubmit={handleCreateStudent} className="mt-4 border-t border-slate-800 pt-4">
          <h4 className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-300">
            Rapid Student Admission Form
          </h4>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
            <div>
              <label className="label text-xs">First Name</label>
              <input
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="e.g. Rahul"
                className="input py-1.5 text-xs"
              />
            </div>

            <div>
              <label className="label text-xs">Last Name</label>
              <input
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="e.g. Sharma"
                className="input py-1.5 text-xs"
              />
            </div>

            <div>
              <label className="label text-xs">Admission No</label>
              <input
                required
                value={admissionNo}
                onChange={(e) => setAdmissionNo(e.target.value)}
                className="input py-1.5 text-xs font-mono font-semibold"
              />
            </div>

            <div>
              <label className="label text-xs">Gender</label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="input py-1.5 text-xs"
              >
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
          </div>

          <div className="mt-3 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="btn-ghost px-3 py-1.5 text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary px-4 py-1.5 text-xs shadow-sm"
            >
              {loading ? "Enrolling..." : "Complete Enrollment"}
            </button>
          </div>
        </form>
      )}

      {/* Status Alert Banner */}
      {message && (
        <div
          className={`mt-4 rounded-xl p-3 text-xs font-medium ${
            message.type === "success"
              ? "border border-emerald-800/80 bg-emerald-950/60 text-emerald-300"
              : "border border-rose-800/80 bg-rose-950/60 text-rose-300"
          }`}
        >
          {message.text}
        </div>
      )}
    </div>
  );
}
