import fs from "fs";
import path from "path";
import { AiModelConfig } from "@/lib/ai/copilot";
import type { AuthContext } from "@/lib/auth/context";

export type SupportedAiProvider = "openai" | "claude" | "gemini" | "custom" | "builtin";

export interface InstitutionalAiConfig {
  provider: SupportedAiProvider;
  modelName: string;
  baseUrl: string;
  apiKey: string; // Active key for current provider (backward compatibility)
  apiKeys?: {
    openai?: string;
    claude?: string;
    gemini?: string;
    custom?: string;
  };
  deletedProviders?: string[]; // Tracks explicitly deleted providers so they don't resurrect from env
  temperature: number;
  customSystemPrompt: string;
  maxTokens: number;
  configuredBy: string;
  configuredAt: string;
  isConfigured: boolean;
}

export interface ProviderKeyStatus {
  provider: "openai" | "claude" | "gemini" | "custom";
  name: string;
  configured: boolean;
  maskedKey: string;
  defaultModel: string;
}

const DEFAULT_INSTITUTIONAL_CONFIG: InstitutionalAiConfig = {
  provider: "builtin",
  modelName: "academic-domain-v1",
  baseUrl: "http://localhost:11434/v1",
  apiKey: "",
  apiKeys: {},
  deletedProviders: [],
  temperature: 0.7,
  customSystemPrompt:
    "You are the expert AI Academic Counsellor at Greenfield International School. Be motivating, precise, and supportive.",
  maxTokens: 1024,
  configuredBy: "Principal (Dr. Anita Desai)",
  configuredAt: new Date().toISOString(),
  isConfigured: false,
};

// Storage file location for persisting institutional configuration
const CONFIG_FILE_PATH = path.join(process.cwd(), ".school-ai-config.json");

// In-memory cache
let inMemoryConfig: InstitutionalAiConfig = { ...DEFAULT_INSTITUTIONAL_CONFIG };

// Load from file if exists
function loadSavedConfig(): InstitutionalAiConfig {
  try {
    if (fs.existsSync(CONFIG_FILE_PATH)) {
      const data = fs.readFileSync(CONFIG_FILE_PATH, "utf-8");
      const parsed = JSON.parse(data);
      const apiKeys = parsed.apiKeys || {};

      // Migrate single apiKey to apiKeys dictionary if not present
      if (parsed.apiKey && parsed.provider && !apiKeys[parsed.provider]) {
        apiKeys[parsed.provider] = parsed.apiKey;
      }

      inMemoryConfig = {
        ...DEFAULT_INSTITUTIONAL_CONFIG,
        ...parsed,
        apiKeys,
        deletedProviders: parsed.deletedProviders || [],
      };
      return inMemoryConfig;
    }
  } catch (err) {
    console.warn("Could not read .school-ai-config.json, using in-memory default", err);
  }
  return inMemoryConfig;
}

// Check if a user has Principal or Admin authorization
export function isPrincipalOrAdmin(ctx: AuthContext | null | undefined): boolean {
  if (!ctx) return false;
  const roles = (ctx.roleKeys || []).map((r) => r.toLowerCase());
  return roles.some((r) =>
    ["principal", "admin", "superadmin", "headmaster", "administrator"].includes(r)
  );
}

/**
 * Safely masks API keys (e.g., sk-proj-1234... -> sk-p••••••••••••1234)
 */
export function maskKey(rawKey: string | undefined | null): string {
  if (!rawKey) return "";
  const key = rawKey.trim();
  if (key.length > 8) {
    return `${key.slice(0, 4)}••••••••••••${key.slice(-4)}`;
  } else if (key.length > 0) {
    return "••••••••••••";
  }
  return "";
}

/**
 * Returns full configuration including real API keys (Internal backend use only)
 */
