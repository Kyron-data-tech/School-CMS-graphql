"use client";

import { useState, useMemo, useTransition } from "react";
import { Badge } from "@/components/ui";
import { gqlRequest, GQL_MUTATIONS } from "@/lib/graphql/client";
import { fmtDate } from "@/lib/dates";
import { calculateDeadlineStatus } from "@/domain/homework/deadline-engine";

export interface SubjectOfferingOption {
  id: string;
  subjectName: string;
  sectionName: string;
  gradeName: string;
}

export interface HomeworkSubmissionItem {
  id: string;
  studentId: string;
  studentName: string;
  status: "ASSIGNED" | "SUBMITTED" | "LATE" | "REVIEWED" | "MISSING";
  submittedAt?: string;
  marks?: number | null;
  comment?: string | null;
  fileUrl?: string | null;
  feedback?: string | null;
}

export interface HomeworkCardItem {
  id: string;
  title: string;
  description?: string | null;
  dueAt: string;
  publishAt: string;
  maxMarks?: number | null;
  offeringId: string;
  subjectName: string;
  gradeName: string;
  sectionName: string;
  teacherName: string;
  type?: "HOMEWORK" | "QUIZ" | "TEST";
  isStrictDeadline?: boolean;
  timeLimitMinutes?: number;
  submissions: HomeworkSubmissionItem[];
}

