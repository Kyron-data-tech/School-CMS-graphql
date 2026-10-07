"use client";

import { useState, useMemo, useEffect } from "react";
import { Badge } from "@/components/ui";
import { fmtDate } from "@/lib/dates";

export interface SubjectNoteItem {
  id: string;
  title: string;
  subjectName: string;
  className: string;
  teacherName: string;
  category: "Chapter Summary" | "Revision Notes" | "Formula Sheet" | "Lab Manual";
  content: string;
  keyPoints: string[];
  attachmentUrl?: string;
  fileSize?: string;
  publishedAt: string;
}

const DEFAULT_NOTES: SubjectNoteItem[] = [
  {
    id: "note-1",
    title: "Chapter 4: Linear Equations in One Variable & Graphical Solutions",
    subjectName: "Mathematics",
    className: "Class 8 · Section A",
    teacherName: "Mr. R. K. Sharma (Head of Math)",
    category: "Formula Sheet",
    content:
      "Comprehensive breakdown of isolating linear variables, standard form ax + b = c, transposition rules, and solving practical age/distance word problems.",
    keyPoints: [
      "Rule of Transposition: Changing sides changes the sign (+ becomes -, * becomes /).",
      "Always clear brackets using the Distributive Property first: a(b + c) = ab + ac.",
      "Check solutions by substituting LHS = RHS before submitting.",
    ],
    attachmentUrl: "https://greenfield.edu/resources/math-ch4-formula-sheet.pdf",
    fileSize: "1.4 MB PDF",
    publishedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: "note-2",
    title: "Unit 3: Newton's Laws of Motion & Momentum Conservation",
    subjectName: "Science & Physics",
    className: "Class 8 · Section A",
    teacherName: "Dr. Ananya Sen",
    category: "Chapter Summary",
    content:
      "Core principles of Inertia (1st Law), F = ma derivation (2nd Law), Action-Reaction pairs (3rd Law), and real-world friction calculations with solved CBSE numericals.",
    keyPoints: [
      "First Law (Inertia): An object remains at rest unless acted upon by an external net unbalanced force.",
      "Second Law: Rate of change of momentum is proportional to applied force (F = m × a).",
      "Third Law: Action and Reaction act on two different bodies and never cancel each other.",
    ],
    attachmentUrl: "https://greenfield.edu/resources/physics-laws-of-motion.pdf",
    fileSize: "2.1 MB PDF",
    publishedAt: new Date(Date.now() - 86400000 * 4).toISOString(),
  },
  {
    id: "note-3",
    title: "English: Analytical Summary of 'The Road Not Taken' by Robert Frost",
    subjectName: "English Literature",
    className: "Class 8 · Section A",
    teacherName: "Mrs. Sunita Kapoor",
    category: "Revision Notes",
    content:
      "Stanza-by-stanza thematic commentary exploring themes of individual choice, consequence, and destiny with CBSE sample questions and character sketches.",
    keyPoints: [
      "Metaphor: The 'two roads' symbolize critical life choices and divergence of pathways.",
      "Tone: Reflective and contemplative with subtle wistfulness in the final stanza.",
      "Rhyme Scheme: ABAAB in each of the four quintain stanzas.",
    ],
    attachmentUrl: "https://greenfield.edu/resources/english-road-not-taken-notes.pdf",
    fileSize: "850 KB PDF",
    publishedAt: new Date(Date.now() - 86400000 * 6).toISOString(),
  },
  {
    id: "note-4",
    title: "AI & Computers: Decision Trees, Classification & Neural Intro",
    subjectName: "Computer Applications & AI",
    className: "Class 8 · Section A",
    teacherName: "Mr. Vikram Patel",
    category: "Lab Manual",
    content:
      "Introduction to supervised learning models, binary decision trees, and training vs testing datasets with Python pseudocode exercises.",
    keyPoints: [
      "Supervised vs Unsupervised: Labeled data vs discovering inherent patterns.",
      "Decision Node vs Leaf Node: Decisions test attributes; leaves output final classifications.",
      "Avoid overfitting by pruning trees to maintain generalizability.",
    ],
    attachmentUrl: "https://greenfield.edu/resources/cs-ai-decision-trees.pdf",
    fileSize: "3.2 MB PDF",
    publishedAt: new Date(Date.now() - 86400000 * 8).toISOString(),
  },
];

