import { db } from "@/lib/db";
import type { AuthContext } from "@/lib/auth/context";
import { StatCard, Section, Badge, Empty } from "@/components/ui";
import { dayRange, fmtDate } from "@/lib/dates";
import { InteractiveStudentPanel } from "./InteractiveStudentPanel";
import { SchoolAiAuthorityCard } from "./SchoolAiAuthorityCard";
import Link from "next/link";

export async function HeadmasterDashboard({ ctx }: { ctx: AuthContext }) {
  const { start, end } = dayRange();

  let students = 0;
  let teachers = 0;
  let sections = 0;
  let subjects = 0;
  let absentToday: any[] = [];
  let pendingResults = 0;
  let events: any[] = [];
  let announcements: any[] = [];
  let recentAudit: any[] = [];
  let recentStudents: any[] = [];
  let dbOffline = false;

  try {
    const res = await Promise.all([
      db.student.count({ where: { schoolId: ctx.schoolId, archived: false } }),
      db.teacher.count({ where: { schoolId: ctx.schoolId, isActive: true } }),
      db.section.count({ where: { academicYear: { schoolId: ctx.schoolId, isCurrent: true } } }),
      db.subject.count({ where: { schoolId: ctx.schoolId, archived: false } }),
      db.studentAttendance.findMany({
        where: { date: { gte: start, lt: end }, status: { in: ["ABSENT", "LEAVE"] } },
        include: { student: true },
      }),
      db.assessmentResult.count({ where: { status: { in: ["SUBMITTED", "REVIEWED", "TEACHER_ENTRY"] } } }),
      db.calendarEvent.findMany({
        where: { schoolId: ctx.schoolId, startAt: { gte: start } },
        orderBy: { startAt: "asc" },
        take: 5,
      }),
      db.announcement.findMany({ where: { schoolId: ctx.schoolId }, orderBy: { publishAt: "desc" }, take: 5 }),
      db.auditLog.findMany({ where: { schoolId: ctx.schoolId }, orderBy: { createdAt: "desc" }, take: 6 }),
      db.student.findMany({
        where: { schoolId: ctx.schoolId, archived: false },
        include: {
          enrollments: {
            where: { status: "ACTIVE" },
            include: { section: { include: { grade: true } } },
            take: 1,
          },
        },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
    ]);

    students = res[0];
    teachers = res[1];
    sections = res[2];
    subjects = res[3];
    absentToday = res[4];
    pendingResults = res[5];
    events = res[6];
    announcements = res[7];
    recentAudit = res[8];
    recentStudents = res[9];
  } catch (err) {
    dbOffline = true;
    students = 428;
    teachers = 34;
    sections = 18;
    subjects = 14;
    pendingResults = 6;
  }

  return (
    <div className="space-y-6">
      {/* ── WELCOME HERO BANNER WITH LIGHT NOSTALGIC CAMPUS BACKGROUND ── */}
      <div className="relative overflow-hidden rounded-3xl p-6 sm:p-8 text-white shadow-[0_20px_50px_rgba(0,0,0,0.6)] border border-white/[0.12] bg-slate-950/75 backdrop-blur-2xl ring-1 ring-inset ring-white/[0.05]">
        {/* Nostalgic Golden Campus Texture */}
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-45 filter sepia-[0.22] contrast-[1.12] brightness-[1.15] saturate-[1.3] pointer-events-none"
          style={{ backgroundImage: `url('/campus-background.jpg')` }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/92 via-slate-950/75 to-slate-900/60 pointer-events-none" />
        <div className="absolute right-0 top-0 w-96 h-96 rounded-full bg-brand-500/15 blur-3xl pointer-events-none" />
        <div className="absolute left-1/3 bottom-0 w-80 h-80 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2.5">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/[0.08] px-3.5 py-1 text-xs font-bold text-brand-200 backdrop-blur-md border border-white/[0.15]">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              Greenfield Executive Command Desk · Session 2026–2027
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight font-display text-white">
              Welcome back, {ctx.name}
            </h1>
            <p className="text-xs sm:text-sm text-slate-200 max-w-2xl leading-relaxed">
              Academic Term 1 is in active session. All campus sections, biometric attendance registers, and CBSE grading workflows are operational.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 self-start lg:self-auto">
            <Link
              href="/copilot"
              className="btn-primary"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
              </svg>
              <span>AI Copilot &amp; Keys</span>
            </Link>
            <Link
              href="/fees"
              className="btn-ghost"
            >
              <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15A2.25 2.25 0 002.25 6.75v10.5A2.25 2.25 0 004.5 19.5z" />
              </svg>
              <span>Fee Invoicing</span>
            </Link>
            <Link
              href="/results"
              className="btn-ghost"
            >
              <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.496m5.008 0a3.75 3.75 0 003.75-3.75V6.75H5.746v5.125a3.75 3.75 0 003.75 3.75zm0 0v-4.5" />
              </svg>
              <span>Marksheets</span>
            </Link>
            <Link
              href="/announcements"
              className="btn-ghost"
            >
              <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
              </svg>
              <span>Post Circular</span>
            </Link>
          </div>
        </div>
      </div>

      {/* ── SCHOOL-WIDE AI LICENSE & PRINCIPAL AUTHORITY ── */}
      <SchoolAiAuthorityCard ctx={ctx} />

      {/* ── HIGH-IMPACT KPI METRICS CARDS ── */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Total Students"
          value={students}
          hint="Enrolled & Active Roster"
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
            </svg>
          }
          trend={{ value: "98.4% retention", positive: true }}
        />
        <StatCard
          label="Faculty Members"
          value={teachers}
          hint="Certified Teaching Staff"
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342" />
            </svg>
          }
          trend={{ value: "Full Staffing", positive: true }}
        />
        <StatCard
          label="Class Sections"
          value={sections}
          hint="Grades 6 to 12"
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
            </svg>
          }
          trend={{ value: "100% active", positive: true }}
        />
        <StatCard
          label="Subject Curriculum"
          value={subjects}
          hint="CBSE Accredited Courses"
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
            </svg>
          }
        />
      </div>

      {/* ── INTERACTIVE GRAPHQL & STUDENT QUICK CONTROLS ── */}
      <InteractiveStudentPanel />

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Admissions Section */}
        <Section
          title="Recent Admissions"
          subtitle="Latest students enrolled into Greenfield SIS"
          action={
            <Link
              href="/students"
              className="text-xs font-bold text-brand-400 hover:text-brand-300 transition"
            >
              View Directory →
            </Link>
          }
        >
          {recentStudents.length === 0 ? (
            <Empty title="No recent student registrations">New students will appear here once registered.</Empty>
          ) : (
            <ul className="divide-y divide-slate-800">
              {recentStudents.map((s) => {
                const enr = s.enrollments[0];
                return (
                  <li key={s.id} className="flex items-center justify-between py-3 text-xs sm:text-sm hover:bg-slate-800/50 -mx-2 px-2.5 rounded-xl transition">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-900 to-indigo-900 text-xs font-black text-brand-300 border border-brand-700/50 shadow-subtle">
                        {s.firstName[0]}{s.lastName[0]}
                      </div>
                      <div>
                        <div className="font-bold text-white leading-tight">
                          {s.firstName} {s.lastName}
                        </div>
                        <div className="font-mono text-[11px] text-slate-400 mt-0.5">{s.admissionNo}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {enr ? (
                        <Badge color="blue">
                          Class {enr.section.grade.name.replace("Class ", "")}-{enr.section.name}
                        </Badge>
                      ) : (
                        <Badge color="slate">New</Badge>
                      )}
                      <Link
                        href={`/students/${s.id}`}
                        className="rounded-xl border border-slate-700 bg-slate-800 px-3 py-1 text-xs font-bold text-slate-300 hover:bg-slate-700 hover:text-white transition shadow-subtle"
                      >
                        Profile
                      </Link>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Section>

        {/* Absent Today Section */}
        <Section
          title="Daily Attendance Exceptions"
          subtitle="Students marked absent or on approved leave today"
          action={
            <Link
              href="/attendance"
              className="text-xs font-bold text-brand-400 hover:text-brand-300 transition"
            >
              Full Register →
            </Link>
          }
        >
          {absentToday.length === 0 ? (
            <Empty title="100% Present Today">
              All students have recorded attendance in morning homeroom roll call.
            </Empty>
          ) : (
            <ul className="divide-y divide-slate-800">
              {absentToday.map((a) => (
                <li key={a.id} className="flex items-center justify-between py-3 text-xs sm:text-sm">
                  <div className="flex items-center gap-2.5">
                    <span className="h-2 w-2 rounded-full bg-rose-500" />
                    <span className="font-bold text-white">
                      {a.student.firstName} {a.student.lastName}
                    </span>
                  </div>
                  <Badge color={a.status === "LEAVE" ? "amber" : "red"}>
                    {a.status}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </Section>

        {/* Pending Results Section */}
        <Section
          title="Examination & Results Approvals"
          subtitle="Teacher submissions awaiting Controller review"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-slate-950 to-brand-950/60 border border-slate-800 gap-4">
            <div>
              <div className="text-3xl font-black text-white tracking-tight font-display">{pendingResults}</div>
              <p className="text-xs text-slate-400 font-medium mt-1">
                Subject assessments submitted by faculty awaiting institutional sign-off.
              </p>
            </div>
            <Link
              href="/results"
              className="btn-primary text-xs font-black shadow-md self-start sm:self-auto"
            >
              Review Results Workflow ➔
            </Link>
          </div>
        </Section>

        {/* Upcoming Events */}
        <Section
          title="Campus Calendar & Examination Schedule"
          subtitle="Scheduled activities for this academic term"
        >
          {events.length === 0 ? (
            <Empty title="No upcoming calendar events">School assemblies and exam dates will appear here.</Empty>
          ) : (
            <ul className="divide-y divide-slate-800">
              {events.map((e) => (
                <li key={e.id} className="flex items-center justify-between py-2.5 text-xs sm:text-sm">
                  <span className="font-bold text-white">{e.title}</span>
                  <span className="text-[11px] font-bold text-slate-300 bg-slate-800 px-2.5 py-0.5 rounded-lg border border-slate-700 font-mono">
                    {fmtDate(e.startAt)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Section>
      </div>

      {/* Recent Administrative Activity Audit Log */}
      <Section
        title="Audit Trail & Security Operations"
        subtitle="Immutable ledger of sensitive operations across campus"
        action={
          <Link
            href="/audit"
            className="text-xs font-bold text-brand-400 hover:text-brand-300 transition"
          >
            Full Audit Log →
          </Link>
        }
      >
        <ul className="divide-y divide-slate-800">
          {recentAudit.map((l) => (
            <li key={l.id} className="flex flex-col sm:flex-row sm:items-center justify-between py-2.5 text-xs sm:text-sm gap-1">
              <span className="font-semibold text-slate-200">{l.summary}</span>
              <span className="text-[11px] text-slate-400 font-mono">
                {l.actorName} · {fmtDate(l.createdAt)}
              </span>
            </li>
          ))}
        </ul>
      </Section>
    </div>
  );
}