export function InteractiveHomeworkClient({
  homeworkList: initialList,
  offerings,
  canCreate,
  canSubmit,
  currentStudentId,
  currentRole,
}: {
  homeworkList: HomeworkCardItem[];
  offerings: SubjectOfferingOption[];
  canCreate: boolean;
  canSubmit: boolean;
  currentStudentId?: string;
  currentRole: string;
}) {
  const [homeworkList, setHomeworkList] = useState<HomeworkCardItem[]>(initialList);
  const [filterTab, setFilterTab] = useState<"ALL" | "ACTIVE" | "QUIZZES_TESTS" | "PAST_DUE" | "SUBMITTED">("ALL");
  const [search, setSearch] = useState("");
  const [selectedSubject, setSelectedSubject] = useState<string>("ALL");

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isSubmitOpen, setIsSubmitOpen] = useState(false);
  const [selectedHwToSubmit, setSelectedHwToSubmit] = useState<HomeworkCardItem | null>(null);
  const [activeReviewHw, setActiveReviewHw] = useState<HomeworkCardItem | null>(null);

  // Form State: Create Homework / Quiz / Test
  const [newOfferingId, setNewOfferingId] = useState(offerings[0]?.id || "");
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newMaxMarks, setNewMaxMarks] = useState<number>(20);
  const [newAssignmentType, setNewAssignmentType] = useState<"HOMEWORK" | "QUIZ" | "TEST">("HOMEWORK");
  const [newIsStrictDeadline, setNewIsStrictDeadline] = useState<boolean>(true);
  const [newTimeLimitMinutes, setNewTimeLimitMinutes] = useState<string>("30");
  const [newDueAt, setNewDueAt] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 3);
    d.setHours(18, 0, 0, 0);
    return d.toISOString().slice(0, 16);
  });

  // Form State: Submit Homework
  const [submitComment, setSubmitComment] = useState("");
  const [submitFileUrl, setSubmitFileUrl] = useState("");

  // Transition & Feedback
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Distinct subjects for filter
  const subjectList = useMemo(() => {
    const set = new Set(homeworkList.map((h) => h.subjectName));
    return Array.from(set);
  }, [homeworkList]);

  // Filtered Homework
  const filteredList = useMemo(() => {
    const now = new Date().getTime();

    return homeworkList.filter((h) => {
      // Search
      const q = search.toLowerCase().trim();
      const matchesSearch =
        !q ||
        h.title.toLowerCase().includes(q) ||
        h.subjectName.toLowerCase().includes(q) ||
        (h.description && h.description.toLowerCase().includes(q)) ||
        h.teacherName.toLowerCase().includes(q);

      if (!matchesSearch) return false;

      // Subject Filter
      if (selectedSubject !== "ALL" && h.subjectName !== selectedSubject) return false;

      // Status Tab Filter
      const dueDate = new Date(h.dueAt).getTime();
      const isPast = dueDate < now;

      // Check student submission status if student
      const userSub = currentStudentId
        ? h.submissions.find((s) => s.studentId === currentStudentId)
        : null;

      if (filterTab === "ACTIVE") {
        if (isPast) return false;
        if (userSub && (userSub.status === "SUBMITTED" || userSub.status === "REVIEWED")) return false;
      } else if (filterTab === "QUIZZES_TESTS") {
        if (h.type !== "QUIZ" && h.type !== "TEST") return false;
      } else if (filterTab === "PAST_DUE") {
        if (!isPast) return false;
      } else if (filterTab === "SUBMITTED") {
        if (!userSub || (userSub.status !== "SUBMITTED" && userSub.status !== "REVIEWED")) return false;
      }

      return true;
    });
  }, [homeworkList, search, selectedSubject, filterTab, currentStudentId]);

  // Handle Create Homework (GraphQL)
  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newOfferingId) return;

    startTransition(async () => {
      setFeedback(null);
      try {
        const off = offerings.find((o) => o.id === newOfferingId);
        const dueIso = new Date(newDueAt).toISOString();

        const data = await gqlRequest(GQL_MUTATIONS.CREATE_HOMEWORK, {
          input: {
            offeringId: newOfferingId,
            title: newTitle.trim(),
            description: newDescription.trim() || undefined,
            maxMarks: Number(newMaxMarks),
            dueAt: dueIso,
          },
        });

        const createdId = data.createHomework?.id || `hw-${Date.now()}`;

        // Optimistically prepend to list
        const newCard: HomeworkCardItem = {
          id: createdId,
          title: newTitle.trim(),
          description: newDescription.trim(),
          dueAt: dueIso,
          publishAt: new Date().toISOString(),
          maxMarks: Number(newMaxMarks),
          offeringId: newOfferingId,
          subjectName: off?.subjectName || "Subject",
          gradeName: off?.gradeName || "Class",
          sectionName: off?.sectionName || "Section",
          teacherName: "You (Teacher)",
          type: newAssignmentType,
          isStrictDeadline: newIsStrictDeadline,
          timeLimitMinutes: newTimeLimitMinutes ? Number(newTimeLimitMinutes) : undefined,
          submissions: [],
        };

        setHomeworkList((prev) => [newCard, ...prev]);
        setIsCreateOpen(false);
        setNewTitle("");
        setNewDescription("");
        setFeedback({ type: "success", message: `Assignment "${newCard.title}" published successfully!` });
      } catch (err: any) {
        setFeedback({
          type: "error",
          message: err.message || "Failed to create assignment.",
        });
      }
    });
  };

  // Handle Submit Homework (GraphQL)
  const handleStudentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedHwToSubmit || !currentStudentId) return;

    startTransition(async () => {
      setFeedback(null);
      try {
        await gqlRequest(GQL_MUTATIONS.SUBMIT_HOMEWORK, {
          input: {
            homeworkId: selectedHwToSubmit.id,
            studentId: currentStudentId,
            comment: submitComment.trim() || undefined,
            fileUrl: submitFileUrl.trim() || undefined,
          },
        });

        // Optimistically update status
        setHomeworkList((prev) =>
          prev.map((h) => {
            if (h.id !== selectedHwToSubmit.id) return h;
            const existingSub = h.submissions.find((s) => s.studentId === currentStudentId);
            const updatedSub: HomeworkSubmissionItem = {
              id: existingSub?.id || `sub-${Date.now()}`,
              studentId: currentStudentId,
              studentName: "You",
              status: "SUBMITTED",
              submittedAt: new Date().toISOString(),
              comment: submitComment.trim(),
              fileUrl: submitFileUrl.trim(),
            };

            const otherSubs = h.submissions.filter((s) => s.studentId !== currentStudentId);
            return {
              ...h,
              submissions: [...otherSubs, updatedSub],
            };
          })
        );

        setIsSubmitOpen(false);
        setSubmitComment("");
        setSubmitFileUrl("");
        setFeedback({
          type: "success",
          message: `Submission recorded for "${selectedHwToSubmit.title}"!`,
        });
      } catch (err: any) {
        setFeedback({
          type: "error",
          message: err.message || "Failed to submit assignment.",
        });
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* ── HEADER ACTION ROW & STATS ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card p-4 flex items-center justify-between border-l-4 border-l-brand-600">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Homework</div>
            <div className="text-2xl font-bold text-white mt-1">{homeworkList.length}</div>
          </div>
          <div className="h-10 w-10 rounded-xl bg-brand-950/80 border border-brand-800/60 flex items-center justify-center text-brand-400 font-bold text-lg">
            📚
          </div>
        </div>

        <div className="card p-4 flex items-center justify-between border-l-4 border-l-emerald-500">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">Active Deadlines</div>
            <div className="text-2xl font-bold text-emerald-400 mt-1">
              {homeworkList.filter((h) => new Date(h.dueAt).getTime() > Date.now()).length}
            </div>
          </div>
          <div className="h-10 w-10 rounded-xl bg-emerald-950/80 border border-emerald-800/60 flex items-center justify-center text-emerald-400 font-bold text-lg">
            ⏰
          </div>
        </div>

        <div className="card p-4 flex items-center justify-between border-l-4 border-l-purple-500">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">Subject Coverage</div>
            <div className="text-2xl font-bold text-purple-400 mt-1">{subjectList.length} Subjects</div>
          </div>
          <div className="h-10 w-10 rounded-xl bg-purple-950/80 border border-purple-800/60 flex items-center justify-center text-purple-400 font-bold text-lg">
            🎓
          </div>
        </div>
      </div>

      {/* ── TOOLBAR: SEARCH, FILTERS & NEW ASSIGNMENT BUTTON ── */}
      <div className="card p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Search & Subject Filter */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[220px]">
            <input
              type="text"
              placeholder="Search homework or subject..."
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

          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="input text-xs py-1.5 max-w-[10rem]"
          >
            <option value="ALL">All Subjects</option>
            {subjectList.map((sub) => (
              <option key={sub} value={sub}>
                {sub}
              </option>
            ))}
          </select>

          {/* Filter Tabs */}
          <div className="flex items-center gap-1 border border-slate-800 rounded-lg p-0.5 bg-slate-950 overflow-x-auto">
            {(["ALL", "ACTIVE", "QUIZZES_TESTS", "PAST_DUE", "SUBMITTED"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setFilterTab(tab)}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                  filterTab === tab
                    ? "bg-slate-800 text-white shadow-sm font-semibold"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {tab === "ALL"
                  ? "All"
                  : tab === "ACTIVE"
                  ? "Due Soon"
                  : tab === "QUIZZES_TESTS"
                  ? "⚡ Quizzes & Tests"
                  : tab === "PAST_DUE"
                  ? "Past Due"
                  : "Submitted"}
              </button>
            ))}
          </div>
        </div>

        {/* Action Button: Create Homework */}
        {canCreate && (
          <button
            type="button"
            onClick={() => setIsCreateOpen(true)}
            className="btn-primary text-xs py-2 px-4 flex items-center justify-center gap-2 shadow-sm shrink-0"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create Assignment / Quiz
          </button>
        )}
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`p-3.5 rounded-xl text-xs font-medium flex items-center justify-between transition-all ${
            feedback.type === "success"
              ? "bg-emerald-950/80 text-emerald-300 border border-emerald-800/80"
              : "bg-rose-950/80 text-rose-300 border border-rose-800/80"
          }`}
        >
          <div className="flex items-center gap-2">
            <span>{feedback.type === "success" ? "✓" : "⚠️"}</span>
            <span>{feedback.message}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-slate-400 hover:text-slate-200 ml-4 font-bold">
            ✕
          </button>
        </div>
      )}

      {/* ── HOMEWORK CARDS GRID ── */}
      {filteredList.length === 0 ? (
        <div className="card p-12 text-center text-slate-400">
          <div className="text-3xl mb-2">📖</div>
          <p className="font-semibold text-white">No assignments or quizzes found</p>
          <p className="text-xs text-slate-400 mt-1">
            Try adjusting your search filters or create a new assignment or quiz above.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredList.map((h) => {
            const isStrict = h.isStrictDeadline ?? true;
            const deadline = calculateDeadlineStatus(h.dueAt, isStrict);
            const totalSubmissions = h.submissions.length;
            const submittedCount = h.submissions.filter(
              (s) => s.status === "SUBMITTED" || s.status === "REVIEWED"
            ).length;

            const mySubmission = currentStudentId
              ? h.submissions.find((s) => s.studentId === currentStudentId)
              : null;

            const isQuizOrTest = h.type === "QUIZ" || h.type === "TEST";

            return (
              <div
                key={h.id}
                className={`card p-5 flex flex-col justify-between hover:shadow-card-hover transition-all duration-200 border-l-4 relative overflow-hidden ${
                  h.type === "QUIZ"
                    ? "border-l-purple-600"
                    : h.type === "TEST"
                    ? "border-l-indigo-600"
                    : "border-l-brand-600"
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md ${
                        h.type === "QUIZ"
                          ? "bg-purple-950/80 text-purple-300 border border-purple-800/60"
                          : h.type === "TEST"
                          ? "bg-indigo-950/80 text-indigo-300 border border-indigo-800/60"
                          : "bg-brand-950/80 text-brand-300 border border-brand-800/60"
                      }`}>
                        {h.type === "QUIZ" ? "⚡ Quiz" : h.type === "TEST" ? "📝 Test" : "📚 Homework"}
                      </span>

                      <Badge color="blue">
                        {h.gradeName.replace("Class ", "")}-{h.sectionName} · {h.subjectName}
                      </Badge>

                      <Badge color={deadline.badgeColor}>
                        {deadline.displayText}
                      </Badge>

                      {isStrict && (
                        <span className="text-[10px] font-semibold text-rose-300 bg-rose-950/80 border border-rose-800/60 px-1.5 py-0.5 rounded" title="Submissions automatically lock when deadline expires">
                          🔒 Strict Lock
                        </span>
                      )}

                      {mySubmission && (
                        <Badge color={mySubmission.status === "REVIEWED" ? "purple" : "emerald"}>
                          {mySubmission.status === "REVIEWED" ? `Graded: ${mySubmission.marks}/${h.maxMarks}` : "Submitted"}
                        </Badge>
                      )}
                    </div>

                    {h.maxMarks && (
                      <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-200 border border-slate-700 shrink-0">
                        {h.maxMarks} marks
                      </span>
                    )}
                  </div>

                  <h3 className="font-bold text-base text-white mt-3">{h.title}</h3>

                  {h.description && (
                    <p className="text-xs text-slate-300 mt-2 line-clamp-3 leading-relaxed">
                      {h.description}
                    </p>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1 font-medium text-slate-200">
                      📅 Due: {fmtDate(h.dueAt)}
                    </span>
                    <span>By: {h.teacherName}</span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">

                    {/* Teacher view submissions drawer */}
                    {canCreate && (
                      <button
                        type="button"
                        onClick={() => setActiveReviewHw(h)}
                        className="px-2.5 py-1 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
                      >
                        Submissions ({submittedCount})
                      </button>
                    )}

                    {/* Student submit button with deadline guard */}
                    {canSubmit && (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedHwToSubmit(h);
                          setIsSubmitOpen(true);
                        }}
                        className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
                          deadline.isExpired && isStrict
                            ? "bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700"
                            : mySubmission
                            ? "bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
                            : "bg-brand-600 hover:bg-brand-500 text-white shadow-sm"
                        }`}
                      >
                        {deadline.isExpired && isStrict
                          ? "Closed"
                          : mySubmission
                          ? "Update Work"
                          : isQuizOrTest
                          ? "Start & Submit"
                          : "Submit Work"}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── MODAL: CREATE HOMEWORK ── */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-slate-900 rounded-2xl shadow-xl max-w-lg w-full p-6 space-y-4 border border-slate-800 text-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                <span>📝</span> Create New Assignment, Quiz or Test
              </h3>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="text-slate-400 hover:text-slate-200 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Target Offering (Subject & Section)
                  </label>
                  <select
                    value={newOfferingId}
                    onChange={(e) => setNewOfferingId(e.target.value)}
                    className="input w-full"
                    required
                  >
                    {offerings.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.gradeName.replace("Class ", "")}-{o.sectionName} · {o.subjectName}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Assignment Category
                  </label>
                  <select
                    value={newAssignmentType}
                    onChange={(e) => setNewAssignmentType(e.target.value as any)}
                    className="input w-full font-semibold"
                  >
                    <option value="HOMEWORK">📚 Homework Assignment</option>
                    <option value="QUIZ">⚡ Speed Quiz</option>
                    <option value="TEST">📝 Class Assessment Test</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Title / Topic Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Chapter 4: Thermodynamics Problem Set"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="input w-full"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Instructions / Guidelines</label>
                <textarea
                  placeholder="Enter detailed problem set, guidelines, reading materials, or submission format..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="input w-full h-20"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Max Marks</label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={newMaxMarks}
                    onChange={(e) => setNewMaxMarks(Number(e.target.value))}
                    className="input w-full"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Submission Deadline *</label>
                  <input
                    type="datetime-local"
                    value={newDueAt}
                    onChange={(e) => setNewDueAt(e.target.value)}
                    className="input w-full"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Deadline Policy</label>
                  <select
                    value={newIsStrictDeadline ? "STRICT" : "GRACE"}
                    onChange={(e) => setNewIsStrictDeadline(e.target.value === "STRICT")}
                    className="input w-full"
                  >
                    <option value="STRICT">🔒 Strict (Auto-lock)</option>
                    <option value="GRACE">⚠️ Grace Period (Late tag)</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="btn-ghost"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="btn-primary py-2 px-4 shadow-sm"
                >
                  {isPending ? "Creating via GraphQL..." : "Publish Assignment / Quiz"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: SUBMIT HOMEWORK ── */}
      {isSubmitOpen && selectedHwToSubmit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-slate-900 rounded-2xl shadow-xl max-w-lg w-full p-6 space-y-4 border border-slate-800 text-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                <span>📤</span> Submit Assignment
              </h3>
              <button
                onClick={() => setIsSubmitOpen(false)}
                className="text-slate-400 hover:text-slate-200 font-bold"
              >
                ✕
              </button>
            </div>

            {(() => {
              const isStrict = selectedHwToSubmit.isStrictDeadline ?? true;
              const deadline = calculateDeadlineStatus(selectedHwToSubmit.dueAt, isStrict);

              return (
                <div className="space-y-2">
                  <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 text-xs">
                    <div className="flex items-center justify-between">
                      <div className="font-bold text-white">{selectedHwToSubmit.title}</div>
                      <Badge color={deadline.badgeColor}>{deadline.displayText}</Badge>
                    </div>
                    <div className="text-slate-400 mt-1 flex items-center justify-between text-[11px]">
                      <span>{selectedHwToSubmit.subjectName} · Max {selectedHwToSubmit.maxMarks} marks</span>
                      <span>📅 Due: {fmtDate(selectedHwToSubmit.dueAt)}</span>
                    </div>
                  </div>

                  {deadline.isExpired && isStrict ? (
                    <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-800/80 text-rose-300 text-xs flex items-center gap-2">
                      <span className="text-base">⛔</span>
                      <div>
                        <div className="font-bold">Submissions Closed (Strict Deadline Enforced)</div>
                        <div className="text-[11px] font-normal text-rose-400 mt-0.5">
                          The deadline for this {selectedHwToSubmit.type || "assignment"} expired on {fmtDate(selectedHwToSubmit.dueAt)}. Submissions are locked.
                        </div>
                      </div>
                    </div>
                  ) : deadline.isExpired ? (
                    <div className="p-2.5 rounded-xl bg-amber-950/80 border border-amber-800/80 text-amber-300 text-xs flex items-center gap-2">
                      <span>⚠️</span>
                      <span className="text-[11px]">
                        Late Submission: The deadline has passed. Your work will be marked with a <strong>LATE</strong> tag.
                      </span>
                    </div>
                  ) : (
                    <div className="p-2.5 rounded-xl bg-emerald-950/80 border border-emerald-800/80 text-emerald-300 text-xs flex items-center justify-between">
                      <span className="font-medium text-[11px]">⏰ Active Countdown:</span>
                      <span className="font-mono font-bold text-xs">{deadline.detailedCountdown}</span>
                    </div>
                  )}
                </div>
              );
            })()}

            <form onSubmit={handleStudentSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Submission Notes / Text Solution
                </label>
                <textarea
                  placeholder="Paste your answers, summary, or response notes here..."
                  value={submitComment}
                  onChange={(e) => setSubmitComment(e.target.value)}
                  className="input w-full h-28"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Attachment / Document URL (Optional)
                </label>
                <input
                  type="url"
                  placeholder="https://drive.google.com/... or shared link"
                  value={submitFileUrl}
                  onChange={(e) => setSubmitFileUrl(e.target.value)}
                  className="input w-full"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsSubmitOpen(false)}
                  className="btn-ghost"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={
                    isPending ||
                    Boolean(
                      calculateDeadlineStatus(
                        selectedHwToSubmit.dueAt,
                        selectedHwToSubmit.isStrictDeadline ?? true
                      ).isExpired && (selectedHwToSubmit.isStrictDeadline ?? true)
                    )
                  }
                  className="btn-primary py-2 px-4 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isPending
                    ? "Submitting..."
                    : calculateDeadlineStatus(
                        selectedHwToSubmit.dueAt,
                        selectedHwToSubmit.isStrictDeadline ?? true
                      ).isExpired && (selectedHwToSubmit.isStrictDeadline ?? true)
                    ? "Locked (Deadline Passed)"
                    : "Submit Work"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: REVIEW SUBMISSIONS DRAWER ── */}
      {activeReviewHw && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-slate-900 rounded-2xl shadow-xl max-w-2xl w-full p-6 space-y-4 border border-slate-800 text-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="font-bold text-base text-white">
                  Submissions: {activeReviewHw.title}
                </h3>
                <div className="text-xs text-slate-400 mt-0.5">
                  Max {activeReviewHw.maxMarks} marks · {activeReviewHw.submissions.length} submissions received
                </div>
              </div>
              <button
                onClick={() => setActiveReviewHw(null)}
                className="text-slate-400 hover:text-slate-200 font-bold"
              >
                ✕
              </button>
            </div>

            {activeReviewHw.submissions.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                No students have submitted this assignment yet.
              </div>
            ) : (
              <div className="overflow-x-auto max-h-96">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-950/80">
                      <th className="th py-2">Student</th>
                      <th className="th py-2">Status</th>
                      <th className="th py-2">Submitted</th>
                      <th className="th py-2">Marks</th>
                      <th className="th py-2">Comments</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {activeReviewHw.submissions.map((sub) => (
                      <tr key={sub.id} className="hover:bg-slate-800/40">
                        <td className="td py-2 font-semibold text-white">{sub.studentName}</td>
                        <td className="td py-2">
                          <Badge color={sub.status === "REVIEWED" ? "purple" : "green"}>
                            {sub.status}
                          </Badge>
                        </td>
                        <td className="td py-2 text-slate-400">
                          {sub.submittedAt ? fmtDate(sub.submittedAt) : "—"}
                        </td>
                        <td className="td py-2 font-mono font-semibold text-slate-200">
                          {sub.marks !== null && sub.marks !== undefined
                            ? `${sub.marks}/${activeReviewHw.maxMarks}`
                            : "Unmarked"}
                        </td>
                        <td className="td py-2 text-slate-300 max-w-xs truncate">
                          {sub.comment || "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="pt-3 border-t border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => setActiveReviewHw(null)}
                className="btn-ghost"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
