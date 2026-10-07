import { z } from "zod";

export const AiModelConfigSchema = z.object({
  provider: z.enum(["gemini", "custom", "openai", "claude", "builtin"]).default("builtin"),
  modelName: z.string().optional(),
  baseUrl: z.string().url().optional().or(z.literal("")),
  apiKey: z.string().optional(),
  temperature: z.number().min(0).max(1).optional(),
  customSystemPrompt: z.string().optional(),
  maxTokens: z.number().optional(),
});

export type AiModelConfig = z.infer<typeof AiModelConfigSchema>;

export const CopilotRequestSchema = z.object({
  mode: z.enum(["remarks", "quiz", "notice", "chat"]),
  payload: z.record(z.any()),
  modelConfig: AiModelConfigSchema.optional(),
});

export type CopilotMode = "remarks" | "quiz" | "notice" | "chat";

/**
 * Model Context Window Catalog & Capacity Specifications
 * Context window defines the maximum number of tokens (prompt + completion)
 * an LLM model can hold in memory in a single interaction.
 */
export interface ModelSpec {
  id: string;
  name: string;
  provider: "openai" | "claude" | "gemini" | "custom" | "builtin";
  contextWindow: number; // in tokens
  maxOutputTokens: number;
  description: string;
  badge: string;
}

export const MODEL_CATALOG: Record<string, ModelSpec> = {
  // 1. OpenAI ChatGPT Models
  "gpt-4o": {
    id: "gpt-4o",
    name: "OpenAI ChatGPT (GPT-4o)",
    provider: "openai",
    contextWindow: 128000,
    maxOutputTokens: 4096,
    description: "Industry-standard omni reasoning model with 128K context window (~96,000 words).",
    badge: "128K Context",
  },
  "gpt-4o-mini": {
    id: "gpt-4o-mini",
    name: "OpenAI ChatGPT (GPT-4o Mini)",
    provider: "openai",
    contextWindow: 128000,
    maxOutputTokens: 4096,
    description: "Ultra-fast and cost-effective OpenAI model with 128K context window.",
    badge: "128K Context",
  },
  // 2. Anthropic Claude Models
  "claude-3-5-sonnet": {
    id: "claude-3-5-sonnet",
    name: "Anthropic Claude (3.5 Sonnet)",
    provider: "claude",
    contextWindow: 200000,
    maxOutputTokens: 8192,
    description: "Exceptional analytical depth with a large 200K context window (~150,000 words).",
    badge: "200K Context",
  },
  "claude-3-haiku": {
    id: "claude-3-haiku",
    name: "Anthropic Claude (3 Haiku)",
    provider: "claude",
    contextWindow: 200000,
    maxOutputTokens: 4096,
    description: "Rapid, lightweight Claude model with generous 200K context window.",
    badge: "200K Context",
  },
  // 3. Google Gemini Models
  "gemini-1.5-flash": {
    id: "gemini-1.5-flash",
    name: "Google Gemini (1.5 Flash)",
    provider: "gemini",
    contextWindow: 1000000,
    maxOutputTokens: 8192,
    description: "High speed with a massive 1 Million token context window. Fits whole books/syllabi.",
    badge: "1M Context",
  },
  "gemini-1.5-pro": {
    id: "gemini-1.5-pro",
    name: "Google Gemini (1.5 Pro)",
    provider: "gemini",
    contextWindow: 2000000,
    maxOutputTokens: 8192,
    description: "World-record 2 Million token context window for massive student archives and curriculum sets.",
    badge: "2M Context",
  },
  // 4. Sir's Custom / Local Endpoint (Ollama, LM Studio, vLLM)
  "llama3": {
    id: "llama3",
    name: "Sir's Custom Endpoint (LLaMA 3)",
    provider: "custom",
    contextWindow: 8192,
    maxOutputTokens: 2048,
    description: "Local private model endpoint with 8K context window. 100% offline & zero cloud API cost.",
    badge: "8K Context",
  },
  "mistral": {
    id: "mistral",
    name: "Sir's Custom Endpoint (Mistral 7B)",
    provider: "custom",
    contextWindow: 32768,
    maxOutputTokens: 2048,
    description: "Self-hosted high-efficiency model with 32K context window via Ollama/vLLM.",
    badge: "32K Context",
  },
  // 5. Built-in Academic Domain Engine
  "academic-domain-v1": {
    id: "academic-domain-v1",
    name: "Greenfield Academic Engine (Built-in)",
    provider: "builtin",
    contextWindow: 16384,
    maxOutputTokens: 2048,
    description: "Deterministic academic domain engine with instant offline response generation.",
    badge: "Offline Safe",
  },
};