export function getInstitutionalAiConfig(): InstitutionalAiConfig {
  const cfg = loadSavedConfig();
  const apiKeys = { ...(cfg.apiKeys || {}) };
  const deleted = new Set(cfg.deletedProviders || []);

  // Initialize from environment if not explicitly configured or deleted
  if (!apiKeys.gemini && !deleted.has("gemini") && process.env.GEMINI_API_KEY) {
    apiKeys.gemini = process.env.GEMINI_API_KEY;
  }
  if (!apiKeys.openai && !deleted.has("openai") && process.env.OPENAI_API_KEY) {
    apiKeys.openai = process.env.OPENAI_API_KEY;
  }
  if (!apiKeys.claude && !deleted.has("claude") && process.env.ANTHROPIC_API_KEY) {
    apiKeys.claude = process.env.ANTHROPIC_API_KEY;
  }

  cfg.apiKeys = apiKeys;

  // Sync active apiKey with current provider if available
  const activeProvider = cfg.provider as keyof typeof apiKeys;
  if (apiKeys[activeProvider]) {
    cfg.apiKey = apiKeys[activeProvider]!;
    cfg.isConfigured = true;
  } else if (!cfg.apiKey && cfg.provider !== "builtin") {
    // If active provider has no key, check if any provider has a key
    const firstAvailable = Object.entries(apiKeys).find(([, v]) => Boolean(v));
    if (firstAvailable) {
      cfg.apiKey = firstAvailable[1]!;
      cfg.isConfigured = true;
    }
  }

  return cfg;
}

/**
 * Returns sanitized configuration with API keys masked (Safe for Teachers & Students)
 * Includes per-model key configuration status for the Principal GUI.
 */
export function getPublicInstitutionalAiConfig(): Omit<InstitutionalAiConfig, "apiKey" | "apiKeys"> & {
  hasKey: boolean;
  maskedKey: string;
  keysStatus: {
    gemini: ProviderKeyStatus;
    openai: ProviderKeyStatus;
    claude: ProviderKeyStatus;
    custom: ProviderKeyStatus;
  };
} {
  const full = getInstitutionalAiConfig();
  const rawKey = full.apiKey || "";
  const apiKeys = full.apiKeys || {};

  const keysStatus = {
    gemini: {
      provider: "gemini" as const,
      name: "Google Gemini (1.5 Flash / Pro)",
      configured: Boolean(apiKeys.gemini && apiKeys.gemini.trim().length > 0),
      maskedKey: maskKey(apiKeys.gemini),
      defaultModel: "gemini-1.5-flash",
    },
    openai: {
      provider: "openai" as const,
      name: "OpenAI ChatGPT (GPT-4o / Mini)",
      configured: Boolean(apiKeys.openai && apiKeys.openai.trim().length > 0),
      maskedKey: maskKey(apiKeys.openai),
      defaultModel: "gpt-4o",
    },
    claude: {
      provider: "claude" as const,
      name: "Anthropic Claude (3.5 Sonnet)",
      configured: Boolean(apiKeys.claude && apiKeys.claude.trim().length > 0),
      maskedKey: maskKey(apiKeys.claude),
      defaultModel: "claude-3-5-sonnet",
    },
    custom: {
      provider: "custom" as const,
      name: "Sir's Local Endpoint (LLaMA 3)",
      configured: Boolean(apiKeys.custom && apiKeys.custom.trim().length > 0),
      maskedKey: maskKey(apiKeys.custom),
      defaultModel: "llama3",
    },
  };

  const hasAnyKey =
    keysStatus.gemini.configured ||
    keysStatus.openai.configured ||
    keysStatus.claude.configured ||
    rawKey.length > 0;

  return {
    provider: full.provider,
    modelName: full.modelName,
    baseUrl: full.baseUrl,
    temperature: full.temperature,
    customSystemPrompt: full.customSystemPrompt,
    maxTokens: full.maxTokens,
    configuredBy: full.configuredBy,
    configuredAt: full.configuredAt,
    isConfigured: Boolean(full.isConfigured || hasAnyKey),
    hasKey: hasAnyKey,
    maskedKey: maskKey(rawKey),
    keysStatus,
  };
}

/**
 * Saves or updates school-wide AI configuration (Principal only)
 */
