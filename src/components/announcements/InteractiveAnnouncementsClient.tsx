"use client";

import { useState, useMemo, useTransition } from "react";
import { Badge } from "@/components/ui";
import { gqlRequest, GQL_MUTATIONS } from "@/lib/graphql/client";
import { fmtDate } from "@/lib/dates";
import Link from "next/link";

export type AnnouncementAudience =
  | "ALL_USERS"
  | "TEACHERS"
  | "STAFF"
  | "STUDENTS"
  | "PARENTS"
  | "PUBLIC"
  | "ROLE"
  | "SECTION";

export interface AnnouncementItem {
  id: string;
  title: string;
  body: string;
  audience: string;
  priority: number;
  publishAt: string;
  authorName?: string;
}

export function InteractiveAnnouncementsClient({
  initialAnnouncements,
  canCreate,
  userRole,
}: {
  initialAnnouncements: AnnouncementItem[];
  canCreate: boolean;
  userRole: string;
}) {
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>(initialAnnouncements);
  const [search, setSearch] = useState("");
  const [audienceFilter, setAudienceFilter] = useState<string>("ALL");
  const [pinnedIds, setPinnedIds] = useState<Set<string>>(new Set());
  const [readIds, setReadIds] = useState<Set<string>>(new Set());

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [audience, setAudience] = useState<AnnouncementAudience>("ALL_USERS");
  const [isUrgent, setIsUrgent] = useState(false);

  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Filter logic
  const filteredList = useMemo(() => {
    return announcements
      .filter((a) => {
        const q = search.toLowerCase().trim();
        const matchesSearch =
          !q || a.title.toLowerCase().includes(q) || a.body.toLowerCase().includes(q);

        if (!matchesSearch) return false;

        if (audienceFilter === "URGENT") {
          if (a.priority <= 0) return false;
        } else if (audienceFilter !== "ALL") {
          if (a.audience !== audienceFilter) return false;
        }

        return true;
      })
      .sort((a, b) => {
        // Pinned first
        const aPinned = pinnedIds.has(a.id) ? 1 : 0;
        const bPinned = pinnedIds.has(b.id) ? 1 : 0;
        if (aPinned !== bPinned) return bPinned - aPinned;

        // Then priority
        if (a.priority !== b.priority) return b.priority - a.priority;

        // Then date
        return new Date(b.publishAt).getTime() - new Date(a.publishAt).getTime();
      });
  }, [announcements, search, audienceFilter, pinnedIds]);

  // Toggle Pin
  const togglePin = (id: string) => {
    setPinnedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Toggle Read
  const toggleRead = (id: string) => {
    setReadIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Copy notice
  const copyNotice = (a: AnnouncementItem) => {
    navigator.clipboard.writeText(`${a.title}\n\n${a.body}\n\nPublished: ${fmtDate(a.publishAt)}`);
    setFeedback({ type: "success", message: `Copied "${a.title}" to clipboard!` });
  };

  // Handle Broadcast via GraphQL
  const handleCreateAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) return;

    startTransition(async () => {
      setFeedback(null);
      try {
        const data = await gqlRequest(GQL_MUTATIONS.CREATE_ANNOUNCEMENT, {
          input: {
            title: title.trim(),
            body: body.trim(),
            audience,
          },
        });

        const createdId = data.createAnnouncement?.id || `ann-${Date.now()}`;
        const newNotice: AnnouncementItem = {
          id: createdId,
          title: title.trim(),
          body: body.trim(),
          audience,
          priority: isUrgent ? 1 : 0,
          publishAt: new Date().toISOString(),
          authorName: "School Administration",
        };

        setAnnouncements((prev) => [newNotice, ...prev]);
        setIsModalOpen(false);
        setTitle("");
        setBody("");
        setIsUrgent(false);
        setFeedback({
          type: "success",
          message: `Announcement broadcast successfully via GraphQL to ${audience}!`,
        });
      } catch (err: any) {
        setFeedback({
          type: "error",
          message: err.message || "Failed to create announcement via GraphQL.",
        });
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* ── METRICS & AI BANNER ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card p-4 flex items-center justify-between border-l-4 border-l-brand-600">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Bulletins</div>
            <div className="text-2xl font-bold text-slate-800 mt-1">{announcements.length}</div>
          </div>
          <div className="h-10 w-10 rounded-xl bg-brand-50 flex items-center justify-center text-brand-600 font-bold text-lg">
            📢
          </div>
        </div>

        <div className="card p-4 flex items-center justify-between border-l-4 border-l-rose-500">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">Urgent Notices</div>
            <div className="text-2xl font-bold text-rose-600 mt-1">
              {announcements.filter((a) => a.priority > 0).length}
            </div>
          </div>
          <div className="h-10 w-10 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600 font-bold text-lg">
            🚨
          </div>
        </div>

        <div className="card p-4 flex items-center justify-between border-l-4 border-l-emerald-500">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">AI Assistant</div>
            <Link
              href="/copilot"
              className="text-xs font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1 mt-1"
            >
              Draft Circulars ↗
            </Link>
          </div>
          <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 font-bold text-lg">
            ✨
          </div>
        </div>
      </div>

      {/* ── TOOLBAR: SEARCH, AUDIENCE FILTER & BROADCAST BUTTON ── */}
      <div className="card p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[240px]">
            <input
              type="text"
              placeholder="Search announcements..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input pl-8 text-xs py-1.5 w-full"
            />
            <svg
              className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-1 border border-slate-200 rounded-lg p-0.5 bg-slate-50">
            {[
              { id: "ALL", label: "All" },
              { id: "URGENT", label: "Urgent" },
              { id: "ALL_USERS", label: "Campus-Wide" },
              { id: "STUDENTS", label: "Students" },
              { id: "TEACHERS", label: "Teachers" },
              { id: "PARENTS", label: "Parents" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setAudienceFilter(tab.id)}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                  audienceFilter === tab.id
                    ? "bg-white text-slate-900 shadow-sm font-semibold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Action Button: Broadcast Announcement */}
        {canCreate && (
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="btn-primary text-xs py-2 px-4 flex items-center justify-center gap-2 shadow-sm shrink-0"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Broadcast Announcement (GraphQL)
          </button>
        )}
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`p-3.5 rounded-xl text-xs font-medium flex items-center justify-between transition-all ${
            feedback.type === "success"
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
              : "bg-rose-50 text-rose-800 border border-rose-200"
          }`}
        >
          <div className="flex items-center gap-2">
            <span>{feedback.type === "success" ? "✓" : "⚠️"}</span>
            <span>{feedback.message}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-slate-400 hover:text-slate-700 ml-4 font-bold">
            ✕
          </button>
        </div>
      )}

      {/* ── ANNOUNCEMENTS FEED ── */}
      {filteredList.length === 0 ? (
        <div className="card p-12 text-center text-slate-500">
          <div className="text-3xl mb-2">📢</div>
          <p className="font-semibold text-slate-700">No announcements match your search</p>
          <p className="text-xs text-slate-400 mt-1">Clear filters to view all institutional broadcasts.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredList.map((a) => {
            const isPinned = pinnedIds.has(a.id);
            const isRead = readIds.has(a.id);

            return (
              <article
                key={a.id}
                className={`card p-5 transition-all duration-200 border-l-4 relative ${
                  a.priority > 0
                    ? "border-l-rose-500 bg-rose-50/10"
                    : isPinned
                    ? "border-l-brand-600 bg-brand-50/10"
                    : "border-l-slate-300"
                } ${isRead ? "opacity-75" : "opacity-100"}`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-100">
                  <div className="flex flex-wrap items-center gap-2">
                    {isPinned && <Badge color="indigo">📌 Pinned</Badge>}
                    {a.priority > 0 && <Badge color="red">🚨 Important Notice</Badge>}
                    <Badge color="blue">{a.audience}</Badge>
                    {isRead && <span className="text-[11px] text-slate-400 italic">Read</span>}
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400">{fmtDate(a.publishAt)}</span>
                    <button
                      type="button"
                      onClick={() => togglePin(a.id)}
                      className={`p-1 rounded text-xs transition-colors ${
                        isPinned ? "text-brand-600 font-bold" : "text-slate-400 hover:text-slate-600"
                      }`}
                      title={isPinned ? "Unpin notice" : "Pin notice to top"}
                    >
                      📌
                    </button>
                    <button
                      type="button"
                      onClick={() => copyNotice(a)}
                      className="p-1 rounded text-xs text-slate-400 hover:text-slate-600 transition-colors"
                      title="Copy notice text"
                    >
                      📋
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleRead(a.id)}
                      className="p-1 rounded text-xs text-slate-400 hover:text-slate-600 transition-colors"
                      title={isRead ? "Mark unread" : "Mark as read"}
                    >
                      {isRead ? "👁️‍🗨️" : "✓"}
                    </button>
                  </div>
                </div>

                <h2 className="mt-3 font-bold text-base text-slate-900">{a.title}</h2>
                <div className="mt-2 text-xs text-slate-700 leading-relaxed whitespace-pre-line">
                  {a.body}
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* ── MODAL: BROADCAST ANNOUNCEMENT ── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 space-y-4 border border-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <span>📢</span> Broadcast Announcement (GraphQL)
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateAnnouncement} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Target Audience</label>
                <select
                  value={audience}
                  onChange={(e) => setAudience(e.target.value as AnnouncementAudience)}
                  className="input w-full"
                  required
                >
                  <option value="ALL_USERS">All Campus Users (Public & Internal)</option>
                  <option value="STUDENTS">Students Only</option>
                  <option value="TEACHERS">Teachers & Faculty Only</option>
                  <option value="PARENTS">Parents & Guardians Only</option>
                  <option value="STAFF">Administrative Staff</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Bulletin Title</label>
                <input
                  type="text"
                  placeholder="e.g. Annual Sports Meet 2026 Schedule & Guidelines"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="input w-full"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Message Content</label>
                <textarea
                  placeholder="Write clear circular body, schedules, instructions, or attach links..."
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  className="input w-full h-32"
                  required
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="urgentNotice"
                  checked={isUrgent}
                  onChange={(e) => setIsUrgent(e.target.checked)}
                  className="h-4 w-4 text-brand-600 rounded border-slate-300 focus:ring-brand-500"
                />
                <label htmlFor="urgentNotice" className="text-xs font-semibold text-slate-700 select-none cursor-pointer">
                  Mark as High Priority / Urgent Bulletin 🚨
                </label>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <Link
                  href="/copilot"
                  className="text-brand-600 hover:text-brand-700 font-semibold flex items-center gap-1"
                >
                  ✨ AI Draft Assistant
                </Link>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="btn-ghost"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isPending}
                    className="btn-primary py-2 px-4 shadow-sm"
                  >
                    {isPending ? "Broadcasting..." : "Broadcast Notice"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
