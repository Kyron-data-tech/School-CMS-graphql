import { describe, it, expect } from "vitest";

interface SubjectNoteItem {
  id: string;
  title: string;
  subjectName: string;
  className: string;
  teacherName: string;
  category: "Chapter Summary" | "Revision Notes" | "Formula Sheet" | "Lab Manual";
  content: string;
  keyPoints: string[];
}

function filterNotes(
  notes: SubjectNoteItem[],
  query: string,
  subject: string,
  category: string
) {
  return notes.filter((n) => {
    const matchSub = subject === "ALL" || n.subjectName === subject;
    const matchCat = category === "ALL" || n.category === category;
    const q = query.toLowerCase().trim();
    const matchQuery =
      !q ||
      n.title.toLowerCase().includes(q) ||
      n.subjectName.toLowerCase().includes(q) ||
      n.content.toLowerCase().includes(q) ||
      n.teacherName.toLowerCase().includes(q);
    return matchSub && matchCat && matchQuery;
  });
}

describe("Subject Notes Module Unit Tests", () => {
  const sampleNotes: SubjectNoteItem[] = [
    {
      id: "note-1",
      title: "Chapter 4: Linear Equations in One Variable",
      subjectName: "Mathematics",
      className: "Class 8 · Section A",
      teacherName: "Mr. R. K. Sharma",
      category: "Formula Sheet",
      content: "Rule of transposition and isolating variables.",
      keyPoints: ["Rule 1: Transposition changes sign."],
    },
    {
      id: "note-2",
      title: "Unit 3: Newton's Laws of Motion",
      subjectName: "Science & Physics",
      className: "Class 8 · Section A",
      teacherName: "Dr. Ananya Sen",
      category: "Chapter Summary",
      content: "Inertia, F = ma, and Action-Reaction forces.",
      keyPoints: ["First Law: Inertia.", "Second Law: F = ma."],
    },
  ];

  it("filters notes accurately by subject name", () => {
    const mathNotes = filterNotes(sampleNotes, "", "Mathematics", "ALL");
    expect(mathNotes).toHaveLength(1);
    expect(mathNotes[0].subjectName).toBe("Mathematics");
  });

  it("filters notes accurately by free-text search query", () => {
    const queryResults = filterNotes(sampleNotes, "Newton", "ALL", "ALL");
    expect(queryResults).toHaveLength(1);
    expect(queryResults[0].title).toContain("Newton's Laws");
  });

  it("filters notes by category type", () => {
    const formulas = filterNotes(sampleNotes, "", "ALL", "Formula Sheet");
    expect(formulas).toHaveLength(1);
    expect(formulas[0].category).toBe("Formula Sheet");
  });
});
