"use client";

import { useState, useEffect } from "react";

export interface PermissionDefinition {
  id: string;
  name: string;
  module: string;
  resource: string;
  description: string;
  icon: string;
  category: "Academic" | "Operations" | "Finance & Admin";
}

export const SYSTEM_MODULE_PERMISSIONS: PermissionDefinition[] = [
  // Academic
  {
    id: "students",
    name: "Student Directory & Profiles",
    module: "students",
    resource: "personal_info",
    description: "View and manage student bio-data, enrollments, and guardians.",
    icon: "👥",
    category: "Academic",
  },
  {
    id: "attendance",
    name: "Attendance Registers",
    module: "attendance",
    resource: "student",
    description: "Mark, review, and report daily student attendance.",
    icon: "📅",
    category: "Academic",
  },
  {
    id: "homework",
    name: "Homework Portal",
    module: "homework",
    resource: "assignment",
    description: "Create homework, attach rubrics, and grade submissions.",
    icon: "📝",
    category: "Academic",
  },
  {
    id: "notes",
    name: "Subject Notes & Materials",
    module: "knowledge",
    resource: "notes",
    description: "Upload and publish lecture notes, PDFs, and syllabus guides.",
    icon: "📚",
    category: "Academic",
  },
  {
    id: "results",
    name: "Results & Marksheets",
    module: "exams",
    resource: "results",
    description: "Enter examination scores, GPA calculation, and print report cards.",
    icon: "📈",
    category: "Academic",
  },
  {
    id: "timetable",
    name: "Class Timetable Schedules",
    module: "academics",
    resource: "timetable",
    description: "Configure subject periods, classrooms, and teacher timings.",
    icon: "⏰",
    category: "Academic",
  },
  // Operations
  {
    id: "transport",
    name: "Transport & Bus Routes",
    module: "transport",
    resource: "routes",
    description: "Bus routes, vehicle fleet tracking, stops, and driver contacts.",
    icon: "🚌",
    category: "Operations",
  },
  {
    id: "library",
    name: "Library Catalog & Books",
    module: "library",
    resource: "books",
    description: "Book checkout, return tracking, and library inventory.",
    icon: "📖",
    category: "Operations",
  },
  {
    id: "activities",
    name: "Co-Curricular Activities",
    module: "activities",
    resource: "activity",
    description: "Sports clubs, cultural events, and inter-school competitions.",
    icon: "⚡",
    category: "Operations",
  },
  {
    id: "announcements",
    name: "Campus Announcements",
    module: "announcements",
    resource: "announcement",
    description: "Broadcast circulars, notices, and exam schedules to campus.",
    icon: "📢",
    category: "Operations",
  },
  // Finance & Admin
  {
    id: "fees",
    name: "Fee Invoicing & Accounts",
    module: "finance",
    resource: "invoice",
    description: "Generate student fee invoices, collect dues, and issue receipts.",
    icon: "💳",
    category: "Finance & Admin",
  },
  {
    id: "copilot",
    name: "AI Academic Copilot",
    module: "copilot",
    resource: "assistant",
    description: "AI quiz generation, report card remarks, and study assistance.",
    icon: "🤖",
    category: "Finance & Admin",
  },
  {
    id: "admin_roles",
    name: "Staff & Role Management",
    module: "admin",
    resource: "roles",
    description: "Principal authority to onboard staff and customize roles.",
    icon: "🛡️",
    category: "Finance & Admin",
  },
  {
    id: "audit",
    name: "Audit & Security Logs",
    module: "admin",
    resource: "audit",
    description: "Track system access, logins, permission updates, and payments.",
    icon: "📜",
    category: "Finance & Admin",
  },
];

interface RoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveSuccess: () => void;
  roleToEdit?: {
    id: string;
    name: string;
    key: string;
    description: string | null;
    isSystem: boolean;
    permissions: Array<{ module: string; resource: string; action: string; scope: string }>;
  } | null;
}

