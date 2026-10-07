import { NextResponse } from "next/server";
import {
  CopilotRequestSchema,
  generateStudentRemarks,
  generateQuiz,
  generateNotice,
  answerSchoolQuery,
  LlmGenerationResult,
} from "@/lib/ai/copilot";

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const { mode, payload, modelConfig } = CopilotRequestSchema.parse(json);

    let result: LlmGenerationResult;

    switch (mode) {
      case "remarks":
        result = await generateStudentRemarks(payload as any, modelConfig);
        break;
      case "quiz":
        result = await generateQuiz(payload as any, modelConfig);
        break;
      case "notice":
        result = await generateNotice(payload as any, modelConfig);
        break;
      case "chat":
        result = await answerSchoolQuery(payload as any, modelConfig);
        break;
      default:
        return NextResponse.json({ success: false, error: "Unsupported copilot mode" }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      mode,
      text: result.text,
      provider: result.provider,
      model: result.model || "default",
      tokenStats: result.tokenStats,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        error: err.message || "Failed to process AI copilot request",
      },
      { status: 400 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    status: "active",
    name: "Greenfield AI Academic Copilot API",
    version: "2.1.0",
    features: [
      "OpenAI ChatGPT Integration (GPT-4o, GPT-4o-mini - 128K context)",
      "Anthropic Claude Integration (Claude 3.5 Sonnet, Haiku - 200K context)",
      "Google Gemini Integration (Gemini 1.5 Flash, Pro - 1M to 2M context)",
      "Sir's Custom Endpoint Integration (Ollama, LM Studio, vLLM - 8K context)",
      "Greenfield Academic AI Built-in Domain Engine",
      "Real-time Context Window & Token Tracking Engine",
    ],
    supportedModes: ["remarks", "quiz", "notice", "chat"],
  });
}
