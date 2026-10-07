"use client";

import { useState, useMemo } from "react";
import { Badge } from "@/components/ui";

export interface TimetablePeriodItem {
  id: string;
  name: string;
  sequence: number;
  startTime: string;
  endTime: string;
}

export interface TimetableEntryItem {
  id: string;
  periodId: string;
  dayOfWeek: number; // 1 = Mon, 2 = Tue, ...
  subjectName: string;
  sectionName: string;
  gradeName: string;
  teacherName?: string;
  roomName?: string;
}

export function InteractiveTimetableClient({
  periods,
  entries,
  sections,
}: {
  periods: TimetablePeriodItem[];
  entries: TimetableEntryItem[];
  sections: { id: string; name: string; gradeName: string }[];
}) {
  const DAYS = [
    { num: 1, label: "Mon", name: "Monday" },
    { num: 2, label: "Tue", name: "Tuesday" },
    { num: 3, label: "Wed", name: "Wednesday" },
    { num: 4, label: "Thu", name: "Thursday" },
    { num: 5, label: "Fri", name: "Friday" },
  ];

  // Default to today's day (Mon-Fri) or Mon (1) on weekends
  const todayDayOfWeek = (() => {
    const d = new Date().getDay(); // 0 is Sun, 1 is Mon
    return d >= 1 && d <= 5 ? d : 1;
  })();

  const [activeDay, setActiveDay] = useState<number>(todayDayOfWeek);
  const [viewMode, setViewMode] = useState<"weekly" | "daily">("weekly");
  const [selectedSection, setSelectedSection] = useState<string>("ALL");

  // Filter entries
  const filteredEntries = useMemo(() => {
    return entries.filter((e) => {
      if (selectedSection !== "ALL") {
        const fullSecName = `${e.gradeName}-${e.sectionName}`;
        if (fullSecName !== selectedSection) return false;
      }
      return true;
    });
  }, [entries, selectedSection]);

  const cell = (periodId: string, day: number) => {
    return filteredEntries.find((e) => e.periodId === periodId && e.dayOfWeek === day);
  };

  // Distinct sections
  const sectionList = useMemo(() => {
    const set = new Set(entries.map((e) => `${e.gradeName}-${e.sectionName}`));
    return Array.from(set);
  }, [entries]);

  return (
    <div className="space-y-6">
      {/* ── TOOLBAR: VIEW TOGGLE & SECTION FILTER ── */}
      <div className="card p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Weekly vs Daily View Mode */}
          <div className="flex items-center gap-1 border border-slate-800 rounded-lg p-0.5 bg-slate-950/80">
            <button
              onClick={() => setViewMode("weekly")}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                viewMode === "weekly"
                  ? "bg-slate-800 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              📅 Weekly Matrix
            </button>
            <button
              onClick={() => setViewMode("daily")}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                viewMode === "daily"
                  ? "bg-slate-800 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              🕒 Daily Schedule
            </button>
          </div>

          {/* Section Filter if multiple */}
          {sectionList.length > 1 && (
            <select
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value)}
              className="input text-xs py-1.5 max-w-[12rem]"
            >
              <option value="ALL">All Sections</option>
              {sectionList.map((sec) => (
                <option key={sec} value={sec}>
                  {sec}
                </option>
              ))}
            </select>
          )}
        </div>

        <button
          type="button"
          onClick={() => window.print()}
          className="px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-800 text-slate-300 hover:bg-slate-800 flex items-center gap-1.5 transition-colors self-start md:self-auto"
        >
          <svg className="h-3.5 w-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
          </svg>
          Print Schedule
        </button>
      </div>

      {/* ── DAILY VIEW ── */}
      {viewMode === "daily" ? (
        <div className="space-y-4">
          {/* Day Selector Tabs */}
          <div className="flex flex-wrap items-center gap-2">
            {DAYS.map((d) => (
              <button
                key={d.num}
                onClick={() => setActiveDay(d.num)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                  activeDay === d.num
                    ? "bg-brand-600 text-white shadow-sm ring-2 ring-brand-500/50"
                    : "bg-slate-900 text-slate-300 border border-slate-800 hover:bg-slate-800"
                }`}
              >
                {d.name} {d.num === todayDayOfWeek && "· Today"}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {periods.map((p) => {
              const e = cell(p.id, activeDay);
              return (
                <div
                  key={p.id}
                  className={`card p-4 transition-all duration-200 border-l-4 ${
                    e ? "border-l-brand-500 bg-slate-900/90" : "border-l-slate-800 bg-slate-950/60"
                  }`}
                >
                  <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-800/80">
                    <span className="font-bold text-white">{p.name}</span>
                    <span className="text-slate-400 font-mono">
                      {p.startTime} – {p.endTime}
                    </span>
                  </div>

                  {e ? (
                    <div className="mt-3">
                      <div className="font-bold text-sm text-brand-300">{e.subjectName}</div>
                      <div className="text-xs text-slate-300 mt-1">
                        Class: {e.gradeName.replace("Class ", "")}-{e.sectionName}
                      </div>
                      <div className="flex items-center gap-2 mt-2 text-[11px] text-slate-400">
                        {e.roomName && <span>🏫 Room {e.roomName}</span>}
                        {e.teacherName && <span>👨‍🏫 {e.teacherName}</span>}
                      </div>
                    </div>
                  ) : (
                    <div className="mt-3 text-xs text-slate-500 italic">No scheduled class (Free period)</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* ── WEEKLY MATRIX VIEW ── */
        <div className="card overflow-x-auto shadow-card">
          <table className="w-full min-w-[700px] text-left text-xs">
            <thead className="bg-slate-900/90 border-b border-slate-800">
              <tr>
                <th className="th py-3 w-32">Period &amp; Time</th>
                {DAYS.map((d) => (
                  <th
                    key={d.num}
                    className={`th py-3 ${d.num === todayDayOfWeek ? "bg-brand-950/40 text-brand-300 font-bold" : ""}`}
                  >
                    {d.name} {d.num === todayDayOfWeek && "★"}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {periods.map((p) => (
                <tr key={p.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="td py-3 whitespace-nowrap bg-slate-950/40">
                    <div className="font-bold text-white">{p.name}</div>
                    <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                      {p.startTime}–{p.endTime}
                    </div>
                  </td>
                  {DAYS.map((d) => {
                    const e = cell(p.id, d.num);
                    const isToday = d.num === todayDayOfWeek;

                    return (
                      <td
                        key={d.num}
                        className={`td py-3 align-top ${isToday ? "bg-brand-950/20" : ""}`}
                      >
                        {e ? (
                          <div className="rounded-lg bg-brand-950/50 border border-brand-800/60 p-2.5 hover:border-brand-700/80 transition-shadow">
                            <div className="font-bold text-xs text-brand-200">{e.subjectName}</div>
                            <div className="text-[11px] text-brand-400 font-medium mt-0.5">
                              {e.gradeName.replace("Class ", "")}-{e.sectionName}
                            </div>
                            <div className="text-[10px] text-slate-400 mt-1 flex flex-wrap gap-1.5">
                              {e.roomName && <span>Room {e.roomName}</span>}
                              {e.teacherName && <span>· {e.teacherName}</span>}
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-600 text-center block">—</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
