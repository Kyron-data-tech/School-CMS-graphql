import { getAuthContext } from "@/lib/auth/context";
import { PageHeader } from "@/components/ui";
import { InteractiveNotesClient } from "@/components/notes/InteractiveNotesClient";

export default async function NotesPage() {
  const ctx = (await getAuthContext())!;

  // Teachers and Admin can create notes; students can view and download
  const canCreate = Boolean(ctx.teacherId || ctx.roleKeys.includes("ADMIN") || ctx.roleKeys.includes("HEADMASTER"));
  const primaryRole = ctx.roleKeys[0] || "STUDENT";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Subject Notes & Study Resources"
        subtitle="Chapter summaries, formula sheets, and study materials published by teachers"
      />
      <InteractiveNotesClient
        canCreate={canCreate}
        userRole={primaryRole}
      />
    </div>
  );
}
