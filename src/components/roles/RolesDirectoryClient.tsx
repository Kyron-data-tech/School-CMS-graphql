"use client";

import { useState, useMemo } from "react";
import { Badge, Section } from "@/components/ui";
import { RegisterModal } from "@/components/auth/RegisterModal";
import { RolePermissionsModal } from "./RolePermissionsModal";
import { EditUserModal } from "./EditUserModal";
import { ApiKeysTab } from "./ApiKeysTab";

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
  // Live state for optimistic client updates
  const [userList, setUserList] = useState<UserSummary[]>(users);
  const [roleList, setRoleList] = useState<RoleSummary[]>(roles);

  // Modal State for Registering New Users
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [registerInitialRole, setRegisterInitialRole] = useState<
    "student" | "teacher" | "staff" | "parent" | "principal"
  >("staff");

  // Modal State for Role Permissions (Create & Edit)
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [selectedRoleToEdit, setSelectedRoleToEdit] = useState<RoleSummary | null>(null);

  // Modal State for User Editing
  const [isEditUserOpen, setIsEditUserOpen] = useState(false);
  const [selectedUserToEdit, setSelectedUserToEdit] = useState<UserSummary | null>(null);

  // View state: "users" | "roles" | "api-keys"
  const [activeTab, setActiveTab] = useState<"users" | "roles" | "api-keys">("users");
  const [roleFilter, setRoleFilter] = useState<string>("ALL");
  const [search, setSearch] = useState("");

  // Filtered Users
  const filteredUsers = useMemo(() => {
    return userList.filter((u) => {
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
  }, [userList, search, roleFilter]);

  // Statistics
  const stats = useMemo(() => {
    const teachers = userList.filter((u) =>
      u.roles.some((r) => r.key === "teacher" || r.key === "class_teacher")
    ).length;
    const staff = userList.filter(
      (u) =>
        u.roles.some((r) => r.key === "staff" || r.key === "non_teaching_staff") ||
        (Boolean(u.teacher) &&
          !u.roles.some((r) => r.key === "teacher" || r.key === "headmaster"))
    ).length;
    const students = userList.filter((u) => u.roles.some((r) => r.key === "student")).length;
    const admins = userList.filter((u) =>
      u.roles.some(
        (r) => r.key === "headmaster" || r.key === "admin" || r.key === "principal"
      )
    ).length;

    return { total: userList.length, teachers, staff, students, admins };
  }, [userList]);

  function handleOpenRegister(
    role: "student" | "teacher" | "staff" | "parent" | "principal" = "staff"
  ) {
    setRegisterInitialRole(role);
    setIsRegisterOpen(true);
  }

  function handleOpenCreateRole() {
    setSelectedRoleToEdit(null);
    setIsRoleModalOpen(true);
  }

  function handleOpenEditRole(r: RoleSummary) {
    setSelectedRoleToEdit(r);
    setIsRoleModalOpen(true);
  }

  function handleOpenEditUser(u: UserSummary) {
    setSelectedUserToEdit(u);
    setIsEditUserOpen(true);
  }

  async function handleToggleUserStatus(u: UserSummary) {
    const newStatus = !u.isActive;
    const actionWord = newStatus ? "activate" : "deactivate";
    if (!confirm(`Are you sure you want to ${actionWord} the account for ${u.name}?`)) {
      return;
    }

    try {
      const res = await fetch("/api/admin/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: u.id,
          name: u.name,
          email: u.email,
          isActive: newStatus,
          roleKeys: u.roles.map((r) => r.key),
        }),
      });

      if (res.ok) {
        setUserList((prev) =>
          prev.map((usr) => (usr.id === u.id ? { ...usr, isActive: newStatus } : usr))
        );
      } else {
        const data = await res.json();
        alert(data.error || "Failed to update account status.");
      }
    } catch (e) {
      alert("Network error updating user account status.");
    }
  }

  async function handleDeleteRole(r: RoleSummary) {
    if (r.isSystem) {
      alert("System roles (Headmaster, Teacher, Student) are protected core templates and cannot be deleted.");
      return;
    }

    if (!confirm(`Are you sure you want to delete the custom role "${r.name}"?`)) {
      return;
    }

    try {
      const res = await fetch("/api/admin/roles", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roleId: r.id }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Failed to delete role.");
        return;
      }

      setRoleList((prev) => prev.filter((role) => role.id !== r.id));
    } catch (e) {
      alert("Network error deleting role.");
    }
  }

  return (
    <div className="space-y-5">
      {/* KPI Stats Header */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <div className="card-hover p-3.5 flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-500/10 text-purple-300 border border-purple-500/25 text-base shadow-sm">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
            </svg>
          </div>
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-display">
              Total Users
            </div>
            <div className="text-lg font-extrabold text-white">{stats.total}</div>
          </div>
        </div>

        <div className="card-hover p-3.5 flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-blue-300 border border-blue-500/25 text-base shadow-sm">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342" />
            </svg>
          </div>
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-display">
              Teachers
            </div>
            <div className="text-lg font-extrabold text-white">{stats.teachers}</div>
          </div>
        </div>

        <div className="card-hover p-3.5 flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-300 border border-indigo-500/25 text-base shadow-sm">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894m7.5 0a48.667 48.667 0 00-7.5 0M12 12.75h.008v.008H12v-.008z" />
            </svg>
          </div>
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-display">
              Staff
            </div>
            <div className="text-lg font-extrabold text-white">{stats.staff}</div>
          </div>
        </div>

        <div className="card-hover p-3.5 flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-300 border border-emerald-500/25 text-base shadow-sm">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
            </svg>
          </div>
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-display">
              Students
            </div>
            <div className="text-lg font-extrabold text-white">{stats.students}</div>
          </div>
        </div>

        <div className="card-hover p-3.5 flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-300 border border-cyan-500/25 text-base shadow-sm">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
            </svg>
          </div>
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-display">
              Roles &amp; Access
            </div>
            <div className="text-lg font-extrabold text-white">{roleList.length} Roles</div>
          </div>
        </div>
      </div>

      {/* Action Bar & Tab Switcher */}
      <div className="card p-4 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          {/* Main Tab Toggle: Users Directory vs Roles Matrix vs API Keys */}
          <div className="flex rounded-xl border border-white/[0.08] bg-white/[0.03] p-1 shrink-0 overflow-x-auto">
            <button
              type="button"
              onClick={() => setActiveTab("users")}
              className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition shrink-0 ${
                activeTab === "users"
                  ? "bg-gradient-to-r from-brand-600 to-indigo-600 text-white shadow-sm font-bold"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <span>People &amp; Staff Directory ({filteredUsers.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("roles")}
              className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition shrink-0 ${
                activeTab === "roles"
                  ? "bg-gradient-to-r from-brand-600 to-indigo-600 text-white shadow-sm font-bold"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <span>Roles &amp; Access Matrix ({roleList.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("api-keys")}
              className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition shrink-0 ${
                activeTab === "api-keys"
                  ? "bg-gradient-to-r from-brand-600 to-indigo-600 text-white shadow-sm font-bold"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <span>🔑 Organization API Keys</span>
            </button>
          </div>

          {/* Quick Action Button Group */}
          {canManage && (
            <div className="flex flex-wrap items-center gap-2">
              {activeTab === "roles" ? (
                <button
                  type="button"
                  onClick={handleOpenCreateRole}
                  className="btn-primary py-2 px-4 text-xs font-bold"
                >
                  <span>+ Create Custom Role</span>
                </button>
              ) : activeTab === "users" ? (
                <>
                  <button
                    type="button"
                    onClick={() => handleOpenRegister("staff")}
                    className="btn-ghost py-2 px-3 text-xs"
                    title="Onboard Non-Teaching Staff"
                  >
                    <span>+ Add Staff</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleOpenRegister("teacher")}
                    className="btn-ghost py-2 px-3 text-xs"
                    title="Onboard Teacher or Faculty Member"
                  >
                    <span>+ Add Teacher</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleOpenRegister("student")}
                    className="btn-primary py-2 px-3.5 text-xs"
                    title="Enroll a new student"
                  >
                    <span>+ Add Student</span>
                  </button>
                </>
              ) : null}
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
                const isHeadmaster = u.roles.some((r) => r.key === "headmaster" || r.key === "principal");
                const isTeacher = u.roles.some((r) => r.key === "teacher");
                const isStudent = u.roles.some((r) => r.key === "student");
                const isStaff = !isTeacher && !isStudent && !isHeadmaster;

                return (
                  <div
                    key={u.id}
                    className="card p-4 space-y-3 border border-slate-800 bg-slate-900/90 hover:border-slate-700 transition flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-0.5 min-w-0">
                          <div className="text-sm font-bold text-white flex items-center gap-1.5 truncate">
                            {isHeadmaster && <span>👑</span>}
                            {isTeacher && <span>👩‍🏫</span>}
                            {isStaff && <span>💼</span>}
                            {isStudent && <span>🎓</span>}
                            <span className="truncate">{u.name}</span>
                          </div>
                          <div className="text-xs text-slate-400 font-mono truncate">{u.email}</div>
                        </div>

                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold border shrink-0 ${
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
                        <span className="text-slate-400 truncate">
                          {u.teacher?.designation || (isStudent ? "Student Scholar" : isHeadmaster ? "Principal" : "Staff Member")}
                        </span>
                        <span className="font-mono text-indigo-300 font-semibold shrink-0">
                          {u.teacher?.employeeId || u.student?.admissionNo || "—"}
                        </span>
                      </div>

                      {/* Role Badges */}
                      <div className="flex flex-wrap gap-1 pt-0.5">
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

                    {/* Actions bar for Principal */}
                    {canManage && (
                      <div className="pt-2.5 border-t border-slate-800/80 flex items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => handleOpenEditUser(u)}
                          className="flex items-center gap-1 text-[11px] font-semibold text-brand-400 hover:text-brand-300 transition"
                        >
                          <span>✏️ Edit &amp; Roles</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleToggleUserStatus(u)}
                          className={`text-[11px] font-semibold transition ${
                            u.isActive
                              ? "text-rose-400 hover:text-rose-300"
                              : "text-emerald-400 hover:text-emerald-300"
                          }`}
                        >
                          {u.isActive ? "🚫 Deactivate" : "🟢 Activate"}
                        </button>
                      </div>
                    )}
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
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-400">
              Configure granular module access (view, create, edit, delete) for custom school roles.
            </p>
            {canManage && (
              <button
                type="button"
                onClick={handleOpenCreateRole}
                className="btn-primary py-2 px-3.5 text-xs font-bold shrink-0"
              >
                + Create Custom Role
              </button>
            )}
          </div>

          {roleList.map((r) => (
            <Section
              key={r.id}
              title={r.name}
              action={
                <div className="flex items-center gap-2 flex-wrap">
                  {r.isSystem ? (
                    <Badge color="slate">System Protected</Badge>
                  ) : (
                    <Badge color="green">Custom Role</Badge>
                  )}
                  <span className="text-xs text-slate-400">{r.userCount} user(s)</span>

                  {canManage && (
                    <div className="flex items-center gap-1.5 ml-2">
                      <button
                        type="button"
                        onClick={() => handleOpenEditRole(r)}
                        className="px-2.5 py-1 text-xs rounded-lg border border-brand-500/30 bg-brand-500/10 hover:bg-brand-500/20 text-brand-300 font-semibold transition"
                        title="Configure page & module permissions"
                      >
                        ✏️ Edit Permissions
                      </button>
                      {!r.isSystem && (
                        <button
                          type="button"
                          onClick={() => handleDeleteRole(r)}
                          className="px-2.5 py-1 text-xs rounded-lg border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 font-semibold transition"
                          title="Delete this custom role"
                        >
                          🗑️ Delete
                        </button>
                      )}
                    </div>
                  )}
                </div>
              }
            >
              <p className="mb-3 text-sm text-slate-400">{r.description}</p>
              <div className="flex flex-wrap gap-1.5">
                {r.permissions.length === 0 && (
                  <span className="text-xs text-slate-500">No permissions granted. Click &quot;Edit Permissions&quot; to assign access.</span>
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

      {/* TAB 3: ORGANIZATION API KEYS */}
      {activeTab === "api-keys" && (
        <ApiKeysTab canManage={canManage} />
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

      {/* Role Permissions Modal (Create & Edit) */}
      <RolePermissionsModal
        isOpen={isRoleModalOpen}
        onClose={() => {
          setIsRoleModalOpen(false);
          setSelectedRoleToEdit(null);
        }}
        onSaveSuccess={() => {
          setIsRoleModalOpen(false);
          setSelectedRoleToEdit(null);
          window.location.reload();
        }}
        roleToEdit={selectedRoleToEdit}
      />

      {/* Edit User Details & Roles Modal */}
      <EditUserModal
        isOpen={isEditUserOpen}
        onClose={() => {
          setIsEditUserOpen(false);
          setSelectedUserToEdit(null);
        }}
        onSuccess={() => {
          setIsEditUserOpen(false);
          setSelectedUserToEdit(null);
          window.location.reload();
        }}
        user={selectedUserToEdit}
        availableRoles={roleList}
      />
    </div>
  );
}
