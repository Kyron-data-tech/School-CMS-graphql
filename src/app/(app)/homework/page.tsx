import { getAuthContext } from "@/lib/auth/context";
import { assertCan, hasSchoolWide, can } from "@/lib/permissions/engine";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/ui";
import {
  InteractiveHomeworkClient,
  type HomeworkCardItem,
  type SubjectOfferingOption,
  type HomeworkSubmissionItem,
} from "@/components/homework/InteractiveHomeworkClient";

export default async function HomeworkPage() {
  const ctx = (await getAuthContext())!;
  assertCan(ctx, "homework", "assignment", "view");

  const schoolWide = hasSchoolWide(ctx, "homework", "assignment", "view");

  let homeworkCards: HomeworkCardItem[] = [];
  let offeringOptions: SubjectOfferingOption[] = [];

  try {
    // Resolve which offerings' homework the user may see.
    let offeringIds: string[] | "ALL" = "ALL";
    if (!schoolWide) {
      if (ctx.assignedOfferingIds.length) {
        offeringIds = ctx.assignedOfferingIds;
      } else {
        const studentIds = ctx.studentId ? [ctx.studentId] : ctx.childStudentIds;
        const enr = await db.enrollment.findMany({
          where: { studentId: { in: studentIds }, status: "ACTIVE" },
          select: { sectionId: true },
        });
        const secIds = [...new Set(enr.map((e) => e.sectionId))];
        const offs = await db.subjectOffering.findMany({
          where: { sectionId: { in: secIds } },
          select: { id: true },
        });
        offeringIds = offs.map((o) => o.id);
      }
    }

    const [homework, allOfferings] = await Promise.all([
      db.homework.findMany({
        where: offeringIds === "ALL" ? {} : { offeringId: { in: offeringIds } },
        include: {
          offering: { include: { subject: true, section: { include: { grade: true } } } },
          teacher: true,
          submissions: {
            include: {
              student: true,
            },
          },
        },
        orderBy: { dueAt: "asc" },
      }),
      db.subjectOffering.findMany({
        include: {
          subject: true,
          section: { include: { grade: true } },
        },
        orderBy: [{ section: { grade: { level: "asc" } } }, { subject: { name: "asc" } }],
      }),
    ]);

    homeworkCards = homework.map((h) => ({
      id: h.id,
      title: h.title,
      description: h.description,
      dueAt: h.dueAt.toISOString(),
      publishAt: h.publishAt.toISOString(),
      maxMarks: h.maxMarks,
      offeringId: h.offeringId,
      subjectName: h.offering.subject.name,
      gradeName: h.offering.section.grade.name,
      sectionName: h.offering.section.name,
      teacherName: `${h.teacher.firstName} ${h.teacher.lastName}`,
      submissions: h.submissions.map((s): HomeworkSubmissionItem => ({
        id: s.id,
        studentId: s.studentId,
        studentName: `${s.student.firstName} ${s.student.lastName}`,
        status: s.status as any,
        submittedAt: s.submittedAt?.toISOString(),
        marks: s.marks,
        comment: s.comment,
        fileUrl: s.fileUrl,
        feedback: s.feedback,
      })),
    }));

    offeringOptions = allOfferings.map((o) => ({
      id: o.id,
      subjectName: o.subject.name,
      sectionName: o.section.name,
      gradeName: o.section.grade.name,
    }));
  } catch (err) {
    // Offline demo fallback
    homeworkCards = [
      {
        id: "hw-1",
        title: "Thermodynamics & Heat Transfer Problem Set",
        description: "Complete problems 1 through 15 from Chapter 4. Include clear derivations for adiabatic expansions and enthalpy changes.",
        dueAt: new Date(Date.now() + 86400000 * 3).toISOString(),
        publishAt: new Date().toISOString(),
        maxMarks: 25,
        offeringId: "off-1",
        subjectName: "Physics",
        gradeName: "Class 8",
        sectionName: "A",
        teacherName: "Dr. Vikram Seth",
        submissions: [
          {
            id: "sub-1",
            studentId: "s1",
            studentName: "Arjun Mehta",
            status: "SUBMITTED",
            submittedAt: new Date().toISOString(),
            comment: "Completed all 15 questions with derivations attached.",
          },
        ],
      },
      {
        id: "hw-2",
        title: "Quadratic Equation Applications",
        description: "Solve the 8 word problems covering projectile trajectories and profit maximization models.",
        dueAt: new Date(Date.now() + 86400000 * 5).toISOString(),
        publishAt: new Date().toISOString(),
        maxMarks: 20,
        offeringId: "off-2",
        subjectName: "Mathematics",
        gradeName: "Class 8",
        sectionName: "A",
        teacherName: "Pooja Raman",
        submissions: [],
      },
      {
        id: "hw-3",
        title: "Shakespeare's Julius Caesar Character Analysis",
        description: "500-word essay comparing the rhetoric of Brutus vs. Mark Antony in Act 3 Scene 2.",
        dueAt: new Date(Date.now() - 86400000).toISOString(),
        publishAt: new Date().toISOString(),
        maxMarks: 30,
        offeringId: "off-3",
        subjectName: "English Literature",
        gradeName: "Class 8",
        sectionName: "B",
        teacherName: "Arundhati Roy",
        submissions: [
          {
            id: "sub-2",
            studentId: "s2",
            studentName: "Sara Kapoor",
            status: "REVIEWED",
            submittedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
            marks: 28,
            comment: "Attached my rhetorical analysis essay.",
            feedback: "Exceptional analysis of irony in Antony's speech.",
          },
        ],
      },
    ];

    offeringOptions = [
      { id: "off-1", subjectName: "Physics", sectionName: "A", gradeName: "Class 8" },
      { id: "off-2", subjectName: "Mathematics", sectionName: "A", gradeName: "Class 8" },
      { id: "off-3", subjectName: "English Literature", sectionName: "B", gradeName: "Class 8" },
      { id: "off-4", subjectName: "Chemistry", sectionName: "A", gradeName: "Class 9" },
    ];
  }

  const canCreate = can(ctx, "homework", "assignment", "create");
  const canSubmit = Boolean(ctx.studentId || ctx.guardianId);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Homework & Assignments Hub"
        subtitle="Manage academic coursework, student submissions, and evaluations powered by GraphQL"
      />

      <InteractiveHomeworkClient
        homeworkList={homeworkCards}
        offerings={offeringOptions}
        canCreate={canCreate}
        canSubmit={canSubmit}
        currentStudentId={ctx.studentId ?? undefined}
        currentRole={ctx.roleKeys[0] || "student"}
      />
    </div>
  );
}
