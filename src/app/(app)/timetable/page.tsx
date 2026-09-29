import { getAuthContext } from "@/lib/auth/context";
import { assertCan } from "@/lib/permissions/engine";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/ui";
import {
  InteractiveTimetableClient,
  type TimetablePeriodItem,
  type TimetableEntryItem,
} from "@/components/timetable/InteractiveTimetableClient";

export default async function TimetablePage() {
  const ctx = (await getAuthContext())!;
  assertCan(ctx, "academics", "timetable", "view");

  let periodsData: TimetablePeriodItem[] = [];
  let entriesData: TimetableEntryItem[] = [];
  let sectionsData: { id: string; name: string; gradeName: string }[] = [];

  try {
    let sectionIds: string[] = [
      ...new Set([...ctx.assignedSectionIds, ...ctx.classTeacherSectionIds, ...ctx.studentSectionIds]),
    ];
    if (ctx.guardianId) {
      const enr = await db.enrollment.findMany({
        where: { studentId: { in: ctx.childStudentIds }, status: "ACTIVE" },
        select: { sectionId: true },
      });
      sectionIds = [...new Set([...sectionIds, ...enr.map((e) => e.sectionId)])];
    }
    if (sectionIds.length === 0) {
      const secs = await db.section.findMany({
        where: { academicYear: { schoolId: ctx.schoolId, isCurrent: true } },
        select: { id: true },
      });
      sectionIds = secs.map((s) => s.id);
    }

    const [periods, entries, sections] = await Promise.all([
      db.timetablePeriod.findMany({
        where: { schoolId: ctx.schoolId },
        orderBy: { sequence: "asc" },
      }),
      db.timetableEntry.findMany({
        where: { sectionId: { in: sectionIds } },
        include: {
          offering: {
            include: {
              subject: true,
              section: { include: { grade: true } },
              teacherAssignments: { include: { teacher: true } },
            },
          },
          room: true,
          period: true,
        },
      }),
      db.section.findMany({
        where: { id: { in: sectionIds } },
        include: { grade: true },
      }),
    ]);

    periodsData = periods.map((p) => ({
      id: p.id,
      name: p.name,
      sequence: p.sequence,
      startTime: p.startTime,
      endTime: p.endTime,
    }));

    entriesData = entries.map((e) => {
      const teacher = e.offering.teacherAssignments[0]?.teacher;
      return {
        id: e.id,
        periodId: e.periodId,
        dayOfWeek: e.dayOfWeek,
        subjectName: e.offering.subject.name,
        sectionName: e.offering.section.name,
        gradeName: e.offering.section.grade.name,
        roomName: e.room?.name,
        teacherName: teacher ? `${teacher.firstName} ${teacher.lastName}` : undefined,
      };
    });

    sectionsData = sections.map((s) => ({
      id: s.id,
      name: s.name,
      gradeName: s.grade.name,
    }));
  } catch (err) {
    // Offline demo fallback
    periodsData = [
      { id: "p1", name: "Period 1", sequence: 1, startTime: "08:30", endTime: "09:20" },
      { id: "p2", name: "Period 2", sequence: 2, startTime: "09:25", endTime: "10:15" },
      { id: "p3", name: "Period 3", sequence: 3, startTime: "10:30", endTime: "11:20" },
      { id: "p4", name: "Period 4", sequence: 4, startTime: "11:25", endTime: "12:15" },
      { id: "p5", name: "Period 5", sequence: 5, startTime: "13:00", endTime: "13:50" },
      { id: "p6", name: "Period 6", sequence: 6, startTime: "13:55", endTime: "14:45" },
    ];

    entriesData = [
      { id: "e1", periodId: "p1", dayOfWeek: 1, subjectName: "Physics", sectionName: "A", gradeName: "Class 8", roomName: "Lab 2", teacherName: "Dr. Vikram Seth" },
      { id: "e2", periodId: "p2", dayOfWeek: 1, subjectName: "Mathematics", sectionName: "A", gradeName: "Class 8", roomName: "201", teacherName: "Pooja Raman" },
      { id: "e3", periodId: "p3", dayOfWeek: 1, subjectName: "English Literature", sectionName: "A", gradeName: "Class 8", roomName: "201", teacherName: "Arundhati Roy" },
      { id: "e4", periodId: "p4", dayOfWeek: 1, subjectName: "Chemistry", sectionName: "A", gradeName: "Class 8", roomName: "Lab 1", teacherName: "Dr. H. Bhabha" },
      { id: "e5", periodId: "p1", dayOfWeek: 2, subjectName: "Mathematics", sectionName: "A", gradeName: "Class 8", roomName: "201", teacherName: "Pooja Raman" },
      { id: "e6", periodId: "p2", dayOfWeek: 2, subjectName: "Physics", sectionName: "A", gradeName: "Class 8", roomName: "Lab 2", teacherName: "Dr. Vikram Seth" },
      { id: "e7", periodId: "p3", dayOfWeek: 2, subjectName: "History & Civics", sectionName: "A", gradeName: "Class 8", roomName: "104", teacherName: "R. Sharma" },
      { id: "e8", periodId: "p1", dayOfWeek: 3, subjectName: "Computer Science", sectionName: "A", gradeName: "Class 8", roomName: "Comp Lab", teacherName: "S. Murthy" },
      { id: "e9", periodId: "p2", dayOfWeek: 3, subjectName: "Mathematics", sectionName: "A", gradeName: "Class 8", roomName: "201", teacherName: "Pooja Raman" },
      { id: "e10", periodId: "p1", dayOfWeek: 4, subjectName: "Biology", sectionName: "A", gradeName: "Class 8", roomName: "Bio Lab", teacherName: "Dr. K. Swaminathan" },
      { id: "e11", periodId: "p1", dayOfWeek: 5, subjectName: "Physical Education", sectionName: "A", gradeName: "Class 8", roomName: "Ground", teacherName: "Coach M. Singh" },
    ];

    sectionsData = [
      { id: "sec-8a", name: "A", gradeName: "Class 8" },
      { id: "sec-8b", name: "B", gradeName: "Class 8" },
    ];
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Weekly Academic Timetable"
        subtitle="Live schedules, classroom allocations, and period timings"
      />

      <InteractiveTimetableClient
        periods={periodsData}
        entries={entriesData}
        sections={sectionsData}
      />
    </div>
  );
}
