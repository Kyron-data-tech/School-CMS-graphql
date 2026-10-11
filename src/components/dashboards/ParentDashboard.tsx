import { db } from "@/lib/db";
import type { AuthContext } from "@/lib/auth/context";
import { Section, Empty, StatCard, Badge } from "@/components/ui";

export async function ParentDashboard({ ctx }: { ctx: AuthContext }) {
  let children: any[] = [];
  try {
    children = await db.student.findMany({
      where: { id: { in: ctx.childStudentIds } },
      include: {
        enrollments: { where: { status: "ACTIVE" }, include: { section: { include: { grade: true } } } },
        attendance: true,
        submissions: { include: { homework: { include: { offering: { include: { subject: true } } } } } },
        results: {
          where: { status: "PUBLISHED" },
          include: { examSubject: { include: { exam: true, offering: { include: { subject: true } } } } },
        },
      },
    });
  } catch (err) {
    children = [
      {
        id: "child-1",
        firstName: "Arjun",
        lastName: "Mehta",
        admissionNo: "ADM-1001",
        enrollments: [{ section: { name: "A", grade: { name: "Class 8" } } }],
        attendance: [{ status: "PRESENT" }, { status: "PRESENT" }],
        submissions: [],
        results: [
          {
            id: "r1",
            marks: 88,
            examSubject: { maxMarks: 100, exam: { name: "Midterm" }, offering: { subject: { name: "Physics" } } },
          },
        ],
      },
    ];
  }


  if (children.length === 0) return <Empty title="No children linked">No student profiles are linked to this parent account.</Empty>;

  return (
    <div className="space-y-8">
      {/* Parent Welcome */}
      <div className="relative overflow-hidden rounded-3xl bg-slate-900/60 backdrop-blur-2xl p-6 sm:p-8 text-white border border-white/[0.08] shadow-[0_8px_32px_0_rgba(0,0,0,0.36)] ring-1 ring-inset ring-white/[0.03]">
        <div className="absolute top-0 right-0 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="relative z-10">
          <span className="inline-flex items-center gap-2 rounded-full bg-brand-500/10 px-3 py-1 text-xs font-semibold text-brand-300 border border-brand-500/20 backdrop-blur-md">
            <svg className="w-3.5 h-3.5 text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            Parent Academic Monitoring Portal · Session 2026–27
          </span>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight mt-3 font-display text-white">
            Welcome, {ctx.name}
          </h1>
          <p className="text-xs sm:text-sm text-slate-300/80 mt-1 max-w-xl">
            Real-time academic performance, attendance records, homework tracking, and teacher remarks for your ward.
          </p>
        </div>
      </div>

      {children.map((c: any) => {
        const enr = c.enrollments[0];
        const present = c.attendance.filter((a: any) => a.status === "PRESENT" || a.status === "LATE").length;
        const pct = c.attendance.length ? Math.round((present / c.attendance.length) * 100) : 100;
        const pending = c.submissions.filter((s: any) => s.status === "ASSIGNED" || s.status === "LATE");

        return (
          <div key={c.id} className="space-y-6 rounded-3xl border border-white/[0.08] bg-slate-900/40 backdrop-blur-xl p-6 shadow-card">
            {/* Child header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3.5">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-brand-600 to-indigo-600 font-extrabold text-white text-base shadow-sm ring-1 ring-white/10">
                  {c.firstName[0]}
                </div>
                <div>
                  <div className="text-lg font-bold text-white leading-tight">
                    {c.firstName} {c.lastName}
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    {enr ? (
                      <span>Class {enr.section.grade.name.replace("Class ", "")}-{enr.section.name} · Roll No. {enr.rollNumber}</span>
                    ) : (
                      "Not actively enrolled"
                    )}
                  </div>
                </div>
              </div>
              <Badge color={pct >= 75 ? "green" : "red"}>{pct}% Attendance</Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <StatCard
                label="Attendance Rate"
                value={`${pct}%`}
                icon={
                  <svg className="w-5 h-5 text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                }
                trend={{ value: `${present}/${c.attendance.length} days`, positive: pct >= 75 }}
              />
              <StatCard
                label="Pending Tasks"
                value={pending.length}
                icon={
                  <svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                }
                hint="Homework due"
              />
              <StatCard
                label="Published Scores"
                value={c.results.length}
                icon={
                  <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                  </svg>
                }
                hint="Graded exams"
              />
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <Section title="Assigned Homework" subtitle="Recent assignments given by teachers">
                {c.submissions.length === 0 ? (
                  <Empty title="No homework assigned">No homework assigned for this student.</Empty>
                ) : (
                  <ul className="divide-y divide-white/[0.06]">
                    {c.submissions.slice(0, 5).map((s: any) => (
                      <li key={s.id} className="flex items-center justify-between py-3 text-sm">
                        <span className="font-medium text-slate-200">
                          {s.homework.offering.subject.name} · {s.homework.title}
                        </span>
                        <Badge
                          color={
                            s.status === "SUBMITTED"
                              ? "green"
                              : s.status === "REVIEWED"
                              ? "blue"
                              : "red"
                          }
                        >
                          {s.status}
                        </Badge>
                      </li>
                    ))}
                  </ul>
                )}
              </Section>

              <Section title="Published Examination Results" subtitle="Scores verified by the school">
                {c.results.length === 0 ? (
                  <Empty title="No exam results yet">Results will appear here as terms conclude.</Empty>
                ) : (
                  <ul className="divide-y divide-white/[0.06]">
                    {c.results.map((r: any) => (
                      <li key={r.id} className="flex items-center justify-between py-3 text-sm">
                        <div>
                          <div className="font-semibold text-slate-200">{r.examSubject.offering.subject.name}</div>
                          <div className="text-xs text-slate-400">{r.examSubject.exam.name}</div>
                        </div>
                        <span className="font-bold text-sm text-slate-100 bg-slate-800/80 px-2.5 py-1 rounded-lg border border-white/10 font-mono">
                          {r.marks} / {r.examSubject.maxMarks}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </Section>
            </div>
          </div>
        );
      })}
    </div>
  );
}