export function saveInstitutionalAiConfig(
  newConfig: Partial<InstitutionalAiConfig>,
  principalName: string = "Principal (Dr. Anita Desai)"
): InstitutionalAiConfig {
  const current = getInstitutionalAiConfig();
  const apiKeys = { ...(current.apiKeys || {}), ...(newConfig.apiKeys || {}) };

  // If a provider and apiKey are passed directly, record in apiKeys dictionary
  if (newConfig.provider && newConfig.provider !== "builtin" && newConfig.apiKey) {
    const p = newConfig.provider as "openai" | "claude" | "gemini" | "custom";
    apiKeys[p] = newConfig.apiKey;
  }

  // Remove updated provider from deleted set
  const deletedProviders = (current.deletedProviders || []).filter(
    (p) => p !== newConfig.provider
  );

  const activeProvider = (newConfig.provider || current.provider) as keyof typeof apiKeys;
  const activeKey = newConfig.apiKey || apiKeys[activeProvider] || current.apiKey;

  const updated: InstitutionalAiConfig = {
    ...current,
    ...newConfig,
    apiKey: activeKey || "",
    apiKeys,
    deletedProviders,
    configuredBy: principalName,
    configuredAt: new Date().toISOString(),
    isConfigured: Boolean(
      activeKey ||
        Object.values(apiKeys).some((k) => Boolean(k)) ||
        newConfig.provider === "builtin"
    ),
  };

  inMemoryConfig = updated;

  try {
    fs.writeFileSync(CONFIG_FILE_PATH, JSON.stringify(updated, null, 2), "utf-8");
  } catch (err) {
    console.warn("Could not persist to .school-ai-config.json", err);
  }

  return updated;
}

/**
 * Saves an API key for a specific provider (e.g. Gemini, ChatGPT, Claude)
 */
export function saveInstitutionalApiKey(
  provider: "openai" | "claude" | "gemini" | "custom",
  apiKey: string,
  modelName?: string,
  principalName: string = "Principal (Dr. Anita Desai)"
): InstitutionalAiConfig {
  const current = getInstitutionalAiConfig();
  const apiKeys = { ...(current.apiKeys || {}), [provider]: apiKey.trim() };
  const deletedProviders = (current.deletedProviders || []).filter((p) => p !== provider);

  const updated: InstitutionalAiConfig = {
    ...current,
    provider,
    modelName: modelName || current.modelName,
    apiKey: apiKey.trim(),
    apiKeys,
    deletedProviders,
    configuredBy: principalName,
    configuredAt: new Date().toISOString(),
    isConfigured: true,
  };

  inMemoryConfig = updated;

  try {
    fs.writeFileSync(CONFIG_FILE_PATH, JSON.stringify(updated, null, 2), "utf-8");
  } catch (err) {
    console.warn("Could not persist to .school-ai-config.json", err);
  }

  return updated;
}

/**
 * Deletes an API key for a specific provider (e.g. Gemini, ChatGPT, Claude) from GUI
 */
export function deleteInstitutionalApiKey(
  provider: "openai" | "claude" | "gemini" | "custom",
  principalName: string = "Principal (Dr. Anita Desai)"
): InstitutionalAiConfig {
  const current = getInstitutionalAiConfig();
  const apiKeys = { ...(current.apiKeys || {}) };
  delete apiKeys[provider];

  // Track that this provider was explicitly deleted by Principal
  const deletedSet = new Set(current.deletedProviders || []);
  deletedSet.add(provider);
  const deletedProviders = Array.from(deletedSet);

  // If deleted provider was the active provider, clear active apiKey
  let activeKey = current.apiKey;
  let activeProvider = current.provider;
  let activeModel = current.modelName;

  if (current.provider === provider) {
    // Check if another provider has a configured key
    const remaining = Object.entries(apiKeys).find(([, key]) => Boolean(key));
    if (remaining) {
      activeProvider = remaining[0] as SupportedAiProvider;
      activeKey = remaining[1]!;
      if (activeProvider === "gemini") activeModel = "gemini-1.5-flash";
      else if (activeProvider === "openai") activeModel = "gpt-4o";
      else if (activeProvider === "claude") activeModel = "claude-3-5-sonnet";
    } else {
      activeKey = "";
      activeProvider = "builtin";
      activeModel = "academic-domain-v1";
    }
  }

  const updated: InstitutionalAiConfig = {
    ...current,
    provider: activeProvider,
    modelName: activeModel,
    apiKey: activeKey,
    apiKeys,
    deletedProviders,
    configuredBy: principalName,
    configuredAt: new Date().toISOString(),
    isConfigured: Boolean(activeKey || Object.values(apiKeys).some((k) => Boolean(k))),
  };

  inMemoryConfig = updated;

  try {
    fs.writeFileSync(CONFIG_FILE_PATH, JSON.stringify(updated, null, 2), "utf-8");
  } catch (err) {
    console.warn("Could not persist to .school-ai-config.json", err);
  }

  return updated;
}
