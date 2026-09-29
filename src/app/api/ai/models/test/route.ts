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
    description: "Ping and verify connection to any custom LLM endpoint, Gemini, or local model.",
    examplePayload: {
      provider: "custom",
      baseUrl: "http://localhost:11434/v1",
      modelName: "llama3",
      apiKey: "optional-key",
      temperature: 0.7,
    },
  });
}
