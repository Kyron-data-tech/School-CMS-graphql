"use client";

import { useState, useMemo } from "react";
import { Badge, Section } from "@/components/ui";
import { RegisterModal } from "@/components/auth/RegisterModal";

export interface UserSummary {
  id: string;
  name: string;
  email: string;
  isActive: boolean;
  createdAt: string | Date;
  roles: Array<{ id: string; name: string; key: string }>;
  teacher?: {
    employeeId: string;
    designation: string | null;
  } | null;
  student?: {
    admissionNo: string;
  } | null;
}

export interface RoleSummary {
  id: string;
  name: string;
  key: string;
  description: string | null;
  isSystem: boolean;
  userCount: number;
  permissions: Array<{
    id: string;
    module: string;
    resource: string;
    action: string;
    scope: string;
  }>;
}

const scopeColor: Record<string, "green" | "blue" | "amber" | "slate" | "red"> = {
  SCHOOL: "green",
  CAMPUS: "green",
  ASSIGNED_CLASS: "blue",
  ASSIGNED_SECTION: "blue",
  ASSIGNED_SUBJECT: "blue",
  ASSIGNED_STUDENTS: "blue",
  DEPARTMENT: "amber",
  OWN: "slate",
  OWN_CHILDREN: "slate",
  NONE: "red",
};

