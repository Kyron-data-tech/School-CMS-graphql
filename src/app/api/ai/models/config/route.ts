import { NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth/context";
import {
  getPublicInstitutionalAiConfig,
  saveInstitutionalAiConfig,
  saveInstitutionalApiKey,
  deleteInstitutionalApiKey,
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
    const principalName = ctx?.name ? `Principal (${ctx.name})` : "Principal (Dr. Anita Desai)";

    // Handle explicit deletion via POST action
    if (json.action === "delete") {
      const provider = (json.provider || "gemini") as "openai" | "claude" | "gemini" | "custom";
      deleteInstitutionalApiKey(provider, principalName);
      const publicConfig = getPublicInstitutionalAiConfig();

      const providerLabels: Record<string, string> = {
        gemini: "Google Gemini",
        openai: "OpenAI ChatGPT",
        claude: "Anthropic Claude",
        custom: "Sir's Local Endpoint",
      };

      return NextResponse.json({
        success: true,
        message: `API key for ${providerLabels[provider] || provider} successfully deleted by Principal.`,
        config: publicConfig,
      });
    }

    // Handle dedicated per-provider key addition/saving
    if (json.action === "save_key" && json.provider && json.apiKey) {
      const provider = json.provider as "openai" | "claude" | "gemini" | "custom";
      saveInstitutionalApiKey(provider, json.apiKey, json.modelName, principalName);
      const publicConfig = getPublicInstitutionalAiConfig();

      const providerLabels: Record<string, string> = {
        gemini: "Google Gemini",
        openai: "OpenAI ChatGPT",
        claude: "Anthropic Claude",
        custom: "Sir's Local Endpoint",
      };

      return NextResponse.json({
        success: true,
        message: `API key for ${providerLabels[provider] || provider} saved successfully by Principal.`,
        config: publicConfig,
      });
    }

    // Default: full config update
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
      principalName
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

export async function DELETE(request: Request) {
  try {
    const ctx = await getAuthContext();
    const isPrincipal = isPrincipalOrAdmin(ctx);

    if (ctx && !isPrincipal) {
      return NextResponse.json(
        {
          success: false,
          error: "Permission Denied: Only the Principal or School Administrator has authority to delete institutional AI API keys.",
        },
        { status: 403 }
      );
    }

    let provider: "openai" | "claude" | "gemini" | "custom" = "gemini";
    try {
      const json = await request.json();
      if (json.provider) provider = json.provider;
    } catch {
      const { searchParams } = new URL(request.url);
      const qProvider = searchParams.get("provider");
      if (qProvider) provider = qProvider as any;
    }

    const principalName = ctx?.name ? `Principal (${ctx.name})` : "Principal (Dr. Anita Desai)";
    deleteInstitutionalApiKey(provider, principalName);

    const publicConfig = getPublicInstitutionalAiConfig();
    const providerLabels: Record<string, string> = {
      gemini: "Google Gemini",
      openai: "OpenAI ChatGPT",
      claude: "Anthropic Claude",
      custom: "Sir's Local Endpoint",
    };

    return NextResponse.json({
      success: true,
      message: `API key for ${providerLabels[provider] || provider} successfully deleted by Principal.`,
      config: publicConfig,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to delete API key." },
      { status: 500 }
    );
  }
}
