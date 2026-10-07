"use client";

import { useState, useEffect } from "react";
import { MODEL_CATALOG, getContextWindowLimit, TokenStats } from "@/lib/ai/copilot";

export interface StudentSummary {
  id: string;
  name: string;
  className: string;
}

export interface ModelSettings {
  provider: "openai" | "claude" | "gemini" | "custom" | "builtin";
  modelName: string;
  baseUrl: string;
  apiKey: string;
  temperature: number;
  customSystemPrompt: string;
  maxTokens?: number;
}

const DEFAULT_SETTINGS: ModelSettings = {
  provider: "builtin",
  modelName: "academic-domain-v1",
  baseUrl: "http://localhost:11434/v1",
  apiKey: "",
  temperature: 0.7,
  customSystemPrompt:
    "You are the expert AI Academic Counsellor at Greenfield International School. Be motivating, precise, and supportive.",
  maxTokens: 1024,
};

export function AiCopilotClient({ students = [] }: { students?: StudentSummary[] }) {
  const [activeTab, setActiveTab] = useState<"remarks" | "quiz" | "notice" | "chat" | "settings">("remarks");
  const [loading, setLoading] = useState(false);
  const [resultText, setResultText] = useState<string | null>(null);
  const [providerUsed, setProviderUsed] = useState<string | null>(null);
  const [lastTokenStats, setLastTokenStats] = useState<TokenStats | null>(null);
  const [copied, setCopied] = useState(false);
  const [showContextInfo, setShowContextInfo] = useState(false);

  // Model Settings State
  const [settings, setSettings] = useState<ModelSettings>(DEFAULT_SETTINGS);
  const [testingConnection, setTestingConnection] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    latencyMs?: number;
    contextWindow?: number;
  } | null>(null);

  // Load saved settings from localStorage on client mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("greenfield_ai_model_config");
      if (saved) {
        setSettings(JSON.parse(saved));
      }
    } catch (_) {}
  }, []);

  function saveSettings(newSettings: ModelSettings) {
    setSettings(newSettings);
    try {
      localStorage.setItem("greenfield_ai_model_config", JSON.stringify(newSettings));
    } catch (_) {}
  }

  // Helper to switch active model preset
  function selectPreset(preset: "openai" | "claude" | "gemini" | "custom" | "builtin") {
    switch (preset) {
      case "openai":
        saveSettings({
          ...settings,
          provider: "openai",
          modelName: "gpt-4o",
          baseUrl: "https://api.openai.com/v1",
        });
        break;
      case "claude":
        saveSettings({
          ...settings,
          provider: "claude",
          modelName: "claude-3-5-sonnet",
          baseUrl: "https://api.anthropic.com",
        });
        break;
      case "gemini":
        saveSettings({
          ...settings,
          provider: "gemini",
          modelName: "gemini-1.5-flash",
          baseUrl: "",
        });
        break;
      case "custom":
        saveSettings({
          ...settings,
          provider: "custom",
          modelName: "llama3",
          baseUrl: "http://localhost:11434/v1",
        });
        break;
      case "builtin":
        saveSettings({
          ...settings,
          provider: "builtin",
          modelName: "academic-domain-v1",
          baseUrl: "",
        });
        break;
    }
  }

  // Active Model Context Spec
  const activeSpec = MODEL_CATALOG[settings.modelName] || {
    id: settings.modelName,
    name: settings.modelName,
    provider: settings.provider,
    contextWindow: getContextWindowLimit(settings.modelName),
    maxOutputTokens: 2048,
    description: "Custom specified model endpoint",
    badge: `${(getContextWindowLimit(settings.modelName) / 1000).toFixed(0)}K Context`,
  };

  // Tab 1: Remarks Form
  const [selectedStudent, setSelectedStudent] = useState(students[0]?.name || "Arjun Mehta");
  const [gradeLevel, setGradeLevel] = useState(students[0]?.className || "Class 8-A");
  const [attendanceRate, setAttendanceRate] = useState("96%");
  const [strengths, setStrengths] = useState("Active class participation and strong problem-solving in science");
  const [areasToImprove, setAreasToImprove] = useState("Needs more consistency in submitting math homework on time");
  const [remarksTone, setRemarksTone] = useState<"encouraging" | "formal" | "constructive">("encouraging");

  // Tab 2: Quiz Form
  const [quizSubject, setQuizSubject] = useState("Science");
  const [quizTopic, setQuizTopic] = useState("Cell Structure & Photosynthesis");
  const [quizGrade, setQuizGrade] = useState("Class 8");
  const [questionCount, setQuestionCount] = useState(5);

  // Tab 3: Notice Form
  const [noticeTopic, setNoticeTopic] = useState("Quarterly Parent-Teacher Meeting (PTM)");
  const [noticeAudience, setNoticeAudience] = useState("Parents & Guardians of Classes 8 & 9");
  const [noticeDate, setNoticeDate] = useState("Next Saturday, October 3rd at 9:30 AM");
  const [noticeDetails, setNoticeDetails] = useState(
    "Discussion on mid-term performance, student attendance records, and distribution of feedback portfolios."
  );

  // Tab 4: Chat
  const [chatMessages, setChatMessages] = useState<Array<{ sender: "user" | "ai"; text: string; tokens?: number }>>([
    {
      sender: "ai",
      text: "Hello! I am the **Greenfield AI Academic Copilot**. How can I assist you with student assessment, curriculum quizzes, or school communications today?",
      tokens: 32,
    },
  ]);
  const [chatInput, setChatInput] = useState("");

  const totalChatTokens = chatMessages.reduce((sum, msg) => sum + (msg.tokens || Math.ceil(msg.text.length / 3.8)), 0);

  async function callCopilotApi(mode: string, payload: any) {
    setLoading(true);
    setCopied(false);
    try {
      const res = await fetch("/api/ai/copilot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode,
          payload,
          modelConfig: settings,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setResultText(data.text);
        setProviderUsed(data.provider);
        if (data.tokenStats) {
          setLastTokenStats(data.tokenStats);
        }
      } else {
        setResultText(`Error: ${data.error || "Failed to generate AI response."}`);
      }
    } catch (err: any) {
      setResultText(`Network Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  async function handleTestConnection() {
    setTestingConnection(true);
    setTestResult(null);
    try {
      const res = await fetch("/api/ai/models/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      const data = await res.json();
      setTestResult(data);
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || "Failed to reach endpoint.",
      });
    } finally {
      setTestingConnection(false);
    }
  }

  function handleGenerateRemarks(e: React.FormEvent) {
    e.preventDefault();
    callCopilotApi("remarks", {
      studentName: selectedStudent,
      gradeLevel,
      attendanceRate,
      strengths,
      areasToImprove,
      tone: remarksTone,
    });
  }

  function handleGenerateQuiz(e: React.FormEvent) {
    e.preventDefault();
    callCopilotApi("quiz", {
      subject: quizSubject,
      topic: quizTopic,
      gradeLevel: quizGrade,
      questionCount: Number(questionCount),
    });
  }

  function handleGenerateNotice(e: React.FormEvent) {
    e.preventDefault();
    callCopilotApi("notice", {
      topic: noticeTopic,
      audience: noticeAudience,
      eventDate: noticeDate,
      keyDetails: noticeDetails,
    });
  }

  async function handleSendChat(e: React.FormEvent) {
    e.preventDefault();
    if (!chatInput.trim() || loading) return;

    const userText = chatInput.trim();
    const userTokens = Math.max(1, Math.ceil(userText.length / 3.8));
    setChatInput("");
    setChatMessages((prev) => [...prev, { sender: "user", text: userText, tokens: userTokens }]);
    setLoading(true);

    try {
      const res = await fetch("/api/ai/copilot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "chat",
          payload: { query: userText },
          modelConfig: settings,
        }),
      });
      const data = await res.json();
      if (data.success) {
        const aiTokens = data.tokenStats?.completionTokens || Math.ceil(data.text.length / 3.8);
        setChatMessages((prev) => [...prev, { sender: "ai", text: data.text, tokens: aiTokens }]);
        if (data.tokenStats) {
          setLastTokenStats(data.tokenStats);
        }
      } else {
        setChatMessages((prev) => [
          ...prev,
          { sender: "ai", text: "I encountered an issue retrieving that information. Please try again." },
        ]);
      }
    } catch (err) {
      setChatMessages((prev) => [
        ...prev,
        { sender: "ai", text: "Network connection error while contacting AI copilot." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleCopy() {
    if (resultText) {
      navigator.clipboard.writeText(resultText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  function handleResetChat() {
    setChatMessages([
      {
        sender: "ai",
        text: "Context window cleared! I am ready for a fresh conversation.",
        tokens: 15,
      },
    ]);
  }

  return (
    <div className="space-y-6">
      {/* 1. Header Banner & Model Coordination Bar */}
      <div className="rounded-2xl border border-brand-800/60 bg-gradient-to-r from-brand-950 via-indigo-950 to-slate-900 p-6 text-white shadow-xl">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500/30 text-xl">🤖</span>
              <h2 className="text-xl font-bold tracking-tight">Greenfield AI Academic Copilot</h2>
              <span className="rounded-full bg-emerald-400/20 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-300 border border-emerald-400/30">
                Multi-LLM GUI Coordinator
              </span>
            </div>
            <p className="text-xs text-slate-300 max-w-2xl">
              Coordinate effortlessly between **OpenAI ChatGPT**, **Anthropic Claude**, **Google Gemini**, and **Sir&apos;s Local Endpoints** with real-time **Content Window** monitoring.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setShowContextInfo(!showContextInfo)}
              className="rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 px-3 py-1.5 text-xs font-semibold text-indigo-200 border border-indigo-400/30 transition flex items-center gap-1.5"
            >
              <span>🧠</span>
              <span>Content Window Info</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("settings")}
              className="rounded-lg bg-white/20 hover:bg-white/30 px-3 py-1.5 text-xs font-medium text-white transition border border-white/20 flex items-center gap-1.5"
            >
              <span>⚙️</span>
              <span>Model Settings</span>
            </button>
          </div>
        </div>

        {/* 2. Interactive LLM Preset Selector Chips */}
        <div className="mt-5 pt-4 border-t border-white/10 flex flex-wrap items-center gap-2">
          <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-400 mr-1">
            Select Active LLM:
          </span>

          {/* ChatGPT */}
          <button
            type="button"
            onClick={() => selectPreset("openai")}
            className={`rounded-xl px-3 py-1.5 text-xs font-medium transition flex items-center gap-1.5 border ${
              settings.provider === "openai"
                ? "bg-emerald-600/30 border-emerald-400 text-emerald-200 font-bold shadow-sm ring-1 ring-emerald-400/50"
                : "bg-white/5 border-white/10 text-slate-300 hover:bg-white/10"
            }`}
          >
            <span>🟢</span>
            <span>ChatGPT (GPT-4o)</span>
            <span className="rounded bg-black/40 px-1.5 py-0.2 text-[10px] text-emerald-300 font-mono">128K</span>
          </button>

          {/* Claude */}
          <button
            type="button"
            onClick={() => selectPreset("claude")}
            className={`rounded-xl px-3 py-1.5 text-xs font-medium transition flex items-center gap-1.5 border ${
              settings.provider === "claude"
                ? "bg-purple-600/30 border-purple-400 text-purple-200 font-bold shadow-sm ring-1 ring-purple-400/50"
                : "bg-white/5 border-white/10 text-slate-300 hover:bg-white/10"
            }`}
          >
            <span>🟣</span>
            <span>Claude (3.5 Sonnet)</span>
            <span className="rounded bg-black/40 px-1.5 py-0.2 text-[10px] text-purple-300 font-mono">200K</span>
          </button>

          {/* Gemini */}
          <button
            type="button"
            onClick={() => selectPreset("gemini")}
            className={`rounded-xl px-3 py-1.5 text-xs font-medium transition flex items-center gap-1.5 border ${
              settings.provider === "gemini"
                ? "bg-blue-600/30 border-blue-400 text-blue-200 font-bold shadow-sm ring-1 ring-blue-400/50"
                : "bg-white/5 border-white/10 text-slate-300 hover:bg-white/10"
            }`}
          >
            <span>🔵</span>
            <span>Google Gemini (1.5 Flash)</span>
            <span className="rounded bg-black/40 px-1.5 py-0.2 text-[10px] text-blue-300 font-mono">1M</span>
          </button>

          {/* Sir's Custom Endpoint */}
          <button
            type="button"
            onClick={() => selectPreset("custom")}
            className={`rounded-xl px-3 py-1.5 text-xs font-medium transition flex items-center gap-1.5 border ${
              settings.provider === "custom"
                ? "bg-amber-600/30 border-amber-400 text-amber-200 font-bold shadow-sm ring-1 ring-amber-400/50"
                : "bg-white/5 border-white/10 text-slate-300 hover:bg-white/10"
            }`}
          >
            <span>⚡</span>
            <span>Sir&apos;s Local Endpoint (LLaMA 3)</span>
            <span className="rounded bg-black/40 px-1.5 py-0.2 text-[10px] text-amber-300 font-mono">8K</span>
          </button>

          {/* Built-in Academic Engine */}
          <button
            type="button"
            onClick={() => selectPreset("builtin")}
            className={`rounded-xl px-3 py-1.5 text-xs font-medium transition flex items-center gap-1.5 border ${
              settings.provider === "builtin"
                ? "bg-slate-700/60 border-slate-400 text-slate-100 font-bold shadow-sm ring-1 ring-slate-400/50"
                : "bg-white/5 border-white/10 text-slate-400 hover:bg-white/10"
            }`}
          >
            <span>🏫</span>
            <span>Built-in Engine</span>
            <span className="rounded bg-black/40 px-1.5 py-0.2 text-[10px] text-slate-300 font-mono">Offline</span>
          </button>
        </div>

        {/* 3. Live Context Window Gauge & Capacity Meter */}
        <div className="mt-4 rounded-xl bg-black/40 border border-white/10 p-3.5 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-mono text-sm font-bold">
              {activeSpec.badge.split(" ")[0]}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white">{activeSpec.name}</span>
                <span className="rounded bg-indigo-900/60 border border-indigo-700/60 px-2 py-0.2 text-[10px] font-mono text-indigo-300">
                  Window: {activeSpec.contextWindow.toLocaleString()} tokens
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">{activeSpec.description}</p>
            </div>
          </div>

          {/* Context Meter Bar */}
          <div className="w-full md:w-64 space-y-1">
            <div className="flex justify-between text-[11px]">
              <span className="text-slate-400">Context Window Used:</span>
              <span className="font-mono text-indigo-300 font-semibold">
                {lastTokenStats ? `${lastTokenStats.totalTokens} tokens (${lastTokenStats.contextWindowPercent}%)` : `~${totalChatTokens} tokens`}
              </span>
            </div>
            <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden border border-slate-700">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 via-indigo-500 to-amber-500 rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(100, Math.max(2, lastTokenStats?.contextWindowPercent || (totalChatTokens / activeSpec.contextWindow) * 100))}%`,
                }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>0</span>
              <span>Headroom: {(activeSpec.contextWindow - (lastTokenStats?.totalTokens || totalChatTokens)).toLocaleString()} tokens</span>
            </div>
          </div>
        </div>

        {/* 4. Educational Content Window Explainer Banner (Toggleable) */}
        {showContextInfo && (
          <div className="mt-4 rounded-xl border border-indigo-500/40 bg-indigo-950/70 p-4 text-xs text-indigo-100 space-y-3 animate-fadeIn">
            <div className="flex items-center justify-between font-bold text-indigo-200">
              <span className="flex items-center gap-1.5 text-sm">
                <span>📚</span> Understanding LLM &quot;Content Window&quot; (Context Window)
              </span>
              <button
                type="button"
                onClick={() => setShowContextInfo(false)}
                className="text-slate-400 hover:text-white text-xs px-2 py-0.5 rounded bg-white/10"
              >
                ✕ Close
              </button>
            </div>
            <p className="leading-relaxed text-slate-300 text-[11px]">
              The **Content Window (Context Window)** is the **working memory limit** of an AI model in a single request. It holds the System Prompt, conversation history, school database context, user query, and generated answer:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 text-[11px]">
              <div className="rounded-lg bg-black/40 border border-indigo-800/60 p-2.5">
                <div className="font-bold text-blue-300 flex items-center gap-1">
                  <span>🔵</span> Google Gemini
                </div>
                <div className="text-[10px] font-mono text-emerald-300 mt-0.5">1,000,000 – 2,000,000 tokens</div>
                <p className="text-slate-400 text-[10px] mt-1">
                  Massive memory. Can digest complete school syllabus, 100+ textbooks, or full-year student rosters at once.
                </p>
              </div>

              <div className="rounded-lg bg-black/40 border border-indigo-800/60 p-2.5">
                <div className="font-bold text-purple-300 flex items-center gap-1">
                  <span>🟣</span> Anthropic Claude
                </div>
                <div className="text-[10px] font-mono text-purple-300 mt-0.5">200,000 tokens (~150,000 words)</div>
                <p className="text-slate-400 text-[10px] mt-1">
                  Superior comprehension for long student essays, multi-chapter exams, and extensive disciplinary files.
                </p>
              </div>

              <div className="rounded-lg bg-black/40 border border-indigo-800/60 p-2.5">
                <div className="font-bold text-emerald-300 flex items-center gap-1">
                  <span>🟢</span> OpenAI ChatGPT
                </div>
                <div className="text-[10px] font-mono text-emerald-300 mt-0.5">128,000 tokens (~96,000 words)</div>
                <p className="text-slate-400 text-[10px] mt-1">
                  General-purpose industry workhorse for fast interactive Q&A, report card remarks, and quick circulars.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 5. Navigation Tabs */}
        <div className="mt-5 flex flex-wrap gap-2 border-t border-white/10 pt-4">
          <button
            type="button"
            onClick={() => {
              setActiveTab("remarks");
              setResultText(null);
            }}
            className={`flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-medium transition ${
              activeTab === "remarks"
                ? "bg-brand-600 text-white shadow-md font-semibold"
                : "text-slate-300 hover:bg-white/10 hover:text-white"
            }`}
          >
            📝 Report Card Remarks
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab("quiz");
              setResultText(null);
            }}
            className={`flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-medium transition ${
              activeTab === "quiz"
                ? "bg-brand-600 text-white shadow-md font-semibold"
                : "text-slate-300 hover:bg-white/10 hover:text-white"
            }`}
          >
            📋 Quiz & Assignment Maker
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab("notice");
              setResultText(null);
            }}
            className={`flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-medium transition ${
              activeTab === "notice"
                ? "bg-brand-600 text-white shadow-md font-semibold"
                : "text-slate-300 hover:bg-white/10 hover:text-white"
            }`}
          >
            📢 Circular & Notice Drafter
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab("chat");
              setResultText(null);
            }}
            className={`flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-medium transition ${
              activeTab === "chat"
                ? "bg-brand-600 text-white shadow-md font-semibold"
                : "text-slate-300 hover:bg-white/10 hover:text-white"
            }`}
          >
            💬 Interactive AI Chat
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab("settings");
              setResultText(null);
            }}
            className={`flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-medium transition ml-auto ${
              activeTab === "settings"
                ? "bg-amber-500 text-slate-950 shadow-md font-bold"
                : "bg-white/10 text-amber-200 hover:bg-white/20"
            }`}
          >
            ⚙️ Model & AI Settings
          </button>
        </div>
      </div>

      {/* Main Content Layout */}
      {activeTab === "settings" ? (
        /* TAB 5: MODEL SETTINGS & ENDPOINT CONFIG */
        <div className="card p-6 max-w-4xl mx-auto space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-base font-semibold text-white flex items-center gap-2">
                <span>⚙️</span> Multi-Model Architecture & GUI Settings
              </h3>
              <p className="text-xs text-slate-400">
                Configure API endpoints, API keys, and parameter controls for ChatGPT, Claude, Gemini, or local models.
              </p>
            </div>
            <span className="rounded bg-indigo-950/60 px-2.5 py-1 text-xs font-mono font-medium text-indigo-300 border border-indigo-800/60">
              API Ready
            </span>
          </div>

          <div className="space-y-5">
            {/* Provider Picker Cards */}
            <div>
              <label className="label text-xs">Choose LLM Engine</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {/* 1. ChatGPT */}
                <button
                  type="button"
                  onClick={() => selectPreset("openai")}
                  className={`rounded-xl border p-3.5 text-left transition ${
                    settings.provider === "openai"
                      ? "border-emerald-500 bg-emerald-950/50 ring-2 ring-emerald-500/40"
                      : "border-slate-800 bg-slate-950/60 hover:bg-slate-800/50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <span>🟢</span> OpenAI ChatGPT
                    </span>
                    <span className="rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-mono text-emerald-400">
                      128K
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">GPT-4o & GPT-4o-mini official API</div>
                </button>

                {/* 2. Claude */}
                <button
                  type="button"
                  onClick={() => selectPreset("claude")}
                  className={`rounded-xl border p-3.5 text-left transition ${
                    settings.provider === "claude"
                      ? "border-purple-500 bg-purple-950/50 ring-2 ring-purple-500/40"
                      : "border-slate-800 bg-slate-950/60 hover:bg-slate-800/50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <span>🟣</span> Anthropic Claude
                    </span>
                    <span className="rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-mono text-purple-400">
                      200K
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">Claude 3.5 Sonnet / Haiku</div>
                </button>

                {/* 3. Gemini */}
                <button
                  type="button"
                  onClick={() => selectPreset("gemini")}
                  className={`rounded-xl border p-3.5 text-left transition ${
                    settings.provider === "gemini"
                      ? "border-blue-500 bg-blue-950/50 ring-2 ring-blue-500/40"
                      : "border-slate-800 bg-slate-950/60 hover:bg-slate-800/50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <span>🔵</span> Google Gemini
                    </span>
                    <span className="rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-mono text-blue-400">
                      1M – 2M
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">Gemini 1.5 Flash / Pro (Long Context)</div>
                </button>

                {/* 4. Sir's Custom Endpoint */}
                <button
                  type="button"
                  onClick={() => selectPreset("custom")}
                  className={`rounded-xl border p-3.5 text-left transition ${
                    settings.provider === "custom"
                      ? "border-amber-500 bg-amber-950/50 ring-2 ring-amber-500/40"
                      : "border-slate-800 bg-slate-950/60 hover:bg-slate-800/50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <span>⚡</span> Sir&apos;s Custom Endpoint
                    </span>
                    <span className="rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-mono text-amber-400">
                      8K – 32K
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">Ollama, LM Studio, vLLM private server</div>
                </button>

                {/* 5. Built-in Academic Engine */}
                <button
                  type="button"
                  onClick={() => selectPreset("builtin")}
                  className={`rounded-xl border p-3.5 text-left transition ${
                    settings.provider === "builtin"
                      ? "border-slate-400 bg-slate-800/70 ring-2 ring-slate-400/40"
                      : "border-slate-800 bg-slate-950/60 hover:bg-slate-800/50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <span>🏫</span> Greenfield Built-in
                    </span>
                    <span className="rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-mono text-slate-300">
                      Offline
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">Zero config, deterministic rules, instant</div>
                </button>
              </div>
            </div>

            {/* Provider-Specific Configuration Form */}
            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div className="text-xs font-semibold text-slate-200">
                  {settings.provider === "openai" && "OpenAI ChatGPT Connection Settings"}
                  {settings.provider === "claude" && "Anthropic Claude Connection Settings"}
                  {settings.provider === "gemini" && "Google Gemini Connection Settings"}
                  {settings.provider === "custom" && "Sir's Custom / Local Model Connection Settings"}
                  {settings.provider === "builtin" && "Built-in Greenfield Academic Engine Details"}
                </div>
                <span className="text-[11px] font-mono text-indigo-300">
                  Content Window Limit: {activeSpec.contextWindow.toLocaleString()} Tokens
                </span>
              </div>

              {/* OpenAI Config */}
              {settings.provider === "openai" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="label text-xs">OpenAI Model Name</label>
                    <select
                      className="input text-xs"
                      value={settings.modelName}
                      onChange={(e) => saveSettings({ ...settings, modelName: e.target.value })}
                    >
                      <option value="gpt-4o">gpt-4o (Flagship Omni - 128K)</option>
                      <option value="gpt-4o-mini">gpt-4o-mini (Fast & Efficient - 128K)</option>
                    </select>
                  </div>
                  <div>
                    <label className="label text-xs">OpenAI API Key (or env OPENAI_API_KEY)</label>
                    <input
                      type="password"
                      className="input text-xs font-mono"
                      value={settings.apiKey}
                      onChange={(e) => saveSettings({ ...settings, apiKey: e.target.value })}
                      placeholder="sk-proj-..."
                    />
                  </div>
                </div>
              )}

              {/* Claude Config */}
              {settings.provider === "claude" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="label text-xs">Anthropic Model Name</label>
                    <select
                      className="input text-xs"
                      value={settings.modelName}
                      onChange={(e) => saveSettings({ ...settings, modelName: e.target.value })}
                    >
                      <option value="claude-3-5-sonnet">claude-3-5-sonnet (High Reasoning - 200K)</option>
                      <option value="claude-3-haiku">claude-3-haiku (Fast Response - 200K)</option>
                    </select>
                  </div>
                  <div>
                    <label className="label text-xs">Anthropic API Key (or env ANTHROPIC_API_KEY)</label>
                    <input
                      type="password"
                      className="input text-xs font-mono"
                      value={settings.apiKey}
                      onChange={(e) => saveSettings({ ...settings, apiKey: e.target.value })}
                      placeholder="sk-ant-api03-..."
                    />
                  </div>
                </div>
              )}

              {/* Gemini Config */}
              {settings.provider === "gemini" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="label text-xs">Gemini Model Name</label>
                    <select
                      className="input text-xs"
                      value={settings.modelName}
                      onChange={(e) => saveSettings({ ...settings, modelName: e.target.value })}
                    >
                      <option value="gemini-1.5-flash">gemini-1.5-flash (Fast & 1M Window)</option>
                      <option value="gemini-1.5-pro">gemini-1.5-pro (Deep Reasoning & 2M Window)</option>
                    </select>
                  </div>
                  <div>
                    <label className="label text-xs">Google Gemini API Key (or env GEMINI_API_KEY)</label>
                    <input
                      type="password"
                      className="input text-xs font-mono"
                      value={settings.apiKey}
                      onChange={(e) => saveSettings({ ...settings, apiKey: e.target.value })}
                      placeholder="AIzaSy..."
                    />
                  </div>
                </div>
              )}

              {/* Custom Model Config */}
              {settings.provider === "custom" && (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="label text-xs">Model Name *</label>
                      <input
                        className="input text-xs font-mono"
                        value={settings.modelName}
                        onChange={(e) => saveSettings({ ...settings, modelName: e.target.value })}
                        placeholder="e.g. llama3, mistral, qwen2"
                      />
                    </div>
                    <div>
                      <label className="label text-xs">Base API URL *</label>
                      <input
                        className="input text-xs font-mono"
                        value={settings.baseUrl}
                        onChange={(e) => saveSettings({ ...settings, baseUrl: e.target.value })}
                        placeholder="e.g. http://localhost:11434/v1"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="label text-xs">API Key (Optional for local Ollama / LM Studio)</label>
                    <input
                      type="password"
                      className="input text-xs font-mono"
                      value={settings.apiKey}
                      onChange={(e) => saveSettings({ ...settings, apiKey: e.target.value })}
                      placeholder="Optional server bearer token"
                    />
                  </div>
                </div>
              )}

              {/* Parameter Sliders */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-800">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <label className="label text-xs p-0 m-0">Temperature (Creativity)</label>
                    <span className="font-mono text-indigo-300 font-semibold">{settings.temperature}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={settings.temperature}
                    onChange={(e) => saveSettings({ ...settings, temperature: parseFloat(e.target.value) })}
                    className="w-full accent-brand-500 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500">
                    <span>0.0 (Precise / Formal)</span>
                    <span>1.0 (Creative)</span>
                  </div>
                </div>

                <div>
                  <label className="label text-xs">Max Output Tokens</label>
                  <select
                    className="input text-xs"
                    value={settings.maxTokens || 1024}
                    onChange={(e) => saveSettings({ ...settings, maxTokens: parseInt(e.target.value) })}
                  >
                    <option value={512}>512 tokens (~380 words)</option>
                    <option value={1024}>1024 tokens (~760 words)</option>
                    <option value={2048}>2048 tokens (~1500 words)</option>
                    <option value={4096}>4096 tokens (~3000 words)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Custom System Prompt & Persona */}
            <div>
              <label className="label text-xs">Customized School System Prompt (Domain Instruction)</label>
              <textarea
                className="input text-xs h-20 resize-none font-mono"
                value={settings.customSystemPrompt}
                onChange={(e) => saveSettings({ ...settings, customSystemPrompt: e.target.value })}
                placeholder="Define custom rules, tone, and grading policies for the model..."
              />
            </div>

            {/* Connection Test Bar */}
            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div>
                <div className="text-xs font-semibold text-white">Test Model Connection & Verification</div>
                <div className="text-[11px] text-slate-400">
                  Sends a real-time verification ping to verify that the active LLM endpoint and context window respond correctly.
                </div>
              </div>
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={testingConnection}
                className="btn bg-brand-600 text-white text-xs font-semibold hover:bg-brand-700 disabled:opacity-50 shrink-0"
              >
                {testingConnection ? "Pinging Model..." : "⚡ Test Connection Now"}
              </button>
            </div>

            {/* Test Connection Results */}
            {testResult && (
              <div
                className={`rounded-xl p-3.5 text-xs ${
                  testResult.success
                    ? "border border-emerald-800/80 bg-emerald-950/60 text-emerald-200"
                    : "border border-amber-800/80 bg-amber-950/60 text-amber-200"
                }`}
              >
                <div className="font-semibold flex items-center gap-1.5">
                  <span>{testResult.success ? "✓" : "⚠️"}</span>
                  <span>{testResult.success ? "Connection Verified Successfully!" : "Connection Warning"}</span>
                  {testResult.latencyMs !== undefined && (
                    <span className="ml-auto font-mono text-[11px] bg-slate-900 border border-slate-800 px-2 py-0.5 rounded text-slate-200">
                      {testResult.latencyMs}ms latency
                    </span>
                  )}
                  {testResult.contextWindow && (
                    <span className="font-mono text-[11px] bg-slate-900 border border-slate-800 px-2 py-0.5 rounded text-indigo-300">
                      Window: {testResult.contextWindow.toLocaleString()} tokens
                    </span>
                  )}
                </div>
                <p className="mt-1 text-[11px]">{testResult.message}</p>
              </div>
            )}
          </div>
        </div>
      ) : activeTab !== "chat" ? (
        /* Tabs 1-3 Form and Output */
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Left Column: Input Form */}
          <div className="lg:col-span-5">
            <div className="card p-5 space-y-4">
              {activeTab === "remarks" && (
                <form onSubmit={handleGenerateRemarks} className="space-y-4">
                  <h3 className="text-sm font-semibold text-white flex items-center gap-1.5">
                    <span>📝</span> Generate Student Remarks
                  </h3>
                  <div>
                    <label className="label text-xs">Target Student</label>
                    <input
                      className="input text-xs"
                      value={selectedStudent}
                      onChange={(e) => setSelectedStudent(e.target.value)}
                      placeholder="e.g. Arjun Mehta"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="label text-xs">Class / Section</label>
                      <input
                        className="input text-xs"
                        value={gradeLevel}
                        onChange={(e) => setGradeLevel(e.target.value)}
                        placeholder="e.g. Class 8-A"
                      />
                    </div>
                    <div>
                      <label className="label text-xs">Attendance Rate</label>
                      <input
                        className="input text-xs"
                        value={attendanceRate}
                        onChange={(e) => setAttendanceRate(e.target.value)}
                        placeholder="e.g. 96%"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="label text-xs">Observed Strengths</label>
                    <textarea
                      className="input text-xs h-18 resize-none"
                      value={strengths}
                      onChange={(e) => setStrengths(e.target.value)}
                      placeholder="What did the student excel in?"
                    />
                  </div>
                  <div>
                    <label className="label text-xs">Areas for Improvement</label>
                    <textarea
                      className="input text-xs h-18 resize-none"
                      value={areasToImprove}
                      onChange={(e) => setAreasToImprove(e.target.value)}
                      placeholder="Constructive recommendations"
                    />
                  </div>
                  <div>
                    <label className="label text-xs">Feedback Tone</label>
                    <select
                      className="input text-xs"
                      value={remarksTone}
                      onChange={(e) => setRemarksTone(e.target.value as any)}
                    >
                      <option value="encouraging">Encouraging & Motivating</option>
                      <option value="formal">Formal & Academic</option>
                      <option value="constructive">Constructive & Direct</option>
                    </select>
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn bg-brand-600 text-white w-full text-xs font-semibold hover:bg-brand-700 disabled:opacity-50"
                  >
                    {loading ? `Generating with ${activeSpec.name}...` : `✨ Generate AI Remarks (${activeSpec.name})`}
                  </button>
                </form>
              )}

              {activeTab === "quiz" && (
                <form onSubmit={handleGenerateQuiz} className="space-y-4">
                  <h3 className="text-sm font-semibold text-white flex items-center gap-1.5">
                    <span>📋</span> Smart Quiz Generator
                  </h3>
                  <div>
                    <label className="label text-xs">Subject</label>
                    <select
                      className="input text-xs"
                      value={quizSubject}
                      onChange={(e) => setQuizSubject(e.target.value)}
                    >
                      <option value="Science">Science</option>
                      <option value="Mathematics">Mathematics</option>
                      <option value="English">English</option>
                      <option value="Computer Science">Computer Science</option>
                      <option value="History">History</option>
                      <option value="Geography">Geography</option>
                    </select>
                  </div>
                  <div>
                    <label className="label text-xs">Lesson / Topic</label>
                    <input
                      className="input text-xs"
                      value={quizTopic}
                      onChange={(e) => setQuizTopic(e.target.value)}
                      placeholder="e.g. Photosynthesis, Linear Equations"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="label text-xs">Target Grade</label>
                      <input
                        className="input text-xs"
                        value={quizGrade}
                        onChange={(e) => setQuizGrade(e.target.value)}
                        placeholder="e.g. Class 8"
                      />
                    </div>
                    <div>
                      <label className="label text-xs">Questions Count</label>
                      <select
                        className="input text-xs"
                        value={questionCount}
                        onChange={(e) => setQuestionCount(Number(e.target.value))}
                      >
                        <option value={3}>3 Questions (Quick Quiz)</option>
                        <option value={5}>5 Questions (Standard)</option>
                        <option value={10}>10 Questions (Full Test)</option>
                      </select>
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn bg-brand-600 text-white w-full text-xs font-semibold hover:bg-brand-700 disabled:opacity-50"
                  >
                    {loading ? `Crafting Quiz with ${activeSpec.name}...` : `⚡ Generate Quiz with Answer Key`}
                  </button>
                </form>
              )}

              {activeTab === "notice" && (
                <form onSubmit={handleGenerateNotice} className="space-y-4">
                  <h3 className="text-sm font-semibold text-white flex items-center gap-1.5">
                    <span>📢</span> Draft Official Notice / Circular
                  </h3>
                  <div>
                    <label className="label text-xs">Circular Topic</label>
                    <input
                      className="input text-xs"
                      value={noticeTopic}
                      onChange={(e) => setNoticeTopic(e.target.value)}
                      placeholder="e.g. Annual Sports Meet 2026"
                      required
                    />
                  </div>
                  <div>
                    <label className="label text-xs">Target Audience</label>
                    <input
                      className="input text-xs"
                      value={noticeAudience}
                      onChange={(e) => setNoticeAudience(e.target.value)}
                      placeholder="e.g. Parents of Class 8 Students"
                    />
                  </div>
                  <div>
                    <label className="label text-xs">Scheduled Date / Time</label>
                    <input
                      className="input text-xs"
                      value={noticeDate}
                      onChange={(e) => setNoticeDate(e.target.value)}
                      placeholder="e.g. October 15, 2026 at 9:00 AM"
                    />
                  </div>
                  <div>
                    <label className="label text-xs">Key Agenda Points</label>
                    <textarea
                      className="input text-xs h-20 resize-none"
                      value={noticeDetails}
                      onChange={(e) => setNoticeDetails(e.target.value)}
                      placeholder="Details, schedule, guidelines to include"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn bg-brand-600 text-white w-full text-xs font-semibold hover:bg-brand-700 disabled:opacity-50"
                  >
                    {loading ? `Drafting Circular with ${activeSpec.name}...` : `📜 Draft Official Circular`}
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* Right Column: AI Output Viewer */}
          <div className="lg:col-span-7">
            <div className="card p-5 h-full flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-white">Generated AI Output</span>
                    {providerUsed && (
                      <span className="rounded bg-indigo-950/60 px-2 py-0.5 text-[11px] font-medium text-indigo-300 border border-indigo-800/60">
                        {providerUsed}
                      </span>
                    )}
                  </div>
                  {resultText && (
                    <button
                      type="button"
                      onClick={handleCopy}
                      className="btn-ghost text-xs flex items-center gap-1 text-slate-300 hover:text-white"
                    >
                      {copied ? "✓ Copied!" : "📋 Copy Output"}
                    </button>
                  )}
                </div>

                <div className="mt-4">
                  {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 space-y-3">
                      <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-800 border-t-brand-400"></div>
                      <p className="text-xs font-medium text-slate-400">
                        {activeSpec.name} is processing within its {activeSpec.badge}...
                      </p>
                    </div>
                  ) : resultText ? (
                    <div className="space-y-3">
                      <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-4 text-xs text-slate-200 font-sans leading-relaxed whitespace-pre-wrap">
                        {resultText}
                      </div>

                      {/* Token usage breakdown bar */}
                      {lastTokenStats && (
                        <div className="rounded-lg bg-slate-900/60 border border-slate-800/80 p-2.5 flex flex-wrap items-center justify-between text-[11px] text-slate-400">
                          <span className="flex items-center gap-1">
                            <span>📊 Prompt:</span>
                            <strong className="text-slate-200">{lastTokenStats.promptTokens} tokens</strong>
                          </span>
                          <span className="flex items-center gap-1">
                            <span>✨ Completion:</span>
                            <strong className="text-slate-200">{lastTokenStats.completionTokens} tokens</strong>
                          </span>
                          <span className="flex items-center gap-1">
                            <span>🎯 Total:</span>
                            <strong className="text-indigo-300">{lastTokenStats.totalTokens} tokens</strong>
                          </span>
                          <span className="flex items-center gap-1">
                            <span>🪟 Window Usage:</span>
                            <strong className="text-emerald-400">{lastTokenStats.contextWindowPercent}%</strong>
                          </span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="rounded-xl border border-dashed border-slate-800 bg-slate-950/30 p-12 text-center text-slate-500">
                      <div className="mx-auto mb-2 text-2xl">✨</div>
                      <p className="text-xs font-medium text-slate-300">No output generated yet</p>
                      <p className="text-[11px] text-slate-500 mt-1">
                        Fill out the parameters on the left and click Generate to see the response.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-4 border-t border-slate-800 pt-3 flex items-center justify-between text-[11px] text-slate-500">
                <span>Active Model: {activeSpec.name} ({activeSpec.badge})</span>
                <span>Configurable in Model Settings</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Tab 4: Interactive AI Chat */
        <div className="lg:col-span-12">
          <div className="card flex flex-col h-[560px]">
            {/* Chat Header with Token Status */}
            <div className="p-3.5 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500"></span>
                <span className="text-xs font-bold text-white">Interactive Copilot Session</span>
                <span className="rounded bg-indigo-950/80 border border-indigo-700/60 px-2 py-0.5 text-[10px] font-mono text-indigo-300">
                  {activeSpec.name}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[11px] text-slate-400 font-mono">
                  Context Window: ~{totalChatTokens} / {activeSpec.contextWindow.toLocaleString()} tokens
                </span>
                <button
                  type="button"
                  onClick={handleResetChat}
                  className="rounded bg-slate-800 hover:bg-slate-700 px-2.5 py-1 text-[11px] text-slate-300 transition"
                  title="Resets conversation to clear the content window"
                >
                  🧹 Clear Window
                </button>
              </div>
            </div>

            {/* Chat Messages Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {chatMessages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex items-start gap-3 ${
                    msg.sender === "user" ? "flex-row-reverse" : "flex-row"
                  }`}
                >
                  <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
                      msg.sender === "user"
                        ? "bg-brand-600 text-white"
                        : "bg-slate-800 text-slate-200 border border-slate-700"
                    }`}
                  >
                    {msg.sender === "user" ? "You" : "🤖"}
                  </div>
                  <div className="space-y-1">
                    <div
                      className={`max-w-xl rounded-2xl p-3.5 text-xs leading-relaxed ${
                        msg.sender === "user"
                          ? "bg-brand-600 text-white rounded-tr-none"
                          : "bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-none whitespace-pre-wrap"
                      }`}
                    >
                      {msg.text}
                    </div>
                    {msg.tokens && (
                      <div
                        className={`text-[10px] text-slate-500 font-mono ${
                          msg.sender === "user" ? "text-right" : "text-left"
                        }`}
                      >
                        ~{msg.tokens} tokens
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <span className="h-2 w-2 animate-ping rounded-full bg-brand-500"></span>
                  <span>{activeSpec.name} is typing...</span>
                </div>
              )}
            </div>

            {/* Chat Input Bar */}
            <div className="border-t border-slate-800 p-4 bg-slate-950/60">
              <form onSubmit={handleSendChat} className="flex gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Ask about school policies, student performance, grading schemes..."
                  className="input flex-1 text-xs"
                  disabled={loading}
                />
                <button
                  type="submit"
                  disabled={loading || !chatInput.trim()}
                  className="btn bg-brand-600 text-xs font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
                >
                  Send ↵
                </button>
              </form>

              {/* Quick Prompts */}
              <div className="mt-2 flex flex-wrap gap-1.5 items-center">
                <span className="text-[10px] text-slate-400">Quick prompts:</span>
                <button
                  type="button"
                  onClick={() =>
                    setChatInput("What is the minimum attendance required for Class 8 exams?")
                  }
                  className="rounded bg-slate-900 border border-slate-800 px-2 py-0.5 text-[10px] text-slate-300 hover:border-brand-500 hover:text-white transition-colors"
                >
                  Attendance policy
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setChatInput("Explain the letter grading scale used in report cards")
                  }
                  className="rounded bg-slate-900 border border-slate-800 px-2 py-0.5 text-[10px] text-slate-300 hover:border-brand-500 hover:text-white transition-colors"
                >
                  Grading scale
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setChatInput("How can I register a new student for admissions?")
                  }
                  className="rounded bg-slate-900 border border-slate-800 px-2 py-0.5 text-[10px] text-slate-300 hover:border-brand-500 hover:text-white transition-colors"
                >
                  Student registration
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