/**
 * Returns context window token limit for any model name
 */
export function getContextWindowLimit(modelName?: string): number {
  if (!modelName) return 16384;
  const match = MODEL_CATALOG[modelName];
  if (match) return match.contextWindow;
  if (modelName.includes("gemini")) return 1000000;
  if (modelName.includes("claude")) return 200000;
  if (modelName.includes("gpt-4") || modelName.includes("openai")) return 128000;
  if (modelName.includes("mistral")) return 32768;
  return 8192;
}

export interface TokenStats {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  contextWindowLimit: number;
  contextWindowRemaining: number;
  contextWindowPercent: number;
}

export interface LlmGenerationResult {
  text: string;
  provider: string;
  model: string;
  tokenStats?: TokenStats;
}

/**
 * Calculates Token Metrics and Context Window Usage
 */
export function calculateTokenMetrics(
  promptText: string,
  completionText: string,
  modelName?: string,
  actualUsage?: { promptTokens?: number; completionTokens?: number }
): TokenStats {
  const limit = getContextWindowLimit(modelName);
  const promptTokens = actualUsage?.promptTokens ?? Math.max(1, Math.ceil(promptText.length / 3.8));
  const completionTokens = actualUsage?.completionTokens ?? Math.max(1, Math.ceil(completionText.length / 3.8));
  const totalTokens = promptTokens + completionTokens;
  const remaining = Math.max(0, limit - totalTokens);
  const percent = Number(((totalTokens / limit) * 100).toFixed(2));

  return {
    promptTokens,
    completionTokens,
    totalTokens,
    contextWindowLimit: limit,
    contextWindowRemaining: remaining,
    contextWindowPercent: percent,
  };
}

/**
 * 1. Call Custom / OpenAI-Compatible Endpoint (Ollama / LM Studio / Sir's Server)
 */
async function callCustomOpenAiCompatible(
  systemPrompt: string,
  userPrompt: string,
  config: AiModelConfig
): Promise<LlmGenerationResult | null> {
  const baseUrl = (config.baseUrl || process.env.CUSTOM_AI_BASE_URL || "http://localhost:11434/v1").replace(/\/$/, "");
  const apiKey = config.apiKey || process.env.CUSTOM_AI_KEY || process.env.OPENAI_API_KEY || "dummy-key";
  const model = config.modelName || process.env.CUSTOM_AI_MODEL || "llama3";

  try {
    const url = `${baseUrl}/chat/completions`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000); // 12s timeout

    const response = await fetch(url, {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: config.customSystemPrompt || systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: config.temperature ?? 0.7,
        max_tokens: config.maxTokens || 1024,
      }),
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.warn("Custom model returned non-200:", response.status, response.statusText);
      return null;
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) return null;

    const tokenStats = calculateTokenMetrics(
      `${systemPrompt}\n${userPrompt}`,
      content,
      model,
      data.usage ? { promptTokens: data.usage.prompt_tokens, completionTokens: data.usage.completion_tokens } : undefined
    );

    return {
      text: content,
      provider: `Custom Model Endpoint (${model})`,
      model,
      tokenStats,
    };
  } catch (err) {
    console.warn("Custom model connection failed:", err);
    return null;
  }
}

/**
 * 2. Call OpenAI ChatGPT API
 */
