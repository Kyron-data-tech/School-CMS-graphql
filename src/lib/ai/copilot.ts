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
  "qwen-0.6b": {
    id: "qwen-0.6b",
    name: "Qwen 0.6B Parameter (Edge / CPU SLM)",
    provider: "custom",
    contextWindow: 32768,
    maxOutputTokens: 2048,
    description: "Ultra-compact 0.6B parameter Small Language Model (Qwen 0.6B / Qwen3). 100% offline, runs on ordinary school PCs & CPUs with under 600MB RAM.",
    badge: "0.6B Edge SLM",
  },
  "qwen3-0.6b": {
    id: "qwen3-0.6b",
    name: "Qwen3 0.6B Parameter (Local Edge)",
    provider: "custom",
    contextWindow: 32768,
    maxOutputTokens: 2048,
    description: "Sir's recommended 0.6B parameter model. Highly optimized for fast CPU inference without dedicated GPU hardware.",
    badge: "0.6B SLM",
  },
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
  if (modelName.includes("mistral") || modelName.includes("qwen")) return 32768;
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
  const userPrompt = `Create a ${count}-question quiz for ${data.gradeLevel || "Class 8"} on the subject of "${data.subject}" focusing strictly on the topic "${data.topic}".
IMPORTANT: All generated questions MUST focus exclusively and directly on "${data.topic}". Do NOT generate questions from unrelated topics or different branches of ${data.subject}.
Format with clear Question numbers (Q1, Q2, ...), multiple choice options (A, B, C, D), and an Answer Key with brief explanations at the bottom.`;

  const llmRes = await dispatchLlm(systemPrompt, userPrompt, config);
  if (llmRes) {
    return llmRes;
  }

  const fallback = buildDomainQuizFallback(
    data.subject,
    data.topic,
    data.gradeLevel || "Class 8",
    count
  );

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

interface DomainQuizQuestion {
  q: string;
  options: string[];
  answer: string;
  explanation: string;
}

function formatQuizResponse(
  subject: string,
  topic: string,
  gradeLevel: string,
  questions: DomainQuizQuestion[],
  questionCount: number
): string {
  const selected = questions.slice(0, Math.min(questionCount, questions.length));
  let text = `### 📝 Practice Quiz: ${subject} — ${topic} (${gradeLevel})\n\n`;
  selected.forEach((item, idx) => {
    text += `**Q${idx + 1}. ${item.q}**\n`;
    item.options.forEach((opt) => {
      text += `* ${opt}\n`;
    });
    text += `\n`;
  });
  text += `---\n\n### 🔑 Answer Key & Explanations:\n`;
  selected.forEach((item, idx) => {
    text += `${idx + 1}. **Answer: ${item.answer}** — ${item.explanation}\n`;
  });
  return text.trim();
}

/**
 * Domain-specific Quiz Generator Fallback
 * Generates rigorous, topic-accurate questions for Mathematics, Computer Science, Science, English, and other subjects.
 */
