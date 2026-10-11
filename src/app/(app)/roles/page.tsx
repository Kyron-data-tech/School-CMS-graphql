import { getAuthContext } from "@/lib/auth/context";
import { assertCan, can } from "@/lib/permissions/engine";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/ui";
import { RolesDirectoryClient } from "@/components/roles/RolesDirectoryClient";

export default async function RolesPage() {
  const ctx = (await getAuthContext())!;
  assertCan(ctx, "admin", "roles", "view");

  const [roles, users] = await Promise.all([
    db.role.findMany({
      where: { schoolId: ctx.schoolId },
      include: {
        permissions: { orderBy: [{ module: "asc" }, { resource: "asc" }] },
        _count: { select: { userRoles: true } },
      },
      orderBy: { name: "asc" },
    }),
    db.user.findMany({
      where: { schoolId: ctx.schoolId },
      include: {
        userRoles: { include: { role: true } },
        teacher: { select: { employeeId: true, designation: true } },
        student: { select: { admissionNo: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
  ]);

  const canManage =
    can(ctx, "admin", "roles", "edit") ||
    can(ctx, "admin", "roles", "create") ||
    ctx.roleKeys.includes("headmaster") ||
    ctx.roleKeys.includes("admin") ||
    ctx.roleKeys.includes("principal");

  const formattedUsers = users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    isActive: u.isActive,
    createdAt: u.createdAt,
    roles: u.userRoles.map((ur) => ({
      id: ur.role.id,
      name: ur.role.name,
      key: ur.role.key,
    })),
    teacher: u.teacher,
    student: u.student,
  }));

  const formattedRoles = roles.map((r) => ({
    id: r.id,
    name: r.name,
    key: r.key,
    description: r.description,
    isSystem: r.isSystem,
    userCount: r._count.userRoles,
    permissions: r.permissions.map((p) => ({
      id: p.id,
      module: p.module,
      resource: p.resource,
      action: p.action,
      scope: p.scope,
    })),
  }));

  return (
    <div className="space-y-5">
      <PageHeader
        title="Users, Staff & Roles Management"
        subtitle="Principal Authority: Onboard and manage teachers, non-teaching staff, students, and administrators with role-based access control."
      />

      <RolesDirectoryClient
        users={formattedUsers}
        roles={formattedRoles}
        canManage={canManage}
      />
    </div>
  );
}

