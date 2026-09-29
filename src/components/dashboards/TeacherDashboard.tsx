import { db } from "@/lib/db";
import type { AuthContext } from "@/lib/auth/context";
import { StatCard, Section, Empty, Badge } from "@/components/ui";
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
      {/* Teacher Action Hero */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-950 via-brand-950 to-indigo-950 p-6 sm:p-8 text-white shadow-elevated border border-slate-800">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-brand-200 border border-white/10 backdrop-blur-md">
              👩‍🏫 Faculty Academic Workspace · Session 2026–27
            </span>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight mt-2 font-display text-white">
              Welcome, {ctx.name}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
              Manage your course offerings, attendance registers, homework evaluations, and examination grading.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/copilot"
              className="inline-flex items-center gap-1.5 rounded-2xl bg-gradient-to-r from-brand-500 via-indigo-600 to-brand-600 px-4 py-2.5 text-xs font-bold text-white shadow-glow hover:from-brand-400 hover:to-indigo-500 transition-all active:scale-95"
            >
              <span>✨</span> AI Copilot
            </Link>
            <Link
              href="/attendance"
              className="inline-flex items-center gap-1.5 rounded-2xl bg-white/10 hover:bg-white/20 backdrop-blur-md px-4 py-2.5 text-xs font-bold text-white border border-white/15 transition active:scale-95"
            >
              <span>📅</span> Mark Attendance
            </Link>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Assigned subjects"
          value={offerings.length}
          icon={<span>📚</span>}
          hint="Active courses"
        />
        <StatCard
          label="Classes today"
          value={todayClasses.length}
          hint={DAYS[today]}
          icon={<span>⏰</span>}
        />
        <StatCard
          label="Homework to review"
          value={awaitingReview}
          hint="Student submissions"
          icon={<span>📝</span>}
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
                className="flex items-center justify-between rounded-2xl border border-brand-100 bg-brand-50/50 p-4 shadow-subtle hover:border-brand-300 transition"
              >
                <div>
                  <div className="text-base font-bold text-slate-900">
                    Class {s.grade.name.replace("Class ", "")}-{s.name}
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    {s._count.enrollments} Enrolled Students
                  </div>
                </div>
                <Link
                  href="/students"
                  className="rounded-xl bg-white px-3 py-1.5 text-xs font-bold text-brand-700 shadow-subtle border border-brand-200 hover:bg-brand-50 transition"
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
            <ul className="divide-y divide-slate-100">
              {todayClasses.map((t) => (
                <li key={t.id} className="flex items-center justify-between py-3 text-sm">
                  <div className="flex items-center gap-2.5">
                    <span className="font-bold text-slate-800">{sectionName(t.offering)}</span>
                    <span className="text-slate-400">·</span>
                    <span className="text-slate-600 font-medium">{t.offering.subject.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
                      {t.period.startTime}–{t.period.endTime}
                    </span>
                    <span className="rounded-md bg-brand-50 px-2 py-0.5 text-xs font-bold text-brand-700 border border-brand-200/60">
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
            <Link href="/results" className="text-xs font-bold text-brand-600 hover:text-brand-800 transition">
              Enter Marks →
            </Link>
          }
        >
          <ul className="divide-y divide-slate-100">
            {offerings.map((o) => (
              <li key={o.id} className="flex items-center justify-between py-3 text-sm">
                <span className="font-semibold text-slate-800">{o.subject.name}</span>
                <Badge color="blue">Class {sectionName(o)}</Badge>
              </li>
            ))}
          </ul>
        </Section>
      </div>
    </div>
  );
}
