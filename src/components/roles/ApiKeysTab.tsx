"use client";

import { useState, useEffect } from "react";
import type { ApiKeyRecord } from "@/app/api/admin/api-keys/route";

const AVAILABLE_SCOPES = [
  { id: "students:read", name: "Read Student Directory", desc: "Access student bio-data, enrollment status, and parent contacts", icon: "👥" },
  { id: "attendance:read", name: "Read Attendance Registers", desc: "Query daily class and section attendance records", icon: "📋" },
  { id: "attendance:write", name: "Submit Attendance / Biometrics", desc: "Allow turnstiles or RFID readers to record check-in events", icon: "⏱️" },
  { id: "fees:read", name: "Read Fee Accounts & Invoices", desc: "Check student tuition balance, fee dues, and clearance status", icon: "💳" },
  { id: "transport:read", name: "Read Transport & Bus Telematics", desc: "Access school bus routes, fleet vehicle IDs, and pickup stops", icon: "🚌" },
];

export function ApiKeysTab({ canManage = true }: { canManage?: boolean }) {
  const [keys, setKeys] = useState<ApiKeyRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [isGenerateOpen, setIsGenerateOpen] = useState(false);

  // Form state
  const [keyName, setKeyName] = useState("");
  const [selectedScopes, setSelectedScopes] = useState<string[]>(["students:read", "attendance:read"]);
  const [expiryDays, setExpiryDays] = useState<number>(90);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // One-time Key Reveal State
  const [revealedKey, setRevealedKey] = useState<string | null>(null);
  const [revealedKeyRecord, setRevealedKeyRecord] = useState<ApiKeyRecord | null>(null);
  const [copied, setCopied] = useState(false);

  const fetchKeys = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/api-keys");
      const data = await res.json();
      if (data.success && data.keys) {
        setKeys(data.keys);
      }
    } catch (e) {
      console.warn("Could not fetch keys:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKeys();
  }, []);

  const toggleScope = (scopeId: string) => {
    setSelectedScopes((prev) =>
      prev.includes(scopeId) ? prev.filter((s) => s !== scopeId) : [...prev, scopeId]
    );
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyName.trim()) {
      setFormError("Please enter a descriptive name for this API key.");
      return;
    }
    if (selectedScopes.length === 0) {
      setFormError("Please select at least one permission scope.");
      return;
    }

    setSubmitting(true);
    setFormError(null);

    try {
      const res = await fetch("/api/admin/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: keyName.trim(),
          scopes: selectedScopes,
          expiryDays: expiryDays === 0 ? null : expiryDays,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to generate key");
      }

      setRevealedKey(data.apiKey);
      setRevealedKeyRecord(data.record);
      setIsGenerateOpen(false);
      setKeyName("");
      setSelectedScopes(["students:read", "attendance:read"]);
      fetchKeys();
    } catch (err: any) {
      setFormError(err.message || "Failed to generate API key.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRevoke = async (keyId: string, name: string) => {
    if (!confirm(`Are you sure you want to revoke the API key "${name}"? Any service using this key will immediately lose access.`)) {
      return;
    }

    try {
      const res = await fetch("/api/admin/api-keys", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyId }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        alert(data.error || "Failed to revoke key.");
        return;
      }
      fetchKeys();
    } catch (e) {
      alert("Network error revoking API key.");
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="space-y-5">
      {/* Informative Header Banner */}
      <div className="card p-5 border border-white/[0.08] bg-slate-900/60 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xl">🔑</span>
              <h3 className="text-base font-extrabold text-white font-display">
                Institutional Machine &amp; Organization API Keys
              </h3>
            </div>
            <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
              Principal Authority: Generate scoped Bearer tokens for internal school hardware and services
              including Biometric Turnstiles, RFID Library Desks, School Bus GPS Telematics, and LMS Mobile Apps.
            </p>
          </div>

          {canManage && (
            <button
              type="button"
              onClick={() => {
                setFormError(null);
                setIsGenerateOpen(true);
              }}
              className="btn-primary py-2.5 px-4 text-xs font-bold whitespace-nowrap shrink-0 shadow-lg"
            >
              <span>+ Generate New API Key</span>
            </button>
          )}
        </div>
      </div>

      {/* Keys Table / Grid */}
      <div className="card overflow-hidden border border-white/[0.08]">
        <div className="p-4 border-b border-white/[0.08] flex items-center justify-between bg-white/[0.02]">
          <div className="text-xs font-bold text-slate-300 uppercase tracking-wider font-display">
            Active School API Keys ({keys.length})
          </div>
          <div className="text-[11px] text-slate-400 font-mono">
            Authorization: Bearer gia_live_...
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-xs text-slate-400">Loading API credentials...</div>
        ) : keys.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-2">
            <div className="text-2xl">🔐</div>
            <div className="text-sm font-bold text-slate-300">No API keys created yet</div>
            <p className="text-xs text-slate-400">Generate an API key to connect biometric turnstiles or internal systems.</p>
          </div>
        ) : (
          <div className="divide-y divide-white/[0.05]">
            {keys.map((k) => (
              <div
                key={k.id}
                className={`p-4 transition hover:bg-white/[0.02] flex flex-col md:flex-row md:items-center md:justify-between gap-4 ${
                  k.status === "REVOKED" ? "opacity-60 bg-slate-950/40" : ""
                }`}
              >
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="text-sm font-bold text-white font-display">{k.name}</span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        k.status === "ACTIVE"
                          ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-300"
                          : "bg-rose-500/15 border-rose-500/30 text-rose-300"
                      }`}
                    >
                      {k.status}
                    </span>
                    <span className="font-mono text-xs bg-slate-950 px-2 py-0.5 rounded border border-white/[0.08] text-indigo-300">
                      {k.keyPrefix}••••••••••••••••
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {k.scopes.map((s) => (
                      <span
                        key={s}
                        className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-md bg-white/[0.04] border border-white/[0.08] text-slate-300"
                      >
                        <span className="text-brand-400">●</span> {s}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center gap-4 text-[11px] text-slate-400 pt-1 flex-wrap font-mono">
                    <span>Created: {new Date(k.createdAt).toLocaleDateString()}</span>
                    <span>•</span>
                    <span>
                      Expires:{" "}
                      {k.expiresAt
                        ? new Date(k.expiresAt).toLocaleDateString()
                        : "Never"}
                    </span>
                    <span>•</span>
                    <span>
                      Last used:{" "}
                      {k.lastUsedAt ? new Date(k.lastUsedAt).toLocaleDateString() : "Never"}
                    </span>
                  </div>
                </div>

                {canManage && k.status === "ACTIVE" && (
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleRevoke(k.id, k.name)}
                      className="px-3 py-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-xs font-bold transition"
                    >
                      Revoke Key
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MODAL 1: Generate New Key */}
      {isGenerateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="relative w-full max-w-lg rounded-3xl bg-slate-900 border border-white/[0.12] p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <div>
                <h3 className="text-base font-extrabold text-white font-display">Generate Organization API Key</h3>
                <p className="text-xs text-slate-400">Create an authenticated Bearer token for internal campus software.</p>
              </div>
              <button
                type="button"
                onClick={() => setIsGenerateOpen(false)}
                className="text-slate-400 hover:text-white text-lg font-bold p-1"
              >
                ✕
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-200 text-xs font-semibold">
                {formError}
              </div>
            )}

            <form onSubmit={handleGenerate} className="space-y-4 text-xs">
              <div>
                <label className="label">Key Description / Service Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. South Gate Biometric Scanner #2, Mobile App Backend"
                  value={keyName}
                  onChange={(e) => setKeyName(e.target.value)}
                  className="input text-xs"
                />
              </div>

              <div>
                <label className="label">Expiration Window</label>
                <select
                  value={expiryDays}
                  onChange={(e) => setExpiryDays(Number(e.target.value))}
                  className="input text-xs"
                >
                  <option value={30}>30 Days</option>
                  <option value={90}>90 Days (Recommended)</option>
                  <option value={180}>180 Days (Half Year)</option>
                  <option value={365}>1 Year (365 Days)</option>
                  <option value={0}>Never Expire (Permanent Internal Machine)</option>
                </select>
              </div>

              <div>
                <label className="label mb-2">Granted API Scopes (Least Privilege Access)</label>
                <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                  {AVAILABLE_SCOPES.map((sc) => {
                    const isChecked = selectedScopes.includes(sc.id);
                    return (
                      <label
                        key={sc.id}
                        className={`flex items-start gap-3 p-2.5 rounded-xl border transition cursor-pointer ${
                          isChecked
                            ? "bg-brand-500/10 border-brand-500/40 text-white"
                            : "bg-white/[0.02] border-white/[0.06] text-slate-300 hover:border-white/[0.12]"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleScope(sc.id)}
                          className="mt-0.5 h-4 w-4 rounded border-slate-700 text-brand-600 focus:ring-brand-500"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 font-bold text-xs">
                            <span>{sc.icon}</span>
                            <span>{sc.name}</span>
                            <span className="font-mono text-[10px] text-brand-300">({sc.id})</span>
                          </div>
                          <p className="text-[11px] text-slate-400 mt-0.5">{sc.desc}</p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/[0.08]">
                <button
                  type="button"
                  onClick={() => setIsGenerateOpen(false)}
                  className="btn-ghost py-2 px-4 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary py-2 px-5 text-xs font-bold"
                >
                  {submitting ? "Generating Key..." : "Generate Key ➔"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: One-Time Key Reveal Modal */}
      {revealedKey && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
          <div className="relative w-full max-w-xl rounded-3xl bg-slate-900 border border-emerald-500/30 p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-xl text-emerald-300">
                ✓
              </div>
              <div>
                <h3 className="text-base font-extrabold text-white font-display">
                  API Key Generated Successfully
                </h3>
                <p className="text-xs text-emerald-300">
                  {revealedKeyRecord?.name}
                </p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs">
              ⚠️ <strong>Save this key immediately!</strong> For security reasons, this raw token will never be displayed again.
            </div>

            {/* Token display box */}
            <div className="space-y-1">
              <label className="label">Live Bearer Token</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={revealedKey}
                  className="input font-mono text-xs text-indigo-300 bg-slate-950 select-all"
                />
                <button
                  type="button"
                  onClick={() => copyToClipboard(revealedKey)}
                  className="btn-primary py-2.5 px-4 text-xs font-bold whitespace-nowrap"
                >
                  {copied ? "✓ Copied!" : "Copy Key"}
                </button>
              </div>
            </div>

            {/* cURL Usage Snippet */}
            <div className="space-y-1 pt-2">
              <label className="label">Instant Verification cURL (Terminal)</label>
              <div className="rounded-xl bg-slate-950 border border-white/[0.08] p-3 text-[11px] font-mono text-slate-300 space-y-2 overflow-x-auto">
                <div className="text-slate-400"># 1. Fetch Students Directory via API:</div>
                <div className="text-cyan-300">
                  {`curl -H "Authorization: Bearer ${revealedKey}" http://localhost:3000/api/v1/students`}
                </div>
                <div className="text-slate-400 pt-1"># 2. Record Biometric Attendance:</div>
                <div className="text-emerald-300">
                  {`curl -X POST -H "Authorization: Bearer ${revealedKey}" -H "Content-Type: application/json" -d '{"admissionNo": "ADM-2026-089"}' http://localhost:3000/api/v1/attendance`}
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-white/[0.08]">
              <button
                type="button"
                onClick={() => {
                  setRevealedKey(null);
                  setRevealedKeyRecord(null);
                }}
                className="btn-primary py-2.5 px-6 text-xs font-bold"
              >
                I Have Safely Stored This Key
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
