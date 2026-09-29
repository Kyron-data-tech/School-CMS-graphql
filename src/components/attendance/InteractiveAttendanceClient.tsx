"use client";

import { useState, useMemo, useTransition } from "react";
import { Badge } from "@/components/ui";
import { gqlRequest, GQL_MUTATIONS } from "@/lib/graphql/client";

export type AttendanceStatus = "PRESENT" | "ABSENT" | "LATE" | "EXCUSED" | "LEAVE";

export interface StudentRosterItem {
  id: string;
  studentId: string;
  rollNumber: number | null;
  firstName: string;
  lastName: string;
  admissionNo: string;
  initialStatus: AttendanceStatus;
  initialNote?: string;
}

export interface SectionSummary {
  id: string;
  name: string;
  gradeName: string;
}

export function InteractiveAttendanceClient({
  section,
  sections,
  date: initialDate,
  roster: initialRoster,
  canMark,
}: {
  section: SectionSummary;
  sections: SectionSummary[];
  date: string;
  roster: StudentRosterItem[];
  canMark: boolean;
}) {
  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [attendance, setAttendance] = useState<Record<string, { status: AttendanceStatus; note: string }>>(() => {
    const map: Record<string, { status: AttendanceStatus; note: string }> = {};
    for (const item of initialRoster) {
      map[item.studentId] = {
        status: item.initialStatus || "PRESENT",
        note: item.initialNote || "",
      };
    }
    return map;
  });

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | AttendanceStatus>("ALL");
  const [isSaving, startTransition] = useTransition();
  const [saveMessage, setSaveMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Status stats
  const stats = useMemo(() => {
    let present = 0;
    let absent = 0;
    let late = 0;
    let excused = 0;
    let leave = 0;

    Object.values(attendance).forEach(({ status }) => {
      if (status === "PRESENT") present++;
      else if (status === "ABSENT") absent++;
      else if (status === "LATE") late++;
      else if (status === "EXCUSED") excused++;
      else if (status === "LEAVE") leave++;
    });

    const total = initialRoster.length;
    const rate = total > 0 ? Math.round((present / total) * 100) : 0;

    return { total, present, absent, late, excused, leave, rate };
  }, [attendance, initialRoster.length]);

  // Filtered roster
  const filteredRoster = useMemo(() => {
    return initialRoster.filter((student) => {
      const q = search.toLowerCase().trim();
      const matchesSearch =
        !q ||
        student.firstName.toLowerCase().includes(q) ||
        student.lastName.toLowerCase().includes(q) ||
        student.admissionNo.toLowerCase().includes(q) ||
        (student.rollNumber && String(student.rollNumber).includes(q));

      if (!matchesSearch) return false;

      const currentStatus = attendance[student.studentId]?.status ?? "PRESENT";
      if (statusFilter !== "ALL" && currentStatus !== statusFilter) return false;

      return true;
    });
  }, [initialRoster, search, statusFilter, attendance]);

  // Status Updater
  const updateStatus = (studentId: string, status: AttendanceStatus) => {
    if (!canMark) return;
    setAttendance((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        status,
      },
    }));
  };

  const updateNote = (studentId: string, note: string) => {
    if (!canMark) return;
    setAttendance((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        note,
      },
    }));
  };

  // Bulk actions
  const markAll = (status: AttendanceStatus) => {
    if (!canMark) return;
    setAttendance((prev) => {
      const next = { ...prev };
      for (const item of initialRoster) {
        next[item.studentId] = {
          ...(next[item.studentId] || { note: "" }),
          status,
        };
      }
      return next;
    });
  };

  // GraphQL Bulk Save
  const handleSaveGraphQL = () => {
    startTransition(async () => {
      setSaveMessage(null);
      try {
        const records = initialRoster.map((item) => ({
          studentId: item.studentId,
          status: attendance[item.studentId]?.status || "PRESENT",
          note: attendance[item.studentId]?.note || undefined,
        }));

        await gqlRequest(GQL_MUTATIONS.MARK_BULK_ATTENDANCE, {
          input: {
            sectionId: section.id,
            date: selectedDate,
            records,
          },
        });

        setSaveMessage({
          type: "success",
          text: `Attendance saved via GraphQL for ${records.length} students (${section.gradeName}-${section.name}) on ${selectedDate}`,
        });
      } catch (err: any) {
        setSaveMessage({
          type: "error",
          text: err.message || "Failed to save attendance via GraphQL. Please check database connectivity.",
        });
      }
    });
  };

  // Export to CSV
  const handleExportCSV = () => {
    const headers = ["Roll No", "Admission No", "Student Name", "Date", "Section", "Status", "Remarks"];
    const rows = initialRoster.map((s) => [
      s.rollNumber ?? "—",
      s.admissionNo,
      `"${s.firstName} ${s.lastName}"`,
      selectedDate,
      `"${section.gradeName}-${section.name}"`,
      attendance[s.studentId]?.status ?? "PRESENT",
      `"${attendance[s.studentId]?.note ?? ""}"`,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `attendance_${section.gradeName}-${section.name}_${selectedDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Shift Date Shortcut
  const shiftDate = (days: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + days);
    const newDateStr = d.toISOString().slice(0, 10);
    setSelectedDate(newDateStr);
    window.location.href = `/attendance?section=${section.id}&date=${newDateStr}`;
  };

  return (
    <div className="space-y-6">
      {/* ── SECTION SELECTOR & DATE CONTROLS ── */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between bg-white p-4 rounded-xl shadow-card border border-slate-100">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 mr-1">Class Section:</span>
          {sections.map((s) => {
            const isActive = s.id === section.id;
            return (
              <a
                key={s.id}
                href={`/attendance?section=${s.id}&date=${selectedDate}`}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? "bg-brand-600 text-white shadow-sm ring-2 ring-brand-300 ring-offset-1"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                {s.gradeName.replace("Class ", "")}-{s.name}
              </a>
            );
          })}
        </div>

        {/* Date Navigator */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => shiftDate(-1)}
            className="px-2.5 py-1.5 text-xs font-medium rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
            title="Previous Day"
          >
            ◀ Yesterday
          </button>

          <input
            type="date"
            value={selectedDate}
            onChange={(e) => {
              setSelectedDate(e.target.value);
              window.location.href = `/attendance?section=${section.id}&date=${e.target.value}`;
            }}
            className="input text-xs py-1.5 px-3 max-w-[10rem] border-slate-300 font-medium"
          />

          <button
            onClick={() => shiftDate(1)}
            className="px-2.5 py-1.5 text-xs font-medium rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
            title="Next Day"
          >
            Tomorrow ▶
          </button>

          <button
            onClick={() => {
              const todayStr = new Date().toISOString().slice(0, 10);
              setSelectedDate(todayStr);
              window.location.href = `/attendance?section=${section.id}&date=${todayStr}`;
            }}
            className="px-2.5 py-1.5 text-xs font-medium rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
          >
            Today
          </button>
        </div>
      </div>

      {/* ── REAL-TIME ATTENDANCE METRICS ── */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        <div className="card p-3 text-center border-l-4 border-l-brand-600">
          <div className="text-xs font-medium text-slate-500">Present Rate</div>
          <div className="text-xl font-bold text-brand-700 mt-1">{stats.rate}%</div>
          <div className="text-[11px] text-slate-400 mt-0.5">{stats.present}/{stats.total} Present</div>
        </div>

        <div className="card p-3 text-center border-l-4 border-l-emerald-500">
          <div className="text-xs font-medium text-slate-500">Present</div>
          <div className="text-xl font-bold text-emerald-600 mt-1">{stats.present}</div>
          <div className="text-[11px] text-emerald-600 font-medium mt-0.5">On time</div>
        </div>

        <div className="card p-3 text-center border-l-4 border-l-rose-500">
          <div className="text-xs font-medium text-slate-500">Absent</div>
          <div className="text-xl font-bold text-rose-600 mt-1">{stats.absent}</div>
          <div className="text-[11px] text-rose-500 font-medium mt-0.5">Unexcused</div>
        </div>

        <div className="card p-3 text-center border-l-4 border-l-amber-500">
          <div className="text-xs font-medium text-slate-500">Late</div>
          <div className="text-xl font-bold text-amber-600 mt-1">{stats.late}</div>
          <div className="text-[11px] text-amber-500 font-medium mt-0.5">Delayed</div>
        </div>

        <div className="card p-3 text-center border-l-4 border-l-purple-500">
          <div className="text-xs font-medium text-slate-500">Excused</div>
          <div className="text-xl font-bold text-purple-600 mt-1">{stats.excused}</div>
          <div className="text-[11px] text-purple-500 font-medium mt-0.5">Documented</div>
        </div>

        <div className="card p-3 text-center border-l-4 border-l-sky-500">
          <div className="text-xs font-medium text-slate-500">On Leave</div>
          <div className="text-xl font-bold text-sky-600 mt-1">{stats.leave}</div>
          <div className="text-[11px] text-sky-500 font-medium mt-0.5">Approved</div>
        </div>
      </div>

      {/* ── ACTION BAR: SEARCH, BATCH ACTIONS, EXPORT ── */}
      <div className="card p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Search & Status Filter */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[200px]">
            <input
              type="text"
              placeholder="Search student or roll no..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input pl-8 text-xs py-1.5 w-full"
            />
            <svg
              className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          <div className="flex items-center gap-1 border border-slate-200 rounded-lg p-0.5 bg-slate-50">
            {(["ALL", "PRESENT", "ABSENT", "LATE"] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setStatusFilter(filter)}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                  statusFilter === filter
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {filter === "ALL" ? "All" : filter}
              </button>
            ))}
          </div>
        </div>

        {/* Quick Actions & Save Button */}
        <div className="flex flex-wrap items-center gap-2">
          {canMark && (
            <>
              <button
                type="button"
                onClick={() => markAll("PRESENT")}
                className="px-2.5 py-1.5 text-xs font-medium rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition-colors"
                title="Mark all students as Present"
              >
                ✓ All Present
              </button>
              <button
                type="button"
                onClick={() => markAll("ABSENT")}
                className="px-2.5 py-1.5 text-xs font-medium rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 transition-colors"
                title="Mark all students as Absent"
              >
                ✕ All Absent
              </button>
            </>
          )}

          <button
            type="button"
            onClick={handleExportCSV}
            className="px-2.5 py-1.5 text-xs font-medium rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 flex items-center gap-1.5 transition-colors"
            title="Download CSV report"
          >
            <svg className="h-3.5 w-3.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export CSV
          </button>

          <button
            type="button"
            onClick={() => window.print()}
            className="px-2.5 py-1.5 text-xs font-medium rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 flex items-center gap-1.5 transition-colors"
            title="Print Attendance Register"
          >
            <svg className="h-3.5 w-3.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Print
          </button>

          {canMark && (
            <button
              type="button"
              onClick={handleSaveGraphQL}
              disabled={isSaving}
              className="btn-primary text-xs py-1.5 px-4 flex items-center gap-2 shadow-sm disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <svg className="animate-spin h-3.5 w-3.5 text-white" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Saving via GraphQL...
                </>
              ) : (
                <>
                  <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
                  Save Attendance
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Save Toast Notification */}
      {saveMessage && (
        <div
          className={`p-3.5 rounded-xl text-xs font-medium flex items-center justify-between transition-all ${
            saveMessage.type === "success"
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
              : "bg-rose-50 text-rose-800 border border-rose-200"
          }`}
        >
          <div className="flex items-center gap-2">
            <span>{saveMessage.type === "success" ? "✓" : "⚠️"}</span>
            <span>{saveMessage.text}</span>
          </div>
          <button
            onClick={() => setSaveMessage(null)}
            className="text-slate-400 hover:text-slate-700 ml-4 font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* ── ATTENDANCE ROSTER TABLE ── */}
      <div className="card overflow-hidden">
        <div className="px-4 py-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-semibold text-sm text-slate-800">
            {section.gradeName.replace("Class ", "")}-{section.name} Student Register
          </h3>
          <span className="text-xs text-slate-500">
            Showing {filteredRoster.length} of {initialRoster.length} students
          </span>
        </div>

        {filteredRoster.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-500">
            No students found matching your search or filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="th py-2.5 w-16 text-center">Roll</th>
                  <th className="th py-2.5">Student Information</th>
                  <th className="th py-2.5 w-72">Attendance Status</th>
                  <th className="th py-2.5">Remarks / Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRoster.map((item) => {
                  const current = attendance[item.studentId] || { status: "PRESENT", note: "" };
                  const isPresent = current.status === "PRESENT";
                  const isAbsent = current.status === "ABSENT";
                  const isLate = current.status === "LATE";
                  const isExcused = current.status === "EXCUSED";
                  const isLeave = current.status === "LEAVE";

                  return (
                    <tr
                      key={item.studentId}
                      className={`hover:bg-slate-50/70 transition-colors ${
                        isAbsent ? "bg-rose-50/20" : isLate ? "bg-amber-50/20" : ""
                      }`}
                    >
                      {/* Roll Number */}
                      <td className="td py-2.5 text-center font-mono font-semibold text-slate-600">
                        {item.rollNumber ?? "—"}
                      </td>

                      {/* Student Details */}
                      <td className="td py-2.5">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-slate-100 text-slate-700 font-semibold text-xs flex items-center justify-center border border-slate-200 shrink-0">
                            {item.firstName[0]}
                            {item.lastName[0]}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900 text-xs">
                              {item.firstName} {item.lastName}
                            </div>
                            <div className="text-[11px] text-slate-400 font-mono">
                              Adm: {item.admissionNo}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Interactive Status Pills */}
                      <td className="td py-2.5">
                        {canMark ? (
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => updateStatus(item.studentId, "PRESENT")}
                              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
                                isPresent
                                  ? "bg-emerald-600 text-white shadow-sm ring-1 ring-emerald-400"
                                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                              }`}
                            >
                              Present
                            </button>

                            <button
                              type="button"
                              onClick={() => updateStatus(item.studentId, "ABSENT")}
                              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
                                isAbsent
                                  ? "bg-rose-600 text-white shadow-sm ring-1 ring-rose-400"
                                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                              }`}
                            >
                              Absent
                            </button>

                            <button
                              type="button"
                              onClick={() => updateStatus(item.studentId, "LATE")}
                              className={`px-2 py-1 text-xs font-semibold rounded-md transition-all ${
                                isLate
                                  ? "bg-amber-500 text-white shadow-sm ring-1 ring-amber-300"
                                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                              }`}
                            >
                              Late
                            </button>

                            <button
                              type="button"
                              onClick={() => updateStatus(item.studentId, "EXCUSED")}
                              className={`px-2 py-1 text-xs font-semibold rounded-md transition-all ${
                                isExcused
                                  ? "bg-purple-600 text-white shadow-sm ring-1 ring-purple-300"
                                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                              }`}
                            >
                              Exc
                            </button>

                            <button
                              type="button"
                              onClick={() => updateStatus(item.studentId, "LEAVE")}
                              className={`px-2 py-1 text-xs font-semibold rounded-md transition-all ${
                                isLeave
                                  ? "bg-sky-600 text-white shadow-sm ring-1 ring-sky-300"
                                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                              }`}
                            >
                              Lv
                            </button>
                          </div>
                        ) : (
                          <Badge
                            color={
                              isPresent
                                ? "green"
                                : isAbsent
                                ? "red"
                                : isLate
                                ? "amber"
                                : isExcused
                                ? "purple"
                                : "blue"
                            }
                          >
                            {current.status}
                          </Badge>
                        )}
                      </td>

                      {/* Remarks / Reason */}
                      <td className="td py-2.5">
                        {canMark ? (
                          <input
                            type="text"
                            placeholder="Optional note (e.g. sick, dentist)..."
                            value={current.note}
                            onChange={(e) => updateNote(item.studentId, e.target.value)}
                            className="input py-1 px-2.5 text-xs w-full max-w-xs text-slate-700 bg-slate-50/50 focus:bg-white"
                          />
                        ) : (
                          <span className="text-xs text-slate-500 italic">
                            {current.note || "—"}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