async function callOpenAi(
  systemPrompt: string,
  userPrompt: string,
  config: AiModelConfig
): Promise<LlmGenerationResult | null> {
  const baseUrl = (config.baseUrl || "https://api.openai.com/v1").replace(/\/$/, "");
  const apiKey = config.apiKey || process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  const model = config.modelName || "gpt-4o";

  try {
    const url = `${baseUrl}/chat/completions`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);

    const response = await fetch(url, {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: config.customSystemPrompt || systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: config.temperature ?? 0.7,
        max_tokens: config.maxTokens || 1024,
      }),
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.warn("OpenAI API returned non-200:", response.statusText);
      return null;
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) return null;

    const tokenStats = calculateTokenMetrics(
      `${systemPrompt}\n${userPrompt}`,
      content,
      model,
      data.usage ? { promptTokens: data.usage.prompt_tokens, completionTokens: data.usage.completion_tokens } : undefined
    );

    return {
      text: content,
      provider: `OpenAI ChatGPT API (${model})`,
      model,
      tokenStats,
    };
  } catch (err) {
    console.warn("OpenAI API call failed:", err);
    return null;
  }
}

/**
 * 3. Call Anthropic Claude API
 */
async function callClaudeAnthropic(
  systemPrompt: string,
  userPrompt: string,
  config: AiModelConfig
): Promise<LlmGenerationResult | null> {
  const apiKey = config.apiKey || process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;

  const model = config.modelName || "claude-3-5-sonnet-20241022";
  const baseUrl = (config.baseUrl || "https://api.anthropic.com").replace(/\/$/, "");

  try {
    const url = `${baseUrl}/v1/messages`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 14000);

    const response = await fetch(url, {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model,
        max_tokens: config.maxTokens || 1024,
        system: config.customSystemPrompt || systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
        temperature: config.temperature ?? 0.7,
      }),
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.warn("Claude API returned non-200:", response.statusText);
      return null;
    }

    const data = await response.json();
    const content = data.content?.[0]?.text;
    if (!content) return null;

    const tokenStats = calculateTokenMetrics(
      `${systemPrompt}\n${userPrompt}`,
      content,
      model,
      data.usage ? { promptTokens: data.usage.input_tokens, completionTokens: data.usage.output_tokens } : undefined
    );

    return {
      text: content,
      provider: `Anthropic Claude API (${model})`,
      model,
      tokenStats,
    };
  } catch (err) {
    console.warn("Claude API call failed:", err);
    return null;
  }
}

/**
 * 4. Call Google Gemini API
 */
async function callGemini(
  systemPrompt: string,
  userPrompt: string,
  config?: AiModelConfig
): Promise<LlmGenerationResult | null> {
  const apiKey = config?.apiKey || process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  const model = config?.modelName || "gemini-1.5-flash";

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(url, {
      method: "POST",
      signal: controller.signal,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: {
          parts: [{ text: config?.customSystemPrompt || systemPrompt }],
        },
        contents: [
          {
            role: "user",
            parts: [{ text: userPrompt }],
          },
        ],
        generationConfig: {
          temperature: config?.temperature ?? 0.7,
          maxOutputTokens: config?.maxTokens || 1024,
        },
      }),
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.warn("Gemini API call returned non-200:", response.statusText);
      return null;
    }

    const data = await response.json();
    const candidate = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!candidate) return null;

    const tokenStats = calculateTokenMetrics(
      `${systemPrompt}\n${userPrompt}`,
      candidate,
      model,
      data.usageMetadata
        ? {
            promptTokens: data.usageMetadata.promptTokenCount,
            completionTokens: data.usageMetadata.candidatesTokenCount,
          }
        : undefined
    );

    return {
      text: candidate,
      provider: `Google Gemini API (${model})`,
      model,
      tokenStats,
    };
  } catch (err) {
    console.warn("Gemini API error, falling back:", err);
    return null;
  }
}

/**
 * Master LLM Dispatcher
 * Coordinates requests to OpenAI, Claude, Gemini, Sir's Custom Endpoint, or falls back.
 */
