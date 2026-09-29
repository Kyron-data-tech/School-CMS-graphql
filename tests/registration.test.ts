import { describe, it, expect, afterAll } from "vitest";
import {
  registerStudent,
  registerTeacher,
  registerPrincipal,
  getRegistrationMetadata,
} from "@/lib/auth/register";
import { db } from "@/lib/db";
import { verifyPassword } from "@/lib/auth/password";

describe("Multi-Role User Registration System", () => {
  const testEmails: string[] = [];

  afterAll(async () => {
    // Cleanup created test records
    for (const email of testEmails) {
      const user = await db.user.findFirst({ where: { email }, include: { student: true } });
      if (user) {
        if (user.student) {
          await db.enrollment.deleteMany({ where: { studentId: user.student.id } });
          await db.student.delete({ where: { id: user.student.id } });
        }
        await db.teacher.deleteMany({ where: { userId: user.id } });
        await db.userRole.deleteMany({ where: { userId: user.id } });
        await db.session.deleteMany({ where: { userId: user.id } });
        await db.user.delete({ where: { id: user.id } });
      }
    }
  });

  it("should fetch registration metadata including active sections and departments", async () => {
    const meta = await getRegistrationMetadata();
    expect(meta.school).toBeDefined();
    expect(meta.school.id).toBeDefined();
    expect(Array.isArray(meta.sections)).toBe(true);
    expect(Array.isArray(meta.departments)).toBe(true);
    expect(Array.isArray(meta.roles)).toBe(true);
    expect(meta.sections.length).toBeGreaterThan(0);
  });

  it("should successfully register a new student with section enrollment", async () => {
    const meta = await getRegistrationMetadata();
    const section = meta.sections[0];
    const testEmail = `test.student.${Date.now()}@student.greenfield.edu`;
    testEmails.push(testEmail);

    const result = await registerStudent({
      email: testEmail,
      password: "StudentPass2026!",
      firstName: "TestStudentFirst",
      lastName: "TestStudentLast",
      gender: "FEMALE",
      sectionId: section.id,
      rollNumber: 42,
    });

    expect(result.success).toBe(true);
    expect(result.user.email).toBe(testEmail);
    expect(result.user.role).toBe("student");
    expect(result.student.admissionNo).toBeDefined();

    // Verify User record in DB
    const user = await db.user.findUnique({
      where: { id: result.user.id },
      include: { userRoles: { include: { role: true } }, student: { include: { enrollments: true } } },
    });
    expect(user).toBeDefined();
    expect(user?.userRoles[0]?.role.key).toBe("student");
    expect(user?.student?.firstName).toBe("TestStudentFirst");
    expect(user?.student?.enrollments.length).toBe(1);
    expect(user?.student?.enrollments[0].sectionId).toBe(section.id);

    // Verify password hash
    const passMatches = await verifyPassword(user!.passwordHash, "StudentPass2026!");
    expect(passMatches).toBe(true);
  });

  it("should reject student registration if email already exists", async () => {
    const meta = await getRegistrationMetadata();
    const testEmail = `duplicate.${Date.now()}@student.greenfield.edu`;
    testEmails.push(testEmail);

    await registerStudent({
      email: testEmail,
      password: "Password123!",
      firstName: "Existing",
      lastName: "User",
      sectionId: meta.sections[0].id,
    });

    await expect(
      registerStudent({
        email: testEmail,
        password: "NewPassword123!",
        firstName: "Duplicate",
        lastName: "Attempt",
      })
    ).rejects.toThrow(/already exists/i);
  });

  it("should successfully register a new teacher with department", async () => {
    const meta = await getRegistrationMetadata();
    const dept = meta.departments[0];
    const testEmail = `test.teacher.${Date.now()}@greenfield.edu`;
    testEmails.push(testEmail);

    const result = await registerTeacher({
      email: testEmail,
      password: "TeacherPass2026!",
      firstName: "Physics",
      lastName: "Professor",
      departmentId: dept?.id,
      designation: "Senior Science Teacher",
    });

    expect(result.success).toBe(true);
    expect(result.user.email).toBe(testEmail);
    expect(result.user.role).toBe("teacher");
    expect(result.teacher.designation).toBe("Senior Science Teacher");

    const user = await db.user.findUnique({
      where: { id: result.user.id },
      include: { userRoles: { include: { role: true } }, teacher: true },
    });
    expect(user?.userRoles[0]?.role.key).toBe("teacher");
    expect(user?.teacher?.firstName).toBe("Physics");
    expect(user?.teacher?.employeeId).toBeDefined();
  });

  it("should successfully register a new principal with headmaster role", async () => {
    const testEmail = `test.principal.${Date.now()}@greenfield.edu`;
    testEmails.push(testEmail);

    const result = await registerPrincipal({
      email: testEmail,
      password: "PrincipalPass2026!",
      firstName: "Margaret",
      lastName: "Hamilton",
      phone: "+91 98765 43210",
    });

    expect(result.success).toBe(true);
    expect(result.user.email).toBe(testEmail);
    expect(result.user.role).toBe("headmaster");

    const user = await db.user.findUnique({
      where: { id: result.user.id },
      include: { userRoles: { include: { role: true } } },
    });
    expect(user?.userRoles[0]?.role.key).toBe("headmaster");
  });

  it("should reject registration with invalid password (less than 8 chars)", async () => {
    await expect(
      registerStudent({
        email: "shortpass@student.greenfield.edu",
        password: "123",
        firstName: "Short",
        lastName: "Pass",
      })
    ).rejects.toThrow(/at least 8 characters/i);
  });
});
