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

    it("should return token usage and context window metrics on generation calls", async () => {
      const res = await generateStudentRemarks({
        studentName: "Devansh Nair",
        gradeLevel: "Class 9-B",
        attendanceRate: "94%",
        strengths: "Computer Programming and Robotics",
        areasToImprove: "Essay formatting",
      });

      expect(res.tokenStats).toBeDefined();
      expect(res.tokenStats?.promptTokens).toBeGreaterThan(0);
      expect(res.tokenStats?.completionTokens).toBeGreaterThan(0);
      expect(res.tokenStats?.totalTokens).toBeGreaterThan(0);
      expect(res.tokenStats?.contextWindowLimit).toBeGreaterThan(0);
      expect(res.tokenStats?.contextWindowRemaining).toBeGreaterThan(0);
      expect(res.tokenStats?.contextWindowPercent).toBeGreaterThan(0);
    });
  });

  describe("LLM Context Window Specifications & Token Economics", () => {
    it("should accurately resolve context window token limits across all supported LLM models", async () => {
      const { getContextWindowLimit, MODEL_CATALOG } = await import("@/lib/ai/copilot");

      // Gemini: 1M - 2M tokens
      expect(getContextWindowLimit("gemini-1.5-flash")).toBe(1000000);
      expect(getContextWindowLimit("gemini-1.5-pro")).toBe(2000000);

      // Claude: 200K tokens
      expect(getContextWindowLimit("claude-3-5-sonnet")).toBe(200000);
      expect(getContextWindowLimit("claude-3-haiku")).toBe(200000);

      // OpenAI: 128K tokens
      expect(getContextWindowLimit("gpt-4o")).toBe(128000);
      expect(getContextWindowLimit("gpt-4o-mini")).toBe(128000);

      // Sir's Local Model: 8K tokens
      expect(getContextWindowLimit("llama3")).toBe(8192);

      // Verify catalog metadata
      expect(MODEL_CATALOG["gemini-1.5-flash"].badge).toBe("1M Context");
      expect(MODEL_CATALOG["claude-3-5-sonnet"].badge).toBe("200K Context");
      expect(MODEL_CATALOG["gpt-4o"].badge).toBe("128K Context");
      expect(MODEL_CATALOG["llama3"].badge).toBe("8K Context");
    });

    it("should compute token metrics, headroom, and percentage correctly", async () => {
      const { calculateTokenMetrics } = await import("@/lib/ai/copilot");

      const prompt = "Please evaluate this student's performance in term exams.";
      const completion = "The student demonstrated outstanding conceptual mastery in physics.";
      const metrics = calculateTokenMetrics(prompt, completion, "gpt-4o");

      expect(metrics.contextWindowLimit).toBe(128000);
      expect(metrics.promptTokens).toBeGreaterThan(0);
      expect(metrics.completionTokens).toBeGreaterThan(0);
      expect(metrics.totalTokens).toBe(metrics.promptTokens + metrics.completionTokens);
      expect(metrics.contextWindowRemaining).toBe(128000 - metrics.totalTokens);
      expect(metrics.contextWindowPercent).toBeLessThan(1);
    });
  });
});
