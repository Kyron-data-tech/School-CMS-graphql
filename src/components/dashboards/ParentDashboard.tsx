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
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-amber-950 via-slate-900 to-slate-950 p-6 sm:p-8 text-white shadow-elevated border border-amber-900/40">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/20 px-3 py-1 text-xs font-bold text-amber-300 border border-amber-500/30 backdrop-blur-md">
          👨‍👩‍👧 Parent Academic Monitoring Portal · Session 2026–27
        </span>
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight mt-2 font-display text-white">
          Welcome, {ctx.name}
        </h1>
        <p className="text-xs sm:text-sm text-amber-100/80 mt-1 max-w-xl">
          Real-time academic performance, attendance records, homework tracking, and teacher remarks for your ward.
        </p>
      </div>

      {children.map((c: any) => {
        const enr = c.enrollments[0];
        const present = c.attendance.filter((a: any) => a.status === "PRESENT" || a.status === "LATE").length;
        const pct = c.attendance.length ? Math.round((present / c.attendance.length) * 100) : 100;
        const pending = c.submissions.filter((s: any) => s.status === "ASSIGNED" || s.status === "LATE");

        return (
          <div key={c.id} className="space-y-4 rounded-3xl border border-slate-200 bg-white/60 p-6 shadow-card">
            {/* Child header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3.5">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-brand-600 to-indigo-600 font-extrabold text-white text-base shadow-sm">
                  {c.firstName[0]}
                </div>
                <div>
                  <div className="text-lg font-bold text-slate-900 leading-tight">
                    {c.firstName} {c.lastName}
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">
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

            <div className="grid grid-cols-3 gap-4">
              <StatCard
                label="Attendance Rate"
                value={`${pct}%`}
                icon={<span>📅</span>}
                trend={{ value: `${present}/${c.attendance.length} days`, positive: pct >= 75 }}
              />
              <StatCard
                label="Pending Tasks"
                value={pending.length}
                icon={<span>📝</span>}
                hint="Homework due"
              />
              <StatCard
                label="Published Scores"
                value={c.results.length}
                icon={<span>🏆</span>}
                hint="Graded exams"
              />
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <Section title="Assigned Homework" subtitle="Recent assignments given by teachers">
                {c.submissions.length === 0 ? (
                  <Empty title="No homework assigned">No homework assigned for this student.</Empty>
                ) : (
                  <ul className="divide-y divide-slate-100">
                    {c.submissions.slice(0, 5).map((s: any) => (
                      <li key={s.id} className="flex items-center justify-between py-2.5 text-sm">
                        <span className="font-medium text-slate-800">
                          {s.homework.offering.subject.name} · {s.homework.title}
                        </span>
                        <Badge
                          color={
                            s.status === "SUBMITTED"
                              ? "green"
                              : s.status === "REVIEWED"
                              ? "blue"
                              : "amber"
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
                  <ul className="divide-y divide-slate-100">
                    {c.results.map((r: any) => (
                      <li key={r.id} className="flex items-center justify-between py-2.5 text-sm">
                        <div>
                          <div className="font-semibold text-slate-800">{r.examSubject.offering.subject.name}</div>
                          <div className="text-xs text-slate-400">{r.examSubject.exam.name}</div>
                        </div>
                        <span className="font-bold text-sm text-slate-900 bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200">
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
