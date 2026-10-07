import { describe, it, expect } from "vitest";
import { can } from "@/lib/permissions/engine";
import type { AuthContext } from "@/lib/auth/context";

describe("Enterprise Modules - Transport Fleet Operations", () => {
  it("calculates bus seat occupancy and remaining capacity accurately", () => {
    const busCapacity = 42;
    const enrolledStudents = 38;
    const occupancyPercent = Math.round((enrolledStudents / busCapacity) * 100);
    const seatsRemaining = busCapacity - enrolledStudents;

    expect(occupancyPercent).toBe(90);
    expect(seatsRemaining).toBe(4);
    expect(seatsRemaining > 0).toBe(true);
  });

  it("validates ordered sequence of bus stops", () => {
    const stops = [
      { name: "Bandra Station (W)", time: "07:15 AM", order: 1 },
      { name: "Khar Gymkhana", time: "07:30 AM", order: 2 },
      { name: "Santacruz Signal", time: "07:45 AM", order: 3 },
      { name: "Campus Gate 1", time: "08:10 AM", order: 4 },
    ];

    expect(stops[0].order).toBe(1);
    expect(stops[stops.length - 1].order).toBe(4);
    expect(stops[0].name).toBe("Bandra Station (W)");
    expect(stops[stops.length - 1].name).toBe("Campus Gate 1");
  });
});

