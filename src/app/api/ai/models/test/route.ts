import { NextResponse } from "next/server";
import { AiModelConfigSchema, testModelConnection } from "@/lib/ai/copilot";

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const config = AiModelConfigSchema.parse(json);

    const result = await testModelConnection(config);

    return NextResponse.json({
      success: result.success,
      message: result.message,
      latencyMs: result.latencyMs,
      provider: result.provider,
      model: result.model,
      contextWindow: result.contextWindow,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        error: err.message || "Failed to test model connection.",
      },
      { status: 400 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    endpoint: "/api/ai/models/test",
    description: "Ping and verify connection to any custom LLM endpoint, OpenAI, Claude, Gemini, or local model.",
    examplePayload: {
      provider: "openai",
      modelName: "gpt-4o",
      apiKey: "sk-...",
      temperature: 0.7,
    },
  });
}
