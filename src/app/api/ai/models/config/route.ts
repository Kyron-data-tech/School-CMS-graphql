import { NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth/context";
import {
  getPublicInstitutionalAiConfig,
  saveInstitutionalAiConfig,
  isPrincipalOrAdmin,
} from "@/lib/ai/institutionalConfig";
import { AiModelConfigSchema } from "@/lib/ai/copilot";

export async function GET() {
  try {
    const ctx = await getAuthContext();
    const publicConfig = getPublicInstitutionalAiConfig();
    const isPrincipal = isPrincipalOrAdmin(ctx);

    return NextResponse.json({
      success: true,
      config: publicConfig,
      isPrincipal,
      userRole: ctx?.roleKeys?.[0] || "guest",
      userName: ctx?.name || "Dr. Anita Desai",
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to retrieve institutional AI configuration." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const ctx = await getAuthContext();
    const isPrincipal = isPrincipalOrAdmin(ctx);

    // If context exists and user is explicitly not a principal/admin, block them!
    // If no session exists (e.g. testing mode), allow assuming Principal
    if (ctx && !isPrincipal) {
      return NextResponse.json(
        {
          success: false,
          error: "Permission Denied: Only the Principal or School Administrator has authority to add or update institutional AI API keys.",
        },
        { status: 403 }
      );
    }

    const json = await request.json();
    const validated = AiModelConfigSchema.partial().parse(json);

    const saved = saveInstitutionalAiConfig(
      {
        provider: validated.provider,
        modelName: validated.modelName,
        baseUrl: validated.baseUrl,
        apiKey: validated.apiKey,
        temperature: validated.temperature,
        customSystemPrompt: validated.customSystemPrompt,
        maxTokens: validated.maxTokens,
      },
      ctx?.name ? `Principal (${ctx.name})` : "Principal (Dr. Anita Desai)"
    );

    const publicConfig = getPublicInstitutionalAiConfig();

    return NextResponse.json({
      success: true,
      message: "Institutional AI configuration and API Key saved successfully by Principal. All teachers and students can now use this AI license.",
      config: publicConfig,
      updatedBy: saved.configuredBy,
      updatedAt: saved.configuredAt,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to save institutional AI configuration." },
      { status: 400 }
    );
  }
}
