import { getAuthContext } from "@/lib/auth/context";
import { hasSchoolWide } from "@/lib/permissions/engine";
import { HeadmasterDashboard } from "@/components/dashboards/HeadmasterDashboard";
import { TeacherDashboard } from "@/components/dashboards/TeacherDashboard";
import { StudentDashboard } from "@/components/dashboards/StudentDashboard";


export default async function DashboardPage() {
  const ctx = (await getAuthContext())!;

  // Dashboard composition is capability-driven, not role-string driven.
  const schoolWide = hasSchoolWide(ctx, "students", "personal_info", "view");

  return (
    <div className="space-y-6 font-sans">
      {schoolWide ? (
        <HeadmasterDashboard ctx={ctx} />
      ) : ctx.teacherId ? (
        <TeacherDashboard ctx={ctx} />
      ) : ctx.studentId ? (
        <StudentDashboard ctx={ctx} />
      ) : (
        <div className="card p-8 text-center text-slate-500">
          No dashboard configured for this account scope.
        </div>
      )}
    </div>
  );
}