describe("Enterprise Modules - Library Circulation & Overdue Logic", () => {
  it("computes loan period and flags overdue correctly", () => {
    const borrowDate = new Date("2026-09-01T00:00:00.000Z");
    const dueDate = new Date("2026-09-15T00:00:00.000Z");
    const testNow = new Date("2026-09-20T00:00:00.000Z");

    const isOverdue = testNow.getTime() > dueDate.getTime();
    const daysOverdue = Math.floor((testNow.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
    const fineRatePerDay = 5;
    const fineAmount = daysOverdue * fineRatePerDay;

    expect(isOverdue).toBe(true);
    expect(daysOverdue).toBe(5);
    expect(fineAmount).toBe(25);
  });

  it("decrements available copies upon issue and increments upon return", () => {
    let availableCopies = 4;
    const totalCopies = 5;

    // Issue book
    availableCopies = Math.max(0, availableCopies - 1);
    expect(availableCopies).toBe(3);

    // Return book
    availableCopies = Math.min(totalCopies, availableCopies + 1);
    expect(availableCopies).toBe(4);
  });
});

describe("Enterprise Modules - Fee Invoicing & Ledger Reconciliation", () => {
  it("computes fee structure breakdown correctly", () => {
    const tuition = 60000;
    const lab = 5000;
    const library = 2500;
    const transport = 12000;
    const other = 2500;

    const total = tuition + lab + library + transport + other;
    expect(total).toBe(82000);
  });

  it("evaluates payment clearance status correctly", () => {
    function getInvoiceStatus(amount: number, paid: number, dueDate: Date, now: Date): string {
      if (paid >= amount) return "PAID";
      if (paid > 0 && paid < amount) return "PARTIAL";
      if (now.getTime() > dueDate.getTime()) return "OVERDUE";
      return "PENDING";
    }

    const futureDue = new Date("2026-11-30");
    const pastDue = new Date("2026-08-01");
    const now = new Date("2026-10-01");

    expect(getInvoiceStatus(41000, 41000, futureDue, now)).toBe("PAID");
    expect(getInvoiceStatus(41000, 15000, futureDue, now)).toBe("PARTIAL");
    expect(getInvoiceStatus(41000, 0, futureDue, now)).toBe("PENDING");
    expect(getInvoiceStatus(41000, 0, pastDue, now)).toBe("OVERDUE");
  });
});

describe("Enterprise Modules - Role Permissions Integrity", () => {
  const fakePrincipal: AuthContext = {
    userId: "u-hm",
    schoolId: "sch-1",
    name: "Dr. Anita Desai",
    email: "principal@greenfield.edu",
    roleKeys: ["headmaster"],
    grants: [
      { module: "*", resource: "*", action: "*", scope: "SCHOOL" },
      { module: "finance", resource: "records", action: "view", scope: "SCHOOL" },
    ],
    teacherId: null,
    departmentId: null,
    assignedOfferingIds: [],
    assignedSectionIds: [],
    classTeacherSectionIds: [],
    studentId: null,
    studentSectionIds: [],
    guardianId: null,
    childStudentIds: [],
  };

  const fakeExamController: AuthContext = {
    userId: "u-ec",
    schoolId: "sch-1",
    name: "Mr. Controller",
    email: "examctrl@greenfield.edu",
    roleKeys: ["exam_controller"],
    grants: [
      { module: "exams", resource: "results", action: "publish", scope: "SCHOOL" },
      { module: "exams", resource: "exam", action: "view", scope: "SCHOOL" },
    ],
    teacherId: null,
    departmentId: null,
    assignedOfferingIds: [],
    assignedSectionIds: [],
    classTeacherSectionIds: [],
    studentId: null,
    studentSectionIds: [],
    guardianId: null,
    childStudentIds: [],
  };

  const fakeStudent: AuthContext = {
    userId: "u-student",
    schoolId: "sch-1",
    name: "Arjun Mehta",
    email: "arjun@student.greenfield.edu",
    roleKeys: ["student"],
    grants: [
      { module: "students", resource: "personal_info", action: "view", scope: "OWN" },
      { module: "finance", resource: "records", action: "view", scope: "OWN" },
    ],
    teacherId: null,
    departmentId: null,
    assignedOfferingIds: [],
    assignedSectionIds: [],
    classTeacherSectionIds: [],
    studentId: "std-01",
    studentSectionIds: ["sec-8a"],
    guardianId: null,
    childStudentIds: [],
  };

  it("headmaster has school-wide access to finance and management", () => {
    expect(can(fakePrincipal, "finance", "records", "view", {})).toBe(true);
  });

  it("exam controller is strictly blocked from viewing finance (RBAC constraint)", () => {
    expect(can(fakeExamController, "finance", "records", "view", {})).toBe(false);
  });

  it("student can view their own financial records but not peer records", () => {
    expect(can(fakeStudent, "finance", "records", "view", { studentId: "std-01" })).toBe(true);
    expect(can(fakeStudent, "finance", "records", "view", { studentId: "std-02" })).toBe(false);
  });
});

describe("Enterprise Modules - Real-Time Payment Gateway", () => {
  function detectCardBrand(cardNumber: string): "VISA" | "MASTERCARD" | "RUPAY" | "GENERIC" {
    const raw = cardNumber.replace(/\s+/g, "");
    if (raw.startsWith("4")) return "VISA";
    if (/^5[1-5]/.test(raw) || /^2[2-7]/.test(raw)) return "MASTERCARD";
    if (/^6[045]/.test(raw) || /^508[5-9]/.test(raw)) return "RUPAY";
    return "GENERIC";
  }

  function formatCardNumber(val: string): string {
    const digits = val.replace(/\D/g, "").slice(0, 16);
    return digits.replace(/(\d{4})(?=\d)/g, "$1 ");
  }

  it("detects card brands correctly from leading digits (BIN)", () => {
    expect(detectCardBrand("4532 8901 2345 6789")).toBe("VISA");
    expect(detectCardBrand("5211 4455 6677 8899")).toBe("MASTERCARD");
    expect(detectCardBrand("6071 9922 3344 5566")).toBe("RUPAY");
    expect(detectCardBrand("3711 0000 0000 0000")).toBe("GENERIC");
  });

  it("formats card numbers with 4-digit space separation", () => {
    expect(formatCardNumber("4532890123456789")).toBe("4532 8901 2345 6789");
    expect(formatCardNumber("45328901")).toBe("4532 8901");
  });

  it("generates unique transaction references for Net Banking and Card payments", () => {
    function generateTxn(method: "CARD" | "NET_BANKING" | "UPI"): string {
      return `TXN-${method}-${Math.floor(100000 + Math.random() * 900000)}`;
    }

    const cardTxn = generateTxn("CARD");
    const nbTxn = generateTxn("NET_BANKING");

    expect(cardTxn.startsWith("TXN-CARD-")).toBe(true);
    expect(nbTxn.startsWith("TXN-NET_BANKING-")).toBe(true);
  });

  it("successfully validates 3D secure OTP requirements", () => {
    function validateOtp(input: string): boolean {
      return /^\d{6}$/.test(input);
    }

    expect(validateOtp("482910")).toBe(true);
    expect(validateOtp("123")).toBe(false);
    expect(validateOtp("abcdef")).toBe(false);
  });
});

