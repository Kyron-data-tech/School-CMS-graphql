import { describe, it, expect } from "vitest";
import {
  computeAggregate,
  evaluateSubjectAssessment,
  calculateSubjectGrade,
} from "@/domain/assessment/assessment-engine";

describe("CBSE Official Report Card & Domain Assessment Engine", () => {
  it("should calculate cumulative aggregate score, percentage and first division with distinction", () => {
    const subjects = [
      { maxMarks: 100, theoryMarks: 72, practicalMarks: 20 }, // 92 - Math
      { maxMarks: 100, theoryMarks: 70, practicalMarks: 20 }, // 90 - Science
      { maxMarks: 100, theoryMarks: 68, practicalMarks: 18 }, // 86 - English
      { maxMarks: 100, theoryMarks: 74, practicalMarks: 15 }, // 89 - Social Science
      { maxMarks: 100, theoryMarks: 78, practicalMarks: 20 }, // 98 - Computer Applications
    ];

    const res = computeAggregate(subjects);
    expect(res.totalMax).toBe(500);
    expect(res.totalScored).toBe(455);
    expect(res.percentage).toBe(91);
    expect(res.overallGrade).toBe("A1");
    expect(res.division).toBe("First Division with Distinction");
    expect(res.cumulativeGpa).toBeGreaterThanOrEqual(9.0);
  });

  it("should correctly assign Second Division for 60-70% scores", () => {
    const subjects = [
      { maxMarks: 100, theoryMarks: 50, practicalMarks: 15 }, // 65
      { maxMarks: 100, theoryMarks: 48, practicalMarks: 16 }, // 64
      { maxMarks: 100, theoryMarks: 52, practicalMarks: 16 }, // 68
    ];

    const res = computeAggregate(subjects);
    expect(res.overallGrade).toBe("B2");
    expect(res.division).toBe("Second Division");
  });

  it("should enforce explicit CBSE 80/20 theory and practical boundaries", () => {
    // Subject with 80 theory max, 20 practical max
    const evalResult = evaluateSubjectAssessment({
      subjectName: "Science & Technology",
      theory: 76,
      practical: 19,
      theoryMax: 80,
      practicalMax: 20,
    });

    expect(evalResult.theoryMarks).toBe(76);
    expect(evalResult.practicalMarks).toBe(19);
    expect(evalResult.totalMarks).toBe(95);
    expect(evalResult.grade).toBe("A1");
    expect(evalResult.gradePoint).toBe(10.0);
    expect(evalResult.passed).toBe(true);

    // Tests clamping if someone submits marks higher than CBSE limits (e.g. theory 85 > 80)
    const clampedResult = evaluateSubjectAssessment({
      subjectName: "Mathematics",
      theory: 90, // exceeds 80 max
      practical: 25, // exceeds 20 max
      theoryMax: 80,
      practicalMax: 20,
    });

    expect(clampedResult.theoryMarks).toBe(80);
    expect(clampedResult.practicalMarks).toBe(20);
    expect(clampedResult.totalMarks).toBe(100);
  });

  it("should calculate correct 9-point CBSE grades and grade points", () => {
    expect(calculateSubjectGrade(95).grade).toBe("A1");
    expect(calculateSubjectGrade(85).grade).toBe("A2");
    expect(calculateSubjectGrade(75).grade).toBe("B1");
    expect(calculateSubjectGrade(65).grade).toBe("B2");
    expect(calculateSubjectGrade(55).grade).toBe("C1");
    expect(calculateSubjectGrade(45).grade).toBe("C2");
    expect(calculateSubjectGrade(35).grade).toBe("D");
    expect(calculateSubjectGrade(25).grade).toBe("E");
  });
});
