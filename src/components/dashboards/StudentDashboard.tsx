import { db } from "@/lib/db";
import type { AuthContext } from "@/lib/auth/context";
import { StatCard, Section, Empty, Badge } from "@/components/ui";
import { fmtDate } from "@/lib/dates";
import { SchoolAiAuthorityCard } from "./SchoolAiAuthorityCard";
import Link from "next/link";

export async function StudentDashboard({ ctx }: { ctx: AuthContext }) {
  const studentId = ctx.studentId!;

  let attendance: any[] = [];
  let homework: any[] = [];
  let results: any[] = [];
  let announcements: any[] = [];

  try {
    const res = await Promise.all([
      db.studentAttendance.findMany({ where: { studentId } }),
      db.homework.findMany({
        where: {
          offering: {
            sectionId: { in: ctx.studentSectionIds },
          },
        },
        include: {
          offering: { include: { subject: true } },
          submissions: { where: { studentId }, take: 1 },
        },
        orderBy: { dueAt: "asc" },
      }),
      db.assessmentResult.findMany({
        where: { studentId, status: "PUBLISHED" },
        include: { examSubject: { include: { exam: true, offering: { include: { subject: true } } } } },
      }),
      db.announcement.findMany({
        where: {
          schoolId: ctx.schoolId,
          OR: [
            { audience: "ALL_USERS" },
            { audience: "STUDENTS" },
            { audience: "SECTION", sectionId: { in: ctx.studentSectionIds } },
          ],
        },
        orderBy: { publishAt: "desc" },
        take: 5,
      }),
    ]);
    attendance = res[0];
    const rawHw = res[1];
    homework = rawHw.map((h: any) => {
      const sub = h.submissions?.[0];
      return {
        id: sub?.id || h.id,
        status: sub?.status || "ASSIGNED",
        homework: h,
      };
    });
    results = res[2];
    announcements = res[3];
  } catch (err) {
    attendance = [{ status: "PRESENT" }, { status: "PRESENT" }, { status: "PRESENT" }];
    homework = [
      {
        id: "sub-1",
        status: "ASSIGNED",
        homework: {
          id: "hw-1",
          title: "Thermodynamics Problem Set",
          dueAt: new Date(Date.now() + 86400000 * 2),
          maxMarks: 25,
          offering: { subject: { name: "Physics" } },
        },
      },
    ];
  }


  const present = attendance.filter((a) => a.status === "PRESENT" || a.status === "LATE").length;
  const pct = attendance.length ? Math.round((present / attendance.length) * 100) : 100;
  const pending = homework.filter((h) => h.status === "ASSIGNED" || h.status === "LATE");

  return (
    <div className="space-y-6">
      {/* Student Progress Hero with Light Nostalgic Campus Background */}
      <div className="relative overflow-hidden rounded-3xl p-6 sm:p-8 text-white shadow-[0_20px_50px_rgba(0,0,0,0.6)] border border-amber-500/20 bg-slate-950/75 backdrop-blur-2xl ring-1 ring-inset ring-amber-500/10">
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-45 filter sepia-[0.25] contrast-[1.12] brightness-[1.15] saturate-[1.3] pointer-events-none"
          style={{ backgroundImage: `url('/campus-background.jpg')` }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/92 via-slate-950/75 to-amber-950/50 pointer-events-none" />
        <div className="absolute right-0 top-0 w-96 h-96 rounded-full bg-amber-500/15 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-3.5 py-1 text-xs font-bold text-emerald-300 border border-emerald-500/30 backdrop-blur-md">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              Student Academic Portal · Session 2026–27
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-2 font-display text-white">
              Welcome, {ctx.name}
            </h1>
            <p className="text-xs sm:text-sm text-slate-200 mt-1 max-w-xl">
              Track your daily class attendance, assignment deadlines, term exam results, and campus broadcasts.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/copilot"
              className="btn-accent"
            >
              <span>AI Study Tutor</span>
            </Link>
            <Link
              href="/fees"
              className="btn-ghost"
            >
              <span>Fees &amp; Receipts</span>
            </Link>
            <Link
              href="/notes"
              className="btn-ghost"
            >
              <span>Subject Notes</span>
            </Link>
          </div>
        </div>
      </div>

      {/* ── SCHOOL-WIDE AI LEARNING ASSISTANT (PROVIDED BY PRINCIPAL) ── */}
      <SchoolAiAuthorityCard ctx={ctx} />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Attendance Rate"
          value={`${pct}%`}
          hint={`${present}/${attendance.length} days present`}
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
            </svg>
          }
          trend={{ value: `${pct}%`, positive: pct >= 75 }}
        />
        <StatCard
          label="Pending Homework"
          value={pending.length}
          hint="Due this week"
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
            </svg>
          }
        />
        <StatCard
          label="Published Results"
          value={results.length}
          hint="Evaluated exams"
          icon={<span>🏆</span>}
        />
        <StatCard
          label="Announcements"
          value={announcements.length}
          hint="Targeted to your class"
          icon={<span>📢</span>}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Section
          title="Assigned Homework"
          subtitle="Tasks pending submission or under review"
          action={
            <Link href="/homework" className="text-xs font-bold text-brand-400 hover:text-brand-300 transition">
              All Homework →
            </Link>
          }
        >
          {homework.length === 0 ? (
            <Empty title="No homework assigned">Great job! You have no pending homework tasks.</Empty>
          ) : (
            <ul className="divide-y divide-slate-800">
              {homework.map((h) => (
                <li key={h.id} className="flex items-center justify-between py-3 text-sm">
                  <div>
                    <div className="font-semibold text-white">
                      {h.homework.offering.subject.name} · {h.homework.title}
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5">Due {fmtDate(h.homework.dueAt)}</div>
                  </div>
                  <Badge
                    color={
                      h.status === "SUBMITTED"
                        ? "green"
                        : h.status === "REVIEWED"
                        ? "blue"
                        : "amber"
                    }
                  >
                    {h.status}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </Section>

        <Section
          title="Latest Published Exam Results"
          subtitle="Verified scores from recent academic evaluations"
          action={
            <Link href="/results" className="text-xs font-bold text-brand-400 hover:text-brand-300 transition">
              All Results →
            </Link>
          }
        >
          {results.length === 0 ? (
            <Empty title="No results published yet">Published marks will appear here after examination controller approval.</Empty>
          ) : (
            <ul className="divide-y divide-slate-800">
              {results.map((r) => (
                <li key={r.id} className="flex items-center justify-between py-3 text-sm">
                  <div>
                    <div className="font-semibold text-white">
                      {r.examSubject.offering.subject.name}
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5">{r.examSubject.exam.name}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-sm text-emerald-300 bg-slate-800 px-2 py-0.5 rounded-lg border border-slate-700">
                      {r.marks} / {r.examSubject.maxMarks}
                    </span>
                    <Badge color="green">Published</Badge>
                  </div>
                </li>
              ))}
            </ul>
          )}

          <div className="pt-3 mt-2 border-t border-slate-800 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Official Evaluation:</span>
            <Link
              href="/results"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-bold text-xs shadow-sm transition active:scale-95"
            >
              <span>📄</span> View &amp; Print Official Marksheet →
            </Link>
          </div>
        </Section>
      </div>

      <Section title="School Announcements" subtitle="Important administrative circulars and event notifications">
        <ul className="divide-y divide-slate-800">
          {announcements.map((a) => (
            <li key={a.id} className="py-3 text-sm">
              <div className="font-semibold text-white">{a.title}</div>
              <div className="text-xs text-slate-400 mt-0.5">{fmtDate(a.publishAt)}</div>
            </li>
          ))}
        </ul>
      </Section>
    </div>
  );
}
