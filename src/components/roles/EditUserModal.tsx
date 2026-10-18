"use client";

import { useState, useEffect } from "react";
import type { UserSummary, RoleSummary } from "./RolesDirectoryClient";

interface EditUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  user: UserSummary | null;
  availableRoles: RoleSummary[];
}

export function EditUserModal({
  isOpen,
  onClose,
  onSuccess,
  user,
  availableRoles,
}: EditUserModalProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [selectedRoleKeys, setSelectedRoleKeys] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setEmail(user.email);
      setIsActive(user.isActive);
      setSelectedRoleKeys(user.roles.map((r) => r.key));
      setError(null);
    }
  }, [user, isOpen]);

  const toggleRole = (key: string) => {
    setSelectedRoleKeys((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (selectedRoleKeys.length === 0) {
      setError("Please assign at least one role to the user.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: user.id,
          name: name.trim(),
          email: email.trim(),
          isActive,
          roleKeys: selectedRoleKeys,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to update user.");
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to update user.");
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-3xl bg-slate-900 border border-slate-800 text-slate-100 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 bg-slate-950/70 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-500/15 border border-brand-500/30 text-xl text-brand-400">
              👤
            </span>
            <div>
              <h3 className="text-base font-black tracking-tight text-white font-display">
                Edit User Account
              </h3>
              <p className="text-xs text-slate-400">
                Modify personal details, active login status, and role assignments.
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

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-5 sm:p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-semibold flex items-center gap-2">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              Full Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-xs text-white focus:border-brand-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              Email Address *
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-xs text-white focus:border-brand-500 focus:outline-none"
            />
          </div>

          {/* Active Status Switch */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
            <div>
              <span className="block text-xs font-bold text-white">
                Account Login Access
              </span>
              <span className="text-[11px] text-slate-400">
                {isActive ? "User can log in normally" : "Account suspended / barred from logging in"}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsActive(!isActive)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                isActive ? "bg-emerald-600" : "bg-slate-700"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  isActive ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>

          {/* Role Assignment Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              Assigned Roles (Select All Applicable) *
            </label>
            <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto p-1">
              {availableRoles.map((r) => {
                const isSelected = selectedRoleKeys.includes(r.key);
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => toggleRole(r.key)}
                    className={`flex items-center justify-between p-2.5 rounded-xl border text-xs font-semibold transition-all ${
                      isSelected
                        ? "bg-brand-500/20 border-brand-500/40 text-brand-300"
                        : "bg-slate-950 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700"
                    }`}
                  >
                    <span className="truncate">{r.name}</span>
                    <span>{isSelected ? "✓" : "+"}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2.5">
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
              className="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold shadow-sm transition disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save User"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
