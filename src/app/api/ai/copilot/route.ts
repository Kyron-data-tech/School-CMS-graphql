import { NextResponse } from "next/server";
import {
  CopilotRequestSchema,
  generateStudentRemarks,
  generateQuiz,
  generateNotice,
  answerSchoolQuery,
  LlmGenerationResult,
} from "@/lib/ai/copilot";
import { getInstitutionalAiConfig } from "@/lib/ai/institutionalConfig";

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const { mode, payload, modelConfig } = CopilotRequestSchema.parse(json);

    // Merge School Institutional AI Configuration saved by Principal
    const institutional = getInstitutionalAiConfig();
    const rawClientKey = (modelConfig?.apiKey || "").trim();
    const isMaskedOrEmpty = !rawClientKey || rawClientKey.includes("••");
    const effectiveApiKey = !isMaskedOrEmpty ? rawClientKey : institutional.apiKey;

    const effectiveConfig = {
      provider: modelConfig?.provider || institutional.provider,
      modelName: modelConfig?.modelName || institutional.modelName,
      baseUrl: modelConfig?.baseUrl || institutional.baseUrl,
      apiKey: effectiveApiKey,
      temperature: modelConfig?.temperature ?? institutional.temperature,
      customSystemPrompt: modelConfig?.customSystemPrompt || institutional.customSystemPrompt,
      maxTokens: modelConfig?.maxTokens || institutional.maxTokens,
    };

    let result: LlmGenerationResult;

    switch (mode) {
      case "remarks":
        result = await generateStudentRemarks(payload as any, effectiveConfig);
        break;
      case "quiz":
        result = await generateQuiz(payload as any, effectiveConfig);
        break;
      case "notice":
        result = await generateNotice(payload as any, effectiveConfig);
        break;
      case "chat":
        result = await answerSchoolQuery(payload as any, effectiveConfig);
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
      institutional: {
        active: Boolean(institutional.apiKey || institutional.isConfigured),
        managedBy: institutional.configuredBy,
      },
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
  const institutional = getInstitutionalAiConfig();

  return NextResponse.json({
    status: "active",
    name: "Greenfield AI Academic Copilot API",
    version: "2.2.0",
    institutionalConfig: {
      managedBy: institutional.configuredBy,
      isConfigured: institutional.isConfigured,
      activeProvider: institutional.provider,
      activeModel: institutional.modelName,
    },
    features: [
      "Principal-Authorized Institutional API Key Management",
      "School-wide Access for Teachers & Students",
      "OpenAI ChatGPT Integration (GPT-4o - 128K context)",
      "Anthropic Claude Integration (Claude 3.5 Sonnet - 200K context)",
      "Google Gemini Integration (Gemini 1.5 Flash - 1M context)",
      "Sir's Custom Endpoint Integration (LLaMA 3 - 8K context)",
      "Greenfield Academic AI Built-in Domain Engine",
      "Real-time Context Window & Token Tracking Engine",
    ],
    supportedModes: ["remarks", "quiz", "notice", "chat"],
  });
}
