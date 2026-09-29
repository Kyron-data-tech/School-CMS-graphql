"use client";

import React, { useState, useTransition } from "react";
import { Badge } from "@/components/ui";
import { computeAggregate } from "@/domain/assessment/assessment-engine";

export interface ReportCardSubjectScore {
  subjectName: string;
  maxMarks: number;
  theoryMarks: number;
  practicalMarks?: number;
  totalMarks: number;
  grade: string;
  gradePoint: number;
}

export interface StudentReportCardData {
  studentId: string;
  studentName: string;
  rollNumber: string | number;
  admissionNo: string;
  className: string;
  academicYear: string;
  term: string;
  attendanceRate: string;
  attendanceDays: string;
  subjects: ReportCardSubjectScore[];
  teacherRemarks?: string;
}

interface ReportCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: StudentReportCardData | null;
}

export function ReportCardModal({ isOpen, onClose, data }: ReportCardModalProps) {
  const [remarks, setRemarks] = useState<string>(
    data?.teacherRemarks ||
      "Demonstrates sincere commitment to academic excellence. Strong performance in sciences and quantitative problem-solving. Encouraged to sustain consistency in term examinations."
  );
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  if (!isOpen || !data) return null;

  // Compute aggregate stats via Domain Assessment Engine
  const { totalMax, totalScored, percentage, overallGrade, division } = computeAggregate(data.subjects);

  // Handle AI Academic Remark Generation
  async function generateAiEvaluation() {
    setIsGeneratingAi(true);
    setAiError(null);

    try {
      const topSubject = [...data!.subjects].sort((a, b) => b.totalMarks - a.totalMarks)[0]?.subjectName || "Science";
      const improveSubject = [...data!.subjects].sort((a, b) => a.totalMarks - b.totalMarks)[0]?.subjectName || "Language";

      const res = await fetch("/api/ai/copilot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "remarks",
          payload: {
            studentName: data!.studentName,
            gradeLevel: data!.className,
            attendanceRate: data!.attendanceRate,
            strengths: `Exceptional proficiency in ${topSubject} and classroom participation. Overall score of ${percentage}%.`,
            areasToImprove: `Continued regular revision in ${improveSubject} to maximize term examination performance.`,
            tone: percentage >= 85 ? "encouraging" : "growth",
          },
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to generate AI remarks.");
      }

      setRemarks(json.text);
    } catch (err: any) {
      setAiError(err.message || "Failed to contact AI Copilot.");
    } finally {
      setIsGeneratingAi(false);
    }
  }

  function handlePrint() {
    window.print();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-md p-3 sm:p-6 overflow-y-auto">
      {/* ── MODAL CONTAINER ── */}
      <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full border border-slate-200 overflow-hidden my-auto flex flex-col max-h-[92vh]">
        {/* Modal Top Bar (Non-Printable) */}
        <div className="print:hidden bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <h2 className="text-sm font-bold tracking-tight">
              Official CBSE Marksheet &amp; Academic Report Card
            </h2>
            <span className="text-xs bg-brand-500/20 text-brand-300 px-2 py-0.5 rounded-full border border-brand-400/30">
              Verified SIS Artifact
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-bold text-xs shadow-glow transition active:scale-95"
            >
              <span>🖨️</span> Print / Save PDF
            </button>
            <button
              onClick={onClose}
              className="h-8 w-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center font-bold text-sm transition"
              title="Close Report Card"
            >
              ✕
            </button>
          </div>
        </div>

        {/* ── SCROLLABLE DOCUMENT PREVIEW ── */}
        <div className="overflow-y-auto p-4 sm:p-8 space-y-6 print:p-0 print:space-y-4 font-sans text-slate-800">
          {/* Printable Official Sheet */}
          <div className="p-6 sm:p-10 border-2 border-slate-800 rounded-2xl bg-white shadow-card print:border-none print:shadow-none print:p-0 space-y-6">
            
            {/* Header: School Emblem, Name, Affiliation */}
            <div className="flex items-start justify-between border-b-2 border-slate-900 pb-5 gap-4">
              <div className="flex items-center gap-4">
                <div className="relative h-16 w-16 p-1 rounded-2xl bg-gradient-to-tr from-amber-400 via-amber-500 to-amber-700 shadow-md shrink-0">
                  <div className="h-full w-full rounded-[12px] bg-slate-950 flex flex-col items-center justify-center p-1 text-center border border-amber-300/30">
                    <span className="font-serif font-black text-amber-400 text-lg tracking-wider">GIA</span>
                    <span className="text-[7px] font-mono text-amber-200 uppercase">1984</span>
                  </div>
                </div>

                <div>
                  <h1 className="text-xl sm:text-2xl font-black text-slate-950 tracking-tight font-display uppercase">
                    Greenfield International Academy
                  </h1>
                  <p className="text-xs text-slate-600 font-semibold tracking-wide">
                    Affiliated to Central Board of Secondary Education (CBSE Code: 1930482 · School No: 40219)
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Centenary Campus, Sector 14, Knowledge Corridor · contact@greenfield.edu
                  </p>
                </div>
              </div>

              <div className="text-right shrink-0">
                <div className="inline-block rounded-xl bg-slate-100 border border-slate-300 px-3 py-1.5 text-center">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Academic Session</div>
                  <div className="font-mono font-black text-xs text-slate-900">{data.academicYear}</div>
                  <div className="text-[10px] font-bold text-brand-700 uppercase">{data.term}</div>
                </div>
              </div>
            </div>

            {/* Document Title Banner */}
            <div className="text-center py-2 bg-slate-100/80 rounded-xl border border-slate-200">
              <span className="text-xs sm:text-sm font-black text-slate-900 uppercase tracking-widest font-display">
                Continuous &amp; Comprehensive Evaluation · Academic Marksheet
              </span>
            </div>

            {/* Student Biographical Data Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-bold">Student Name</span>
                <span className="font-bold text-slate-900 text-sm">{data.studentName}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-bold">Roll Number</span>
                <span className="font-mono font-bold text-slate-900">{data.rollNumber}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-bold">Admission Number</span>
                <span className="font-mono font-bold text-slate-900">{data.admissionNo}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-bold">Class &amp; Section</span>
                <span className="font-bold text-brand-800">{data.className}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-bold">Term Attendance</span>
                <span className="font-bold text-emerald-700">{data.attendanceRate} ({data.attendanceDays})</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-bold">Evaluation Type</span>
                <span className="font-semibold text-slate-800">Mid-Term Summative</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-bold">Assessment Board</span>
                <span className="font-semibold text-slate-800">CBSE Curriculum</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-bold">Date of Release</span>
                <span className="font-mono text-slate-700">{new Date().toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}</span>
              </div>
            </div>

            {/* ── SUBJECT MARKS EVALUATION TABLE ── */}
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 text-[11px] uppercase tracking-wider">
                    <th className="py-2.5 px-3">Subject Description</th>
                    <th className="py-2.5 px-3 text-center">Max Marks</th>
                    <th className="py-2.5 px-3 text-center">Theory</th>
                    <th className="py-2.5 px-3 text-center">Practical / IA</th>
                    <th className="py-2.5 px-3 text-center">Total Scored</th>
                    <th className="py-2.5 px-3 text-center">Grade Point</th>
                    <th className="py-2.5 px-3 text-center">Letter Grade</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.subjects.map((s, idx) => (
                    <tr key={idx} className={idx % 2 === 0 ? "bg-white" : "bg-slate-50/50"}>
                      <td className="py-2.5 px-3 font-semibold text-slate-900">{s.subjectName}</td>
                      <td className="py-2.5 px-3 text-center font-mono text-slate-600">{s.maxMarks}</td>
                      <td className="py-2.5 px-3 text-center font-mono text-slate-800 font-bold">{s.theoryMarks}</td>
                      <td className="py-2.5 px-3 text-center font-mono text-slate-600">{s.practicalMarks ?? "—"}</td>
                      <td className="py-2.5 px-3 text-center font-mono font-bold text-brand-900 bg-brand-50/40">
                        {s.totalMarks}
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono text-slate-700 font-bold">{s.gradePoint}</td>
                      <td className="py-2.5 px-3 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-black ${
                          s.grade.startsWith("A") ? "bg-emerald-100 text-emerald-800" :
                          s.grade.startsWith("B") ? "bg-blue-100 text-blue-800" : "bg-amber-100 text-amber-800"
                        }`}>
                          {s.grade}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {/* Aggregate Summary Row */}
                  <tr className="bg-slate-900 text-white font-bold border-t-2 border-slate-950">
                    <td className="py-3 px-3 uppercase text-[11px] font-black tracking-wider">
                      Cumulative Aggregate Total
                    </td>
                    <td className="py-3 px-3 text-center font-mono">{totalMax}</td>
                    <td colSpan={2} className="py-3 px-3 text-right uppercase text-[10px] text-slate-300">
                      Total Marks Obtained:
                    </td>
                    <td className="py-3 px-3 text-center font-mono text-amber-300 text-sm font-black">
                      {totalScored}
                    </td>
                    <td className="py-3 px-3 text-center font-mono text-emerald-300 font-bold">
                      {percentage}%
                    </td>
                    <td className="py-3 px-3 text-center font-black text-amber-300 text-sm">
                      {overallGrade}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Performance Summary Strip */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-500 uppercase text-[10px]">Overall Result:</span>
                <span className="font-black text-emerald-700">{division}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-500 uppercase text-[10px]">Percentage:</span>
                <span className="font-mono font-bold text-slate-900">{percentage}%</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-500 uppercase text-[10px]">Evaluation Status:</span>
                <span className="font-bold text-brand-700">Official &amp; Verified</span>
              </div>
            </div>

            {/* ── TEACHER EVALUATION & AI REMARK DESK ── */}
            <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-900">
                    Class Teacher Academic &amp; Behavioral Remarks
                  </span>
                  <span className="text-[10px] font-bold text-brand-700 bg-brand-50 px-2 py-0.5 rounded-full border border-brand-200">
                    Holistic Assessment
                  </span>
                </div>

                {/* Non-Printable AI Generator Button */}
                <button
                  type="button"
                  onClick={generateAiEvaluation}
                  disabled={isGeneratingAi}
                  className="print:hidden inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 font-bold text-xs transition active:scale-95 shadow-sm"
                >
                  <span>✨</span> {isGeneratingAi ? "Generating AI Remark..." : "Generate AI Remark"}
                </button>
              </div>

              {aiError && (
                <div className="text-rose-600 text-xs font-medium">⚠️ {aiError}</div>
              )}

              <p className="text-xs text-slate-700 leading-relaxed italic bg-slate-50/80 p-3 rounded-lg border border-slate-100">
                &ldquo;{remarks}&rdquo;
              </p>
            </div>

            {/* Official Signatures & Verification Seal */}
            <div className="pt-8 border-t border-slate-200 grid grid-cols-3 items-end text-center text-xs">
              <div className="space-y-1">
                <div className="font-serif italic text-sm text-slate-800">Sunita Rao</div>
                <div className="border-t border-slate-400 pt-1 text-[11px] font-bold text-slate-600">
                  Class Teacher
                </div>
              </div>

              {/* Institutional Seal Badge */}
              <div className="flex flex-col items-center">
                <div className="h-16 w-16 rounded-full border-2 border-dashed border-brand-600 flex flex-col items-center justify-center p-1 text-[8px] font-black text-brand-800 tracking-wider text-center uppercase">
                  <span>Greenfield</span>
                  <span className="text-amber-600">★ ★ ★</span>
                  <span>Seal 1984</span>
                </div>
                <span className="text-[9px] text-slate-400 mt-1 uppercase font-semibold">Institutional Seal</span>
              </div>

              <div className="space-y-1">
                <div className="font-serif italic text-sm text-slate-800">Dr. Alistair Vance</div>
                <div className="border-t border-slate-400 pt-1 text-[11px] font-bold text-slate-600">
                  Headmaster / Principal
                </div>
              </div>
            </div>

            {/* Footer QR & Verification Stamp */}
            <div className="pt-4 border-t border-dashed border-slate-200 flex items-center justify-between text-[10px] text-slate-400 font-mono">
              <div>Verification Hash: <code>0xCB71A9F42B</code> · Central SIS Record</div>
              <div>Generated via Greenfield Academic Portal (Next.js 15 + GraphQL Yoga)</div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
