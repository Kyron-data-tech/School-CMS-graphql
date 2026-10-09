import fs from "fs";
import path from "path";
import { AiModelConfig } from "@/lib/ai/copilot";
import type { AuthContext } from "@/lib/auth/context";

export interface InstitutionalAiConfig {
  provider: "openai" | "claude" | "gemini" | "custom" | "builtin";
  modelName: string;
  baseUrl: string;
  apiKey: string;
  temperature: number;
  customSystemPrompt: string;
  maxTokens: number;
  configuredBy: string;
  configuredAt: string;
  isConfigured: boolean;
}

const DEFAULT_INSTITUTIONAL_CONFIG: InstitutionalAiConfig = {
  provider: "builtin",
  modelName: "academic-domain-v1",
  baseUrl: "http://localhost:11434/v1",
  apiKey: "",
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
      inMemoryConfig = { ...DEFAULT_INSTITUTIONAL_CONFIG, ...parsed };
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
 * Returns full configuration including real API key (Internal backend use only)
 */
export function getInstitutionalAiConfig(): InstitutionalAiConfig {
  const cfg = loadSavedConfig();

  // If env keys exist and no file config has been explicitly saved, auto-upgrade
  if (!cfg.apiKey) {
    if (process.env.GEMINI_API_KEY) {
      cfg.provider = "gemini";
      cfg.modelName = "gemini-1.5-flash";
      cfg.apiKey = process.env.GEMINI_API_KEY;
      cfg.isConfigured = true;
    } else if (process.env.OPENAI_API_KEY) {
      cfg.provider = "openai";
      cfg.modelName = "gpt-4o";
      cfg.apiKey = process.env.OPENAI_API_KEY;
      cfg.isConfigured = true;
    } else if (process.env.ANTHROPIC_API_KEY) {
      cfg.provider = "claude";
      cfg.modelName = "claude-3-5-sonnet";
      cfg.apiKey = process.env.ANTHROPIC_API_KEY;
      cfg.isConfigured = true;
    }
  }

  return cfg;
}

/**
 * Returns sanitized configuration with API key masked (Safe for Teachers & Students)
 */
export function getPublicInstitutionalAiConfig(): Omit<InstitutionalAiConfig, "apiKey"> & {
  hasKey: boolean;
  maskedKey: string;
} {
  const full = getInstitutionalAiConfig();
  const rawKey = full.apiKey || "";

  let maskedKey = "";
  if (rawKey.length > 8) {
    maskedKey = `${rawKey.slice(0, 4)}••••••••••••${rawKey.slice(-4)}`;
  } else if (rawKey.length > 0) {
    maskedKey = "••••••••••••";
  }

  return {
    provider: full.provider,
    modelName: full.modelName,
    baseUrl: full.baseUrl,
    temperature: full.temperature,
    customSystemPrompt: full.customSystemPrompt,
    maxTokens: full.maxTokens,
    configuredBy: full.configuredBy,
    configuredAt: full.configuredAt,
    isConfigured: Boolean(full.isConfigured || rawKey.length > 0),
    hasKey: rawKey.length > 0,
    maskedKey,
  };
}

/**
 * Saves new school-wide AI configuration (Principal only)
 */
export function saveInstitutionalAiConfig(
  newConfig: Partial<InstitutionalAiConfig>,
  principalName: string = "Principal (Dr. Anita Desai)"
): InstitutionalAiConfig {
  const current = getInstitutionalAiConfig();
  const updated: InstitutionalAiConfig = {
    ...current,
    ...newConfig,
    configuredBy: principalName,
    configuredAt: new Date().toISOString(),
    isConfigured: Boolean(newConfig.apiKey || current.apiKey || newConfig.provider === "builtin"),
  };

  inMemoryConfig = updated;

  try {
    fs.writeFileSync(CONFIG_FILE_PATH, JSON.stringify(updated, null, 2), "utf-8");
  } catch (err) {
    console.warn("Could not persist to .school-ai-config.json", err);
  }

  return updated;
}
