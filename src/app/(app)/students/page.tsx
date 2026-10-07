import { redirect } from "next/navigation";
import { getAuthContext } from "@/lib/auth/context";
import { assertCan, can } from "@/lib/permissions/engine";
import { listAccessibleStudents } from "@/lib/queries/students";
import { PageHeader } from "@/components/ui";
import { StudentDirectoryClient } from "@/components/students/StudentDirectoryClient";
import { db } from "@/lib/db";

export default async function StudentsPage({ searchParams }: { searchParams: Promise<{ q?: string; page?: string }> }) {
  const ctx = (await getAuthContext())!;
  // Server-side gate — never rely on the hidden nav item.
  assertCan(ctx, "students", "personal_info", "view");

  const isStudent = ctx.roleKeys.includes("student") || Boolean(ctx.studentId);
  const isParent = ctx.roleKeys.includes("parent") || Boolean(ctx.guardianId);

  // If logged in as student, directly open their personal student profile
  if (isStudent && ctx.studentId) {
    redirect(`/students/${ctx.studentId}`);
  }

  // If parent has exactly one child, directly open that child's profile
  if (isParent && ctx.childStudentIds.length === 1) {
    redirect(`/students/${ctx.childStudentIds[0]}`);
  }

  const sp = await searchParams;
  const { rows, total } = await listAccessibleStudents(ctx, {
    search: sp.q,
    pageSize: 100,
  });

  // Fallback for student if studentId was not in session context
  if (isStudent && rows.length > 0) {
    redirect(`/students/${rows[0].id}`);
  }

  const sections = await db.section.findMany({
    where: { academicYear: { schoolId: ctx.schoolId, isCurrent: true } },
    include: { grade: true },
    orderBy: [{ grade: { level: "asc" } }, { name: "asc" }],
  });

  const canCreate = can(ctx, "students", "personal_info", "create");

  return (
    <div className="space-y-4">
      <PageHeader
        title="Students Directory"
        subtitle={`${total} student${total === 1 ? "" : "s"} enrolled · Filter, search, switch views, or export roster`}
      />

      <StudentDirectoryClient
        students={rows}
        sections={sections}
        canCreate={canCreate}
        currentRole={ctx.roleKeys[0] || "student"}
        userName={ctx.name}
      />
    </div>
  );
}