function buildDomainQuizFallback(
  subject: string,
  topic: string,
  gradeLevel: string = "Class 8",
  questionCount: number = 3
): string {
  const topicLower = topic.toLowerCase();
  const subjectLower = subject.toLowerCase();

  // 1A. Computer Science: Arrays & Linked Lists
  if (
    topicLower.includes("array") ||
    topicLower.includes("linked") ||
    topicLower.includes("list")
  ) {
    const questions: DomainQuizQuestion[] = [
      {
        q: "What is the primary memory allocation difference between an Array and a Linked List?",
        options: [
          "A) Arrays use contiguous memory blocks, whereas Linked Lists allocate individual nodes dynamically linked via pointers",
          "B) Linked Lists use static contiguous memory, whereas arrays use dynamic heap pointers",
          "C) Arrays can expand infinitely without resizing, while Linked Lists have a fixed capacity",
          "D) Linked Lists have O(1) random access by numerical index",
        ],
        answer: "A",
        explanation: "Arrays store elements in consecutive (contiguous) memory addresses, enabling instant index calculation. In contrast, Linked Lists store elements in non-contiguous memory locations where each node maintains a reference (pointer) to the next node.",
      },
      {
        q: "What is the time complexity to access an element by its index in an Array versus a Singly Linked List?",
        options: [
          "A) Array: O(1) constant time, Linked List: O(N) linear time",
          "B) Array: O(N) linear time, Linked List: O(1) constant time",
          "C) Array: O(log N) logarithmic time, Linked List: O(N) linear time",
          "D) Both provide O(1) random access",
        ],
        answer: "A",
        explanation: "Arrays support O(1) direct indexing arithmetic (base_address + index * element_size). Linked Lists must be traversed from the head node one pointer at a time, taking O(N) time in the worst case.",
      },
      {
        q: "In a Singly Linked List, what is the time complexity of inserting a new node at the head (beginning) if a head pointer is maintained?",
        options: [
          "A) O(N)",
          "B) O(1)",
          "C) O(log N)",
          "D) O(N^2)",
        ],
        answer: "B",
        explanation: "Inserting at the head simply requires pointing the new node's next pointer to the current head and updating the head pointer, which takes O(1) constant time.",
      },
      {
        q: "What is the primary disadvantage of a Doubly Linked List compared to a Singly Linked List?",
        options: [
          "A) Cannot be traversed backwards",
          "B) Extra memory overhead per node to store both next and previous pointers",
          "C) Deletion of a known node takes O(N) time instead of O(1)",
          "D) Does not allow dynamic insertion",
        ],
        answer: "B",
        explanation: "Every node in a Doubly Linked List must store an additional pointer (previous), increasing memory consumption per node.",
      },
      {
        q: "Which error occurs in languages like C/Java when attempting to read an Array index that exceeds its allocated length?",
        options: [
          "A) Array Index Out Of Bounds / Segmentation Fault",
          "B) Deadlock Exception",
          "C) Infinite Recursion",
          "D) Garbage Collection Freeze",
        ],
        answer: "A",
        explanation: "Attempting to access an index outside [0, length - 1] leads to an ArrayIndexOutOfBoundsException or Segmentation Fault due to unauthorized memory access.",
      },
    ];
    return formatQuizResponse(subject, topic, gradeLevel, questions, questionCount);
  }

  // 1B. Computer Science: Trees & Graphs
  if (
    topicLower.includes("tree") ||
    topicLower.includes("graph") ||
    topicLower.includes("bst")
  ) {
    const questions: DomainQuizQuestion[] = [
      {
        q: "What is the primary structural difference between a Tree and a Graph data structure?",
        options: [
          "A) Trees are linear data structures, while graphs are non-linear",
          "B) A Tree is a connected, acyclic graph with exactly N - 1 edges for N vertices, while a Graph can contain cycles and multiple disconnected components",
          "C) Graphs cannot have weighted edges, whereas trees always require weights",
          "D) Trees can only store numerical values, whereas graphs store objects",
        ],
        answer: "B",
        explanation: "By mathematical and computational definition, a tree is a connected, acyclic graph. Any graph that contains cycles or disconnected vertices cannot be classified as a tree.",
      },
      {
        q: "Which traversal algorithm utilizes a Queue (FIFO) to explore nodes level-by-level in a Tree or Graph?",
        options: [
          "A) Depth-First Search (DFS)",
          "B) Breadth-First Search (BFS)",
          "C) In-Order Traversal",
          "D) Post-Order Traversal",
        ],
        answer: "B",
        explanation: "Breadth-First Search (BFS) utilizes a Queue data structure to traverse tree or graph vertices level-by-level starting from a source vertex.",
      },
      {
        q: "In a Binary Search Tree (BST), what is the worst-case time complexity for searching an element if the tree becomes completely skewed?",
        options: [
          "A) O(1)",
          "B) O(log N)",
          "C) O(N)",
          "D) O(N log N)",
        ],
        answer: "C",
        explanation: "When a Binary Search Tree becomes completely skewed (all nodes inserted in ascending or descending sorted order), it degenerates into a linear linked list with O(N) search time.",
      },
      {
        q: "Which graph representation is most memory-efficient for storing a sparse graph with V vertices and E edges?",
        options: [
          "A) Adjacency Matrix (V x V matrix)",
          "B) Adjacency List using linked lists or dynamic arrays",
          "C) 3D Static Matrix",
          "D) Monolithic Binary Heap",
        ],
        answer: "B",
        explanation: "For sparse graphs where E << V^2, an Adjacency List takes only O(V + E) memory space, whereas an Adjacency Matrix requires O(V^2) memory regardless of edge density.",
      },
      {
        q: "In a connected undirected graph with V vertices, what is the minimum number of edges needed to form a Spanning Tree?",
        options: [
          "A) V",
          "B) V - 1",
          "C) V + 1",
          "D) V * (V - 1) / 2",
        ],
        answer: "B",
        explanation: "A spanning tree that connects all V vertices without forming any cycles contains exactly V - 1 edges.",
      },
    ];
    return formatQuizResponse(subject, topic, gradeLevel, questions, questionCount);
  }

  // 1C. Computer Science: Stacks & Queues
  if (
    topicLower.includes("stack") ||
    topicLower.includes("queue")
  ) {
    const questions: DomainQuizQuestion[] = [
      {
        q: "Which fundamental data access principle governs a Stack data structure?",
        options: [
          "A) First-In, First-Out (FIFO)",
          "B) Last-In, First-Out (LIFO)",
          "C) Random Direct Access",
          "D) Lowest-Value First",
        ],
        answer: "B",
        explanation: "A Stack operates on the Last-In, First-Out (LIFO) principle: the most recently pushed element is the first one removed via pop().",
      },
      {
        q: "Which real-world computing mechanism relies directly on a Stack data structure?",
        options: [
          "A) Function call stack and recursion management",
          "B) Print queue spooling",
          "C) CPU round-robin scheduling",
          "D) Network packet routing",
        ],
        answer: "A",
        explanation: "The call stack manages active function calls, local variables, and return addresses using LIFO stack semantics.",
      },
      {
        q: "What principle governs a standard Queue data structure?",
        options: [
          "A) Last-In, First-Out (LIFO)",
          "B) First-In, First-Out (FIFO)",
          "C) Binary Priority Heap",
          "D) Hash Collisions",
        ],
        answer: "B",
        explanation: "A standard Queue enforces First-In, First-Out (FIFO) ordering: elements are enqueued at the rear and dequeued from the front.",
      },
    ];
    return formatQuizResponse(subject, topic, gradeLevel, questions, questionCount);
  }

  // 2A. Mathematics: Probability & Chance (Class 8 & School Curriculum)
  if (
    topicLower.includes("probab") ||
    topicLower.includes("chance") ||
    topicLower.includes("dice") ||
    topicLower.includes("coin") ||
    topicLower.includes("card") ||
    topicLower.includes("sample space") ||
    topicLower.includes("outcome")
  ) {
    const questions: DomainQuizQuestion[] = [
      {
        q: "What is the standard mathematical formula used to calculate the theoretical probability of an event E, denoted as P(E)?",
        options: [
          "A) P(E) = (Number of outcomes favorable to E) / (Total number of possible outcomes in the sample space)",
          "B) P(E) = (Total number of possible outcomes) / (Number of favorable outcomes)",
          "C) P(E) = (Number of favorable outcomes) × (Total outcomes)",
          "D) P(E) = (Total outcomes) - (Number of favorable outcomes)",
        ],
        answer: "A",
        explanation: "Theoretical probability is calculated as the ratio of favorable outcomes to the total number of equally likely possible outcomes: P(E) = n(E) / n(S).",
      },
      {
        q: "If a fair, standard six-sided die is rolled once, what is the probability of rolling an even prime number?",
        options: [
          "A) 1/2",
          "B) 1/6",
          "C) 1/3",
          "D) 2/3",
        ],
        answer: "B",
        explanation: "The possible outcomes when rolling a six-sided die are {1, 2, 3, 4, 5, 6} (6 total outcomes). The only even prime number is 2 (1 favorable outcome). Therefore, P(even prime) = 1/6.",
      },
      {
        q: "Which of the following values can NEVER represent the probability of an event occurring?",
        options: [
          "A) 0",
          "B) 3/4 (or 0.75)",
          "C) 1.25",
          "D) 85%",
        ],
        answer: "C",
        explanation: "The probability of any event E always satisfies 0 ≤ P(E) ≤ 1 (or 0% to 100%). A probability value cannot be negative or strictly greater than 1 (such as 1.25).",
      },
      {
        q: "When two fair coins are tossed simultaneously, what is the probability of obtaining at least one Head?",
        options: [
          "A) 1/4",
          "B) 1/2",
          "C) 3/4",
          "D) 1",
        ],
        answer: "C",
        explanation: "The complete sample space for tossing two coins is {HH, HT, TH, TT} (4 total outcomes). The outcomes containing at least one Head are {HH, HT, TH} (3 favorable outcomes). Hence, P(at least one Head) = 3/4.",
      },
      {
        q: "A single card is drawn at random from a well-shuffled standard deck of 52 playing cards. What is the probability of drawing a red Ace?",
        options: [
          "A) 1/52",
          "B) 2/52 (which simplifies to 1/26)",
          "C) 4/52 (which simplifies to 1/13)",
          "D) 1/4",
        ],
        answer: "B",
        explanation: "A standard deck contains 4 Aces, consisting of 2 black Aces (Spades, Clubs) and 2 red Aces (Hearts, Diamonds). Therefore, P(red Ace) = 2/52 = 1/26.",
      },
      {
        q: "If the probability of an event E occurring is P(E) = 0.35, what is the probability of its complementary event 'not E' occurring?",
        options: [
          "A) 0.35",
          "B) 0.65",
          "C) 1.35",
          "D) 0.70",
        ],
        answer: "B",
        explanation: "The sum of probabilities of an event and its complement is always 1: P(E) + P(not E) = 1. Therefore, P(not E) = 1 - 0.35 = 0.65.",
      },
      {
        q: "A bag contains 5 red balls, 3 blue balls, and 2 green balls. If one ball is drawn at random, what is the probability that it is NOT blue?",
        options: [
          "A) 3/10",
          "B) 7/10",
          "C) 1/2",
          "D) 2/5",
        ],
        answer: "B",
        explanation: "Total balls = 5 + 3 + 2 = 10. The number of balls that are not blue (red + green) = 5 + 2 = 7. Thus, P(not blue) = 7/10.",
      },
    ];
    return formatQuizResponse(subject, topic, gradeLevel, questions, questionCount);
  }

  // 2B. Mathematics: Statistics & Data Handling
  if (
    topicLower.includes("stat") ||
    topicLower.includes("mean") ||
    topicLower.includes("median") ||
    topicLower.includes("mode") ||
    topicLower.includes("data handling") ||
    topicLower.includes("frequency") ||
    topicLower.includes("histogram") ||
    topicLower.includes("bar graph") ||
    topicLower.includes("pie chart")
  ) {
    const questions: DomainQuizQuestion[] = [
      {
        q: "How is the arithmetic mean of a set of N observations calculated?",
        options: [
          "A) (Sum of all observations) / (Total number of observations N)",
          "B) (Highest observation - Lowest observation) / 2",
          "C) The value that appears most frequently",
          "D) The middle observation when sorted",
        ],
        answer: "A",
        explanation: "The arithmetic mean is computed by summing all values and dividing by the total count: Mean = (Σx) / N.",
      },
      {
        q: "In a set of sorted numerical observations, what does the Median represent?",
        options: [
          "A) The arithmetic average of all values",
          "B) The middle-most value that divides the sorted data into two equal halves",
          "C) The observation occurring with the highest frequency",
          "D) The difference between extreme values",
        ],
        answer: "B",
        explanation: "When data is arranged in ascending or descending order, the median is the central observation.",
      },
      {
        q: "What is the Mode of the following data set: 4, 7, 9, 7, 3, 7, 5, 2?",
        options: [
          "A) 5.5",
          "B) 7",
          "C) 9",
          "D) 4",
        ],
        answer: "B",
        explanation: "The mode is the observation that appears with the highest frequency. Here, 7 appears 3 times, which is more than any other number.",
      },
      {
        q: "In descriptive statistics, what does the Range of a data set measure?",
        options: [
          "A) The difference between the maximum and minimum observations (Max - Min)",
          "B) The average distance of data points from the mean",
          "C) The sum of squares of deviations",
          "D) The center of mass of the frequency polygon",
        ],
        answer: "A",
        explanation: "The range measures statistical dispersion by subtracting the smallest observation from the largest observation.",
      },
      {
        q: "Which graphical representation uses adjacent continuous bars without gaps between them to represent grouped frequency distributions?",
        options: [
          "A) Simple Bar Graph",
          "B) Histogram",
          "C) Pie Chart",
          "D) Line Graph",
        ],
        answer: "B",
        explanation: "Histograms display continuous class intervals on the horizontal axis with adjacent bars whose heights represent frequency.",
      },
    ];
    return formatQuizResponse(subject, topic, gradeLevel, questions, questionCount);
  }

  // 2C. Mathematics: Geometry & Mensuration
  if (
    topicLower.includes("geometry") ||
    topicLower.includes("mensuration") ||
    topicLower.includes("surface area") ||
    topicLower.includes("volume") ||
    topicLower.includes("perimeter") ||
    topicLower.includes("circle") ||
    topicLower.includes("triangle") ||
    topicLower.includes("quadrilateral") ||
    topicLower.includes("polygon") ||
    topicLower.includes("pythagor")
  ) {
    const questions: DomainQuizQuestion[] = [
      {
        q: "What is the formula for calculating the area of a circle with radius r?",
        options: [
          "A) 2πr",
          "B) πr²",
          "C) πd²/2",
          "D) 4/3 πr³",
        ],
        answer: "B",
        explanation: "The area enclosed by a circle of radius r is πr², whereas 2πr represents its circumference (perimeter).",
      },
      {
        q: "According to the Pythagorean Theorem, what is the relationship between the hypotenuse c and legs a, b in a right-angled triangle?",
        options: [
          "A) a + b = c",
          "B) a² + b² = c²",
          "C) a² - b² = c²",
          "D) 2a + 2b = c²",
        ],
        answer: "B",
        explanation: "In any right-angled triangle, the square of the hypotenuse is equal to the sum of the squares of the other two sides: a² + b² = c².",
      },
      {
        q: "What is the sum of the interior angles of a convex polygon with n sides?",
        options: [
          "A) (n - 2) × 180°",
          "B) n × 180°",
          "C) (n + 2) × 180°",
          "D) 360° / n",
        ],
        answer: "A",
        explanation: "Any convex n-sided polygon can be partitioned into (n - 2) non-overlapping triangles from a single vertex, making the sum of its interior angles (n - 2) × 180°.",
      },
      {
        q: "What is the formula for the volume of a right circular cylinder having radius r and height h?",
        options: [
          "A) 2πrh",
          "B) πr²h",
          "C) 1/3 πr²h",
          "D) 2πr(r + h)",
        ],
        answer: "B",
        explanation: "The volume of a cylinder is computed by multiplying the circular base area (πr²) by the height h: V = πr²h.",
      },
      {
        q: "If a triangle has a base of 10 cm and a perpendicular height of 6 cm, what is its area?",
        options: [
          "A) 60 cm²",
          "B) 30 cm²",
          "C) 16 cm²",
          "D) 45 cm²",
        ],
        answer: "B",
        explanation: "Area of a triangle = (1/2) × base × height = (1/2) × 10 × 6 = 30 cm².",
      },
    ];
    return formatQuizResponse(subject, topic, gradeLevel, questions, questionCount);
  }

  // 2D. Mathematics: Exponents, Powers & Square Roots
  if (
    topicLower.includes("exponent") ||
    topicLower.includes("power") ||
    topicLower.includes("square root") ||
    topicLower.includes("cube root") ||
    topicLower.includes("radical") ||
    topicLower.includes("rational")
  ) {
    const questions: DomainQuizQuestion[] = [
      {
        q: "According to the laws of exponents, what is the product of aᵐ and aⁿ for any non-zero base a?",
        options: [
          "A) aᵐ⁺ⁿ",
          "B) aᵐⁿ",
          "C) aᵐ⁻ⁿ",
          "D) (2a)ᵐ⁺ⁿ",
        ],
        answer: "A",
        explanation: "When multiplying exponential expressions with the same base, keep the base and add the exponents: aᵐ × aⁿ = aᵐ⁺ⁿ.",
      },
      {
        q: "For any non-zero real number a, what is the value of a⁰?",
        options: [
          "A) 0",
          "B) 1",
          "C) a",
          "D) Undefined",
        ],
        answer: "B",
        explanation: "By exponent laws (aⁿ / aⁿ = aⁿ⁻ⁿ = a⁰ = 1), any non-zero number raised to the zero power equals 1.",
      },
      {
        q: "What is the principal square root of 144, denoted as √144?",
        options: [
          "A) 11",
          "B) 12",
          "C) 14",
          "D) 72",
        ],
        answer: "B",
        explanation: "Since 12 × 12 = 144, the principal (positive) square root of 144 is 12.",
      },
      {
        q: "Which of the following numbers is an irrational number?",
        options: [
          "A) 0.75",
          "B) 2/3",
          "C) √2",
          "D) √16",
        ],
        answer: "C",
        explanation: "√2 cannot be expressed as the ratio of two integers p/q, making it an irrational number. √16 simplifies to 4 (rational).",
      },
      {
        q: "What is the simplified value of (2³)²?",
        options: [
          "A) 2⁵ = 32",
          "B) 2⁶ = 64",
          "C) 2⁹ = 512",
          "D) 12",
        ],
        answer: "B",
        explanation: "Using the power of a power rule (aᵐ)ⁿ = aᵐⁿ, we have (2³)² = 2⁶ = 64.",
      },
    ];
    return formatQuizResponse(subject, topic, gradeLevel, questions, questionCount);
  }

  // 2E. Mathematics: Algebra & Linear Equations
  if (
    topicLower.includes("algebra") ||
    topicLower.includes("linear") ||
    topicLower.includes("equation") ||
    topicLower.includes("variable") ||
    topicLower.includes("polynomial")
  ) {
    const questions: DomainQuizQuestion[] = [
      {
        q: "What is the standard procedure to solve a linear equation for an unknown variable x?",
        options: [
          "A) Balancing the equation by applying identical inverse operations to both sides",
          "B) Guessing and substituting values without validation",
          "C) Removing terms arbitrarily from the left side",
          "D) Multiplying only one side by zero",
        ],
        answer: "A",
        explanation: "Maintaining mathematical equality requires applying balanced inverse operations across both sides of the equation to isolate the unknown variable.",
      },
      {
        q: "Which algebraic property justifies that a(b + c) = ab + ac?",
        options: [
          "A) Associative Property",
          "B) Distributive Property of Multiplication over Addition",
          "C) Commutative Property",
          "D) Identity Property",
        ],
        answer: "B",
        explanation: "The Distributive Property allows multiplying a single outer term across each term in a parenthetical sum.",
      },
      {
        q: "In a linear equation of the form y = mx + c, what does the parameter m represent?",
        options: [
          "A) The y-intercept where the line crosses the vertical axis",
          "B) The slope or rate of change (rise over run)",
          "C) The total area under the linear curve",
          "D) The x-intercept",
        ],
        answer: "B",
        explanation: "The slope m measures the steepness and direction of a line, defined by the ratio of vertical change (rise) to horizontal change (run).",
      },
      {
        q: "What defines a Linear Equation in one variable?",
        options: [
          "A) The highest power (degree) of the unknown variable is exactly 1",
          "B) The equation must contain two or more variables multiplied together",
          "C) The equation must contain squared terms x²",
          "D) The variable must appear inside a square root",
        ],
        answer: "A",
        explanation: "A linear equation in one variable has the general form ax + b = 0 (where a ≠ 0), with variable degree exactly equal to 1.",
      },
      {
        q: "If 3x + 5 = 20, what is the value of x?",
        options: [
          "A) 3",
          "B) 5",
          "C) 7",
          "D) 15",
        ],
        answer: "B",
        explanation: "Subtract 5 from both sides: 3x = 15. Divide both sides by 3: x = 5.",
      },
    ];
    return formatQuizResponse(subject, topic, gradeLevel, questions, questionCount);
  }

  // 2F. Mathematics: General Fallback for other Math Topics
  if (subjectLower.includes("math")) {
    const questions: DomainQuizQuestion[] = [
      {
        q: `In the mathematical analysis of ${topic}, what is the foundational principle used to verify the accuracy of a calculated solution?`,
        options: [
          `A) Substituting the result back into the original equations or constraints of ${topic} to confirm equality`,
          "B) Arbitrary approximation without symbolic verification",
          "C) Disregarding edge cases and boundary constraints",
          "D) Changing the initial numerical values until they match",
        ],
        answer: "A",
        explanation: `Rigorous mathematical verification in ${topic} requires substituting the derived value back into the original conditions to confirm consistency.`,
      },
      {
        q: `When simplifying or calculating expressions in ${topic}, which standard hierarchy of operational precedence must be maintained?`,
        options: [
          "A) Standard Order of Operations (BODMAS/PEMDAS: Brackets/Parentheses, Orders/Exponents, Division & Multiplication, Addition & Subtraction)",
          "B) Arbitrary left-to-right evaluation ignoring groupings",
          "C) Performing all addition before evaluating parentheses",
          "D) Randomized evaluation order",
        ],
        answer: "A",
        explanation: "Universal mathematical conventions require following the standard order of operations (BODMAS/PEMDAS) across all expressions.",
      },
      {
        q: `What distinguishes a formal mathematical theorem or proof in ${topic} from an empirical hypothesis?`,
        options: [
          "A) A proof uses deductive logical reasoning to establish universal truth across all valid conditions",
          "B) A proof only works for a single numerical trial",
          "C) A proof is based purely on opinion and survey votes",
          "D) A proof cannot be algebraically validated",
        ],
        answer: "A",
        explanation: `In mathematics, a proof provides deductive certainty that holds true universally under stated axioms, which is central to ${topic}.`,
      },
    ];
    return formatQuizResponse(subject, topic, gradeLevel, questions, questionCount);
  }

  // 3A. Science: Physics, Force & Motion
  if (
    topicLower.includes("force") ||
    topicLower.includes("motion") ||
    topicLower.includes("newton") ||
    topicLower.includes("gravity") ||
    topicLower.includes("friction") ||
    topicLower.includes("speed") ||
    topicLower.includes("velocity") ||
    topicLower.includes("energy") ||
    topicLower.includes("electricity") ||
    topicLower.includes("light")
  ) {
    const questions: DomainQuizQuestion[] = [
      {
        q: "What does Newton's First Law of Motion (Law of Inertia) state?",
        options: [
          "A) An object remains at rest or in uniform straight-line motion unless acted upon by a net external unbalanced force",
          "B) Acceleration is inversely proportional to net force",
          "C) Every action has an unequal opposite reaction",
          "D) Friction is always zero in a vacuum",
        ],
        answer: "A",
        explanation: "Inertia is the inherent tendency of an object to resist changes in its state of rest or motion unless compelled by an external net force.",
      },
      {
        q: "Which mathematical formula represents Newton's Second Law of Motion relating Force (F), Mass (m), and Acceleration (a)?",
        options: [
          "A) F = m × a",
          "B) F = m / a",
          "C) F = m + a",
          "D) F = a / m",
        ],
        answer: "A",
        explanation: "Newton's Second Law defines net force as the product of mass and acceleration: F = ma (measured in Newtons).",
      },
      {
        q: "What type of contact force acts parallel to surfaces in contact and opposes relative motion?",
        options: [
          "A) Gravitational force",
          "B) Frictional force",
          "C) Electrostatic force",
          "D) Magnetic force",
        ],
        answer: "B",
        explanation: "Frictional force arises from microscopic surface irregularities and always opposes relative motion between contacting bodies.",
      },
      {
        q: "According to the Law of Conservation of Energy, which statement is universally true?",
        options: [
          "A) Energy can be created from nothing during chemical reactions",
          "B) Energy cannot be created or destroyed; it can only be transformed from one form to another",
          "C) Total energy in an isolated system constantly decreases over time",
          "D) Kinetic energy is always greater than potential energy",
        ],
        answer: "B",
        explanation: "The first law of thermodynamics states that the total energy of an isolated system remains constant; energy is merely converted among forms.",
      },
    ];
    return formatQuizResponse(subject, topic, gradeLevel, questions, questionCount);
  }

  // 3B. Science: Chemistry, Acids, Bases & Chemical Reactions
  if (
    topicLower.includes("acid") ||
    topicLower.includes("base") ||
    topicLower.includes("chemical") ||
    topicLower.includes("reaction") ||
    topicLower.includes("atom") ||
    topicLower.includes("element") ||
    topicLower.includes("compound") ||
    topicLower.includes("ph")
  ) {
    const questions: DomainQuizQuestion[] = [
      {
        q: "On the standard pH scale ranging from 0 to 14, what pH value corresponds to a neutral solution at 25°C?",
        options: [
          "A) pH = 0",
          "B) pH = 7",
          "C) pH = 14",
          "D) pH = 3.5",
        ],
        answer: "B",
        explanation: "Pure water at 25°C has equal hydrogen and hydroxide ion concentrations, corresponding to a neutral pH of exactly 7.",
      },
      {
        q: "How does blue litmus paper behave when tested in an acidic solution?",
        options: [
          "A) Turns red",
          "B) Turns green",
          "C) Remains blue",
          "D) Turns completely colorless",
        ],
        answer: "A",
        explanation: "Acids turn blue litmus paper red, while alkaline (basic) substances turn red litmus paper blue.",
      },
      {
        q: "What products are universally formed in a typical acid-base Neutralization reaction?",
        options: [
          "A) Salt and Water",
          "B) Pure Hydrogen gas and Oxygen",
          "C) Carbon dioxide only",
          "D) Pure metallic elements",
        ],
        answer: "A",
        explanation: "When an acid reacts with a base, they neutralize each other to produce a chemical salt and water: Acid + Base -> Salt + Water.",
      },
      {
        q: "Which fundamental scientific law requires that chemical equations be balanced on both reactant and product sides?",
        options: [
          "A) Law of Definite Proportions",
          "B) Law of Conservation of Mass",
          "C) Boyle's Law",
          "D) Avogadro's Principle",
        ],
        answer: "B",
        explanation: "The Law of Conservation of Mass states that mass cannot be created or destroyed in a chemical reaction; atoms must be equal on both sides.",
      },
    ];
    return formatQuizResponse(subject, topic, gradeLevel, questions, questionCount);
  }

  // 3C. Science: Biology, Cell Structure & Photosynthesis
  if (
    topicLower.includes("cell") ||
    topicLower.includes("photo") ||
    topicLower.includes("bio") ||
    topicLower.includes("plant") ||
    topicLower.includes("organ") ||
    topicLower.includes("gene") ||
    topicLower.includes("life")
  ) {
    const questions: DomainQuizQuestion[] = [
      {
        q: `In the biological study of ${topic}, which cellular organelle is primarily responsible for energy conversion?`,
        options: [
          "A) Endoplasmic Reticulum",
          "B) Chloroplast in plant cells and Mitochondria in eukaryotic cells",
          "C) Golgi Apparatus",
          "D) Nuclear envelope",
        ],
        answer: "B",
        explanation: "Chloroplasts conduct photosynthesis in plant cells, while mitochondria synthesize ATP across eukaryotic cells.",
      },
      {
        q: `What is the primary chemical reactant consumed during photosynthetic reactions related to ${topic}?`,
        options: [
          "A) Methane and Nitrogen",
          "B) Carbon dioxide (CO2) and Water (H2O) in the presence of sunlight",
          "C) Pure Carbon Monoxide",
          "D) Glucose and Oxygen only",
        ],
        answer: "B",
        explanation: "Plants convert carbon dioxide and water into glucose and oxygen utilizing light energy.",
      },
      {
        q: `Which pigment is directly responsible for capturing photon energy in ${topic}?`,
        options: [
          "A) Carotenoids only",
          "B) Chlorophyll a and b",
          "C) Anthocyanin",
          "D) Hemoglobin",
        ],
        answer: "B",
        explanation: "Chlorophyll pigments absorb blue and red light wavelengths while reflecting green light.",
      },
      {
        q: "Which structural feature is present in plant cells but absent in animal cells?",
        options: [
          "A) Rigid Cellulose Cell Wall and Chloroplasts",
          "B) Mitochondria",
          "C) Cell membrane",
          "D) Ribosomes",
        ],
        answer: "A",
        explanation: "Plant cells feature a rigid outer cell wall made of cellulose and chloroplasts for photosynthesis, neither of which exists in animal cells.",
      },
    ];
    return formatQuizResponse(subject, topic, gradeLevel, questions, questionCount);
  }

  // 3D. Science: General Fallback
  if (subjectLower.includes("science")) {
    const questions: DomainQuizQuestion[] = [
      {
        q: `In the scientific investigation of ${topic}, what is the essential first step of the Scientific Method?`,
        options: [
          "A) Making systematic observations and defining a clear question or hypothesis",
          "B) Drawing conclusions before gathering any data",
          "C) Publishing results without experimental controls",
          "D) Discarding conflicting experimental trials",
        ],
        answer: "A",
        explanation: `The scientific method begins with systematic empirical observation and formulating testable hypotheses concerning ${topic}.`,
      },
      {
        q: `Why must a controlled experiment testing ${topic} keep control variables constant while changing only the independent variable?`,
        options: [
          "A) To ensure that any observed effect on the dependent variable is caused solely by the tested factor",
          "B) To speed up laboratory procedures",
          "C) To avoid recording numerical measurements",
          "D) Because controlled variables do not affect experimental outcomes",
        ],
        answer: "A",
        explanation: "Controlling extraneous variables ensures high internal validity, confirming that the independent variable caused the observed change.",
      },
    ];
    return formatQuizResponse(subject, topic, gradeLevel, questions, questionCount);
  }

  // 4. English & Language Arts
  if (
    subjectLower.includes("english") ||
    topicLower.includes("grammar") ||
    topicLower.includes("voice") ||
    topicLower.includes("tense") ||
    topicLower.includes("speech") ||
    topicLower.includes("comprehension")
  ) {
    const questions: DomainQuizQuestion[] = [
      {
        q: "In English grammar, what distinguishes Active Voice from Passive Voice?",
        options: [
          "A) In Active Voice the subject performs the action, whereas in Passive Voice the subject receives the action",
          "B) Active Voice is used only in the past tense",
          "C) Passive Voice can never include the agent ('by...')",
          "D) Active voice cannot contain transitive verbs",
        ],
        answer: "A",
        explanation: "In active voice, the grammatical subject carries out the verb's action (e.g., 'The teacher explained the lesson'). In passive voice, the subject is acted upon ('The lesson was explained by the teacher').",
      },
      {
        q: "Which verb tense correctly expresses an action that began in the past and continues into the present moment?",
        options: [
          "A) Simple Past Tense",
          "B) Present Perfect Continuous Tense",
          "C) Future Perfect Tense",
          "D) Past Perfect Tense",
        ],
        answer: "B",
        explanation: "The Present Perfect Continuous tense (e.g., 'She has been studying for two hours') connects an ongoing action from the past into the present.",
      },
      {
        q: "When converting Direct Speech into Indirect (Reported) Speech, what change typically occurs to the reporting verb and tense?",
        options: [
          "A) Quotation marks are removed, pronouns adjust, and present tenses shift back into past tenses",
          "B) The sentence must always be converted into future tense",
          "C) No punctuation or pronoun changes are allowed",
          "D) The reporting clause is always deleted",
        ],
        answer: "A",
        explanation: "Indirect speech removes quotation marks and shifts back verb tenses (backshifting) while adapting pronouns and time expressions relative to the speaker.",
      },
    ];
    return formatQuizResponse(subject, topic, gradeLevel, questions, questionCount);
  }

  // 5. History & Social Studies
  if (
    subjectLower.includes("history") ||
    subjectLower.includes("social") ||
    topicLower.includes("constitution") ||
    topicLower.includes("revolt") ||
    topicLower.includes("revolution") ||
    topicLower.includes("movement") ||
    topicLower.includes("democracy")
  ) {
    const questions: DomainQuizQuestion[] = [
      {
        q: `In historical analysis related to ${topic}, what is the key difference between a Primary Source and a Secondary Source?`,
        options: [
          "A) A primary source is a firsthand artifact or document from the time period, whereas a secondary source analyzes or interprets primary sources later",
          "B) Primary sources are only found in textbooks",
          "C) Secondary sources were written exclusively before 1900",
          "D) Primary sources are always biased while secondary sources are universally objective",
        ],
        answer: "A",
        explanation: "Primary sources (letters, treaties, eyewitness accounts) originate directly from the historical period, whereas secondary sources (scholarship, critiques) interpret those records.",
      },
      {
        q: `What is the supreme governing legal document that outlines fundamental rights, duties, and state governance for a democratic nation in the study of ${topic}?`,
        options: [
          "A) The National Constitution",
          "B) The Annual Budget Report",
          "C) A Presidential Decree",
          "D) An Executive Directive",
        ],
        answer: "A",
        explanation: "The Constitution serves as the fundamental supreme law establishing the structure of government and safeguarding citizen rights.",
      },
    ];
    return formatQuizResponse(subject, topic, gradeLevel, questions, questionCount);
  }

  // 6. Universal Subject & Topic Fallback (Clean, non-polluted)
  const defaultQuestions: DomainQuizQuestion[] = [
    {
      q: `What is the foundational theoretical principle of ${topic} in ${subject}?`,
      options: [
        `A) Core conceptual definitions, taxonomy, and fundamental principles governing ${topic}`,
        "B) Randomized speculative observations without empirical validation",
        "C) Subjective arbitrary classifications without formal criteria",
        "D) Disregarding historical and pedagogical standards",
      ],
      answer: "A",
      explanation: `Mastery of ${topic} in ${subject} requires understanding foundational principles, accurate terminology, and systematic methodologies.`,
    },
    {
      q: `When applying principles of ${topic} to solve practical academic problems, what is the recommended systematic workflow?`,
      options: [
        "A) Problem identification, analyzing constraints, applying standard domain procedures, and validating outcomes",
        "B) Guessing the final outcome without intermediate steps",
        "C) Changing problem requirements whenever difficulties arise",
        "D) Bypassing verification procedures",
      ],
      answer: "A",
      explanation: "Rigorous academic inquiry follows structured problem-solving: identifying requirements, applying standardized principles, and confirming results.",
    },
    {
      q: `Which skill is essential for students to demonstrate proficiency in ${topic} for ${gradeLevel}?`,
      options: [
        "A) Critical thinking, analytical reasoning, and clear conceptual communication",
        "B) Passive rote memorization without contextual understanding",
        "C) Avoiding peer collaboration and discussion",
        "D) Memorizing answers without understanding underlying mechanisms",
      ],
      answer: "A",
      explanation: `Proficiency in ${topic} emphasizes critical analytical application and clear conceptual understanding suited for ${gradeLevel}.`,
    },
  ];
  return formatQuizResponse(subject, topic, gradeLevel, defaultQuestions, questionCount);
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