export function InteractiveNotesClient({
  canCreate,
  userRole,
}: {
  canCreate: boolean;
  userRole: string;
}) {
  const [notes, setNotes] = useState<SubjectNoteItem[]>([]);
  const [search, setSearch] = useState("");
  const [selectedSubject, setSelectedSubject] = useState<string>("ALL");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeNoteModal, setActiveNoteModal] = useState<SubjectNoteItem | null>(null);

  // Form State for new note
  const [formData, setFormData] = useState({
    title: "",
    subjectName: "Mathematics",
    className: "Class 8 · Section A",
    category: "Chapter Summary" as SubjectNoteItem["category"],
    content: "",
    keyPointsText: "",
    fileSize: "1.2 MB PDF",
  });

  // Load from localStorage or defaults
  useEffect(() => {
    try {
      const saved = localStorage.getItem("school_cms_subject_notes");
      if (saved) {
        setNotes(JSON.parse(saved));
      } else {
        setNotes(DEFAULT_NOTES);
        localStorage.setItem("school_cms_subject_notes", JSON.stringify(DEFAULT_NOTES));
      }
    } catch {
      setNotes(DEFAULT_NOTES);
    }
  }, []);

  const saveNotes = (updated: SubjectNoteItem[]) => {
    setNotes(updated);
    try {
      localStorage.setItem("school_cms_subject_notes", JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  const handleCreateNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.content.trim()) return;

    const points = formData.keyPointsText
      .split("\n")
      .map((p) => p.trim())
      .filter(Boolean);

    const newNote: SubjectNoteItem = {
      id: `note-${Date.now()}`,
      title: formData.title.trim(),
      subjectName: formData.subjectName,
      className: formData.className,
      teacherName: userRole === "HEADMASTER" ? "Principal Office" : "Faculty Member",
      category: formData.category,
      content: formData.content.trim(),
      keyPoints: points.length ? points : ["Standard curriculum reference notes for revision."],
      fileSize: formData.fileSize || "1.0 MB PDF",
      attachmentUrl: "https://greenfield.edu/resources/faculty-notes.pdf",
      publishedAt: new Date().toISOString(),
    };

    saveNotes([newNote, ...notes]);
    setIsModalOpen(false);
    setFormData({
      title: "",
      subjectName: "Mathematics",
      className: "Class 8 · Section A",
      category: "Chapter Summary",
      content: "",
      keyPointsText: "",
      fileSize: "1.2 MB PDF",
    });
  };

  const subjects = useMemo(() => {
    const list = Array.from(new Set(notes.map((n) => n.subjectName)));
    return ["ALL", ...list];
  }, [notes]);

  const filteredNotes = useMemo(() => {
    return notes.filter((n) => {
      const matchSub = selectedSubject === "ALL" || n.subjectName === selectedSubject;
      const matchCat = selectedCategory === "ALL" || n.category === selectedCategory;
      const q = search.toLowerCase().trim();
      const matchQuery =
        !q ||
        n.title.toLowerCase().includes(q) ||
        n.subjectName.toLowerCase().includes(q) ||
        n.content.toLowerCase().includes(q) ||
        n.teacherName.toLowerCase().includes(q);
      return matchSub && matchCat && matchQuery;
    });
  }, [notes, selectedSubject, selectedCategory, search]);

  return (
    <div className="space-y-6">
      {/* ── TOOLBAR & STATS ── */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-slate-900/90 p-4 shadow-card border border-slate-800">
        <div className="flex flex-1 items-center gap-3 min-w-[280px]">
          <div className="relative flex-1">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by chapter, formula, or teacher…"
              className="w-full rounded-xl border border-slate-800 bg-slate-950/80 px-3.5 py-2 pl-9 text-xs text-slate-100 placeholder-slate-500 focus:bg-slate-950 focus:border-brand-500 focus:outline-none"
            />
            <svg
              className="absolute left-3 top-2.5 h-4 w-4 text-slate-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          {/* Subject Filter */}
          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="rounded-xl border border-slate-800 bg-slate-950/80 px-3 py-2 text-xs font-semibold text-slate-200 shadow-sm focus:outline-none focus:border-brand-500"
          >
            {subjects.map((s) => (
              <option key={s} value={s}>
                {s === "ALL" ? "All Subjects" : s}
              </option>
            ))}
          </select>
        </div>

        {canCreate && (
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 px-3.5 py-2 text-xs font-bold text-white shadow-sm hover:from-brand-500 hover:to-indigo-500 transition-all active:scale-95"
          >
            <span>📝</span> Publish Subject Notes
          </button>
        )}
      </div>

      {/* ── NOTES GRID ── */}
      {filteredNotes.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-900/40 p-12 text-center">
          <span className="text-3xl">📚</span>
          <h3 className="mt-2 text-sm font-bold text-white">No subject notes found</h3>
          <p className="mt-1 text-xs text-slate-400">Try adjusting your search query or subject filters.</p>
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2">
          {filteredNotes.map((note) => (
            <div
              key={note.id}
              className="group relative flex flex-col justify-between rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-card hover:border-slate-700 hover:shadow-md transition-all"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2.5">
                  <div className="flex items-center gap-2">
                    <Badge color="blue">{note.subjectName}</Badge>
                    <Badge color="slate">{note.className}</Badge>
                  </div>
                  <span className="text-[11px] font-semibold text-indigo-400 bg-indigo-950/60 border border-indigo-900/60 px-2 py-0.5 rounded-md">
                    {note.category}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-white group-hover:text-brand-400 transition-colors leading-snug">
                  {note.title}
                </h3>

                <p className="mt-2 text-xs text-slate-300 line-clamp-3 leading-relaxed">
                  {note.content}
                </p>

                {/* Key Takeaways */}
                <div className="mt-3.5 space-y-1 rounded-xl bg-slate-950/60 p-2.5 border border-slate-800/80">
                  <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                    💡 Key Revision Takeaways
                  </div>
                  <ul className="space-y-1 text-[11px] text-slate-300">
                    {note.keyPoints.slice(0, 2).map((kp, idx) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <span className="text-brand-400 font-bold">•</span>
                        <span className="line-clamp-1">{kp}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Card Footer */}
              <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                <div className="text-[11px] text-slate-500">
                  By <strong className="text-slate-300 font-semibold">{note.teacherName}</strong> · {fmtDate(note.publishedAt)}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveNoteModal(note)}
                    className="rounded-lg bg-slate-800 px-2.5 py-1 text-[11px] font-semibold text-slate-200 hover:bg-slate-700 border border-slate-700 transition-colors"
                  >
                    View Full Notes
                  </button>
                  <a
                    href={note.attachmentUrl}
                    download
                    onClick={(e) => {
                      e.preventDefault();
                      alert(`Downloading: ${note.title} (${note.fileSize || "PDF Document"})`);
                    }}
                    className="flex items-center gap-1 rounded-lg bg-brand-950/60 border border-brand-800/60 px-2.5 py-1 text-[11px] font-bold text-brand-400 hover:bg-brand-900/50 transition-colors"
                  >
                    <span>📥</span> PDF
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── CREATE NOTE MODAL ── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <div>
                <h3 className="text-base font-bold text-white">Publish Subject Notes</h3>
                <p className="text-xs text-slate-400">Provide chapter summary & study resources for students</p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="h-8 w-8 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center font-bold text-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateNote} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Subject
                  </label>
                  <select
                    value={formData.subjectName}
                    onChange={(e) => setFormData({ ...formData, subjectName: e.target.value })}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950/80 px-3 py-2 text-xs text-slate-100 focus:bg-slate-950 focus:border-brand-500 focus:outline-none"
                  >
                    <option value="Mathematics">Mathematics</option>
                    <option value="Science & Physics">Science & Physics</option>
                    <option value="English Literature">English Literature</option>
                    <option value="Social Science">Social Science</option>
                    <option value="Computer Applications & AI">Computer Applications & AI</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Class & Section
                  </label>
                  <input
                    type="text"
                    value={formData.className}
                    onChange={(e) => setFormData({ ...formData, className: e.target.value })}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950/80 px-3 py-2 text-xs text-slate-100 focus:bg-slate-950 focus:border-brand-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Chapter / Topic Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Chapter 6: Combustion & Flame Key Notes"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950/80 px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:bg-slate-950 focus:border-brand-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Summary / Detailed Explanation
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Explain core definitions, formulas, or conceptual steps…"
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950/80 px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:bg-slate-950 focus:border-brand-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Key Revision Takeaways (1 per line)
                </label>
                <textarea
                  rows={2}
                  placeholder="Formula 1: ...&#10;Key definition: ..."
                  value={formData.keyPointsText}
                  onChange={(e) => setFormData({ ...formData, keyPointsText: e.target.value })}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950/80 px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:bg-slate-950 focus:border-brand-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl border border-slate-800 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-brand-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-brand-500 transition-colors"
                >
                  Publish Note to Class
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── VIEW NOTE DETAILS MODAL ── */}
      {activeNoteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-xl rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Badge color="blue">{activeNoteModal.subjectName}</Badge>
                  <Badge color="slate">{activeNoteModal.className}</Badge>
                </div>
                <h3 className="text-base font-bold text-white">{activeNoteModal.title}</h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveNoteModal(null)}
                className="h-8 w-8 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center font-bold text-lg"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-4 text-xs text-slate-300 max-h-[60vh] overflow-y-auto pr-2">
              <div>
                <h4 className="font-bold text-white uppercase tracking-wider text-[11px] mb-1">
                  Chapter Overview & Notes
                </h4>
                <p className="leading-relaxed whitespace-pre-line bg-slate-950/70 p-3 rounded-xl border border-slate-800 text-slate-200">
                  {activeNoteModal.content}
                </p>
              </div>

              <div>
                <h4 className="font-bold text-white uppercase tracking-wider text-[11px] mb-1.5">
                  Key Revision Points
                </h4>
                <ul className="space-y-2">
                  {activeNoteModal.keyPoints.map((point, i) => (
                    <li key={i} className="flex items-start gap-2 bg-brand-950/40 p-2.5 rounded-xl border border-brand-800/50 text-slate-200">
                      <span className="font-extrabold text-brand-400">{i + 1}.</span>
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-xl bg-slate-950/80 border border-slate-800 p-3 flex items-center justify-between">
                <div>
                  <div className="text-[11px] font-bold text-white">Course Materials Attachment</div>
                  <div className="text-[10px] text-slate-400">{activeNoteModal.fileSize || "1.4 MB PDF"}</div>
                </div>
                <button
                  type="button"
                  onClick={() => alert(`Downloading: ${activeNoteModal.title}`)}
                  className="rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-brand-500 transition-colors"
                >
                  Download PDF
                </button>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => setActiveNoteModal(null)}
                className="rounded-xl bg-slate-800 px-4 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-700 border border-slate-700 transition-colors"
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
