import type { AuthContext } from "@/lib/auth/context";
import { can } from "@/lib/permissions/engine";

export interface NavItem {
  href: string;
  label: string;
  module: string;
  resource: string;
}

const ITEMS: NavItem[] = [
  { href: "/", label: "Dashboard", module: "*", resource: "*" },
  { href: "/students", label: "Students", module: "students", resource: "personal_info" },
  { href: "/attendance", label: "Attendance", module: "attendance", resource: "student" },
  { href: "/homework", label: "Homework", module: "homework", resource: "assignment" },
  { href: "/notes", label: "Subject Notes", module: "*", resource: "*" },
  { href: "/results", label: "Results & Marksheets", module: "exams", resource: "results" },
  { href: "/timetable", label: "Timetable", module: "academics", resource: "timetable" },
  { href: "/transport", label: "Transport & Buses", module: "*", resource: "*" },
  { href: "/library", label: "Library Catalog", module: "*", resource: "*" },
  { href: "/fees", label: "Fee Invoicing", module: "*", resource: "*" },
  { href: "/activities", label: "Activities", module: "activities", resource: "activity" },
  { href: "/announcements", label: "Announcements", module: "announcements", resource: "announcement" },
  { href: "/copilot", label: "AI Academic Copilot", module: "*", resource: "*" },
  { href: "/roles", label: "Staff & Roles", module: "admin", resource: "roles" },
  { href: "/audit", label: "Audit Log", module: "admin", resource: "audit" },
];

export function navFor(ctx: AuthContext): NavItem[] {
  const isStudentOrParent = Boolean(
    ctx.studentId ||
      ctx.guardianId ||
      ctx.roleKeys.includes("student") ||
      ctx.roleKeys.includes("parent")
  );

  return ITEMS.filter((item) => {
    if (item.module === "*") return true;
    return can(ctx, item.module, item.resource, "view");
  }).map((item) => {
    if (isStudentOrParent) {
      if (item.href === "/copilot") return { ...item, label: "AI Study Assistant" };
      if (item.href === "/students") {
        return {
          ...item,
          label: ctx.roleKeys.includes("parent") ? "Student Profile" : "My Profile",
        };
      }
      if (item.href === "/transport") return { ...item, label: "My Bus Route" };
      if (item.href === "/library") return { ...item, label: "Library Books" };
      if (item.href === "/fees") return { ...item, label: "My Fees & Receipts" };
    }
    return item;
  });
}
