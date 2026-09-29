import { describe, it, expect } from "vitest";
import {
  generateStudentRemarks,
  generateQuiz,
  generateNotice,
  answerSchoolQuery,
  testModelConnection,
} from "@/lib/ai/copilot";

describe("AI Academic Copilot LLM Services", () => {
  it("should generate personalized student remarks with provider attribution", async () => {
    const result = await generateStudentRemarks({
      studentName: "Arjun Mehta",
      gradeLevel: "Class 8-A",
      attendanceRate: "96%",
      strengths: "Active classroom participation and strong scientific curiosity",
      areasToImprove: "Mathematics homework consistency",
      tone: "encouraging",
    });

    expect(result.text).toBeDefined();
    expect(result.text.length).toBeGreaterThan(50);
    expect(result.text).toContain("Arjun Mehta");
    expect(result.provider).toBeDefined();
  });

  it("should generate curriculum practice quiz with questions and answer key", async () => {
    const result = await generateQuiz({
      subject: "Science",
      topic: "Photosynthesis",
      gradeLevel: "Class 8",
      questionCount: 3,
    });

    expect(result.text).toBeDefined();
    expect(result.text).toContain("Photosynthesis");
    expect(result.text).toContain("Answer Key");
    expect(result.provider).toBeDefined();
  });

  it("should draft formal administrative circular with reference and signature", async () => {
    const result = await generateNotice({
      topic: "Annual Sports Meet 2026",
      audience: "Parents & Guardians",
      eventDate: "October 20, 2026",
      keyDetails: "Track and field events, inter-house relay, and prize distribution",
    });

    expect(result.text).toBeDefined();
    expect(result.text).toContain("GREENFIELD INTERNATIONAL SCHOOL");
    expect(result.text).toContain("CIRCULAR: ANNUAL SPORTS MEET 2026");
    expect(result.text).toContain("Dr. Anita Desai");
  });

  it("should answer academic school query accurately", async () => {
    const result = await answerSchoolQuery({
      query: "What is the attendance policy for examinations?",
    });

    expect(result.text).toBeDefined();
    expect(result.text).toContain("75% attendance");
    expect(result.provider).toBeDefined();
  });

  it("should test connection to model endpoint with latency tracking", async () => {
    const config = {
      provider: "builtin" as const,
      modelName: "academic-domain-v1",
    };
    const testRes = await testModelConnection(config);
    expect(testRes.success).toBe(true);
    expect(testRes.latencyMs).toBeGreaterThanOrEqual(0);
    expect(testRes.model).toBe("academic-domain-v1");
  });

  it("should accept custom school system instructions and parameters", async () => {
    const result = await generateStudentRemarks(
      {
        studentName: "Sara Kapoor",
        gradeLevel: "Class 8-A",
      },
      {
        provider: "builtin",
        customSystemPrompt: "Focus strictly on STEM subjects.",
      }
    );
    expect(result.text).toContain("Sara Kapoor");
    expect(result.provider).toBeDefined();
  });
});