export function RolesDirectoryClient({
  users,
  roles,
  canManage = true,
}: {
  users: UserSummary[];
  roles: RoleSummary[];
  canManage?: boolean;
}) {
  // Modal State
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [registerInitialRole, setRegisterInitialRole] = useState<
    "student" | "teacher" | "staff" | "parent" | "principal"
  >("staff");

  // View state
  const [activeTab, setActiveTab] = useState<"users" | "roles">("users");
  const [roleFilter, setRoleFilter] = useState<string>("ALL");
  const [search, setSearch] = useState("");

  // Filtered Users
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const q = search.toLowerCase().trim();
      const matchesSearch =
        !q ||
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.teacher?.employeeId && u.teacher.employeeId.toLowerCase().includes(q)) ||
        (u.teacher?.designation && u.teacher.designation.toLowerCase().includes(q)) ||
        (u.student?.admissionNo && u.student.admissionNo.toLowerCase().includes(q));

      if (!matchesSearch) return false;

      if (roleFilter !== "ALL") {
        if (roleFilter === "TEACHER") {
          return u.roles.some((r) => r.key === "teacher" || r.key === "class_teacher");
        }
        if (roleFilter === "STAFF") {
          return (
            u.roles.some((r) => r.key === "staff" || r.key === "non_teaching_staff") ||
            (Boolean(u.teacher) &&
              !u.roles.some((r) => r.key === "teacher" || r.key === "headmaster"))
          );
        }
        if (roleFilter === "STUDENT") {
          return u.roles.some((r) => r.key === "student");
        }
        if (roleFilter === "ADMIN") {
          return u.roles.some(
            (r) => r.key === "headmaster" || r.key === "admin" || r.key === "principal"
          );
        }
      }

      return true;
    });
  }, [users, search, roleFilter]);

  // Statistics
  const stats = useMemo(() => {
    const teachers = users.filter((u) =>
      u.roles.some((r) => r.key === "teacher" || r.key === "class_teacher")
    ).length;
    const staff = users.filter(
      (u) =>
        u.roles.some((r) => r.key === "staff" || r.key === "non_teaching_staff") ||
        (Boolean(u.teacher) &&
          !u.roles.some((r) => r.key === "teacher" || r.key === "headmaster"))
    ).length;
    const students = users.filter((u) => u.roles.some((r) => r.key === "student")).length;
    const admins = users.filter((u) =>
      u.roles.some(
        (r) => r.key === "headmaster" || r.key === "admin" || r.key === "principal"
      )
    ).length;

    return { total: users.length, teachers, staff, students, admins };
  }, [users]);

  function handleOpenRegister(
    role: "student" | "teacher" | "staff" | "parent" | "principal" = "staff"
  ) {
    setRegisterInitialRole(role);
    setIsRegisterOpen(true);
  }

  return (
    <div className="space-y-5">
      {/* KPI Stats Header */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <div className="card p-3 flex items-center gap-3 border-l-4 border-l-purple-500">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-950/80 text-purple-300 border border-purple-800/60 text-lg shadow-sm">
            👥
          </div>
          <div>
            <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
              Total Users
            </div>
            <div className="text-lg font-bold text-white">{stats.total}</div>
          </div>
        </div>

        <div className="card p-3 flex items-center gap-3 border-l-4 border-l-blue-500">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-950/80 text-blue-300 border border-blue-800/60 text-lg shadow-sm">
            👩‍🏫
          </div>
          <div>
            <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
              Teachers
            </div>
            <div className="text-lg font-bold text-white">{stats.teachers}</div>
          </div>
        </div>

        <div className="card p-3 flex items-center gap-3 border-l-4 border-l-indigo-500">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-950/80 text-indigo-300 border border-indigo-800/60 text-lg shadow-sm">
            💼
          </div>
          <div>
            <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
              Non-Teaching Staff
            </div>
            <div className="text-lg font-bold text-white">{stats.staff}</div>
          </div>
        </div>

        <div className="card p-3 flex items-center gap-3 border-l-4 border-l-emerald-500">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-950/80 text-emerald-300 border border-emerald-800/60 text-lg shadow-sm">
            🎓
          </div>
          <div>
            <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
              Students
            </div>
            <div className="text-lg font-bold text-white">{stats.students}</div>
          </div>
        </div>

        <div className="card p-3 flex items-center gap-3 border-l-4 border-l-amber-500">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-950/80 text-amber-300 border border-amber-800/60 text-lg shadow-sm">
            👑
          </div>
          <div>
            <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
              Leadership &amp; Roles
            </div>
            <div className="text-lg font-bold text-white">{roles.length} Roles</div>
          </div>
        </div>
      </div>

      {/* Action Bar & Quick Add Buttons */}
      <div className="card p-4 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          {/* Main Tab Toggle: Users Directory vs Roles Matrix */}
          <div className="flex rounded-xl border border-slate-800 bg-slate-950/80 p-1 shrink-0">
            <button
              type="button"
              onClick={() => setActiveTab("users")}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                activeTab === "users"
                  ? "bg-brand-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <span>👥</span> People &amp; Staff Directory ({filteredUsers.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("roles")}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                activeTab === "roles"
                  ? "bg-brand-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <span>🛡️</span> Roles &amp; Permissions Matrix ({roles.length})
            </button>
          </div>

          {/* Quick Onboarding Button Group */}
          {canManage && (
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => handleOpenRegister("staff")}
                className="btn bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs px-3 py-2 rounded-xl transition flex items-center gap-1.5 shadow-sm"
                title="Onboard Non-Teaching Staff (Accountant, Librarian, Transport, Clerk, Lab Assistant)"
              >
                <span>💼</span>
                <span>+ Add Staff</span>
              </button>

              <button
                type="button"
                onClick={() => handleOpenRegister("teacher")}
                className="btn bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs px-3 py-2 rounded-xl transition flex items-center gap-1.5 shadow-sm"
                title="Onboard Teacher or Faculty Member"
              >
                <span>👩‍🏫</span>
                <span>+ Add Teacher</span>
              </button>

              <button
                type="button"
                onClick={() => handleOpenRegister("student")}
                className="btn bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 shadow-sm"
                title="Enroll a new student"
              >
                <span>🎓</span>
                <span>+ Add Student</span>
              </button>
            </div>
          )}
        </div>

        {/* Filters Bar (Only active when in Users Directory mode) */}
        {activeTab === "users" && (
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2 border-t border-slate-800">
            <div className="relative flex-1 max-w-md">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, email, employee ID, designation, or admission no…"
                className="input text-xs pr-8 w-full"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-2.5 top-2 text-xs text-slate-400 hover:text-white"
                >
                  ✕
                </button>
              )}
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              {[
                { label: "All Users", val: "ALL" },
                { label: "👩‍🏫 Teachers", val: "TEACHER" },
                { label: "💼 Non-Teaching Staff", val: "STAFF" },
                { label: "🎓 Students", val: "STUDENT" },
                { label: "👑 Admins", val: "ADMIN" },
              ].map((opt) => (
                <button
                  key={opt.val}
                  type="button"
                  onClick={() => setRoleFilter(opt.val)}
                  className={`px-2.5 py-1 text-xs rounded-lg font-medium transition shrink-0 ${
                    roleFilter === opt.val
                      ? "bg-slate-800 text-brand-300 border border-slate-700"
                      : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* TAB 1: USERS & PERSONNEL DIRECTORY */}
      {activeTab === "users" && (
        <div className="space-y-3">
          {filteredUsers.length === 0 ? (
            <div className="card p-12 text-center text-slate-400 space-y-3">
              <div className="text-3xl">🔍</div>
              <div className="text-sm font-semibold text-slate-200">No users found</div>
              <p className="text-xs max-w-sm mx-auto text-slate-400">
                No personnel match your search filter. Use the buttons above to onboard teachers, non-teaching staff, or students.
              </p>
              {canManage && (
                <button
                  type="button"
                  onClick={() => handleOpenRegister("staff")}
                  className="btn bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold px-4 py-2 rounded-xl"
                >
                  + Onboard Staff Member
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredUsers.map((u) => {
                const isHeadmaster = u.roles.some((r) => r.key === "headmaster");
                const isTeacher = u.roles.some((r) => r.key === "teacher");
                const isStudent = u.roles.some((r) => r.key === "student");
                const isStaff = !isTeacher && !isStudent && !isHeadmaster;

                return (
                  <div
                    key={u.id}
                    className="card p-4 space-y-3 border border-slate-800 bg-slate-900/90 hover:border-slate-700 transition"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-0.5">
                        <div className="text-sm font-bold text-white flex items-center gap-1.5">
                          {isHeadmaster && <span>👑</span>}
                          {isTeacher && <span>👩‍🏫</span>}
                          {isStaff && <span>💼</span>}
                          {isStudent && <span>🎓</span>}
                          <span>{u.name}</span>
                        </div>
                        <div className="text-xs text-slate-400 font-mono truncate">{u.email}</div>
                      </div>

                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-semibold border ${
                          u.isActive
                            ? "bg-emerald-950/60 border-emerald-800/80 text-emerald-300"
                            : "bg-slate-800 border-slate-700 text-slate-400"
                        }`}
                      >
                        {u.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>

                    {/* Designation / ID detail */}
                    <div className="text-xs bg-slate-950/80 border border-slate-800/80 rounded-lg p-2 flex items-center justify-between">
                      <span className="text-slate-400">
                        {u.teacher?.designation || (isStudent ? "Student Scholar" : isHeadmaster ? "Principal" : "Staff Member")}
                      </span>
                      <span className="font-mono text-indigo-300 font-semibold">
                        {u.teacher?.employeeId || u.student?.admissionNo || "—"}
                      </span>
                    </div>

                    {/* Role Badges */}
                    <div className="flex flex-wrap gap-1 pt-1">
                      {u.roles.map((r) => (
                        <span
                          key={r.id}
                          className="inline-flex items-center rounded-md border border-slate-700 bg-slate-800/80 px-2 py-0.5 text-[10px] font-medium text-slate-200"
                        >
                          {r.name}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: ROLES & PERMISSIONS MATRIX */}
      {activeTab === "roles" && (
        <div className="space-y-4">
          {roles.map((r) => (
            <Section
              key={r.id}
              title={r.name}
              action={
                <span className="flex items-center gap-2">
                  {r.isSystem ? (
                    <Badge color="slate">System</Badge>
                  ) : (
                    <Badge color="green">Custom</Badge>
                  )}
                  <span className="text-xs text-slate-400">{r.userCount} user(s)</span>
                </span>
              }
            >
              <p className="mb-3 text-sm text-slate-400">{r.description}</p>
              <div className="flex flex-wrap gap-1.5">
                {r.permissions.length === 0 && (
                  <span className="text-xs text-slate-500">No permissions granted.</span>
                )}
                {r.permissions.map((p) => (
                  <span
                    key={p.id}
                    className="inline-flex items-center gap-1 rounded-md border border-slate-800 bg-slate-950/80 px-2 py-1 text-xs"
                  >
                    <span className="font-medium text-slate-300 font-mono">
                      {p.module}.{p.resource}.{p.action}
                    </span>
                    <Badge color={scopeColor[p.scope] ?? "slate"}>{p.scope}</Badge>
                  </span>
                ))}
              </div>
            </Section>
          ))}
        </div>
      )}

      {/* Registration Modal */}
      <RegisterModal
        isOpen={isRegisterOpen}
        initialRole={registerInitialRole}
        onClose={() => setIsRegisterOpen(false)}
        onSuccess={() => {
          setTimeout(() => {
            window.location.reload();
          }, 1500);
        }}
      />
    </div>
  );
}