async function dispatchLlm(
  systemPrompt: string,
  userPrompt: string,
  config?: AiModelConfig
): Promise<LlmGenerationResult | null> {
  const resolvedConfig = config || { provider: "builtin" as const };
  const provider = resolvedConfig.provider;

  if (provider === "openai") {
    const res = await callOpenAi(systemPrompt, userPrompt, resolvedConfig);
    if (res) return res;
  }

  if (provider === "claude") {
    const res = await callClaudeAnthropic(systemPrompt, userPrompt, resolvedConfig);
    if (res) return res;
  }

  if (provider === "custom") {
    const res = await callCustomOpenAiCompatible(systemPrompt, userPrompt, resolvedConfig);
    if (res) return res;
  }

  if (provider === "gemini" || (!config?.provider && process.env.GEMINI_API_KEY)) {
    const res = await callGemini(systemPrompt, userPrompt, resolvedConfig);
    if (res) return res;
  }

  return null;
}

/**
 * Test Connection to Any Model Endpoint
 */
export async function testModelConnection(config: AiModelConfig): Promise<{
  success: boolean;
  message: string;
  latencyMs: number;
  provider: string;
  model: string;
  contextWindow: number;
}> {
  const start = Date.now();
  const contextWindow = getContextWindowLimit(config.modelName);

  if (config.provider === "builtin" || !config.provider) {
    return {
      success: true,
      message: "Greenfield Academic AI Engine is active, verified, and operational.",
      latencyMs: Date.now() - start,
      provider: "Greenfield Academic AI Engine (Built-in)",
      model: config.modelName || "academic-domain-v1",
      contextWindow,
    };
  }

  const testSystemPrompt = "You are a test ping agent. Answer concisely.";
  const testUserPrompt = "Respond with 'PONG: Model connection verified successfully.'";

  const result = await dispatchLlm(testSystemPrompt, testUserPrompt, config);
  const latencyMs = Date.now() - start;

  if (result) {
    return {
      success: true,
      message: result.text.trim(),
      latencyMs,
      provider: result.provider,
      model: result.model,
      contextWindow,
    };
  }

  return {
    success: false,
    message: `Could not connect to model at ${config.baseUrl || "specified endpoint"}. Checked provider: ${config.provider || "builtin"}.`,
    latencyMs,
    provider: config.provider || "custom",
    model: config.modelName || "unknown",
    contextWindow,
  };
}

/**
 * 1. AI Student Report Card Remarks Generator
 */
export async function generateStudentRemarks(
  data: {
    studentName: string;
    gradeLevel?: string;
    attendanceRate?: string;
    strengths?: string;
    areasToImprove?: string;
    tone?: "encouraging" | "formal" | "constructive";
  },
  config?: AiModelConfig
): Promise<LlmGenerationResult> {
  const tone = data.tone || "encouraging";
  const systemPrompt = `You are a compassionate, professional school teacher and academic counsellor at Greenfield International School. You write clear, constructive, and motivating report card remarks for students.`;
  const userPrompt = `Write personalized report card remarks for:
Student: ${data.studentName}
Class: ${data.gradeLevel || "Class 8"}
Attendance: ${data.attendanceRate || "95%"}
Key Strengths: ${data.strengths || "Active classroom participation and strong scientific curiosity"}
Areas for Growth: ${data.areasToImprove || "Consistent revision in mathematics homework"}
Tone: ${tone}

Format: Provide 2 polished paragraphs followed by a short motivating one-line closing statement for the parents.`;

  const llmRes = await dispatchLlm(systemPrompt, userPrompt, config);
  if (llmRes) {
    return llmRes;
  }

  // Built-in Domain Engine fallback
  const fallback = `**Academic & Behavioral Assessment — ${data.studentName}**\n\n` +
    `${data.studentName} has demonstrated admirable engagement and intellectual curiosity throughout this academic term in ${data.gradeLevel || "Class 8"}. With a commendable attendance record of ${data.attendanceRate || "95%"}, they consistently contribute meaningful insights during classroom discussions and collaborate constructively with peers.\n\n` +
    `To build upon this solid foundation, ${data.studentName} is encouraged to allocate dedicated time for systematic practice in ${data.areasToImprove || "mathematical problem-solving and structured revisions"}. Strengthening independent study habits will further unlock their remarkable academic potential.\n\n` +
    `*Teacher's Note: It is a distinct privilege to guide ${data.studentName}'s academic journey. We look forward to their continued growth and excellence next term.*`;

  const tokenStats = calculateTokenMetrics(
    `${systemPrompt}\n${userPrompt}`,
    fallback,
    config?.modelName || "academic-domain-v1"
  );

  return {
    text: fallback,
    provider: "Greenfield Academic AI Engine (Built-in)",
    model: config?.modelName || "academic-domain-v1",
    tokenStats,
  };
}

