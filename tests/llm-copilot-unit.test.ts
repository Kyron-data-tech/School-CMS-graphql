import { describe, it, expect } from "vitest";
import {
  generateStudentRemarks,
  generateQuiz,
  generateNotice,
  answerSchoolQuery,
  CopilotRequestSchema,
  AiModelConfigSchema,
} from "@/lib/ai/copilot";

describe("LLM Academic Copilot - Unit Test Suite", () => {
  describe("Zod Validation Schemas", () => {
    it("should validate a valid AI Model configuration", () => {
      const validConfig = {
        provider: "builtin" as const,
        temperature: 0.7,
        customSystemPrompt: "You are an expert CBSE school educator.",
      };
      const parsed = AiModelConfigSchema.parse(validConfig);
      expect(parsed.provider).toBe("builtin");
      expect(parsed.temperature).toBe(0.7);
    });

    it("should accept custom OpenAI-compatible endpoint configurations", () => {
      const customConfig = {
        provider: "custom" as const,
        baseUrl: "http://localhost:11434/v1",
        apiKey: "sk-test-token-12345",
        modelName: "llama3:8b",
        temperature: 0.5,
      };
      const parsed = AiModelConfigSchema.parse(customConfig);
      expect(parsed.provider).toBe("custom");
      expect(parsed.modelName).toBe("llama3:8b");
      expect(parsed.baseUrl).toBe("http://localhost:11434/v1");
    });

    it("should validate CopilotRequestSchema for student remarks", () => {
      const request = {
        mode: "remarks",
        payload: {
          studentName: "Arjun Mehta",
          gradeLevel: "Class 8-A",
          attendanceRate: "98%",
          strengths: "Physics & Chemistry concepts",
          areasToImprove: "Time management during examinations",
          tone: "encouraging",
        },
      };
      const parsed = CopilotRequestSchema.parse(request);
      expect(parsed.mode).toBe("remarks");
      expect(parsed.payload.studentName).toBe("Arjun Mehta");
    });

    it("should validate CopilotRequestSchema for quiz generation", () => {
      const request = {
        mode: "quiz",
        payload: {
          subject: "Science",
          topic: "Thermodynamics",
          gradeLevel: "Class 8",
          questionCount: 5,
        },
      };
      const parsed = CopilotRequestSchema.parse(request);
      expect(parsed.mode).toBe("quiz");
      expect(parsed.payload.questionCount).toBe(5);
    });
  });

  describe("LLM Generation Services & Prompts", () => {
    it("should generate encouraging report card remarks mentioning specific strengths", async () => {
      const res = await generateStudentRemarks({
        studentName: "Arjun Mehta",
        gradeLevel: "Class 8-A",
        attendanceRate: "97%",
        strengths: "Consistent problem-solving in Thermodynamics and laboratory experiments",
        areasToImprove: "Algebraic formula speed",
        tone: "encouraging",
      });

      expect(res.text).toBeDefined();
      expect(res.text.length).toBeGreaterThan(60);
      expect(res.text).toContain("Arjun Mehta");
      expect(res.text).toContain("Class 8-A");
      expect(res.text).toContain("97%");
      expect(res.provider).toBeDefined();
    });

    it("should generate formal tone student remarks", async () => {
      const res = await generateStudentRemarks({
        studentName: "Sara Kapoor",
        gradeLevel: "Class 8-A",
        attendanceRate: "99%",
        strengths: "Top scorer in Mathematics",
        areasToImprove: "Class debate participation",
        tone: "formal",
      });

      expect(res.text).toBeDefined();
      expect(res.text).toContain("Sara Kapoor");
      expect(res.text).toContain("Class 8-A");
    });

    it("should generate custom curriculum quiz with question count and answer key", async () => {
      const res = await generateQuiz({
        subject: "Mathematics",
        topic: "Linear Equations",
        gradeLevel: "Class 8",
        questionCount: 4,
      });

      expect(res.text).toBeDefined();
      expect(res.text).toContain("Linear Equations");
      expect(res.text).toContain("Answer Key");
      expect(res.text).toContain("Q1");
      expect(res.text).toContain("Q2");
    });

    it("should generate school administrative circular with event schedule", async () => {
      const res = await generateNotice({
        topic: "Science Exhibition & Robotic Fair 2026",
        audience: "All Students & Faculty",
        eventDate: "November 14, 2026",
        keyDetails: "Working models submission, robotics workshop, and guest keynote by ISRO scientists",
      });

      expect(res.text).toBeDefined();
      expect(res.text).toContain("GREENFIELD INTERNATIONAL SCHOOL");
      expect(res.text).toContain("CIRCULAR");
      expect(res.text).toContain("November 14, 2026");
      expect(res.text).toContain("Science Exhibition");
    });

    it("should answer school administrative queries about grading and examination rules", async () => {
      const res = await answerSchoolQuery({
        query: "What is the minimum passing grade percentage for CBSE examinations?",
      });

      expect(res.text).toBeDefined();
      expect(res.text.length).toBeGreaterThan(30);
      expect(res.text).toContain("grading scale");
    });

    it("should return valid provider metadata on all generation requests", async () => {
      const res = await answerSchoolQuery({
        query: "How do teachers mark attendance?",
      });

      expect(res.provider).toBeDefined();
      expect(typeof res.provider).toBe("string");
    });
  });
});
