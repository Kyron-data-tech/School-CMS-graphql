/**
 * CBSE Assessment & Grading Domain Engine
 *
 * Implements standard CBSE 9-point grading scale, 80:20 Theory/Practical validation,
 * aggregate percentage, GPA calculation, and division categorization.
 */

export interface SubjectAssessmentInput {
  subjectName: string;
  theory: number;
  practical?: number;
  theoryMax?: number; // default: 80
  practicalMax?: number; // default: 20
  maxMarks?: number; // default: 100
}

export interface SubjectAssessmentResult {
  subjectName: string;
  theoryMarks: number;
  practicalMarks: number;
  totalMarks: number;
  maxMarks: number;
  percentage: number;
  grade: "A1" | "A2" | "B1" | "B2" | "C1" | "C2" | "D" | "E";
  gradePoint: number;
  passed: boolean;
}

export interface AggregateReportSummary {
  totalMax: number;
  totalScored: number;
  percentage: number;
  cumulativeGpa: number;
  overallGrade: string;
  division:
    | "First Division with Distinction"
    | "First Division"
    | "Second Division"
    | "Third Division"
    | "Essential Repeat (Fail)";
  passed: boolean;
  subjectCount: number;
}

/**
 * Standard CBSE 9-point grading policy
 */
export function calculateSubjectGrade(percentage: number): {
  grade: "A1" | "A2" | "B1" | "B2" | "C1" | "C2" | "D" | "E";
  gradePoint: number;
  passed: boolean;
} {
  if (percentage >= 91) return { grade: "A1", gradePoint: 10.0, passed: true };
  if (percentage >= 81) return { grade: "A2", gradePoint: 9.0, passed: true };
  if (percentage >= 71) return { grade: "B1", gradePoint: 8.0, passed: true };
  if (percentage >= 61) return { grade: "B2", gradePoint: 7.0, passed: true };
  if (percentage >= 51) return { grade: "C1", gradePoint: 6.0, passed: true };
  if (percentage >= 41) return { grade: "C2", gradePoint: 5.0, passed: true };
  if (percentage >= 33) return { grade: "D", gradePoint: 4.0, passed: true };
  return { grade: "E", gradePoint: 0.0, passed: false };
}

/**
 * Validates and evaluates a single subject's CBSE 80/20 assessment
 */
export function evaluateSubjectAssessment(input: SubjectAssessmentInput): SubjectAssessmentResult {
  const theoryMax = input.theoryMax ?? 80;
  const practicalMax = input.practicalMax ?? 20;
  const maxMarks = input.maxMarks ?? (theoryMax + practicalMax);

  // Enforce bounds
  const clampedTheory = Math.min(Math.max(0, input.theory), theoryMax);
  const clampedPractical = Math.min(Math.max(0, input.practical ?? 0), practicalMax);
  const total = clampedTheory + clampedPractical;
  const percentage = maxMarks > 0 ? Math.round((total / maxMarks) * 1000) / 10 : 0;

  const { grade, gradePoint, passed } = calculateSubjectGrade(percentage);

  return {
    subjectName: input.subjectName,
    theoryMarks: clampedTheory,
    practicalMarks: clampedPractical,
    totalMarks: total,
    maxMarks,
    percentage,
    grade,
    gradePoint,
    passed,
  };
}

/**
 * Computes school aggregate across multiple subject scores
 */
export function computeAggregate(
  subjects: Array<{ maxMarks: number; theoryMarks?: number; practicalMarks?: number; totalMarks?: number }>
): AggregateReportSummary {
  const totalMax = subjects.reduce((sum, s) => sum + s.maxMarks, 0);
  const totalScored = subjects.reduce(
    (sum, s) => sum + (s.totalMarks ?? (s.theoryMarks || 0) + (s.practicalMarks || 0)),
    0
  );
  const percentage = totalMax > 0 ? Math.round((totalScored / totalMax) * 1000) / 10 : 0;

  let overallGrade = "E";
  let division: AggregateReportSummary["division"] = "Essential Repeat (Fail)";
  let passed = false;

  if (percentage >= 90) {
    overallGrade = "A1";
    division = "First Division with Distinction";
    passed = true;
  } else if (percentage >= 80) {
    overallGrade = "A2";
    division = "First Division";
    passed = true;
  } else if (percentage >= 70) {
    overallGrade = "B1";
    division = "Second Division";
    passed = true;
  } else if (percentage >= 60) {
    overallGrade = "B2";
    division = "Second Division";
    passed = true;
  } else if (percentage >= 50) {
    overallGrade = "C1";
    division = "Third Division";
    passed = true;
  } else if (percentage >= 33) {
    overallGrade = "D";
    division = "Third Division";
    passed = true;
  }

  // Calculate Average GPA
  const totalGp = subjects.reduce((sum, s) => {
    const scored = s.totalMarks ?? ((s.theoryMarks || 0) + (s.practicalMarks || 0));
    const pct = s.maxMarks > 0 ? (scored / s.maxMarks) * 100 : 0;
    return sum + calculateSubjectGrade(pct).gradePoint;
  }, 0);
  const cumulativeGpa = subjects.length > 0 ? Math.round((totalGp / subjects.length) * 10) / 10 : 0;

  return {
    totalMax,
    totalScored,
    percentage,
    cumulativeGpa,
    overallGrade,
    division,
    passed,
    subjectCount: subjects.length,
  };
}
