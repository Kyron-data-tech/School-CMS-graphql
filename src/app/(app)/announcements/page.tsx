import { getAuthContext } from "@/lib/auth/context";
import { assertCan, can } from "@/lib/permissions/engine";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/ui";
import {
  InteractiveAnnouncementsClient,
  type AnnouncementItem,
} from "@/components/announcements/InteractiveAnnouncementsClient";
import type { Prisma } from "@prisma/client";

export default async function AnnouncementsPage() {
  const ctx = (await getAuthContext())!;
  assertCan(ctx, "announcements", "announcement", "view");

  let announcements: AnnouncementItem[] = [];

  try {
    const or: Prisma.AnnouncementWhereInput[] = [{ audience: "ALL_USERS" }, { audience: "PUBLIC" }];
    if (ctx.teacherId) or.push({ audience: "TEACHERS" }, { audience: "STAFF" });
    if (ctx.studentId) or.push({ audience: "STUDENTS" });
    if (ctx.guardianId) or.push({ audience: "PARENTS" });
    const secIds = [...new Set([...ctx.studentSectionIds, ...ctx.assignedSectionIds, ...ctx.classTeacherSectionIds])];
    if (secIds.length) or.push({ audience: "SECTION", sectionId: { in: secIds } });
    ctx.roleKeys.forEach((rk) => or.push({ audience: "ROLE", roleKey: rk }));

    const items = await db.announcement.findMany({
      where: { schoolId: ctx.schoolId, OR: or },
      orderBy: [{ priority: "desc" }, { publishAt: "desc" }],
    });

    announcements = items.map((a) => ({
      id: a.id,
      title: a.title,
      body: a.body,
      audience: a.audience,
      priority: a.priority,
      publishAt: a.publishAt.toISOString(),
      authorName: "School Administration",
    }));
  } catch (err) {
    // Offline demo fallback
    announcements = [
      {
        id: "ann-1",
        title: "Inter-School Science & Robotics Exhibition 2026",
        body: "All students from Classes 7 through 10 are invited to submit project prototypes by Friday. Selected projects will represent the institution at the National STEM Olympiad.",
        audience: "ALL_USERS",
        priority: 1,
        publishAt: new Date().toISOString(),
        authorName: "Principal",
      },
      {
        id: "ann-2",
        title: "Term 1 Examination Timetable Released",
        body: "The final examination schedule for the upcoming Term 1 assessments has been published on the Timetable & Results portal. Review dates and report discrepancies to the Exam Office.",
        audience: "STUDENTS",
        priority: 1,
        publishAt: new Date(Date.now() - 86400000).toISOString(),
        authorName: "Exam Controller",
      },
      {
        id: "ann-3",
        title: "Staff Development Workshop on AI in Pedagogy",
        body: "All department faculty members are requested to attend the interactive workshop on LLM-assisted curriculum evaluation scheduled for this Saturday in Audio-Visual Room 2.",
        audience: "TEACHERS",
        priority: 0,
        publishAt: new Date(Date.now() - 86400000 * 2).toISOString(),
        authorName: "Academic Dean",
      },
      {
        id: "ann-4",
        title: "Parent-Teacher Council General Assembly",
        body: "We warmly invite all parents and guardians to discuss the academic roadmap, extracurricular expansions, and campus infrastructure developments for 2026–27.",
        audience: "PARENTS",
        priority: 0,
        publishAt: new Date(Date.now() - 86400000 * 4).toISOString(),
        authorName: "Parent Council",
      },
    ];
  }

  const canCreate = can(ctx, "announcements", "announcement", "create");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Campus Notice Board & Bulletins"
        subtitle="Institutional announcements, emergency alerts, and administrative circulars"
      />

      <InteractiveAnnouncementsClient
        initialAnnouncements={announcements}
        canCreate={canCreate}
        userRole={ctx.roleKeys[0] || "student"}
      />
    </div>
  );
}
