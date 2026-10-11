"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui";
import { RegisterModal } from "@/components/auth/RegisterModal";

export interface StudentRow {
  id: string;
  firstName: string;
  lastName: string;
  admissionNo: string;
  gender: string;
  enrollments: {
    rollNumber: number | null;
    section: {
      id: string;
      name: string;
      grade: {
        id: string;
        name: string;
      };
    };
  }[];
}

export interface SectionOption {
  id: string;
  name: string;
  grade: {
    id: string;
    name: string;
  };
}

export function StudentDirectoryClient({
  students,
  sections,
  canCreate = true,
  currentRole = "student",
  userName = "Student",
}: {
  students: StudentRow[];
  sections: SectionOption[];
  canCreate?: boolean;
  currentRole?: string;
  userName?: string;
}) {
  const router = useRouter();

  // Multi-role Registration Modal state
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [registerInitialRole, setRegisterInitialRole] = useState<
    "student" | "teacher" | "staff" | "parent" | "principal"
  >("student");

  // Filters state
  const [search, setSearch] = useState("");
  const [selectedSection, setSelectedSection] = useState<string>("ALL");
  const [selectedGender, setSelectedGender] = useState<string>("ALL");
  const [viewMode, setViewMode] = useState<"table" | "grid">("grid");

  // Filter logic
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      // Search
      const q = search.toLowerCase().trim();
      const matchesSearch =
        !q ||
        s.firstName.toLowerCase().includes(q) ||
        s.lastName.toLowerCase().includes(q) ||
        s.admissionNo.toLowerCase().includes(q);

      if (!matchesSearch) return false;

      // Section filter
      if (selectedSection !== "ALL") {
        const studentSectionId = s.enrollments[0]?.section.id;
        if (studentSectionId !== selectedSection) return false;
      }

      // Gender filter
      if (selectedGender !== "ALL") {
        if (s.gender !== selectedGender) return false;
      }

      return true;
    });
  }, [students, search, selectedSection, selectedGender]);

  // Export to CSV
  function handleExportCSV() {
    const headers = ["Admission No", "First Name", "Last Name", "Gender", "Class", "Roll No"];
    const rows = filteredStudents.map((s) => {
      const enr = s.enrollments[0];
      const className = enr ? `${enr.section.grade.name}-${enr.section.name}` : "Unassigned";
      const roll = enr?.rollNumber ?? "—";
      return [s.admissionNo, s.firstName, s.lastName, s.gender, className, roll];
    });

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.map((val) => `"${val}"`).join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `School_CMS_Students_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  return (
    <div className="space-y-4">

      {/* Quick KPI Stats Header */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="card-hover p-4 flex items-center gap-3.5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/25 text-base shadow-sm">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
            </svg>
          </div>
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-display">Total Enrolled</div>
            <div className="text-xl font-extrabold text-white">{students.length}</div>
          </div>
        </div>

        <div className="card-hover p-4 flex items-center gap-3.5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/25 text-base shadow-sm">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
            </svg>
          </div>
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-display">Active Sections</div>
            <div className="text-xl font-extrabold text-white">{sections.length}</div>
          </div>
        </div>

        <div className="card-hover p-4 flex items-center gap-3.5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 text-base shadow-sm">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
            </svg>
          </div>
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-display">Gender Split</div>
            <div className="text-xs font-bold text-slate-200">
              {students.filter((s) => s.gender === "MALE").length} Boys · {students.filter((s) => s.gender === "FEMALE").length} Girls
            </div>
          </div>
        </div>

        <div className="card-hover p-4 flex items-center gap-3.5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-500/10 text-brand-400 border border-brand-500/25 text-base shadow-sm">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c2.755 0 5.455.232 8.083.678.539.09.917.555.917 1.097v1.824c0 .385-.195.74-.514.945l-5.119 3.29a2.25 2.25 0 00-.967 1.884V16.5a2.25 2.25 0 01-1.023 1.888l-2.25 1.5A2.25 2.25 0 018.25 18V12.69a2.25 2.25 0 00-.967-1.884L2.164 7.517A1.125 1.125 0 011.65 6.572V4.775c0-.542.378-1.007.917-1.097A48.539 48.539 0 0112 3z" />
            </svg>
          </div>
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-display">Filtered Matches</div>
            <div className="text-xl font-extrabold text-brand-400">{filteredStudents.length}</div>
          </div>
        </div>
      </div>

      {/* Dynamic Controls & Filter Bar */}
      <div className="card p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          {/* Search and Filters */}
          <div className="flex flex-1 flex-wrap items-center gap-2">
            <div className="relative min-w-[220px] flex-1">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name or admission no…"
                className="input pr-8"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-2.5 top-2.5 text-xs text-slate-400 hover:text-slate-200"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Class Section Filter */}
            <select
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value)}
              className="input max-w-[170px]"
            >
              <option value="ALL">All Classes</option>
              {sections.map((sec) => (
                <option key={sec.id} value={sec.id}>
                  {sec.grade.name.replace("Class ", "")}-{sec.name}
                </option>
              ))}
            </select>

            {/* Gender Filter */}
            <select
              value={selectedGender}
              onChange={(e) => setSelectedGender(e.target.value)}
              className="input max-w-[130px]"
            >
              <option value="ALL">All Genders</option>
              <option value="MALE">Male</option>
              <option value="FEMALE">Female</option>
              <option value="OTHER">Other</option>
            </select>
          </div>

          {/* Action Buttons & View Mode Toggle */}
          <div className="flex flex-wrap items-center gap-2">
            {/* View Mode Toggle */}
            <div className="flex rounded-lg border border-slate-800 bg-slate-950/80 p-0.5">
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                title="Grid / Cards View"
                className={`flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-medium transition ${
                  viewMode === "grid"
                    ? "bg-slate-800 text-brand-400 shadow-sm border border-slate-700"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                ⊞ Cards
              </button>
              <button
                type="button"
                onClick={() => setViewMode("table")}
                title="Table View"
                className={`flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-medium transition ${
                  viewMode === "table"
                    ? "bg-slate-800 text-brand-400 shadow-sm border border-slate-700"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                ☰ Table
              </button>
            </div>

            {/* Export to CSV (Staff / Admins only) */}
            {canCreate && (
              <button
                onClick={handleExportCSV}
                disabled={filteredStudents.length === 0}
                className="btn-ghost text-xs font-semibold hover:bg-slate-800 transition rounded-xl px-3 py-2 flex items-center gap-1.5 text-slate-300 border border-slate-700/80"
                title="Export current list to CSV"
              >
                📥 Export CSV
              </button>
            )}

            {/* Onboarding Action Buttons (Staff / Admins only) */}
            {canCreate && (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => {
                    setRegisterInitialRole("student");
                    setIsRegisterModalOpen(true);
                  }}
                  className="btn bg-brand-600 text-xs font-bold text-white hover:bg-brand-500 shadow-sm flex items-center gap-1.5 rounded-xl px-3 py-2 transition"
                  title="Enroll a new student with login account, roll number & automatic fee invoice"
                >
                  ＋ Student Admission
                </button>
                <button
                  onClick={() => {
                    setRegisterInitialRole("staff");
                    setIsRegisterModalOpen(true);
                  }}
                  className="btn bg-indigo-600 text-xs font-semibold text-white hover:bg-indigo-500 shadow-sm flex items-center gap-1.5 rounded-xl px-3 py-2 transition"
                  title="Onboard Teacher or Non-Teaching Staff"
                >
                  ＋ Add Teacher / Staff
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Results Counter & Active Filters Tag */}
        <div className="mt-3 flex items-center justify-between border-t border-slate-800/80 pt-3 text-xs text-slate-400">
          <div>
            Showing <strong className="text-white">{filteredStudents.length}</strong> of{" "}
            <strong className="text-white">{students.length}</strong> students
            {(search || selectedSection !== "ALL" || selectedGender !== "ALL") && (
              <span className="ml-2 font-medium text-brand-400">
                (Filters active —{" "}
                <button
                  onClick={() => {
                    setSearch("");
                    setSelectedSection("ALL");
                    setSelectedGender("ALL");
                  }}
                  className="underline hover:text-brand-300"
                >
                  Reset all
                </button>
                )
              </span>
            )}
          </div>
          <div className="hidden sm:block text-slate-500">
            Click on any student card or row to view complete academic profile
          </div>
        </div>
      </div>

      {/* Empty State */}
      {filteredStudents.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-800 text-xl text-slate-400">
            🔍
          </div>
          <h3 className="text-sm font-semibold text-white">No students found</h3>
          <p className="mt-1 text-xs text-slate-400">
            Try adjusting your search keyword or clearing class/gender filters.
          </p>
          <button
            onClick={() => {
              setSearch("");
              setSelectedSection("ALL");
              setSelectedGender("ALL");
            }}
            className="btn-ghost mt-4 text-xs"
          >
            Clear Filters
          </button>
        </div>
      ) : viewMode === "grid" ? (
        /* GRID / CARDS VIEW */
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredStudents.map((s) => {
            const enr = s.enrollments[0];
            const className = enr
              ? `${enr.section.grade.name.replace("Class ", "")}-${enr.section.name}`
              : "Unassigned";

            return (
              <div
                key={s.id}
                className="card-hover group flex flex-col justify-between overflow-hidden relative"
              >
                <div className="p-4">
                  {/* Avatar & Class Badge */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-brand-900/80 via-indigo-900/60 to-slate-900 text-brand-300 border border-brand-500/30 font-bold shadow-sm">
                      {s.firstName[0]}
                      {s.lastName[0]}
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      {enr ? (
                        <Badge color="blue">Class {className}</Badge>
                      ) : (
                        <Badge color="slate">New</Badge>
                      )}
                      {enr?.rollNumber && (
                        <span className="text-[10px] font-mono font-medium text-slate-400">
                          Roll #{enr.rollNumber}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Student Details */}
                  <div className="mt-3">
                    <h4 className="font-bold text-white group-hover:text-brand-300 transition">
                      {s.firstName} {s.lastName}
                    </h4>
                    <div className="mt-1 flex items-center gap-2 text-xs text-slate-400">
                      <span className="font-mono text-[11px] text-slate-400">{s.admissionNo}</span>
                      <span>·</span>
                      <span className="capitalize text-[11px]">{s.gender.toLowerCase()}</span>
                    </div>
                  </div>
                </div>

                {/* Footer Link */}
                <div className="border-t border-white/[0.06] bg-white/[0.02] px-4 py-2.5 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400 font-medium">Academic File</span>
                  <Link
                    href={`/students/${s.id}`}
                    className="text-xs font-bold text-brand-400 hover:text-brand-300 transition"
                  >
                    View Details →
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* TABLE VIEW */
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead className="border-b border-slate-800 bg-slate-950/80">
              <tr>
                <th className="th">Student</th>
                <th className="th">Admission No</th>
                <th className="th">Class & Section</th>
                <th className="th">Roll No</th>
                <th className="th">Gender</th>
                <th className="th text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {filteredStudents.map((s) => {
                const enr = s.enrollments[0];
                return (
                  <tr key={s.id} className="hover:bg-slate-800/50 transition">
                    <td className="td font-medium text-white">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-950/80 border border-brand-800/60 text-xs font-semibold text-brand-300">
                          {s.firstName[0]}
                          {s.lastName[0]}
                        </div>
                        <span>
                          {s.firstName} {s.lastName}
                        </span>
                      </div>
                    </td>
                    <td className="td font-mono text-xs text-slate-300">{s.admissionNo}</td>
                    <td className="td">
                      {enr ? (
                        <Badge color="blue">
                          {enr.section.grade.name.replace("Class ", "")}-{enr.section.name}
                        </Badge>
                      ) : (
                        <Badge color="slate">Unassigned</Badge>
                      )}
                    </td>
                    <td className="td text-slate-400">{enr?.rollNumber ?? "—"}</td>
                    <td className="td">
                      <span className="text-xs capitalize text-slate-400">
                        {s.gender.toLowerCase()}
                      </span>
                    </td>
                    <td className="td text-right">
                      <Link
                        href={`/students/${s.id}`}
                        className="text-xs font-medium text-brand-400 hover:underline"
                      >
                        View Profile →
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}



      {/* Multi-Role Registration Window Modal */}
      <RegisterModal
        isOpen={isRegisterModalOpen}
        initialRole={registerInitialRole}
        onClose={() => setIsRegisterModalOpen(false)}
        onSuccess={() => {
          router.refresh();
        }}
      />
    </div>
  );
}
