import { db } from "@/lib/db";
import type { Gender, AttendanceStatus, ResultStatus, SubmissionStatus, Audience } from "@prisma/client";
import { resetUserPassword } from "@/lib/auth/passwordReset";
import {
  generateStudentRemarks,
  generateQuiz,
  generateNotice,
  answerSchoolQuery,
  testModelConnection,
  MODEL_CATALOG,
} from "@/lib/ai/copilot";

export const resolvers = {
  Student: {
    fullName: (parent: { firstName: string; lastName: string }) => {
      return `${parent.firstName} ${parent.lastName}`.trim();
    },
    gender: (parent: { gender: Gender }) => {
      return parent.gender || "UNSPECIFIED";
    },
    dateOfBirth: (parent: { dateOfBirth: Date | null }) => {
      return parent.dateOfBirth ? new Date(parent.dateOfBirth).toISOString() : null;
    },
    admissionDate: (parent: { admissionDate: Date | null }) => {
      return parent.admissionDate ? new Date(parent.admissionDate).toISOString() : null;
    },
    createdAt: (parent: { createdAt: Date }) => {
      return parent.createdAt ? new Date(parent.createdAt).toISOString() : new Date().toISOString();
    },
    currentClass: (parent: any) => {
      const active = parent.enrollments?.[0];
      if (!active?.section) return null;
      const gradeName = active.section.grade?.name ?? "";
      return `${gradeName}-${active.section.name}`.trim();
    },
    guardians: (parent: any) => {
      if (!parent.guardians || !Array.isArray(parent.guardians)) return [];
      return parent.guardians.map((g: any) => ({
        id: g.guardian?.id ?? g.id,
        name: g.guardian?.name ?? "Guardian",
        relationship: g.relationship ?? "Guardian",
        phone: g.guardian?.phone ?? null,
        email: g.guardian?.email ?? null,
      }));
    },
    attendanceSummary: async (parent: { id: string }) => {
      const records = await db.studentAttendance.findMany({
        where: { studentId: parent.id },
      });
      const totalDays = records.length;
      const presentDays = records.filter(
        (r) => r.status === "PRESENT" || r.status === "LATE"
      ).length;
      const percentage = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 100;
      return {
        totalDays,
        presentDays,
        percentage,
      };
    },
  },

  Teacher: {
    fullName: (parent: { firstName: string; lastName: string }) => {
      return `${parent.firstName} ${parent.lastName}`.trim();
    },
    userEmail: async (parent: { userId: string }) => {
      const user = await db.user.findUnique({ where: { id: parent.userId } });
      return user?.email ?? null;
    },
    assignments: async (parent: { id: string }) => {
      return db.teacherAssignment.findMany({
        where: { teacherId: parent.id },
        include: {
          offering: {
            include: { subject: true, section: { include: { grade: true } } },
          },
        },
      });
    },
    classTeacherOf: async (parent: { id: string }) => {
      return db.classTeacherAssignment.findMany({
        where: { teacherId: parent.id },
        include: { section: { include: { grade: true } } },
      });
    },
  },

  Enrollment: {
    startDate: (parent: { startDate: Date }) => {
      return parent.startDate ? new Date(parent.startDate).toISOString() : new Date().toISOString();
    },
    endDate: (parent: { endDate?: Date | null }) => {
      return parent.endDate ? new Date(parent.endDate).toISOString() : null;
    },
  },

  Homework: {
    dueAt: (parent: { dueAt: Date }) => new Date(parent.dueAt).toISOString(),
    publishAt: (parent: { publishAt: Date }) => new Date(parent.publishAt).toISOString(),
  },

  HomeworkSubmission: {
    submittedAt: (parent: { submittedAt?: Date | null }) =>
      parent.submittedAt ? new Date(parent.submittedAt).toISOString() : null,
  },

  StudentAttendance: {
    date: (parent: { date: Date }) => new Date(parent.date).toISOString(),
  },

  Announcement: {
    publishAt: (parent: { publishAt: Date }) => new Date(parent.publishAt).toISOString(),
  },

  AuditLog: {
    createdAt: (parent: { createdAt: Date }) => new Date(parent.createdAt).toISOString(),
  },

  Query: {
    // School & Organization
    school: async () => {
      return db.school.findFirst({
        include: {
          academicYears: { orderBy: { startDate: "desc" } },
          grades: { orderBy: { level: "asc" } },
          subjects: true,
        },
      });
    },

    academicYears: async () => {
      return db.academicYear.findMany({ orderBy: { startDate: "desc" } });
    },

    grades: async () => {
      return db.grade.findMany({
        orderBy: { level: "asc" },
        include: { sections: true },
      });
    },

    sections: async (_: unknown, args: { gradeId?: string; academicYearId?: string }) => {
      const where: any = {};
      if (args.gradeId) where.gradeId = args.gradeId;
      if (args.academicYearId) where.academicYearId = args.academicYearId;
      return db.section.findMany({
        where,
        include: { grade: true, academicYear: true },
        orderBy: { name: "asc" },
      });
    },

    subjects: async () => {
      return db.subject.findMany({ orderBy: { name: "asc" } });
    },

    subjectOfferings: async (_: unknown, args: { sectionId?: string }) => {
      const where: any = {};
      if (args.sectionId) where.sectionId = args.sectionId;
      return db.subjectOffering.findMany({
        where,
        include: { subject: true, section: { include: { grade: true } } },
      });
    },

    // Students
    students: async (
      _: unknown,
      args: { search?: string; limit?: number; offset?: number; includeArchived?: boolean },
    ) => {
      const where: any = {};
      if (!args.includeArchived) where.archived = false;
      if (args.search && args.search.trim() !== "") {
        const query = args.search.trim();
        where.OR = [
          { firstName: { contains: query } },
          { lastName: { contains: query } },
          { admissionNo: { contains: query } },
        ];
      }

      return db.student.findMany({
        where,
        include: {
          enrollments: {
            where: { status: "ACTIVE" },
            include: { section: { include: { grade: true } } },
            take: 1,
          },
          guardians: { include: { guardian: true } },
        },
        orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
        skip: args.offset ?? 0,
        take: args.limit ?? 50,
      });
    },

    student: async (_: unknown, { id }: { id: string }) => {
      return db.student.findUnique({
        where: { id },
        include: {
          enrollments: { include: { section: { include: { grade: true } } } },
          guardians: { include: { guardian: true } },
        },
      });
    },

    totalStudents: async (
      _: unknown,
      args: { search?: string; includeArchived?: boolean },
    ) => {
      const where: any = {};
      if (!args.includeArchived) where.archived = false;
      if (args.search && args.search.trim() !== "") {
        const query = args.search.trim();
        where.OR = [
          { firstName: { contains: query } },
          { lastName: { contains: query } },
          { admissionNo: { contains: query } },
        ];
      }
      return db.student.count({ where });
    },

    // Faculty
    teachers: async (_: unknown, args: { isActive?: boolean }) => {
      const where: any = {};
      if (args.isActive !== undefined) where.isActive = args.isActive;
      return db.teacher.findMany({
        where,
        include: { department: true },
        orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
      });
    },

    teacher: async (_: unknown, { id }: { id: string }) => {
      return db.teacher.findUnique({
        where: { id },
        include: { department: true },
      });
    },

    totalTeachers: async () => {
      return db.teacher.count({ where: { isActive: true } });
    },

    // Attendance
    studentAttendance: async (
      _: unknown,
      args: { sectionId?: string; date?: string; studentId?: string },
    ) => {
      const where: any = {};
      if (args.sectionId) where.sectionId = args.sectionId;
      if (args.studentId) where.studentId = args.studentId;
      if (args.date) {
        const d = new Date(args.date);
        const start = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0));
        const end = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 23, 59, 59));
        where.date = { gte: start, lte: end };
      }
      return db.studentAttendance.findMany({
        where,
        include: { student: true },
        orderBy: { date: "desc" },
      });
    },

    // Homework
    homeworks: async (_: unknown, args: { offeringId?: string; sectionId?: string }) => {
      const where: any = {};
      if (args.offeringId) where.offeringId = args.offeringId;
      if (args.sectionId) where.offering = { sectionId: args.sectionId };
      return db.homework.findMany({
        where,
        include: {
          offering: { include: { subject: true, section: { include: { grade: true } } } },
          submissions: { include: { student: true } },
        },
        orderBy: { dueAt: "desc" },
      });
    },

    homework: async (_: unknown, { id }: { id: string }) => {
      return db.homework.findUnique({
        where: { id },
        include: {
          offering: { include: { subject: true, section: { include: { grade: true } } } },
          submissions: { include: { student: true } },
        },
      });
    },

    // Exams & Results
    exams: async (_: unknown, args: { academicYearId?: string }) => {
      const where: any = {};
      if (args.academicYearId) where.academicYearId = args.academicYearId;
      return db.exam.findMany({
        where,
        include: {
          examSubjects: {
            include: {
              offering: { include: { subject: true, section: { include: { grade: true } } } },
              results: { include: { student: true } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });
    },

    results: async (_: unknown, args: { examSubjectId?: string; studentId?: string }) => {
      const where: any = {};
      if (args.examSubjectId) where.examSubjectId = args.examSubjectId;
      if (args.studentId) where.studentId = args.studentId;
      return db.assessmentResult.findMany({
        where,
        include: {
          student: true,
          examSubject: {
            include: { exam: true, offering: { include: { subject: true } } },
          },
        },
        orderBy: { student: { lastName: "asc" } },
      });
    },

    // Timetable
    timetable: async (_: unknown, args: { sectionId?: string; dayOfWeek?: number }) => {
      const where: any = {};
      if (args.sectionId) where.sectionId = args.sectionId;
      if (args.dayOfWeek !== undefined) where.dayOfWeek = args.dayOfWeek;
      return db.timetableEntry.findMany({
        where,
        include: {
          period: true,
          room: true,
          section: { include: { grade: true } },
          offering: { include: { subject: true } },
        },
        orderBy: [{ dayOfWeek: "asc" }, { period: { sequence: "asc" } }],
      });
    },

    // Announcements
    announcements: async (_: unknown, args: { audience?: Audience; limit?: number }) => {
      const where: any = {};
      if (args.audience) where.audience = args.audience;
      return db.announcement.findMany({
        where,
        orderBy: { publishAt: "desc" },
        take: args.limit ?? 20,
      });
    },

    // Audit logs
    auditLogs: async (_: unknown, args: { limit?: number }) => {
      return db.auditLog.findMany({
        orderBy: { createdAt: "desc" },
        take: args.limit ?? 50,
      });
    },

    // AI diagnostic ping
    aiTestConnection: async (
      _: unknown,
      args: { provider?: string; modelName?: string; baseUrl?: string; apiKey?: string }
    ) => {
      return testModelConnection({
        provider: (args.provider as any) || "builtin",
        modelName: args.modelName,
        baseUrl: args.baseUrl,
        apiKey: args.apiKey,
      });
    },

    aiSupportedModels: async () => {
      return Object.values(MODEL_CATALOG);
    },
  },

  Mutation: {
    // Student Mutations
    createStudent: async (
      _: unknown,
      {
        input,
      }: {
        input: {
          firstName: string;
          lastName: string;
          admissionNo: string;
          studentCode?: string;
          gender?: Gender;
          dateOfBirth?: string;
          admissionDate?: string;
          sectionId?: string;
          rollNumber?: number;
        };
      },
    ) => {
      const school = await db.school.findFirst();
      if (!school) throw new Error("No school found in database.");

      const existing = await db.student.findUnique({
        where: { schoolId_admissionNo: { schoolId: school.id, admissionNo: input.admissionNo } },
      });
      if (existing) {
        throw new Error(`Student with admission number "${input.admissionNo}" already exists.`);
      }

      const student = await db.student.create({
        data: {
          schoolId: school.id,
          admissionNo: input.admissionNo,
          studentCode: input.studentCode || input.admissionNo,
          firstName: input.firstName,
          lastName: input.lastName,
          gender: input.gender || "UNSPECIFIED",
          dateOfBirth: input.dateOfBirth ? new Date(input.dateOfBirth) : null,
          admissionDate: input.admissionDate ? new Date(input.admissionDate) : new Date(),
        },
      });

      if (input.sectionId) {
        const academicYear = await db.academicYear.findFirst({
          where: { schoolId: school.id, isCurrent: true },
        });
        if (academicYear) {
          await db.enrollment.create({
            data: {
              studentId: student.id,
              sectionId: input.sectionId,
              academicYearId: academicYear.id,
              rollNumber: input.rollNumber ?? null,
              startDate: new Date(),
              status: "ACTIVE",
            },
          });
        }
      }

      return db.student.findUnique({
        where: { id: student.id },
        include: {
          enrollments: { include: { section: { include: { grade: true } } } },
          guardians: { include: { guardian: true } },
        },
      });
    },

    updateStudent: async (
      _: unknown,
      {
        id,
        input,
      }: {
        id: string;
        input: {
          firstName?: string;
          lastName?: string;
          gender?: Gender;
          dateOfBirth?: string;
          archived?: boolean;
        };
      },
    ) => {
      const updateData: any = {};
      if (input.firstName !== undefined) updateData.firstName = input.firstName;
      if (input.lastName !== undefined) updateData.lastName = input.lastName;
      if (input.gender !== undefined) updateData.gender = input.gender;
      if (input.dateOfBirth !== undefined) {
        updateData.dateOfBirth = input.dateOfBirth ? new Date(input.dateOfBirth) : null;
      }
      if (input.archived !== undefined) updateData.archived = input.archived;

      await db.student.update({ where: { id }, data: updateData });

      return db.student.findUnique({
        where: { id },
        include: {
          enrollments: { include: { section: { include: { grade: true } } } },
          guardians: { include: { guardian: true } },
        },
      });
    },

    deleteStudent: async (
      _: unknown,
      { id, permanent }: { id: string; permanent?: boolean },
    ) => {
      if (permanent) {
        await db.enrollment.deleteMany({ where: { studentId: id } });
        await db.studentGuardian.deleteMany({ where: { studentId: id } });
        await db.student.delete({ where: { id } });
      } else {
        await db.student.update({ where: { id }, data: { archived: true } });
      }
      return true;
    },

    // Faculty Mutations
    createTeacher: async (
      _: unknown,
      { input }: { input: { firstName: string; lastName: string; employeeId: string; designation?: string; phone?: string; email: string } }
    ) => {
      const school = await db.school.findFirst();
      if (!school) throw new Error("No school found.");

      const user = await db.user.create({
        data: {
          schoolId: school.id,
          name: `${input.firstName} ${input.lastName}`,
          email: input.email,
          passwordHash: "$argon2id$v=19$m=65536,t=3,p=4$dummyhash",
        },
      });

      return db.teacher.create({
        data: {
          schoolId: school.id,
          userId: user.id,
          employeeId: input.employeeId,
          firstName: input.firstName,
          lastName: input.lastName,
          designation: input.designation || "Teacher",
          phone: input.phone,
        },
      });
    },

    // Attendance Mutations
    markAttendance: async (
      _: unknown,
      { input }: { input: { studentId: string; sectionId: string; date: string; status: AttendanceStatus; note?: string } }
    ) => {
      const adminUser = await db.user.findFirst();
      const markedById = adminUser ? adminUser.id : "system";
      const recordDate = new Date(input.date);

      return db.studentAttendance.upsert({
        where: {
          studentId_date_offeringId: {
            studentId: input.studentId,
            date: recordDate,
            offeringId: "",
          },
        },
        create: {
          studentId: input.studentId,
          sectionId: input.sectionId,
          date: recordDate,
          status: input.status,
          note: input.note,
          markedById,
        },
        update: {
          status: input.status,
          note: input.note,
          markedById,
        },
        include: { student: true },
      });
    },

    markBulkAttendance: async (
      _: unknown,
      { input }: { input: { sectionId: string; date: string; records: Array<{ studentId: string; status: AttendanceStatus; note?: string }> } }
    ) => {
      const adminUser = await db.user.findFirst();
      const markedById = adminUser ? adminUser.id : "system";
      const recordDate = new Date(input.date);

      for (const rec of input.records) {
        await db.studentAttendance.upsert({
          where: {
            studentId_date_offeringId: {
              studentId: rec.studentId,
              date: recordDate,
              offeringId: "",
            },
          },
          create: {
            studentId: rec.studentId,
            sectionId: input.sectionId,
            date: recordDate,
            status: rec.status,
            note: rec.note,
            markedById,
          },
          update: {
            status: rec.status,
            note: rec.note,
            markedById,
          },
        });
      }

      return input.records.length;
    },

    // Homework Mutations
    createHomework: async (
      _: unknown,
      { input }: { input: { offeringId: string; title: string; description?: string; maxMarks?: number; dueAt: string } }
    ) => {
      const teacher = await db.teacher.findFirst();
      if (!teacher) throw new Error("No teacher profile available.");

      return db.homework.create({
        data: {
          offeringId: input.offeringId,
          teacherId: teacher.id,
          title: input.title,
          description: input.description,
          maxMarks: input.maxMarks || 10,
          dueAt: new Date(input.dueAt),
          publishAt: new Date(),
        },
        include: { offering: { include: { subject: true, section: { include: { grade: true } } } } },
      });
    },

    submitHomework: async (
      _: unknown,
      { input }: { input: { homeworkId: string; studentId: string; comment?: string; fileUrl?: string } }
    ) => {
      return db.homeworkSubmission.upsert({
        where: {
          homeworkId_studentId: {
            homeworkId: input.homeworkId,
            studentId: input.studentId,
          },
        },
        create: {
          homeworkId: input.homeworkId,
          studentId: input.studentId,
          comment: input.comment,
          fileUrl: input.fileUrl,
          status: "SUBMITTED",
          submittedAt: new Date(),
        },
        update: {
          comment: input.comment,
          fileUrl: input.fileUrl,
          status: "SUBMITTED",
          submittedAt: new Date(),
        },
        include: { homework: true, student: true },
      });
    },

    gradeHomework: async (
      _: unknown,
      { input }: { input: { submissionId: string; marks: number; feedback?: string } }
    ) => {
      return db.homeworkSubmission.update({
        where: { id: input.submissionId },
        data: {
          marks: input.marks,
          feedback: input.feedback,
          status: "REVIEWED",
          reviewedAt: new Date(),
        },
        include: { homework: true, student: true },
      });
    },

    // Results & Assessments
    recordAssessmentResult: async (
      _: unknown,
      { input }: { input: { examSubjectId: string; studentId: string; marks: number; grade?: string; remarks?: string } }
    ) => {
      return db.assessmentResult.upsert({
        where: {
          examSubjectId_studentId: {
            examSubjectId: input.examSubjectId,
            studentId: input.studentId,
          },
        },
        create: {
          examSubjectId: input.examSubjectId,
          studentId: input.studentId,
          marks: input.marks,
          grade: input.grade,
          remarks: input.remarks,
          status: "APPROVED",
        },
        update: {
          marks: input.marks,
          grade: input.grade,
          remarks: input.remarks,
          status: "APPROVED",
        },
        include: { student: true, examSubject: true },
      });
    },

    publishExamResults: async (_: unknown, { examId }: { examId: string }) => {
      const examSubjects = await db.examSubject.findMany({ where: { examId } });
      const ids = examSubjects.map((es) => es.id);
      const res = await db.assessmentResult.updateMany({
        where: { examSubjectId: { in: ids } },
        data: { status: "PUBLISHED" },
      });
      return res.count;
    },

    // Announcements
    createAnnouncement: async (
      _: unknown,
      { input }: { input: { title: string; body: string; audience: Audience } }
    ) => {
      const school = await db.school.findFirst();
      if (!school) throw new Error("No school found.");

      const author = await db.user.findFirst();
      const authorId = author ? author.id : "system";

      return db.announcement.create({
        data: {
          schoolId: school.id,
          authorId,
          title: input.title,
          body: input.body,
          audience: input.audience,
          publishAt: new Date(),
        },
      });
    },

    // Security
    resetPassword: async (
      _: unknown,
      { input }: { input: { email: string; newPassword?: string } }
    ) => {
      const result = await resetUserPassword(input);
      return {
        success: result.success,
        message: result.message,
        email: result.email,
        role: result.role,
      };
    },

    // AI Copilot
    aiGenerateRemarks: async (
      _: unknown,
      { input }: { input: { studentName: string; gradeLevel?: string; attendanceRate?: string; strengths?: string; areasToImprove?: string; tone?: any } }
    ) => {
      const res = await generateStudentRemarks(input);
      return {
        success: true,
        mode: "remarks",
        text: res.text,
        provider: res.provider,
        model: res.model,
        tokenStats: res.tokenStats,
        timestamp: new Date().toISOString(),
      };
    },

    aiGenerateQuiz: async (
      _: unknown,
      { input }: { input: { subject: string; topic: string; gradeLevel?: string; questionCount?: number } }
    ) => {
      const res = await generateQuiz(input);
      return {
        success: true,
        mode: "quiz",
        text: res.text,
        provider: res.provider,
        model: res.model,
        tokenStats: res.tokenStats,
        timestamp: new Date().toISOString(),
      };
    },

    aiGenerateNotice: async (
      _: unknown,
      { input }: { input: { topic: string; audience?: string; eventDate?: string; keyDetails?: string } }
    ) => {
      const res = await generateNotice(input);
      return {
        success: true,
        mode: "notice",
        text: res.text,
        provider: res.provider,
        model: res.model,
        tokenStats: res.tokenStats,
        timestamp: new Date().toISOString(),
      };
    },

    aiChatQuery: async (
      _: unknown,
      { input }: { input: { query: string; context?: string } }
    ) => {
      const res = await answerSchoolQuery(input);
      return {
        success: true,
        mode: "chat",
        text: res.text,
        provider: res.provider,
        model: res.model,
        tokenStats: res.tokenStats,
        timestamp: new Date().toISOString(),
      };
    },
  },
};
