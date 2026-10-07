import Link from "next/link";
import { notFound } from "next/navigation";
import { getAuthContext } from "@/lib/auth/context";
import { can } from "@/lib/permissions/engine";
import { db } from "@/lib/db";
import { PageHeader, Section, Badge, StatCard, Empty } from "@/components/ui";
import { fmtDate } from "@/lib/dates";

export default async function StudentDetail({ params }: { params: Promise<{ id: string }> }) {
  const ctx = (await getAuthContext())!;
  const { id } = await params;

  const student = await db.student.findUnique({
    where: { id },
    include: {
      school: true,
      enrollments: {
        where: { status: "ACTIVE" },
        include: { section: { include: { grade: true } } },
        take: 1,
      },
      guardians: { include: { guardian: true } },
      results: {
        where: { status: "PUBLISHED" },
        include: { examSubject: { include: { exam: true, offering: { include: { subject: true } } } } },
      },
      attendance: true,
      notes: true,
      transport: {
        where: { isActive: true },
        include: { route: true },
        take: 1,
      },
      invoices: {
        orderBy: { dueDate: "desc" },
        take: 3,
      },
    },
  });
  if (!student || student.schoolId !== ctx.schoolId) notFound();

  const sectionId = student.enrollments[0]?.sectionId ?? null;
  const target = { studentId: student.id, sectionId, schoolId: student.schoolId };

  // Per-record authorization: ensure user is authorized to view this record
  if (!can(ctx, "students", "personal_info", "view", target)) {
    return (
      <div>
        <PageHeader title="Access denied" />
        <Empty>You do not have permission to view this student&apos;s information.</Empty>
      </div>
    );
  }

  const canConfidential = can(ctx, "students", "confidential_notes", "view", target);
  const enr = student.enrollments[0];
  const present = student.attendance.filter((a) => a.status === "PRESENT" || a.status === "LATE").length;
  const pct = student.attendance.length ? Math.round((present / student.attendance.length) * 100) : 100;
  const activeTransport = student.transport[0];
  const pendingInvoices = student.invoices.filter((inv) => inv.status !== "PAID");

  return (
    <div className="space-y-6">
      {/* Student & School Academic Header */}
      <PageHeader
        title={`${student.firstName} ${student.lastName}`}
        subtitle={`${student.school.name} · Admission No: ${student.admissionNo}`}
        action={
          <div className="flex flex-wrap items-center gap-2">
            {enr && (
              <Badge color="blue">
                {enr.section.grade.name.replace("Class ", "")}-{enr.section.name} · Roll {enr.rollNumber ?? "—"}
              </Badge>
            )}
            <Badge color="slate">{student.gender}</Badge>
          </div>
        }
      />

      {/* Student Personal KPI Stats */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="Overall Attendance" value={`${pct}%`} />
        <StatCard label="Published Results" value={`${student.results.length}`} />
        <StatCard
          label="Bus Transport"
          value={activeTransport ? activeTransport.route.code : "Not Enrolled"}
        />
        <StatCard
          label="Fee Account"
          value={pendingInvoices.length === 0 ? "All Paid" : "Pending Dues"}
        />
      </div>

      {/* Student Academic Quick Navigation Links */}
      <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-slate-800 bg-slate-900/90 p-3 shadow-sm">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 mr-2">
          Academic Shortcuts:
        </span>
        <Link
          href="/attendance"
          className="rounded-xl bg-slate-800 border border-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition"
        >
          📅 My Attendance
        </Link>
        <Link
          href="/homework"
          className="rounded-xl bg-slate-800 border border-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition"
        >
          📝 My Homework
        </Link>
        <Link
          href="/notes"
          className="rounded-xl bg-slate-800 border border-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition"
        >
          📖 Subject Notes
        </Link>
        <Link
          href="/results"
          className="rounded-xl bg-slate-800 border border-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition"
        >
          🏆 Marksheets
        </Link>
        <Link
          href="/timetable"
          className="rounded-xl bg-slate-800 border border-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition"
        >
          ⏰ Timetable
        </Link>
        <Link
          href="/transport"
          className="rounded-xl bg-slate-800 border border-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition"
        >
          🚌 Bus Route
        </Link>
        <Link
          href="/fees"
          className="rounded-xl bg-brand-950/60 border border-brand-800/60 text-brand-300 px-3 py-1.5 text-xs font-semibold hover:bg-brand-900/50 transition"
        >
          💳 My Fees & Receipts
        </Link>
      </div>

      {/* Academic Details & School Context */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Academic Enrollment Details */}
        <Section title="Academic & School Enrollment">
          <div className="space-y-3 text-sm">
            <div className="flex justify-between border-b border-slate-800 pb-2">
              <span className="text-slate-400">School</span>
              <span className="font-semibold text-white">{student.school.name}</span>
            </div>
            <div className="flex justify-between border-b border-slate-800 pb-2">
              <span className="text-slate-400">Class & Section</span>
              <span className="font-semibold text-white">
                {enr ? `${enr.section.grade.name} - Section ${enr.section.name}` : "Not Enrolled"}
              </span>
            </div>
            <div className="flex justify-between border-b border-slate-800 pb-2">
              <span className="text-slate-400">Roll Number</span>
              <span className="font-semibold text-white">{enr?.rollNumber ?? "Unassigned"}</span>
            </div>
            <div className="flex justify-between border-b border-slate-800 pb-2">
              <span className="text-slate-400">Admission Number</span>
              <span className="font-semibold text-white">{student.admissionNo}</span>
            </div>
            <div className="flex justify-between border-b border-slate-800 pb-2">
              <span className="text-slate-400">Admission Date</span>
              <span className="font-semibold text-white">{fmtDate(student.admissionDate)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Current Academic Term</span>
              <span className="font-semibold text-brand-400">2026–27 Term 1</span>
            </div>
          </div>
        </Section>

        {/* Bus Route & Transport */}
        <Section title="Campus Transport (Bus Route)">
          {activeTransport ? (
            <div className="space-y-3 text-sm">
              <div className="flex justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-400">Assigned Route</span>
                <span className="font-semibold text-white">{activeTransport.route.name}</span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-400">Route Code</span>
                <Badge color="blue">{activeTransport.route.code}</Badge>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-400">Boarding Stop</span>
                <span className="font-semibold text-white">{activeTransport.stopName}</span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-400">Pickup Timing</span>
                <span className="font-semibold text-white">{activeTransport.pickupTime ?? "07:30 AM"}</span>
              </div>
              <div className="pt-1">
                <Link
                  href="/transport"
                  className="text-xs font-semibold text-brand-400 hover:text-brand-300"
                >
                  View full bus stops & timings →
                </Link>
              </div>
            </div>
          ) : (
            <div className="py-4 text-center">
              <p className="text-sm text-slate-400">No school bus transport enrolled.</p>
              <Link
                href="/transport"
                className="mt-2 inline-block text-xs font-semibold text-brand-400 hover:text-brand-300"
              >
                Browse available campus bus routes →
              </Link>
            </div>
          )}
        </Section>

        {/* Fee Invoicing & Payment Summary */}
        <Section title="Tuition & Fee Status">
          {student.invoices.length === 0 ? (
            <div className="py-4 text-center text-sm text-slate-400">
              No fee invoices issued yet.
            </div>
          ) : (
            <div className="space-y-3">
              {student.invoices.map((inv) => (
                <div
                  key={inv.id}
                  className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/60 p-3 text-sm"
                >
                  <div>
                    <div className="font-semibold text-white">{inv.title}</div>
                    <div className="text-xs text-slate-400">
                      Invoice: {inv.invoiceNo} · Due: {inv.dueDate.toISOString().split("T")[0]}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white">
                      ₹{Number(inv.amount).toLocaleString("en-IN")}
                    </span>
                    <Badge color={inv.status === "PAID" ? "green" : "amber"}>{inv.status}</Badge>
                  </div>
                </div>
              ))}
              <div className="pt-1">
                <Link
                  href="/fees"
                  className="text-xs font-semibold text-brand-400 hover:text-brand-300"
                >
                  Go to Fee Invoicing & Online Payment Gateway →
                </Link>
              </div>
            </div>
          )}
        </Section>

        {/* Guardians Contact */}
        <Section title="Parent & Guardian Information">
          {student.guardians.length === 0 ? (
            <Empty>No guardian records linked.</Empty>
          ) : (
            <ul className="divide-y divide-slate-800">
              {student.guardians.map((g) => (
                <li key={g.id} className="flex items-center justify-between py-2 text-sm">
                  <span>
                    <span className="font-medium text-white">{g.guardian.name}</span> · {g.relationship}
                    {g.isPrimary && <Badge color="green"> Primary</Badge>}
                  </span>
                  <span className="text-xs font-medium text-slate-400">{g.guardian.phone || "—"}</span>
                </li>
              ))}
            </ul>
          )}
        </Section>

        {/* Published Examination Results */}
        <div className="lg:col-span-2">
          <Section title="Published Academic Examination Results">
            {student.results.length === 0 ? (
              <Empty>No exam marks published yet for this term.</Empty>
            ) : (
              <ul className="divide-y divide-slate-800">
                {student.results.map((r) => (
                  <li key={r.id} className="flex items-center justify-between py-2.5 text-sm">
                    <div>
                      <span className="font-semibold text-white">{r.examSubject.offering.subject.name}</span>
                      <span className="ml-2 text-xs text-slate-400">({r.examSubject.exam.name})</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white">
                        {r.marks}/{r.examSubject.maxMarks}
                      </span>
                      <Badge color={Number(r.marks) >= 35 ? "blue" : "red"}>
                        {Math.round((Number(r.marks) / Number(r.examSubject.maxMarks)) * 100)}%
                      </Badge>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Section>
        </div>
      </div>

      {student.notes.length > 0 && (
        <Section title="Teacher & Academic Notes">
          <ul className="divide-y divide-slate-800">
            {student.notes.map((n) => {
              if (n.confidential && !canConfidential) {
                return null;
              }
              return (
                <li key={n.id} className="py-2.5 text-sm">
                  <Badge color="slate">{n.category}</Badge>
                  <span className="ml-2 text-slate-300">{n.body}</span>
                </li>
              );
            })}
          </ul>
        </Section>
      )}
    </div>
  );
}
