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

export function AiCopilotClient({
  students = [],
  initialIsPrincipal = true,
  initialUserRole = "principal",
  userName = "Dr. Anita Desai (Principal)",
  initialInstitutionalConfig,
}: {
  students?: StudentSummary[];
  initialIsPrincipal?: boolean;
  initialUserRole?: string;
  userName?: string;
  initialInstitutionalConfig?: any;
}) {
  const initialRoleNormalized: "principal" | "teacher" | "student" = initialIsPrincipal
    ? "principal"
    : initialUserRole === "student"
    ? "student"
    : "teacher";

  const [activeRole, setActiveRole] = useState<"principal" | "teacher" | "student">(initialRoleNormalized);
  const [activeTab, setActiveTab] = useState<"remarks" | "quiz" | "notice" | "chat" | "settings">(
    initialRoleNormalized === "student" ? "quiz" : "remarks"
  );
  const [loading, setLoading] = useState(false);
  const [resultText, setResultText] = useState<string | null>(null);
  const [providerUsed, setProviderUsed] = useState<string | null>(null);
  const [lastTokenStats, setLastTokenStats] = useState<TokenStats | null>(null);
  const [copied, setCopied] = useState(false);
  const [showContextInfo, setShowContextInfo] = useState(false);

  // Institutional License & Role Authority Simulation
  const [institutionalConfig, setInstitutionalConfig] = useState<any>(initialInstitutionalConfig || null);
  const [savingInstitutional, setSavingInstitutional] = useState(false);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);

  // Per-Provider Key Inputs and Action Loading for Principal GUI
  const [providerKeyInputs, setProviderKeyInputs] = useState<{ [key: string]: string }>({
    gemini: "",
    openai: "",
    claude: "",
    custom: "",
  });
  const [keyActionLoading, setKeyActionLoading] = useState<{ [key: string]: boolean }>({});

  // Automatically switch away from teacher-only tabs if student role is active
  useEffect(() => {
    if (activeRole === "student" && (activeTab === "remarks" || activeTab === "notice")) {
      setActiveTab("quiz");
    }
  }, [activeRole, activeTab]);

  // Model Settings State
  const [settings, setSettings] = useState<ModelSettings>(DEFAULT_SETTINGS);
  const [testingConnection, setTestingConnection] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    latencyMs?: number;
    contextWindow?: number;
  } | null>(null);

  // Load saved settings from server and localStorage on client mount
  useEffect(() => {
    fetch("/api/ai/models/config")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.config) {
          setInstitutionalConfig(data.config);
          if (data.config.isConfigured) {
            setSettings((prev) => ({
              ...prev,
              provider: data.config.provider,
              modelName: data.config.modelName,
              baseUrl: data.config.baseUrl,
            }));
          }
        }
      })
      .catch((_) => {});

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

  async function handleSaveSchoolApiKey() {
    setSavingInstitutional(true);
    setSaveSuccessMessage(null);
    try {
      const res = await fetch("/api/ai/models/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: settings.provider,
          modelName: settings.modelName,
          baseUrl: settings.baseUrl,
          apiKey: settings.apiKey,
          temperature: settings.temperature,
          customSystemPrompt: settings.customSystemPrompt,
          maxTokens: settings.maxTokens,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setInstitutionalConfig(data.config);
        setSaveSuccessMessage("✓ Principal Authority: School-wide AI Key saved! All teachers and students can now use this model.");
        setTimeout(() => setSaveSuccessMessage(null), 5000);
      } else {
        alert(data.error || "Failed to save institutional API key.");
      }
    } catch (err: any) {
      alert("Network error saving configuration: " + err.message);
    } finally {
      setSavingInstitutional(false);
    }
  }

  async function handleSaveProviderKey(
    provider: "openai" | "claude" | "gemini" | "custom",
    customKey?: string
  ) {
    const rawKey = (customKey !== undefined ? customKey : providerKeyInputs[provider]) || "";
    if (!rawKey.trim()) {
      alert(`Please enter a valid API key for ${provider.toUpperCase()} before saving.`);
      return;
    }
    setKeyActionLoading((prev) => ({ ...prev, [provider]: true }));
    setSaveSuccessMessage(null);
    try {
      const res = await fetch("/api/ai/models/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "save_key",
          provider,
          apiKey: rawKey.trim(),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setInstitutionalConfig(data.config);
        setProviderKeyInputs((prev) => ({ ...prev, [provider]: "" }));
        setSaveSuccessMessage(`✓ Principal Authority: ${data.message || `Saved API key for ${provider.toUpperCase()}.`}`);
        setTimeout(() => setSaveSuccessMessage(null), 5000);
      } else {
        alert(data.error || "Failed to save API key.");
      }
    } catch (err: any) {
      alert("Network error: " + err.message);
    } finally {
      setKeyActionLoading((prev) => ({ ...prev, [provider]: false }));
    }
  }

  async function handleDeleteProviderKey(provider: "openai" | "claude" | "gemini" | "custom") {
    const providerNames: Record<string, string> = {
      gemini: "Google Gemini",
      openai: "OpenAI ChatGPT",
      claude: "Anthropic Claude",
      custom: "Sir's Local Endpoint",
    };
    const pName = providerNames[provider] || provider;
    const confirmDelete = window.confirm(
      `Are you sure you want to delete the school API key for ${pName}? Teachers and students will no longer have access to this model until a new key is added.`
    );
    if (!confirmDelete) return;

    setKeyActionLoading((prev) => ({ ...prev, [provider]: true }));
    setSaveSuccessMessage(null);
    try {
      const res = await fetch("/api/ai/models/config", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider }),
      });
      const data = await res.json();
      if (data.success) {
        setInstitutionalConfig(data.config);
        setProviderKeyInputs((prev) => ({ ...prev, [provider]: "" }));
        if (settings.provider === provider) {
          saveSettings({ ...settings, apiKey: "" });
        }
        setSaveSuccessMessage(`✓ Principal Authority: ${data.message || `Deleted API key for ${pName}.`}`);
        setTimeout(() => setSaveSuccessMessage(null), 5000);
      } else {
        alert(data.error || "Failed to delete API key.");
      }
    } catch (err: any) {
      alert("Network error: " + err.message);
    } finally {
      setKeyActionLoading((prev) => ({ ...prev, [provider]: false }));
    }
  }

  function getProviderStatus(provider: "gemini" | "openai" | "claude" | "custom") {
    if (institutionalConfig?.keysStatus?.[provider]) {
      return institutionalConfig.keysStatus[provider];
    }
    const isThis = institutionalConfig?.provider === provider;
    return {
      provider,
      name: provider,
      configured: isThis && Boolean(institutionalConfig?.hasKey),
      maskedKey: isThis ? institutionalConfig?.maskedKey || "" : "",
      defaultModel: "",
    };
  }

  // Helper to switch active model preset
  function selectPreset(preset: "openai" | "claude" | "gemini" | "custom" | "qwen" | "builtin") {
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
      case "qwen":
        saveSettings({
          ...settings,
          provider: "custom",
          modelName: "qwen-0.6b",
          baseUrl: "http://localhost:11434/v1",
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
  const [quizSubject, setQuizSubject] = useState("Mathematics");
  const [quizTopic, setQuizTopic] = useState("Probability (Class 8)");
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
      <div className="rounded-3xl border border-white/[0.08] bg-slate-900/50 backdrop-blur-2xl p-6 sm:p-7 text-white shadow-[0_16px_40px_rgba(0,0,0,0.4)] ring-1 ring-inset ring-white/[0.03]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-600 text-white shadow-[0_0_20px_-3px_rgba(99,102,241,0.5)]">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                </svg>
              </span>
              <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight font-display">
                {activeRole === "student" ? "Greenfield AI Study Assistant" : "Greenfield AI Academic Copilot"}
              </h2>
              <span className="rounded-full bg-emerald-500/15 px-3 py-0.5 text-[10px] font-bold text-emerald-300 border border-emerald-500/30 backdrop-blur-md">
                {activeRole === "student" ? "Student Learning & Practice Mode" : "Multi-LLM GUI Coordinator"}
              </span>
            </div>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              {activeRole === "student"
                ? "Self-assessment practice quizzes (Science, Photosynthesis, Force & Motion), curriculum revision, and interactive AI tutor doubt-solving."
                : "Coordinate effortlessly between OpenAI ChatGPT, Anthropic Claude, Google Gemini, and Sir's Local Endpoints with real-time Content Window monitoring."}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setShowContextInfo(!showContextInfo)}
              className="btn-ghost py-2 px-3 text-xs"
            >
              <svg className="h-4 w-4 text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
              </svg>
              <span>Context Window Guide</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("settings")}
              className="btn-ghost py-2 px-3 text-xs"
            >
              <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.343 3.94c.09-.542.56-.94 1.11-.94h1.093c.55 0 1.02.398 1.11.94l.149.894c.07.424.384.764.78.93.398.164.855.142 1.205-.108l.737-.527a1.125 1.125 0 011.45.12l.773.774c.39.389.44 1.002.12 1.45l-.527.737c-.25.35-.272.806-.107 1.204.165.397.505.71.93.78l.893.15c.543.09.94.559.94 1.109v1.094c0 .55-.397 1.02-.94 1.11l-.894.149c-.424.07-.764.383-.929.78-.165.398-.143.854.107 1.204l.527.738c.32.447.27.1.06-.12l-.773.773a1.125 1.125 0 01-1.449.12l-.738-.527c-.35-.25-.806-.272-1.203-.107-.398.165-.71.505-.781.929l-.149.894c-.09.542-.56.94-1.11.94h-1.094c-.55 0-1.019-.398-1.11-.94l-.148-.894c-.071-.424-.384-.764-.781-.93-.398-.164-.854-.142-1.204.108l-.738.527c-.447.32-1.06.27-1.45-.12l-.773-.774a1.125 1.125 0 01-.12-1.45l.527-.737c.25-.35.272-.806.108-1.204-.165-.397-.506-.71-.93-.78l-.894-.15c-.542-.09-.94-.56-.94-1.11v-1.093c0-.55.398-1.02.94-1.11l.894-.149c.424-.07.765-.383.93-.78.165-.398.143-.854-.108-1.204l-.526-.738a1.125 1.125 0 01.12-1.45l.773-.773a1.125 1.125 0 011.45-.12l.737.527c.35.25.807.272 1.204.107.397-.165.71-.505.78-.929l.15-.894z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>{activeRole === "student" ? "AI Settings" : "Model Settings"}</span>
            </button>
          </div>
        </div>

        {/* Role Authority & Institutional License Status Strip */}
        <div className="mt-5 pt-4 border-t border-white/[0.08] flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px] font-display">Authority Level:</span>
            <div className="inline-flex rounded-xl bg-white/[0.03] p-1 border border-white/[0.08]">
              <button
                type="button"
                onClick={() => setActiveRole("principal")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                  activeRole === "principal"
                    ? "bg-gradient-to-r from-brand-600 to-indigo-600 text-white shadow-sm ring-1 ring-white/10"
                    : "text-slate-300 hover:text-white"
                }`}
              >
                <span>👑</span> Principal (Add &amp; Manage Key)
              </button>
              <button
                type="button"
                onClick={() => setActiveRole("teacher")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                  activeRole === "teacher"
                    ? "bg-gradient-to-r from-indigo-600 to-brand-600 text-white shadow-sm ring-1 ring-white/10"
                    : "text-slate-300 hover:text-white"
                }`}
              >
                <span>👩‍🏫</span> Teacher (Assignments &amp; Remarks)
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveRole("student");
                  if (activeTab === "remarks" || activeTab === "notice") {
                    setActiveTab("quiz");
                  }
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                  activeRole === "student"
                    ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-sm ring-1 ring-white/10"
                    : "text-slate-300 hover:text-white"
                }`}
              >
                <span>🎓</span> Student (Practice Quizzes &amp; AI Tutor)
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {institutionalConfig?.hasKey || institutionalConfig?.isConfigured ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-3 py-1 text-[11px] font-semibold text-emerald-300 backdrop-blur-md">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                School AI License: <strong>Active (Configured by Principal)</strong>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.04] border border-white/[0.08] px-3 py-1 text-[11px] font-medium text-slate-300">
                <span className="h-1.5 w-1.5 rounded-full bg-slate-400"></span>
                Institutional Key: <strong>Needs Principal Setup</strong>
              </span>
            )}
            {activeRole !== "principal" && (
              <span className="text-[11px] text-slate-400 italic hidden sm:inline">
                (Inherits school key • No individual key required)
              </span>
            )}
          </div>
        </div>

        {/* 2. Interactive LLM Preset Selector Chips */}
        <div className="mt-4 pt-3 border-t border-white/[0.08] flex flex-wrap items-center gap-2">
          <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 mr-1 font-display">
            Active LLM Model:
          </span>

          {/* ChatGPT */}
          <button
            type="button"
            onClick={() => selectPreset("openai")}
            className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition flex items-center gap-2 border backdrop-blur-md ${
              settings.provider === "openai"
                ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-200 font-bold shadow-[0_0_15px_-3px_rgba(16,185,129,0.3)] ring-1 ring-emerald-400/50"
                : "bg-white/[0.03] border-white/[0.08] text-slate-300 hover:bg-white/[0.07]"
            }`}
          >
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            <span>ChatGPT (GPT-4o)</span>
            <span className="rounded bg-black/40 px-1.5 py-0.5 text-[10px] text-emerald-300 font-mono">128K</span>
          </button>

          {/* Claude */}
          <button
            type="button"
            onClick={() => selectPreset("claude")}
            className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition flex items-center gap-2 border backdrop-blur-md ${
              settings.provider === "claude"
                ? "bg-purple-500/15 border-purple-500/40 text-purple-200 font-bold shadow-[0_0_15px_-3px_rgba(168,85,247,0.3)] ring-1 ring-purple-400/50"
                : "bg-white/[0.03] border-white/[0.08] text-slate-300 hover:bg-white/[0.07]"
            }`}
          >
            <span className="h-2 w-2 rounded-full bg-purple-400" />
            <span>Claude (3.5 Sonnet)</span>
            <span className="rounded bg-black/40 px-1.5 py-0.5 text-[10px] text-purple-300 font-mono">200K</span>
          </button>

          {/* Gemini */}
          <button
            type="button"
            onClick={() => selectPreset("gemini")}
            className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition flex items-center gap-2 border backdrop-blur-md ${
              settings.provider === "gemini"
                ? "bg-blue-500/15 border-blue-500/40 text-blue-200 font-bold shadow-[0_0_15px_-3px_rgba(59,130,246,0.3)] ring-1 ring-blue-400/50"
                : "bg-white/[0.03] border-white/[0.08] text-slate-300 hover:bg-white/[0.07]"
            }`}
          >
            <span className="h-2 w-2 rounded-full bg-blue-400" />
            <span>Google Gemini (1.5 Flash)</span>
            <span className="rounded bg-black/40 px-1.5 py-0.5 text-[10px] text-blue-300 font-mono">1M</span>
          </button>

          {/* Qwen 0.6B (Sir's Recommendation) */}
          <button
            type="button"
            onClick={() => selectPreset("qwen")}
            className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition flex items-center gap-2 border backdrop-blur-md ${
              settings.provider === "custom" && (settings.modelName === "qwen-0.6b" || settings.modelName === "qwen3-0.6b")
                ? "bg-teal-500/15 border-teal-500/40 text-teal-200 font-bold shadow-[0_0_15px_-3px_rgba(20,184,166,0.3)] ring-1 ring-teal-400/50"
                : "bg-white/[0.03] border-white/[0.08] text-slate-300 hover:bg-white/[0.07]"
            }`}
          >
            <span className="h-2 w-2 rounded-full bg-teal-400" />
            <span>Qwen 0.6B (Edge SLM)</span>
            <span className="rounded bg-black/40 px-1.5 py-0.5 text-[10px] text-teal-300 font-mono">0.6B / 32K</span>
          </button>

          {/* Sir's Custom Endpoint */}
          <button
            type="button"
            onClick={() => selectPreset("custom")}
            className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition flex items-center gap-2 border backdrop-blur-md ${
              settings.provider === "custom" && settings.modelName !== "qwen-0.6b" && settings.modelName !== "qwen3-0.6b"
                ? "bg-indigo-500/15 border-indigo-500/40 text-indigo-200 font-bold shadow-[0_0_15px_-3px_rgba(99,102,241,0.3)] ring-1 ring-indigo-400/50"
                : "bg-white/[0.03] border-white/[0.08] text-slate-300 hover:bg-white/[0.07]"
            }`}
          >
            <span className="h-2 w-2 rounded-full bg-indigo-400" />
            <span>Local Endpoint (LLaMA 3)</span>
            <span className="rounded bg-black/40 px-1.5 py-0.5 text-[10px] text-slate-300 font-mono">8K</span>
          </button>

          {/* Built-in Academic Engine */}
          <button
            type="button"
            onClick={() => selectPreset("builtin")}
            className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition flex items-center gap-2 border backdrop-blur-md ${
              settings.provider === "builtin"
                ? "bg-white/[0.1] border-white/[0.2] text-white font-bold ring-1 ring-white/20"
                : "bg-white/[0.03] border-white/[0.08] text-slate-400 hover:bg-white/[0.07]"
            }`}
          >
            <span className="h-2 w-2 rounded-full bg-slate-400" />
            <span>Built-in Offline Engine</span>
            <span className="rounded bg-black/40 px-1.5 py-0.5 text-[10px] text-slate-300 font-mono">Offline</span>
          </button>
        </div>

        {/* 3. Live Context Window Gauge & Capacity Meter */}
        <div className="mt-4 rounded-2xl bg-white/[0.02] border border-white/[0.08] p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-500/15 text-brand-300 border border-brand-500/25 font-mono text-sm font-bold shadow-sm">
              {activeSpec.badge.split(" ")[0]}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white">{activeSpec.name}</span>
                <span className="rounded-full bg-indigo-500/15 border border-indigo-500/30 px-2.5 py-0.5 text-[10px] font-mono text-indigo-300">
                  Window: {activeSpec.contextWindow.toLocaleString()} tokens
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">{activeSpec.description}</p>
            </div>
          </div>

          {/* Context Meter Bar */}
          <div className="w-full md:w-72 space-y-1.5">
            <div className="flex justify-between text-[11px]">
              <span className="text-slate-400">Context Window Used:</span>
              <span className="font-mono text-brand-300 font-bold">
                {lastTokenStats ? `${lastTokenStats.totalTokens} tokens (${lastTokenStats.contextWindowPercent}%)` : `~${totalChatTokens} tokens`}
              </span>
            </div>
            <div className="h-2 w-full bg-white/[0.06] rounded-full overflow-hidden border border-white/[0.08]">
              <div
                className="h-full bg-gradient-to-r from-brand-500 via-indigo-500 to-cyan-400 rounded-full transition-all duration-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]"
                style={{
                  width: `${Math.min(100, Math.max(2, lastTokenStats?.contextWindowPercent || (totalChatTokens / activeSpec.contextWindow) * 100))}%`,
                }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-slate-400 font-mono">
              <span>0</span>
              <span>Headroom: {(activeSpec.contextWindow - (lastTokenStats?.totalTokens || totalChatTokens)).toLocaleString()} tokens</span>
            </div>
          </div>
        </div>

        {/* 4. Educational Content Window Explainer Banner (Toggleable) */}
        {showContextInfo && (
          <div className="mt-4 rounded-2xl border border-brand-500/30 bg-brand-950/40 p-4 text-xs text-indigo-100 space-y-3 backdrop-blur-xl animate-fadeIn ring-1 ring-inset ring-white/[0.04]">
            <div className="flex items-center justify-between font-bold text-brand-200">
              <span className="flex items-center gap-2 text-sm font-display">
                <span>Understanding LLM Context Windows</span>
              </span>
              <button
                type="button"
                onClick={() => setShowContextInfo(false)}
                className="text-slate-400 hover:text-white text-xs px-2.5 py-1 rounded-lg bg-white/10 transition"
              >
                ✕ Close
              </button>
            </div>
            <p className="leading-relaxed text-slate-300 text-[11px]">
              The **Context Window** is the working memory limit of an AI model in a single request. It holds the System Prompt, conversation history, school database context, user query, and generated answer:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 text-[11px]">
              <div className="rounded-xl bg-white/[0.03] border border-white/[0.08] p-3 backdrop-blur-md">
                <div className="font-bold text-blue-300 flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-blue-400" /> Google Gemini
                </div>
                <div className="text-[10px] font-mono text-emerald-300 mt-1">1,000,000 – 2,000,000 tokens</div>
                <p className="text-slate-400 text-[10px] mt-1 leading-relaxed">
                  Massive memory. Can digest complete school syllabus, 100+ textbooks, or full-year student rosters at once.
                </p>
              </div>

              <div className="rounded-xl bg-white/[0.03] border border-white/[0.08] p-3 backdrop-blur-md">
                <div className="font-bold text-purple-300 flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-purple-400" /> Anthropic Claude
                </div>
                <div className="text-[10px] font-mono text-purple-300 mt-1">200,000 tokens (~150,000 words)</div>
                <p className="text-slate-400 text-[10px] mt-1 leading-relaxed">
                  Superior comprehension for long student essays, multi-chapter exams, and extensive disciplinary files.
                </p>
              </div>

              <div className="rounded-xl bg-white/[0.03] border border-white/[0.08] p-3 backdrop-blur-md">
                <div className="font-bold text-emerald-300 flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" /> OpenAI ChatGPT
                </div>
                <div className="text-[10px] font-mono text-emerald-300 mt-1">128,000 tokens (~96,000 words)</div>
                <p className="text-slate-400 text-[10px] mt-1 leading-relaxed">
                  General-purpose industry workhorse for fast interactive Q&A, report card remarks, and quick circulars.
                </p>
              </div>

              <div className="rounded-xl bg-teal-950/30 border border-teal-500/30 p-3 backdrop-blur-md">
                <div className="font-bold text-teal-300 flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-teal-400" /> Qwen 0.6B (Sir&apos;s Pick)
                </div>
                <div className="text-[10px] font-mono text-teal-300 mt-1">32,768 tokens (~25,000 words)</div>
                <p className="text-slate-300 text-[10px] mt-1 leading-relaxed">
                  Ultra-light 0.6B Small Language Model. Runs offline on school CPUs with ~500MB RAM. Zero API cost.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 5. Navigation Tabs - Filtered for Student Authority */}
        <div className="mt-5 flex flex-wrap gap-2 border-t border-white/[0.08] pt-4">
          {/* Remarks Tab: Only for Principal & Teacher */}
          {activeRole !== "student" && (
            <button
              type="button"
              onClick={() => {
                setActiveTab("remarks");
                setResultText(null);
              }}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition ${
                activeTab === "remarks"
                  ? "bg-gradient-to-r from-brand-600 to-indigo-600 text-white shadow-[0_0_15px_-2px_rgba(99,102,241,0.4)] font-bold"
                  : "text-slate-300 hover:text-white bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.08]"
              }`}
            >
              <span>📝</span>
              <span>Report Card Remarks</span>
            </button>
          )}

          {/* Quiz Tab: For All (Tailored label for Student) */}
          <button
            type="button"
            onClick={() => {
              setActiveTab("quiz");
              setResultText(null);
            }}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition ${
              activeTab === "quiz"
                ? "bg-gradient-to-r from-brand-600 to-indigo-600 text-white shadow-[0_0_15px_-2px_rgba(99,102,241,0.4)] font-bold"
                : "text-slate-300 hover:text-white bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.08]"
            }`}
          >
            <span>📋</span>
            <span>{activeRole === "student" ? "Practice Quizzes & Revision" : "Quiz & Assignment Maker"}</span>
          </button>

          {/* Notice Tab: Only for Principal & Teacher */}
          {activeRole !== "student" && (
            <button
              type="button"
              onClick={() => {
                setActiveTab("notice");
                setResultText(null);
              }}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition ${
                activeTab === "notice"
                  ? "bg-gradient-to-r from-brand-600 to-indigo-600 text-white shadow-[0_0_15px_-2px_rgba(99,102,241,0.4)] font-bold"
                  : "text-slate-300 hover:text-white bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.08]"
              }`}
            >
              <span>📢</span>
              <span>Circular &amp; Notice Drafter</span>
            </button>
          )}

          {/* Chat Tab: For All */}
          <button
            type="button"
            onClick={() => {
              setActiveTab("chat");
              setResultText(null);
            }}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition ${
              activeTab === "chat"
                ? "bg-gradient-to-r from-brand-600 to-indigo-600 text-white shadow-[0_0_15px_-2px_rgba(99,102,241,0.4)] font-bold"
                : "text-slate-300 hover:text-white bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.08]"
            }`}
          >
            <span>💬</span>
            <span>{activeRole === "student" ? "AI Study Tutor & Doubt Solver" : "Interactive AI Chat"}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab("settings");
              setResultText(null);
            }}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition ml-auto ${
              activeTab === "settings"
                ? "bg-gradient-to-r from-brand-600 to-indigo-600 text-white shadow-[0_0_15px_-2px_rgba(99,102,241,0.4)] font-bold"
                : "bg-white/[0.04] text-slate-200 hover:bg-white/[0.08] border border-white/[0.08]"
            }`}
          >
            <span>⚙️</span>
            <span>{activeRole === "student" ? "AI Settings & Key" : "Model & AI Settings"}</span>
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
            {/* 👑 Institutional License & School-Wide API Key Card */}
            {activeRole === "principal" ? (
              <>
                <div className="rounded-2xl border border-brand-500/30 bg-gradient-to-br from-slate-900 via-brand-950/30 to-slate-950 p-5 space-y-3.5 shadow-lg">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-500/20 text-brand-300 text-lg">
                          👑
                        </span>
                        <h4 className="text-sm font-bold text-white">
                          Principal Authority: School-Wide AI License Management
                        </h4>
                        <span className="rounded bg-brand-500/20 border border-brand-400/30 px-2 py-0.5 text-[10px] font-mono text-brand-300 font-semibold">
                          ADMIN AUTHORITY
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
                        As Principal, manage your school&apos;s AI keys below. All keys are securely stored on the server so <strong>Teachers and Students</strong> automatically inherit access without seeing or needing individual API keys.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleSaveSchoolApiKey}
                      disabled={savingInstitutional}
                      className="btn bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs shrink-0 shadow-lg transition flex items-center gap-2 px-4 py-2.5 rounded-xl border border-brand-400/40 disabled:opacity-50"
                    >
                      <span>💾</span>
                      <span>{savingInstitutional ? "Saving..." : "Save Active Config"}</span>
                    </button>
                  </div>

                  {saveSuccessMessage && (
                    <div className="rounded-xl bg-emerald-950/80 border border-emerald-500/60 p-3 text-xs text-emerald-200 font-medium flex items-center gap-2">
                      <span>✓</span>
                      <span>{saveSuccessMessage}</span>
                    </div>
                  )}

                  {institutionalConfig && (
                    <div className="pt-2 border-t border-white/10 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400">
                      <div className="flex items-center gap-2">
                        <span>Authority: <strong className="text-white">{institutionalConfig.configuredBy || "Dr. Anita Desai (Principal)"}</strong></span>
                        <span>•</span>
                        <span>Active Default Engine: <strong className="text-indigo-300 uppercase">{institutionalConfig.provider}</strong> ({institutionalConfig.modelName})</span>
                      </div>
                      {institutionalConfig.maskedKey && (
                        <div className="font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2.5 py-0.5 rounded">
                          Key: {institutionalConfig.maskedKey}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* 🔑 Principal Multi-Model API Keys Control Center (Add & Delete from GUI) */}
                <div className="rounded-2xl border border-slate-800 bg-slate-900/95 p-5 space-y-4 shadow-xl">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-800/80 pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-indigo-500/20 text-indigo-300 text-sm">
                          🔑
                        </span>
                        <h4 className="text-sm font-bold text-white">
                          Principal Multi-Model Key Manager (Add &amp; Delete from GUI)
                        </h4>
                        <span className="rounded bg-indigo-500/20 border border-indigo-400/30 px-2 py-0.5 text-[10px] font-mono text-indigo-300 font-semibold">
                          GUI CONTROLS
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 mt-1">
                        Add, update, or delete school API keys for <strong>Google Gemini</strong>, <strong>OpenAI ChatGPT</strong>, and <strong>Anthropic Claude</strong>. Clicking <strong>Delete</strong> immediately removes access for that specific model.
                      </p>
                    </div>
                    <span className="text-[11px] font-mono text-slate-400 shrink-0">
                      Status: <strong className="text-emerald-400">{institutionalConfig?.isConfigured ? "Keys Configured" : "No Keys Set"}</strong>
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                    {/* 1. Google Gemini Card */}
                    {(() => {
                      const status = getProviderStatus("gemini");
                      const isBusy = keyActionLoading["gemini"];
                      return (
                        <div className="rounded-xl border border-blue-500/30 bg-blue-950/20 p-3.5 flex flex-col justify-between space-y-3">
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                                <span>🔵</span> Google Gemini
                              </span>
                              <span className="rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-mono text-blue-400">
                                1M–2M Context
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-400">Gemini 1.5 Flash &amp; Pro</div>
                            <div className="pt-1">
                              {status.configured ? (
                                <div className="inline-flex items-center gap-1.5 rounded-md bg-emerald-950/80 border border-emerald-500/40 px-2 py-1 text-[11px] font-mono text-emerald-300 w-full justify-between">
                                  <span className="flex items-center gap-1.5 truncate">
                                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shrink-0"></span>
                                    <span className="truncate">{status.maskedKey || "Configured"}</span>
                                  </span>
                                  <span className="text-[10px] text-emerald-400 font-sans shrink-0">✓ Active</span>
                                </div>
                              ) : (
                                <div className="inline-flex items-center gap-1.5 rounded-md bg-slate-950/80 border border-slate-800 px-2 py-1 text-[11px] font-mono text-slate-400 w-full">
                                  <span className="h-1.5 w-1.5 rounded-full bg-slate-500 shrink-0"></span>
                                  <span>Not Configured</span>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="space-y-2 pt-1">
                            <input
                              type="password"
                              className="input text-xs font-mono w-full"
                              placeholder={status.configured ? "Paste new key to replace..." : "Paste AIzaSy... key"}
                              value={providerKeyInputs.gemini || ""}
                              onChange={(e) =>
                                setProviderKeyInputs((prev) => ({ ...prev, gemini: e.target.value }))
                              }
                            />
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                disabled={isBusy || !providerKeyInputs.gemini?.trim()}
                                onClick={() => handleSaveProviderKey("gemini")}
                                className="btn bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs flex-1 py-1.5 rounded-lg disabled:opacity-40 transition"
                              >
                                {isBusy ? "Saving..." : status.configured ? "Update Key" : "Add Key"}
                              </button>
                              {status.configured && (
                                <button
                                  type="button"
                                  disabled={isBusy}
                                  onClick={() => handleDeleteProviderKey("gemini")}
                                  title="Delete Gemini API Key"
                                  className="btn bg-rose-950/60 hover:bg-rose-900 border border-rose-700/60 text-rose-300 font-semibold text-xs px-2.5 py-1.5 rounded-lg disabled:opacity-40 transition flex items-center gap-1 shrink-0"
                                >
                                  <svg className="w-3.5 h-3.5 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                  <span>Delete</span>
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })()}

                    {/* 2. OpenAI ChatGPT Card */}
                    {(() => {
                      const status = getProviderStatus("openai");
                      const isBusy = keyActionLoading["openai"];
                      return (
                        <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-3.5 flex flex-col justify-between space-y-3">
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                                <span>🟢</span> OpenAI ChatGPT
                              </span>
                              <span className="rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-mono text-emerald-400">
                                128K Context
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-400">GPT-4o &amp; GPT-4o-mini</div>
                            <div className="pt-1">
                              {status.configured ? (
                                <div className="inline-flex items-center gap-1.5 rounded-md bg-emerald-950/80 border border-emerald-500/40 px-2 py-1 text-[11px] font-mono text-emerald-300 w-full justify-between">
                                  <span className="flex items-center gap-1.5 truncate">
                                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shrink-0"></span>
                                    <span className="truncate">{status.maskedKey || "Configured"}</span>
                                  </span>
                                  <span className="text-[10px] text-emerald-400 font-sans shrink-0">✓ Active</span>
                                </div>
                              ) : (
                                <div className="inline-flex items-center gap-1.5 rounded-md bg-slate-950/80 border border-slate-800 px-2 py-1 text-[11px] font-mono text-slate-400 w-full">
                                  <span className="h-1.5 w-1.5 rounded-full bg-slate-500 shrink-0"></span>
                                  <span>Not Configured</span>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="space-y-2 pt-1">
                            <input
                              type="password"
                              className="input text-xs font-mono w-full"
                              placeholder={status.configured ? "Paste new key to replace..." : "Paste sk-proj-... key"}
                              value={providerKeyInputs.openai || ""}
                              onChange={(e) =>
                                setProviderKeyInputs((prev) => ({ ...prev, openai: e.target.value }))
                              }
                            />
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                disabled={isBusy || !providerKeyInputs.openai?.trim()}
                                onClick={() => handleSaveProviderKey("openai")}
                                className="btn bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex-1 py-1.5 rounded-lg disabled:opacity-40 transition"
                              >
                                {isBusy ? "Saving..." : status.configured ? "Update Key" : "Add Key"}
                              </button>
                              {status.configured && (
                                <button
                                  type="button"
                                  disabled={isBusy}
                                  onClick={() => handleDeleteProviderKey("openai")}
                                  title="Delete OpenAI API Key"
                                  className="btn bg-rose-950/60 hover:bg-rose-900 border border-rose-700/60 text-rose-300 font-semibold text-xs px-2.5 py-1.5 rounded-lg disabled:opacity-40 transition flex items-center gap-1 shrink-0"
                                >
                                  <svg className="w-3.5 h-3.5 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                  <span>Delete</span>
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })()}

                    {/* 3. Anthropic Claude Card */}
                    {(() => {
                      const status = getProviderStatus("claude");
                      const isBusy = keyActionLoading["claude"];
                      return (
                        <div className="rounded-xl border border-purple-500/30 bg-purple-950/20 p-3.5 flex flex-col justify-between space-y-3">
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                                <span>🟣</span> Anthropic Claude
                              </span>
                              <span className="rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-mono text-purple-400">
                                200K Context
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-400">Claude 3.5 Sonnet &amp; Haiku</div>
                            <div className="pt-1">
                              {status.configured ? (
                                <div className="inline-flex items-center gap-1.5 rounded-md bg-emerald-950/80 border border-emerald-500/40 px-2 py-1 text-[11px] font-mono text-emerald-300 w-full justify-between">
                                  <span className="flex items-center gap-1.5 truncate">
                                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shrink-0"></span>
                                    <span className="truncate">{status.maskedKey || "Configured"}</span>
                                  </span>
                                  <span className="text-[10px] text-emerald-400 font-sans shrink-0">✓ Active</span>
                                </div>
                              ) : (
                                <div className="inline-flex items-center gap-1.5 rounded-md bg-slate-950/80 border border-slate-800 px-2 py-1 text-[11px] font-mono text-slate-400 w-full">
                                  <span className="h-1.5 w-1.5 rounded-full bg-slate-500 shrink-0"></span>
                                  <span>Not Configured</span>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="space-y-2 pt-1">
                            <input
                              type="password"
                              className="input text-xs font-mono w-full"
                              placeholder={status.configured ? "Paste new key to replace..." : "Paste sk-ant-... key"}
                              value={providerKeyInputs.claude || ""}
                              onChange={(e) =>
                                setProviderKeyInputs((prev) => ({ ...prev, claude: e.target.value }))
                              }
                            />
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                disabled={isBusy || !providerKeyInputs.claude?.trim()}
                                onClick={() => handleSaveProviderKey("claude")}
                                className="btn bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs flex-1 py-1.5 rounded-lg disabled:opacity-40 transition"
                              >
                                {isBusy ? "Saving..." : status.configured ? "Update Key" : "Add Key"}
                              </button>
                              {status.configured && (
                                <button
                                  type="button"
                                  disabled={isBusy}
                                  onClick={() => handleDeleteProviderKey("claude")}
                                  title="Delete Claude API Key"
                                  className="btn bg-rose-950/60 hover:bg-rose-900 border border-rose-700/60 text-rose-300 font-semibold text-xs px-2.5 py-1.5 rounded-lg disabled:opacity-40 transition flex items-center gap-1 shrink-0"
                                >
                                  <svg className="w-3.5 h-3.5 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                  <span>Delete</span>
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </>
            ) : activeRole === "student" ? (
              <div className="rounded-2xl border border-emerald-500/40 bg-gradient-to-br from-emerald-950/40 via-slate-900 to-slate-950 p-5 space-y-3 shadow-lg">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-300 text-lg">
                        🎓
                      </span>
                      <h4 className="text-sm font-bold text-emerald-200">
                        Student Learning Authority &amp; AI License
                      </h4>
                      <span className="rounded bg-emerald-500/20 border border-emerald-400/30 px-2 py-0.5 text-[10px] font-mono text-emerald-300 font-semibold">
                        STUDENT AUTHORIZED
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
                      You are logged in as a <strong>Student</strong>. You have full authority to practice quizzes, consult the AI Study Tutor, and choose AI models. You automatically inherit the <strong>Principal&apos;s School License</strong> for free access, or you can optionally configure your <strong>own personal API key</strong> below if you want your own private quota.
                    </p>
                  </div>

                  <div className="rounded-xl bg-black/50 border border-emerald-400/30 px-3.5 py-2 text-center shrink-0">
                    <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Your AI Access</div>
                    <div className="text-xs font-bold text-emerald-300 mt-0.5 flex items-center justify-center gap-1">
                      <span>✓</span> Free &amp; Unrestricted
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-white/10 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400">
                  <div className="flex items-center gap-2">
                    <span>Active Engine: <strong className="text-white">{settings.provider.toUpperCase()} ({settings.modelName})</strong></span>
                    <span>•</span>
                    <span>School License: <strong className="text-slate-200">{institutionalConfig?.configuredBy || "Principal"}</strong></span>
                  </div>
                  <div className="font-mono text-slate-300 bg-slate-900 border border-slate-700 px-2.5 py-0.5 rounded flex items-center gap-1.5">
                    <span>🔒</span>
                    <span>{settings.apiKey ? "Personal Key Active" : (institutionalConfig?.maskedKey || "School License Active")}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-indigo-500/40 bg-gradient-to-br from-indigo-950/40 via-slate-900 to-slate-950 p-5 space-y-3 shadow-lg">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-500/20 text-indigo-300 text-lg">
                        👨‍🏫
                      </span>
                      <h4 className="text-sm font-bold text-indigo-200">
                        School-Wide AI License Inherited (Teacher Mode)
                      </h4>
                      <span className="rounded bg-emerald-500/20 border border-emerald-400/30 px-2 py-0.5 text-[10px] font-mono text-emerald-300 font-semibold">
                        PROTECTED LICENSE
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
                      You are logged in as a <strong>Teacher</strong>. Your AI requests automatically use the school license configured centrally by the Principal (<strong>Dr. Anita Desai</strong>). You have full access to generate student remarks, quizzes, notices, and chat without buying or entering an API key.
                    </p>
                  </div>

                  <div className="rounded-xl bg-black/50 border border-indigo-400/30 px-3.5 py-2 text-center shrink-0">
                    <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Your AI Status</div>
                    <div className="text-xs font-bold text-emerald-300 mt-0.5 flex items-center justify-center gap-1">
                      <span>✓</span> Active &amp; Covered
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-white/10 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400">
                  <div className="flex items-center gap-2">
                    <span>Active Engine: <strong className="text-white">{settings.provider.toUpperCase()} ({settings.modelName})</strong></span>
                    <span>•</span>
                    <span>License Managed by: <strong className="text-slate-200">{institutionalConfig?.configuredBy || "Principal"}</strong></span>
                  </div>
                  <div className="font-mono text-slate-300 bg-slate-900 border border-slate-700 px-2.5 py-0.5 rounded flex items-center gap-1.5">
                    <span>🔒</span>
                    <span>{institutionalConfig?.maskedKey || "sk-•••••••••••••••• (Protected)"}</span>
                  </div>
                </div>
              </div>
            )}

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
                      ? "border-brand-500/60 bg-slate-800/80 ring-2 ring-brand-500/30"
                      : "border-slate-800 bg-slate-950/60 hover:bg-slate-800/50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <span>⚡</span> Sir&apos;s Custom Endpoint
                    </span>
                    <span className="rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-mono text-slate-300">
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
                      <option value="gpt-4o-mini">gpt-4o-mini (Fast &amp; Efficient - 128K)</option>
                    </select>
                  </div>
                  <div>
                    <div className="flex items-center justify-between">
                      <label className="label text-xs">OpenAI API Key</label>
                      {activeRole === "principal" ? (
                        <span className="text-[10px] text-brand-300 font-semibold">👑 Principal School Key</span>
                      ) : activeRole === "student" ? (
                        <span className="text-[10px] text-emerald-400 font-semibold">🎓 Student Personal Key (Optional)</span>
                      ) : (
                        <span className="text-[10px] text-slate-400 font-medium">🔒 Inherited from Principal</span>
                      )}
                    </div>
                    {activeRole === "principal" || activeRole === "student" ? (
                      <input
                        type="password"
                        className="input text-xs font-mono"
                        value={settings.apiKey}
                        onChange={(e) => saveSettings({ ...settings, apiKey: e.target.value })}
                        placeholder={activeRole === "principal" ? "sk-proj-..." : "Optional: paste personal sk-proj- key, or leave blank to use school key"}
                      />
                    ) : (
                      <input
                        type="text"
                        disabled
                        className="input text-xs font-mono bg-slate-900/80 text-slate-400 cursor-not-allowed border-dashed"
                        value={institutionalConfig?.maskedKey || "sk-•••••••••••••••• (Managed by Principal)"}
                      />
                    )}
                    {activeRole === "principal" && (
                      <div className="mt-2 space-y-1.5">
                        <div className="flex items-center justify-between gap-2">
                          {getProviderStatus("openai").configured ? (
                            <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1.5">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                              Active: {getProviderStatus("openai").maskedKey}
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-400">No key configured</span>
                          )}
                          <div className="flex items-center gap-2">
                            {settings.apiKey && (
                              <button
                                type="button"
                                disabled={keyActionLoading["openai"]}
                                onClick={() => handleSaveProviderKey("openai", settings.apiKey)}
                                className="text-[11px] font-semibold text-emerald-300 hover:text-emerald-200 bg-emerald-950/60 border border-emerald-800/60 px-2.5 py-1 rounded-lg transition"
                              >
                                {keyActionLoading["openai"] ? "Saving..." : "💾 Save Key"}
                              </button>
                            )}
                            {getProviderStatus("openai").configured && (
                              <button
                                type="button"
                                disabled={keyActionLoading["openai"]}
                                onClick={() => handleDeleteProviderKey("openai")}
                                className="text-[11px] font-semibold text-rose-300 hover:text-rose-200 bg-rose-950/60 border border-rose-800/60 px-2.5 py-1 rounded-lg transition flex items-center gap-1"
                              >
                                <span>🗑️</span>
                                <span>Delete Key</span>
                              </button>
                            )}
                          </div>
                        </div>
                        <p className="text-[10px] text-slate-400">
                          Principal can add or delete this key anytime. Deletion removes OpenAI for the school.
                        </p>
                      </div>
                    )}
                    {activeRole === "student" && (
                      <p className="text-[10px] text-emerald-400/80 mt-1">
                        {settings.apiKey ? "✓ Using your custom student API key." : "✓ Using Principal's school key. You can leave this blank."}
                      </p>
                    )}
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
                    <div className="flex items-center justify-between">
                      <label className="label text-xs">Anthropic API Key</label>
                      {activeRole === "principal" ? (
                        <span className="text-[10px] text-brand-300 font-semibold">👑 Principal School Key</span>
                      ) : activeRole === "student" ? (
                        <span className="text-[10px] text-emerald-400 font-semibold">🎓 Student Personal Key (Optional)</span>
                      ) : (
                        <span className="text-[10px] text-slate-400 font-medium">🔒 Inherited from Principal</span>
                      )}
                    </div>
                    {activeRole === "principal" || activeRole === "student" ? (
                      <input
                        type="password"
                        className="input text-xs font-mono"
                        value={settings.apiKey}
                        onChange={(e) => saveSettings({ ...settings, apiKey: e.target.value })}
                        placeholder={activeRole === "principal" ? "sk-ant-api03-..." : "Optional: paste personal sk-ant- key, or leave blank to use school key"}
                      />
                    ) : (
                      <input
                        type="text"
                        disabled
                        className="input text-xs font-mono bg-slate-900/80 text-slate-400 cursor-not-allowed border-dashed"
                        value={institutionalConfig?.maskedKey || "sk-•••••••••••••••• (Managed by Principal)"}
                      />
                    )}
                    {activeRole === "principal" && (
                      <div className="mt-2 space-y-1.5">
                        <div className="flex items-center justify-between gap-2">
                          {getProviderStatus("claude").configured ? (
                            <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1.5">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                              Active: {getProviderStatus("claude").maskedKey}
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-400">No key configured</span>
                          )}
                          <div className="flex items-center gap-2">
                            {settings.apiKey && (
                              <button
                                type="button"
                                disabled={keyActionLoading["claude"]}
                                onClick={() => handleSaveProviderKey("claude", settings.apiKey)}
                                className="text-[11px] font-semibold text-purple-300 hover:text-purple-200 bg-purple-950/60 border border-purple-800/60 px-2.5 py-1 rounded-lg transition"
                              >
                                {keyActionLoading["claude"] ? "Saving..." : "💾 Save Key"}
                              </button>
                            )}
                            {getProviderStatus("claude").configured && (
                              <button
                                type="button"
                                disabled={keyActionLoading["claude"]}
                                onClick={() => handleDeleteProviderKey("claude")}
                                className="text-[11px] font-semibold text-rose-300 hover:text-rose-200 bg-rose-950/60 border border-rose-800/60 px-2.5 py-1 rounded-lg transition flex items-center gap-1"
                              >
                                <span>🗑️</span>
                                <span>Delete Key</span>
                              </button>
                            )}
                          </div>
                        </div>
                        <p className="text-[10px] text-slate-400">
                          Principal can add or delete this key anytime. Deletion removes Claude for the school.
                        </p>
                      </div>
                    )}
                    {activeRole === "student" && (
                      <p className="text-[10px] text-emerald-400/80 mt-1">
                        {settings.apiKey ? "✓ Using your custom student API key." : "✓ Using Principal's school key. You can leave this blank."}
                      </p>
                    )}
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
                      <option value="gemini-1.5-flash">gemini-1.5-flash (Fast &amp; 1M Window)</option>
                      <option value="gemini-1.5-pro">gemini-1.5-pro (Deep Reasoning &amp; 2M Window)</option>
                    </select>
                  </div>
                  <div>
                    <div className="flex items-center justify-between">
                      <label className="label text-xs">Google Gemini API Key</label>
                      {activeRole === "principal" ? (
                        <span className="text-[10px] text-brand-300 font-semibold">👑 Principal School Key</span>
                      ) : activeRole === "student" ? (
                        <span className="text-[10px] text-emerald-400 font-semibold">🎓 Student Personal Key (Optional)</span>
                      ) : (
                        <span className="text-[10px] text-slate-400 font-medium">🔒 Inherited from Principal</span>
                      )}
                    </div>
                    {activeRole === "principal" || activeRole === "student" ? (
                      <input
                        type="password"
                        className="input text-xs font-mono"
                        value={settings.apiKey}
                        onChange={(e) => saveSettings({ ...settings, apiKey: e.target.value })}
                        placeholder={activeRole === "principal" ? "AIzaSy..." : "Optional: paste personal Gemini key, or leave blank to use school key"}
                      />
                    ) : (
                      <input
                        type="text"
                        disabled
                        className="input text-xs font-mono bg-slate-900/80 text-slate-400 cursor-not-allowed border-dashed"
                        value={institutionalConfig?.maskedKey || "AIza•••••••••••• (Managed by Principal)"}
                      />
                    )}
                    {activeRole === "principal" && (
                      <div className="mt-2 space-y-1.5">
                        <div className="flex items-center justify-between gap-2">
                          {getProviderStatus("gemini").configured ? (
                            <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1.5">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                              Active: {getProviderStatus("gemini").maskedKey}
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-400">No key configured</span>
                          )}
                          <div className="flex items-center gap-2">
                            {settings.apiKey && (
                              <button
                                type="button"
                                disabled={keyActionLoading["gemini"]}
                                onClick={() => handleSaveProviderKey("gemini", settings.apiKey)}
                                className="text-[11px] font-semibold text-blue-300 hover:text-blue-200 bg-blue-950/60 border border-blue-800/60 px-2.5 py-1 rounded-lg transition"
                              >
                                {keyActionLoading["gemini"] ? "Saving..." : "💾 Save Key"}
                              </button>
                            )}
                            {getProviderStatus("gemini").configured && (
                              <button
                                type="button"
                                disabled={keyActionLoading["gemini"]}
                                onClick={() => handleDeleteProviderKey("gemini")}
                                className="text-[11px] font-semibold text-rose-300 hover:text-rose-200 bg-rose-950/60 border border-rose-800/60 px-2.5 py-1 rounded-lg transition flex items-center gap-1"
                              >
                                <span>🗑️</span>
                                <span>Delete Key</span>
                              </button>
                            )}
                          </div>
                        </div>
                        <p className="text-[10px] text-slate-400">
                          Principal can add or delete this key anytime. Deletion removes Gemini for the school.
                        </p>
                      </div>
                    )}
                    {activeRole === "student" && (
                      <p className="text-[10px] text-emerald-400/80 mt-1">
                        {settings.apiKey ? "✓ Using your custom student API key." : "✓ Using Principal's school key. You can leave this blank."}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Custom Model Config */}
              {settings.provider === "custom" && (
                <div className="space-y-3">
                  {/* Quick Local Model Presets */}
                  <div className="flex flex-wrap items-center gap-1.5 pb-1">
                    <span className="text-[11px] text-slate-400 mr-1">Quick Local Presets:</span>
                    <button
                      type="button"
                      onClick={() => saveSettings({ ...settings, modelName: "qwen-0.6b", baseUrl: "http://localhost:11434/v1" })}
                      className={`text-[10px] px-2.5 py-1 rounded-lg border font-semibold transition ${
                        settings.modelName === "qwen-0.6b" || settings.modelName === "qwen3-0.6b"
                          ? "bg-teal-500/20 text-teal-300 border-teal-500/40 shadow-sm"
                          : "bg-white/[0.04] text-slate-300 border-white/[0.08] hover:bg-white/[0.08]"
                      }`}
                    >
                      ⚡ Qwen 0.6B (Sir&apos;s Pick)
                    </button>
                    <button
                      type="button"
                      onClick={() => saveSettings({ ...settings, modelName: "llama3", baseUrl: "http://localhost:11434/v1" })}
                      className={`text-[10px] px-2.5 py-1 rounded-lg border font-semibold transition ${
                        settings.modelName === "llama3"
                          ? "bg-indigo-500/20 text-indigo-300 border-indigo-500/40 shadow-sm"
                          : "bg-white/[0.04] text-slate-300 border-white/[0.08] hover:bg-white/[0.08]"
                      }`}
                    >
                      LLaMA 3 (8B)
                    </button>
                    <button
                      type="button"
                      onClick={() => saveSettings({ ...settings, modelName: "mistral", baseUrl: "http://localhost:11434/v1" })}
                      className={`text-[10px] px-2.5 py-1 rounded-lg border font-semibold transition ${
                        settings.modelName === "mistral"
                          ? "bg-indigo-500/20 text-indigo-300 border-indigo-500/40 shadow-sm"
                          : "bg-white/[0.04] text-slate-300 border-white/[0.08] hover:bg-white/[0.08]"
                      }`}
                    >
                      Mistral 7B
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="label text-xs">Model Name *</label>
                      <input
                        className="input text-xs font-mono"
                        value={settings.modelName}
                        onChange={(e) => saveSettings({ ...settings, modelName: e.target.value })}
                        placeholder="e.g. qwen-0.6b, llama3, mistral"
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
                    <div className="flex items-center justify-between">
                      <label className="label text-xs">API Key (Optional for local Ollama / LM Studio)</label>
                      {activeRole === "principal" ? (
                        <span className="text-[10px] text-brand-300 font-semibold">👑 Principal School Key</span>
                      ) : activeRole === "student" ? (
                        <span className="text-[10px] text-emerald-400 font-semibold">🎓 Student Personal Key (Optional)</span>
                      ) : (
                        <span className="text-[10px] text-slate-400 font-medium">🔒 Inherited from Principal</span>
                      )}
                    </div>
                    {activeRole === "principal" || activeRole === "student" ? (
                      <input
                        type="password"
                        className="input text-xs font-mono"
                        value={settings.apiKey}
                        onChange={(e) => saveSettings({ ...settings, apiKey: e.target.value })}
                        placeholder="Optional server bearer token"
                      />
                    ) : (
                      <input
                        type="text"
                        disabled
                        className="input text-xs font-mono bg-slate-900/80 text-slate-400 cursor-not-allowed border-dashed"
                        value={institutionalConfig?.maskedKey || "None required / Protected"}
                      />
                    )}
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
                    : "border border-rose-800/80 bg-rose-950/60 text-rose-200"
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
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-white flex items-center gap-1.5">
                      <span>{activeRole === "student" ? "📚" : "📋"}</span>
                      <span>{activeRole === "student" ? "Practice Quiz & Self-Assessment" : "Smart Quiz & Assignment Generator"}</span>
                    </h3>
                    {activeRole === "student" && (
                      <span className="rounded bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-2 py-0.5 text-[10px] font-bold">
                        STUDENT LEARNING MODE
                      </span>
                    )}
                  </div>
                  <div>
                    <label className="label text-xs">Subject</label>
                    <select
                      className="input text-xs"
                      value={quizSubject}
                      onChange={(e) => {
                        const nextSubject = e.target.value;
                        setQuizSubject(nextSubject);
                        if (nextSubject === "Mathematics") {
                          setQuizTopic("Probability (Class 8)");
                        } else if (nextSubject === "Science") {
                          setQuizTopic("Cell Structure & Photosynthesis");
                        } else if (nextSubject === "Computer Science") {
                          setQuizTopic("Arrays & Linked Lists");
                        } else if (nextSubject === "English") {
                          setQuizTopic("Active & Passive Voice");
                        } else if (nextSubject === "History") {
                          setQuizTopic("Indian National Movement (1857–1947)");
                        } else if (nextSubject === "Geography") {
                          setQuizTopic("Earth's Climate Zones & Resources");
                        }
                      }}
                    >
                      <option value="Mathematics">Mathematics</option>
                      <option value="Science">Science</option>
                      <option value="Computer Science">Computer Science (Data Structures)</option>
                      <option value="English">English</option>
                      <option value="History">History</option>
                      <option value="Geography">Geography</option>
                    </select>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="label text-xs m-0 p-0">Lesson / Topic</label>
                      <span className="text-[10px] text-slate-400 font-mono">Select or type custom</span>
                    </div>
                    <input
                      className="input text-xs font-medium"
                      value={quizTopic}
                      onChange={(e) => setQuizTopic(e.target.value)}
                      placeholder={
                        quizSubject === "Mathematics"
                          ? "e.g. Probability (Class 8), Linear Equations, Mensuration & Surface Area"
                          : quizSubject === "Science"
                          ? "e.g. Cell Structure & Photosynthesis, Force & Motion, Chemical Reactions"
                          : quizSubject === "English"
                          ? "e.g. Active & Passive Voice, Reading Comprehension"
                          : quizSubject === "History" || quizSubject === "Geography"
                          ? "e.g. Indian National Movement, Earth's Climate Zones"
                          : "e.g. Arrays & Linked Lists, Trees & Graphs, Stacks & Queues"
                      }
                      required
                    />

                    {/* Quick Topic Chips - Filtered for Active Subject */}
                    <div className="flex flex-wrap items-center gap-1.5 mt-2">
                      <span className="text-[10px] text-slate-400 font-semibold mr-0.5">Quick Pick:</span>
                      {quizSubject === "Mathematics" ? (
                        <>
                          <button
                            type="button"
                            onClick={() => setQuizTopic("Probability (Class 8)")}
                            className={`px-2 py-0.5 rounded text-[10px] border transition ${
                              quizTopic === "Probability (Class 8)"
                                ? "bg-indigo-600 border-indigo-400 text-white font-bold"
                                : "bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800"
                            }`}
                          >
                            🎲 Probability (Class 8)
                          </button>
                          <button
                            type="button"
                            onClick={() => setQuizTopic("Linear Equations in One Variable")}
                            className={`px-2 py-0.5 rounded text-[10px] border transition ${
                              quizTopic === "Linear Equations in One Variable"
                                ? "bg-indigo-600 border-indigo-400 text-white font-bold"
                                : "bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800"
                            }`}
                          >
                            📐 Linear Equations
                          </button>
                          <button
                            type="button"
                            onClick={() => setQuizTopic("Mensuration & Surface Area")}
                            className={`px-2 py-0.5 rounded text-[10px] border transition ${
                              quizTopic === "Mensuration & Surface Area"
                                ? "bg-indigo-600 border-indigo-400 text-white font-bold"
                                : "bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800"
                            }`}
                          >
                            📏 Mensuration &amp; Area
                          </button>
                          <button
                            type="button"
                            onClick={() => setQuizTopic("Exponents & Square Roots")}
                            className={`px-2 py-0.5 rounded text-[10px] border transition ${
                              quizTopic === "Exponents & Square Roots"
                                ? "bg-indigo-600 border-indigo-400 text-white font-bold"
                                : "bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800"
                            }`}
                          >
                            🔢 Square Roots &amp; Exponents
                          </button>
                        </>
                      ) : quizSubject === "Science" ? (
                        <>
                          <button
                            type="button"
                            onClick={() => setQuizTopic("Cell Structure & Photosynthesis")}
                            className={`px-2 py-0.5 rounded text-[10px] border transition ${
                              quizTopic === "Cell Structure & Photosynthesis"
                                ? "bg-indigo-600 border-indigo-400 text-white font-bold"
                                : "bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800"
                            }`}
                          >
                            🔬 Cell Structure &amp; Photosynthesis
                          </button>
                          <button
                            type="button"
                            onClick={() => setQuizTopic("Force, Motion & Newton's Laws")}
                            className={`px-2 py-0.5 rounded text-[10px] border transition ${
                              quizTopic === "Force, Motion & Newton's Laws"
                                ? "bg-indigo-600 border-indigo-400 text-white font-bold"
                                : "bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800"
                            }`}
                          >
                            ⚡ Force &amp; Motion
                          </button>
                          <button
                            type="button"
                            onClick={() => setQuizTopic("Acids, Bases & Chemical Reactions")}
                            className={`px-2 py-0.5 rounded text-[10px] border transition ${
                              quizTopic === "Acids, Bases & Chemical Reactions"
                                ? "bg-indigo-600 border-indigo-400 text-white font-bold"
                                : "bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800"
                            }`}
                          >
                            🧪 Chemical Reactions
                          </button>
                        </>
                      ) : quizSubject === "English" ? (
                        <>
                          <button
                            type="button"
                            onClick={() => setQuizTopic("Active & Passive Voice")}
                            className={`px-2 py-0.5 rounded text-[10px] border transition ${
                              quizTopic === "Active & Passive Voice"
                                ? "bg-indigo-600 border-indigo-400 text-white font-bold"
                                : "bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800"
                            }`}
                          >
                            ✍️ Active &amp; Passive Voice
                          </button>
                          <button
                            type="button"
                            onClick={() => setQuizTopic("Reading Comprehension & Inferences")}
                            className={`px-2 py-0.5 rounded text-[10px] border transition ${
                              quizTopic === "Reading Comprehension & Inferences"
                                ? "bg-indigo-600 border-indigo-400 text-white font-bold"
                                : "bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800"
                            }`}
                          >
                            📖 Reading Comprehension
                          </button>
                          <button
                            type="button"
                            onClick={() => setQuizTopic("Direct and Indirect Speech")}
                            className={`px-2 py-0.5 rounded text-[10px] border transition ${
                              quizTopic === "Direct and Indirect Speech"
                                ? "bg-indigo-600 border-indigo-400 text-white font-bold"
                                : "bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800"
                            }`}
                          >
                            💬 Reported Speech
                          </button>
                        </>
                      ) : quizSubject === "History" || quizSubject === "Geography" ? (
                        <>
                          <button
                            type="button"
                            onClick={() => setQuizTopic("Indian National Movement (1857–1947)")}
                            className={`px-2 py-0.5 rounded text-[10px] border transition ${
                              quizTopic === "Indian National Movement (1857–1947)"
                                ? "bg-indigo-600 border-indigo-400 text-white font-bold"
                                : "bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800"
                            }`}
                          >
                            🏛️ Indian National Movement
                          </button>
                          <button
                            type="button"
                            onClick={() => setQuizTopic("The Indian Constitution & Democracy")}
                            className={`px-2 py-0.5 rounded text-[10px] border transition ${
                              quizTopic === "The Indian Constitution & Democracy"
                                ? "bg-indigo-600 border-indigo-400 text-white font-bold"
                                : "bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800"
                            }`}
                          >
                            📜 Indian Constitution
                          </button>
                          <button
                            type="button"
                            onClick={() => setQuizTopic("Earth's Climate Zones & Resources")}
                            className={`px-2 py-0.5 rounded text-[10px] border transition ${
                              quizTopic === "Earth's Climate Zones & Resources"
                                ? "bg-indigo-600 border-indigo-400 text-white font-bold"
                                : "bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800"
                            }`}
                          >
                            🌍 Climate &amp; Resources
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => setQuizTopic("Arrays & Linked Lists")}
                            className={`px-2 py-0.5 rounded text-[10px] border transition ${
                              quizTopic === "Arrays & Linked Lists"
                                ? "bg-indigo-600 border-indigo-400 text-white font-bold"
                                : "bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800"
                            }`}
                          >
                            🔗 Arrays &amp; Linked Lists
                          </button>
                          <button
                            type="button"
                            onClick={() => setQuizTopic("Trees & Graphs")}
                            className={`px-2 py-0.5 rounded text-[10px] border transition ${
                              quizTopic === "Trees & Graphs"
                                ? "bg-indigo-600 border-indigo-400 text-white font-bold"
                                : "bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800"
                            }`}
                          >
                            🌲 Trees &amp; Graphs
                          </button>
                          <button
                            type="button"
                            onClick={() => setQuizTopic("Stacks & Queues")}
                            className={`px-2 py-0.5 rounded text-[10px] border transition ${
                              quizTopic === "Stacks & Queues"
                                ? "bg-indigo-600 border-indigo-400 text-white font-bold"
                                : "bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800"
                            }`}
                          >
                            📚 Stacks &amp; Queues
                          </button>
                        </>
                      )}
                    </div>
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
                        <option value={3}>3 Questions (Quick Practice)</option>
                        <option value={5}>5 Questions (Standard Practice)</option>
                        <option value={10}>10 Questions (Complete Test)</option>
                      </select>
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn bg-brand-600 text-white w-full text-xs font-semibold hover:bg-brand-700 disabled:opacity-50"
                  >
                    {loading
                      ? `Generating with ${activeSpec.name}...`
                      : activeRole === "student"
                      ? `⚡ Generate My Practice Quiz & Solutions`
                      : `⚡ Generate Quiz with Answer Key`}
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
                  placeholder={
                    activeRole === "student"
                      ? "Ask your AI Study Tutor about Data Structures, coding, science, or math..."
                      : "Ask about school policies, student performance, grading schemes..."
                  }
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
                {activeRole === "student" ? (
                  <>
                    <button
                      type="button"
                      onClick={() =>
                        setChatInput("Explain difference between Array and Linked List in simple terms")
                      }
                      className="rounded bg-slate-900 border border-slate-800 px-2 py-0.5 text-[10px] text-slate-300 hover:border-brand-500 hover:text-white transition-colors"
                    >
                      🔗 Array vs Linked List
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setChatInput("How does Breadth-First Search (BFS) traverse a Graph?")
                      }
                      className="rounded bg-slate-900 border border-slate-800 px-2 py-0.5 text-[10px] text-slate-300 hover:border-brand-500 hover:text-white transition-colors"
                    >
                      🌲 Graph BFS Traversal
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setChatInput("Explain the photosynthesis light and dark reaction stages")
                      }
                      className="rounded bg-slate-900 border border-slate-800 px-2 py-0.5 text-[10px] text-slate-300 hover:border-brand-500 hover:text-white transition-colors"
                    >
                      🔬 Photosynthesis stages
                    </button>
                  </>
                ) : (
                  <>
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
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