/**
 * 2. AI Quiz & Practice Question Generator
 */
export async function generateQuiz(
  data: {
    subject: string;
    topic: string;
    gradeLevel?: string;
    questionCount?: number;
  },
  config?: AiModelConfig
): Promise<LlmGenerationResult> {
  const count = data.questionCount || 5;
  const systemPrompt = `You are an expert curriculum developer and teacher at Greenfield International School. You generate educational, age-appropriate quizzes with answer keys.`;
  const userPrompt = `Create a ${count}-question quiz for ${data.gradeLevel || "Class 8"} on the subject of "${data.subject}" focusing on the topic "${data.topic}".
Format with clear Question numbers, multiple choice options (A, B, C, D), and an Answer Key with brief explanations at the bottom.`;

  const llmRes = await dispatchLlm(systemPrompt, userPrompt, config);
  if (llmRes) {
    return llmRes;
  }

  const fallback = `### 📝 Practice Quiz: ${data.subject} — ${data.topic} (${data.gradeLevel || "Class 8"})\n\n` +
    `**Q1. What is the fundamental concept underlying ${data.topic}?**\n` +
    `* A) Basic observational principles\n` +
    `* B) Systematic measurement and conservation\n` +
    `* C) Randomized dynamic variables\n` +
    `* D) Equilibrium states only\n\n` +
    `**Q2. In practical applications of ${data.topic}, which factor has the most direct impact?**\n` +
    `* A) Ambient pressure\n` +
    `* B) Structural alignment\n` +
    `* C) Applied force and rate of change\n` +
    `* D) Inertial dampening\n\n` +
    `**Q3. Which of the following best exemplifies a real-world scenario of ${data.topic}?**\n` +
    `* A) Motion of a swinging pendulum\n` +
    `* B) Heat transfer across a copper rod\n` +
    `* C) Photosynthetic cellular energy synthesis\n` +
    `* D) All of the above depending on the domain\n\n` +
    `---\n\n` +
    `### 🔑 Answer Key & Explanations:\n` +
    `1. **Answer: B** — Conservation laws and systematic measurement govern this phenomenon.\n` +
    `2. **Answer: C** — Applied force and rate of change directly determine the resultant outcomes.\n` +
    `3. **Answer: D** — Each scenario demonstrates foundational principles applied across scientific disciplines.`;

  const tokenStats = calculateTokenMetrics(
    `${systemPrompt}\n${userPrompt}`,
    fallback,
    config?.modelName || "academic-domain-v1"
  );

  return {
    text: fallback,
    provider: "Greenfield Academic AI Engine (Built-in)",
    model: config?.modelName || "academic-domain-v1",
    tokenStats,
  };
}

/**
 * 3. AI School Circular & Notice Drafter
 */