export function RolePermissionsModal({
  isOpen,
  onClose,
  onSaveSuccess,
  roleToEdit,
}: RoleModalProps) {
  const isEditing = Boolean(roleToEdit);

  const [name, setName] = useState("");
  const [key, setKey] = useState("");
  const [description, setDescription] = useState("");
  const [selectedPermissions, setSelectedPermissions] = useState<Record<string, { view: boolean; edit: boolean }>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize form state
  useEffect(() => {
    if (roleToEdit) {
      setName(roleToEdit.name);
      setKey(roleToEdit.key);
      setDescription(roleToEdit.description || "");

      const permMap: Record<string, { view: boolean; edit: boolean }> = {};
      SYSTEM_MODULE_PERMISSIONS.forEach((def) => {
        const hasView = roleToEdit.permissions.some(
          (p) => p.module === def.module && p.resource === def.resource && (p.action === "view" || p.action === "*")
        );
        const hasEdit = roleToEdit.permissions.some(
          (p) => p.module === def.module && p.resource === def.resource && (p.action === "edit" || p.action === "create" || p.action === "*")
        );
        permMap[def.id] = { view: hasView, edit: hasEdit };
      });
      setSelectedPermissions(permMap);
    } else {
      setName("");
      setKey("");
      setDescription("");
      const emptyMap: Record<string, { view: boolean; edit: boolean }> = {};
      SYSTEM_MODULE_PERMISSIONS.forEach((def) => {
        emptyMap[def.id] = { view: false, edit: false };
      });
      setSelectedPermissions(emptyMap);
    }
    setError(null);
  }, [roleToEdit, isOpen]);

  // Auto-generate machine key from name when creating
  const handleNameChange = (val: string) => {
    setName(val);
    if (!isEditing) {
      const generated = val
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "_")
        .replace(/^_+|_+$/g, "");
      setKey(generated);
    }
  };

  const togglePermission = (id: string, type: "view" | "edit") => {
    setSelectedPermissions((prev) => {
      const current = prev[id] || { view: false, edit: false };
      const nextVal = !current[type];
      return {
        ...prev,
        [id]: {
          ...current,
          [type]: nextVal,
          // If enabling edit, also enable view
          ...(type === "edit" && nextVal ? { view: true } : {}),
          // If disabling view, also disable edit
          ...(type === "view" && !nextVal ? { edit: false } : {}),
        },
      };
    });
  };

  const handleSelectAll = (select: boolean) => {
    const nextMap: Record<string, { view: boolean; edit: boolean }> = {};
    SYSTEM_MODULE_PERMISSIONS.forEach((def) => {
      nextMap[def.id] = { view: select, edit: select };
    });
    setSelectedPermissions(nextMap);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Please enter a role name.");
      return;
    }

    setSaving(true);
    setError(null);

    // Transform selected permissions to API array
    const permissionsPayload: Array<{ module: string; resource: string; action: string; scope: string }> = [];

    SYSTEM_MODULE_PERMISSIONS.forEach((def) => {
      const perms = selectedPermissions[def.id];
      if (perms?.view) {
        permissionsPayload.push({
          module: def.module,
          resource: def.resource,
          action: "view",
          scope: "SCHOOL",
        });
      }
      if (perms?.edit) {
        permissionsPayload.push({
          module: def.module,
          resource: def.resource,
          action: "edit",
          scope: "SCHOOL",
        });
      }
    });

    try {
      const url = "/api/admin/roles";
      const method = isEditing ? "PUT" : "POST";
      const body = isEditing
        ? { id: roleToEdit!.id, name, description, permissions: permissionsPayload }
        : { name, key, description, permissions: permissionsPayload };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to save role.");
      }

      onSaveSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "An error occurred while saving the role.");
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-5 animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl max-h-[92vh] flex flex-col rounded-3xl bg-slate-900 border border-slate-800 text-slate-100 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="shrink-0 p-5 sm:p-6 border-b border-slate-800 bg-slate-950/70 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-500/15 border border-brand-500/30 text-xl text-brand-400">
              🛡️
            </span>
            <div>
              <h3 className="text-base sm:text-lg font-black tracking-tight text-white font-display">
                {isEditing ? `Edit Role: ${roleToEdit?.name}` : "Create Custom Institutional Role"}
              </h3>
              <p className="text-xs text-slate-400">
                Configure custom page and module permissions for faculty or staff members.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-xl bg-white/[0.06] text-slate-400 hover:text-white flex items-center justify-center transition"
          >
            ✕
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSave} className="overflow-y-auto flex-1 p-5 sm:p-6 space-y-5">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-semibold flex items-center gap-2">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {/* Basic Role Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-950/50 p-4 rounded-2xl border border-slate-800/80">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Role Display Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Senior Librarian, Lab Assistant"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:border-brand-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Machine Key (System Identifier) *
              </label>
              <input
                type="text"
                required
                disabled={isEditing}
                placeholder="e.g. senior_librarian"
                value={key}
                onChange={(e) => setKey(e.target.value)}
                className={`w-full rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2 text-xs text-white font-mono placeholder-slate-500 focus:border-brand-500 focus:outline-none ${
                  isEditing ? "opacity-60 cursor-not-allowed" : ""
                }`}
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Role Purpose / Description
              </label>
              <input
                type="text"
                placeholder="e.g. Full oversight of campus books, student borrowing limits, and library catalog."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:border-brand-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Granular Page & Module Access Section */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider text-brand-300 flex items-center gap-1.5">
                  <span>📑</span> Modular Page Access & Permissions
                </h4>
                <p className="text-[11px] text-slate-400">
                  Select which pages and modules this role is authorized to view and modify.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleSelectAll(true)}
                  className="px-2.5 py-1 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-[11px] font-bold text-slate-300 transition"
                >
                  ✓ Select All
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectAll(false)}
                  className="px-2.5 py-1 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-[11px] font-bold text-slate-300 transition"
                >
                  ✕ Clear All
                </button>
              </div>
            </div>

            {/* Permissions Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {SYSTEM_MODULE_PERMISSIONS.map((item) => {
                const perms = selectedPermissions[item.id] || { view: false, edit: false };
                const isSelected = perms.view || perms.edit;

                return (
                  <div
                    key={item.id}
                    className={`p-3.5 rounded-2xl border transition-all ${
                      isSelected
                        ? "bg-brand-950/25 border-brand-500/40 shadow-sm"
                        : "bg-slate-950/30 border-slate-800/80 hover:border-slate-700"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-base">{item.icon}</span>
                        <div>
                          <span className="block text-xs font-bold text-white leading-tight">
                            {item.name}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {item.module}.{item.resource}
                          </span>
                        </div>
                      </div>
                      <span className="text-[9px] font-mono px-2 py-0.5 rounded-md bg-white/[0.05] border border-white/10 text-slate-400">
                        {item.category}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-400 mb-3 line-clamp-1">
                      {item.description}
                    </p>

                    {/* View and Edit Toggles */}
                    <div className="flex items-center gap-3 pt-2 border-t border-white/[0.06]">
                      <label className="flex items-center gap-1.5 cursor-pointer text-xs font-semibold text-slate-300 hover:text-white">
                        <input
                          type="checkbox"
                          checked={perms.view}
                          onChange={() => togglePermission(item.id, "view")}
                          className="rounded border-slate-700 bg-slate-900 text-brand-600 focus:ring-brand-500"
                        />
                        <span>View Page</span>
                      </label>

                      <label className="flex items-center gap-1.5 cursor-pointer text-xs font-semibold text-slate-300 hover:text-white">
                        <input
                          type="checkbox"
                          checked={perms.edit}
                          onChange={() => togglePermission(item.id, "edit")}
                          className="rounded border-slate-700 bg-slate-900 text-brand-600 focus:ring-brand-500"
                        />
                        <span className="text-emerald-400 font-bold">Edit / Manage</span>
                      </label>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="shrink-0 pt-4 border-t border-slate-800 flex items-center justify-between">
            <span className="text-[11px] text-slate-400">
              * Changes apply in real-time across role-based session contexts.
            </span>
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl border border-slate-700 text-xs font-bold text-slate-300 hover:bg-slate-800 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold shadow-sm transition flex items-center gap-1.5 disabled:opacity-50"
              >
                {saving ? "Saving Role..." : isEditing ? "Save Role Changes" : "Create Role"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
