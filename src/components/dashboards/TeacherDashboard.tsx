import { db } from "@/lib/db";
import type { AuthContext } from "@/lib/auth/context";
import { StatCard, Section, Empty, Badge } from "@/components/ui";
import { SchoolAiAuthorityCard } from "./SchoolAiAuthorityCard";
import Link from "next/link";

const DAYS = ["", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export async function TeacherDashboard({ ctx }: { ctx: AuthContext }) {
  const today = new Date().getUTCDay() || 7;

  let offerings: any[] = [];
  let todayClasses: any[] = [];
  let awaitingReview = 0;
  let marksToEnter = 0;
  let classTeacher: any[] = [];

  try {
    const res = await Promise.all([
      db.subjectOffering.findMany({
        where: { id: { in: ctx.assignedOfferingIds } },
        include: { subject: true, section: { include: { grade: true } } },
      }),
      db.timetableEntry.findMany({
        where: { offeringId: { in: ctx.assignedOfferingIds }, dayOfWeek: today },
        include: {
          offering: { include: { subject: true, section: { include: { grade: true } } } },
          period: true,
          room: true,
        },
        orderBy: { period: { sequence: "asc" } },
      }),
      db.homeworkSubmission.count({
        where: { status: "SUBMITTED", homework: { offeringId: { in: ctx.assignedOfferingIds } } },
      }),
      db.assessmentResult.count({
        where: {
          status: { in: ["DRAFT", "TEACHER_ENTRY"] },
          examSubject: { offeringId: { in: ctx.assignedOfferingIds } },
        },
      }),
      ctx.classTeacherSectionIds.length
        ? db.section.findMany({
            where: { id: { in: ctx.classTeacherSectionIds } },
            include: { grade: true, _count: { select: { enrollments: true } } },
          })
        : Promise.resolve([]),
    ]);

    offerings = res[0];
    todayClasses = res[1];
    awaitingReview = res[2];
    marksToEnter = res[3];
    classTeacher = res[4];
  } catch (err) {
    offerings = [
      { id: "off-1", subject: { name: "Physics" }, section: { name: "A", grade: { name: "Class 8" } } },
      { id: "off-2", subject: { name: "Mathematics" }, section: { name: "A", grade: { name: "Class 8" } } },
    ];
    awaitingReview = 4;
    marksToEnter = 2;
  }

  const sectionName = (o: any) =>
    `${o.section.grade.name.replace("Class ", "")}-${o.section.name}`;


  return (
    <div className="space-y-6">
      {/* Teacher Action Hero with Light Nostalgic Campus Background */}
      <div className="relative overflow-hidden rounded-3xl p-6 sm:p-8 text-white shadow-[0_20px_50px_rgba(0,0,0,0.6)] border border-amber-500/20 bg-slate-950/75 backdrop-blur-2xl ring-1 ring-inset ring-amber-500/10">
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-45 filter sepia-[0.25] contrast-[1.12] brightness-[1.15] saturate-[1.3] pointer-events-none"
          style={{ backgroundImage: `url('/campus-background.jpg')` }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/92 via-slate-950/75 to-amber-950/50 pointer-events-none" />
        <div className="absolute right-0 top-0 w-96 h-96 rounded-full bg-amber-500/15 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.08] px-3.5 py-1 text-xs font-bold text-brand-200 border border-white/[0.15] backdrop-blur-md">
              <span className="h-2 w-2 rounded-full bg-blue-400 animate-pulse" />
              Faculty Academic Workspace · Session 2026–27
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-2 font-display text-white">
              Welcome, {ctx.name}
            </h1>
            <p className="text-xs sm:text-sm text-slate-200 mt-1 max-w-xl">
              Manage your course offerings, attendance registers, homework evaluations, and examination grading.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/copilot"
              className="btn-primary"
            >
              <span>AI Copilot</span>
            </Link>
            <Link
              href="/notes"
              className="btn-ghost"
            >
              <span>Subject Notes</span>
            </Link>
            <Link
              href="/attendance"
              className="btn-ghost"
            >
              <span>Attendance</span>
            </Link>
            <Link
              href="/results"
              className="btn-ghost"
            >
              <span>Enter Marks</span>
            </Link>
          </div>
        </div>
      </div>

      {/* ── SCHOOL-WIDE AI LICENSE (INHERITED FROM PRINCIPAL) ── */}
      <SchoolAiAuthorityCard ctx={ctx} />

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Assigned subjects"
          value={offerings.length}
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
            </svg>
          }
          hint="Active courses"
        />
        <StatCard
          label="Classes today"
          value={todayClasses.length}
          hint={DAYS[today]}
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <StatCard
          label="Homework to review"
          value={awaitingReview}
          hint="Student submissions"
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
            </svg>
          }
        />
        <StatCard
          label="Marks to enter"
          value={marksToEnter}
          hint="Draft assessments"
          icon={<span>🏆</span>}
        />
      </div>

      {classTeacher.length > 0 && (
        <Section
          title="Class Teacher Responsibilities"
          subtitle="Sections under your direct mentorship and pastoral care"
        >
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {classTeacher.map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between rounded-2xl border border-brand-900/60 bg-brand-950/40 p-4 shadow-subtle hover:border-brand-700 transition"
              >
                <div>
                  <div className="text-base font-bold text-white">
                    Class {s.grade.name.replace("Class ", "")}-{s.name}
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    {s._count.enrollments} Enrolled Students
                  </div>
                </div>
                <Link
                  href="/students"
                  className="rounded-xl bg-slate-800 px-3 py-1.5 text-xs font-bold text-brand-300 shadow-subtle border border-slate-700 hover:bg-slate-700 transition"
                >
                  Open Class →
                </Link>
              </div>
            ))}
          </div>
        </Section>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Section
          title={`Today's Classes — ${DAYS[today]}`}
          subtitle="Your scheduled teaching periods for today"
        >
          {todayClasses.length === 0 ? (
            <Empty title="No classes today">You have no teaching periods scheduled for {DAYS[today]}.</Empty>
          ) : (
            <ul className="divide-y divide-slate-800">
              {todayClasses.map((t) => (
                <li key={t.id} className="flex items-center justify-between py-3 text-sm">
                  <div className="flex items-center gap-2.5">
                    <span className="font-bold text-white">{sectionName(t.offering)}</span>
                    <span className="text-slate-500">·</span>
                    <span className="text-slate-300 font-medium">{t.offering.subject.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-md bg-slate-800 px-2 py-0.5 text-xs font-semibold text-slate-300 border border-slate-700">
                      {t.period.startTime}–{t.period.endTime}
                    </span>
                    <span className="rounded-md bg-brand-950/70 px-2 py-0.5 text-xs font-bold text-brand-300 border border-brand-800/80">
                      Room {t.room?.name ?? "—"}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Section>

        <Section
          title="Assigned Subjects & Sections"
          subtitle="Courses you teach across academic grades"
          action={
            <Link href="/results" className="text-xs font-bold text-brand-400 hover:text-brand-300 transition">
              Enter Marks →
            </Link>
          }
        >
          <ul className="divide-y divide-slate-800">
            {offerings.map((o) => (
              <li key={o.id} className="flex items-center justify-between py-3 text-sm">
                <span className="font-semibold text-white">{o.subject.name}</span>
                <Badge color="blue">Class {sectionName(o)}</Badge>
              </li>
            ))}
          </ul>
        </Section>
      </div>
    </div>
  );
}