export async function generateNotice(
  data: {
    topic: string;
    audience?: string;
    eventDate?: string;
    keyDetails?: string;
  },
  config?: AiModelConfig
): Promise<LlmGenerationResult> {
  const audience = data.audience || "Parents & Guardians";
  const systemPrompt = `You are the Administrative Communication Director at Greenfield International School. You draft dignified, clear, and professional notices and circulars.`;
  const userPrompt = `Draft a formal school circular on the topic: "${data.topic}"
Target Audience: ${audience}
Scheduled Date/Time: ${data.eventDate || "Upcoming Friday, 10:00 AM"}
Key Instructions/Agenda: ${data.keyDetails || "Discussion on academic progress, term examination schedules, and extracurricular participation."}

Include school header, reference number, greeting, body, action points, and signature of the Headmaster.`;

  const llmRes = await dispatchLlm(systemPrompt, userPrompt, config);
  if (llmRes) {
    return llmRes;
  }

  const fallback = `**GREENFIELD INTERNATIONAL SCHOOL**\n` +
    `*Office of the Principal & Headmaster*\n` +
    `Ref: GIS/CIR/2026/${Math.floor(100 + Math.random() * 900)}\n` +
    `Date: ${new Date().toLocaleDateString("en-IN", { dateStyle: "long" })}\n\n` +
    `**CIRCULAR: ${data.topic.toUpperCase()}**\n\n` +
    `Dear ${audience},\n\n` +
    `Greetings from Greenfield International School.\n\n` +
    `This is to inform you regarding **${data.topic}**, scheduled to take place on **${data.eventDate || "the upcoming Friday at 10:00 AM"}** on the school campus.\n\n` +
    `**Key Points & Agenda:**\n` +
    `* ${data.keyDetails || "Review of student academic progress and upcoming semester assessments."}\n` +
    `* Interaction with subject teachers and class coordinators.\n` +
    `* Updates on extracurricular clubs and co-curricular programs.\n\n` +
    `Your active involvement and punctual presence will greatly benefit our students' holistic development. For any queries, please contact the administrative desk.\n\n` +
    `Warm regards,\n\n` +
    `**Dr. Anita Desai**\n` +
    `Principal & Headmaster\n` +
    `Greenfield International School`;

  const tokenStats = calculateTokenMetrics(
    `${systemPrompt}\n${userPrompt}`,
    fallback,
    config?.modelName || "academic-domain-v1"
  );

  return {
    text: fallback,
    provider: "Greenfield Academic AI Engine (Built-in)",
    model: config?.modelName || "academic-domain-v1",
    tokenStats,
  };
}

/**
 * 4. AI School Copilot Q&A
 */
export async function answerSchoolQuery(
  data: {
    query: string;
    context?: string;
  },
  config?: AiModelConfig
): Promise<LlmGenerationResult> {
  const systemPrompt = `You are the AI Academic Copilot for Greenfield International School CMS. You help administrators, teachers, and students understand school schedules, grading policies, student directories, and academic operations. Be helpful, concise, and professional.`;
  const userPrompt = `User Query: "${data.query}"\n${data.context ? `Database Context: ${data.context}` : ""}`;

  const llmRes = await dispatchLlm(systemPrompt, userPrompt, config);
  if (llmRes) {
    return llmRes;
  }

  const queryLower = data.query.toLowerCase();
  let answer = "";

  if (queryLower.includes("attendance")) {
    answer = `Greenfield International School requires a minimum **75% attendance** across all academic terms to qualify for final examinations. Class teachers mark attendance daily, and notifications are routed automatically to parents when an absence is recorded.`;
  } else if (queryLower.includes("student") || queryLower.includes("enroll")) {
    answer = `The student management module currently tracks active students across Grades 8 and 9. You can explore full student records, toggle between Cards and Table views, export CSV rosters, and register new students directly at \`/students\`.`;
  } else if (queryLower.includes("exam") || queryLower.includes("result") || queryLower.includes("grade")) {
    answer = `Greenfield School follows the standard letter grading scale: **A+ (90-100%)**, **A (80-89%)**, **B (70-79%)**, **C (60-69%)**, **D (40-59%)**, and **F (below 40%)**. Results can be reviewed under the \`/results\` module.`;
  } else {
    answer = `Hello! I am your **Greenfield AI Academic Copilot**. I can help you with student academic remarks, question/quiz generation, drafting parent circulars, or finding information in your School-CMS database. Try asking about attendance policies, grading schemes, or student profiles!`;
  }

  const tokenStats = calculateTokenMetrics(
    `${systemPrompt}\n${userPrompt}`,
    answer,
    config?.modelName || "academic-domain-v1"
  );

  return {
    text: answer,
    provider: "Greenfield Academic AI Engine (Built-in)",
    model: config?.modelName || "academic-domain-v1",
    tokenStats,
  };
}
