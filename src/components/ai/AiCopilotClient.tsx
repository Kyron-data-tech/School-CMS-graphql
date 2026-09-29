"use client";

import { useState, useEffect } from "react";

export interface StudentSummary {
  id: string;
  name: string;
  className: string;
}

export interface ModelSettings {
  provider: "gemini" | "custom" | "openai" | "builtin";
  modelName: string;
  baseUrl: string;
  apiKey: string;
  temperature: number;
  customSystemPrompt: string;
}

const DEFAULT_SETTINGS: ModelSettings = {
  provider: "builtin",
  modelName: "academic-domain-v1",
  baseUrl: "http://localhost:11434/v1",
  apiKey: "",
  temperature: 0.7,
  customSystemPrompt: "You are the expert AI Academic Counsellor at Greenfield International School. Be motivating, precise, and supportive.",
};

export function AiCopilotClient({ students = [] }: { students?: StudentSummary[] }) {
  const [activeTab, setActiveTab] = useState<"remarks" | "quiz" | "notice" | "chat" | "settings">("remarks");
  const [loading, setLoading] = useState(false);
  const [resultText, setResultText] = useState<string | null>(null);
  const [providerUsed, setProviderUsed] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Model Settings State
  const [settings, setSettings] = useState<ModelSettings>(DEFAULT_SETTINGS);
  const [testingConnection, setTestingConnection] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; latencyMs?: number } | null>(null);

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
  const [chatMessages, setChatMessages] = useState<Array<{ sender: "user" | "ai"; text: string }>>([
    {
      sender: "ai",
      text: "Hello! I am the **Greenfield AI Academic Copilot**. How can I assist you with student assessment, curriculum quizzes, or school communications today?",
    },
  ]);
  const [chatInput, setChatInput] = useState("");

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
    setChatInput("");
    setChatMessages((prev) => [...prev, { sender: "user", text: userText }]);
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
        setChatMessages((prev) => [...prev, { sender: "ai", text: data.text }]);
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

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="rounded-2xl border border-brand-200 bg-gradient-to-r from-brand-900 via-indigo-900 to-slate-900 p-6 text-white shadow-xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-500/30 text-lg">🤖</span>
              <h2 className="text-xl font-bold tracking-tight">Greenfield AI Academic Copilot</h2>
              <span className="rounded-full bg-emerald-400/20 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-300 border border-emerald-400/30">
                Pluggable Model Architecture
              </span>
            </div>
            <p className="text-xs text-slate-300 max-w-2xl">
              Configurable AI Assistant supporting **Sir's Custom Endpoint (Ollama / vLLM / OpenAI)**, **Google Gemini**, and **Built-in Academic Engine**.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-lg bg-white/10 px-2.5 py-1 text-xs font-mono text-emerald-300 border border-white/10">
              Active: {settings.provider === "custom" ? `Custom (${settings.modelName})` : settings.provider === "gemini" ? "Google Gemini" : "Built-in Academic Engine"}
            </span>
            <button
              type="button"
              onClick={() => setActiveTab("settings")}
              className="rounded-lg bg-white/20 hover:bg-white/30 px-3 py-1 text-xs font-medium text-white transition border border-white/20 flex items-center gap-1"
            >
              ⚙️ Model Settings
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="mt-6 flex flex-wrap gap-2 border-t border-white/10 pt-4">
          <button
            type="button"
            onClick={() => {
              setActiveTab("remarks");
              setResultText(null);
            }}
            className={`flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-medium transition ${
              activeTab === "remarks"
                ? "bg-white text-slate-900 shadow-md font-semibold"
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
                ? "bg-white text-slate-900 shadow-md font-semibold"
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
                ? "bg-white text-slate-900 shadow-md font-semibold"
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
                ? "bg-white text-slate-900 shadow-md font-semibold"
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
                ? "bg-amber-400 text-slate-900 shadow-md font-bold"
                : "bg-white/10 text-amber-200 hover:bg-white/20"
            }`}
          >
            ⚙️ Model Settings (Sir's Endpoint)
          </button>
        </div>
      </div>

      {/* Main Content Layout */}
      {activeTab === "settings" ? (
        /* TAB 5: MODEL SETTINGS & SIR'S ENDPOINT */
        <div className="card p-6 max-w-3xl mx-auto space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2">
                <span>⚙️</span> Custom Model & Endpoint Configuration
              </h3>
              <p className="text-xs text-slate-500">
                Connect School-CMS to your own model server, Ollama, LM Studio, vLLM, or Google Gemini.
              </p>
            </div>
            <span className="rounded bg-indigo-50 px-2.5 py-1 text-xs font-mono font-medium text-indigo-700">
              API Ready
            </span>
          </div>

          <div className="space-y-4">
            {/* Provider Picker */}
            <div>
              <label className="label text-xs">AI Provider Architecture</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => saveSettings({ ...settings, provider: "custom", modelName: "llama3" })}
                  className={`rounded-xl border p-3 text-left transition ${
                    settings.provider === "custom"
                      ? "border-brand-600 bg-brand-50/70 ring-2 ring-brand-600/20"
                      : "border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  <div className="text-xs font-bold text-slate-900">⚡ Sir's Custom Endpoint</div>
                  <div className="text-[11px] text-slate-500 mt-1">Ollama, LM Studio, vLLM, or private server</div>
                </button>

                <button
                  type="button"
                  onClick={() => saveSettings({ ...settings, provider: "gemini", modelName: "gemini-1.5-flash" })}
                  className={`rounded-xl border p-3 text-left transition ${
                    settings.provider === "gemini"
                      ? "border-brand-600 bg-brand-50/70 ring-2 ring-brand-600/20"
                      : "border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  <div className="text-xs font-bold text-slate-900">🤖 Google Gemini API</div>
                  <div className="text-[11px] text-slate-500 mt-1">Gemini 1.5 Flash / Pro cloud model</div>
                </button>

                <button
                  type="button"
                  onClick={() => saveSettings({ ...settings, provider: "builtin", modelName: "academic-domain-v1" })}
                  className={`rounded-xl border p-3 text-left transition ${
                    settings.provider === "builtin"
                      ? "border-brand-600 bg-brand-50/70 ring-2 ring-brand-600/20"
                      : "border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  <div className="text-xs font-bold text-slate-900">🏫 Built-in Academic Engine</div>
                  <div className="text-[11px] text-slate-500 mt-1">Zero config, instant responses, offline</div>
                </button>
              </div>
            </div>

            {/* Custom Endpoint Parameters */}
            {settings.provider === "custom" && (
              <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-3">
                <div className="text-xs font-semibold text-slate-800">Custom Model Connection Details</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="label text-xs">Model Name *</label>
                    <input
                      className="input text-xs font-mono"
                      value={settings.modelName}
                      onChange={(e) => saveSettings({ ...settings, modelName: e.target.value })}
                      placeholder="e.g. llama3, mistral, gpt-4o-mini"
                    />
                  </div>
                  <div>
                    <label className="label text-xs">Base API URL *</label>
                    <input
                      className="input text-xs font-mono"
                      value={settings.baseUrl}
                      onChange={(e) => saveSettings({ ...settings, baseUrl: e.target.value })}
                      placeholder="e.g. http://localhost:11434/v1 or https://api.openai.com/v1"
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
                    placeholder="Enter API Key if required by Sir's endpoint"
                  />
                </div>
              </div>
            )}

            {settings.provider === "gemini" && (
              <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-3">
                <div className="text-xs font-semibold text-slate-800">Google Gemini Configuration</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="label text-xs">Gemini Model</label>
                    <select
                      className="input text-xs"
                      value={settings.modelName}
                      onChange={(e) => saveSettings({ ...settings, modelName: e.target.value })}
                    >
                      <option value="gemini-1.5-flash">gemini-1.5-flash (Fast & Recommended)</option>
                      <option value="gemini-1.5-pro">gemini-1.5-pro (High Reasoning)</option>
                      <option value="gemini-2.0-flash">gemini-2.0-flash</option>
                    </select>
                  </div>
                  <div>
                    <label className="label text-xs">Gemini API Key</label>
                    <input
                      type="password"
                      className="input text-xs font-mono"
                      value={settings.apiKey}
                      onChange={(e) => saveSettings({ ...settings, apiKey: e.target.value })}
                      placeholder="AIzaSy..."
                    />
                  </div>
                </div>
              </div>
            )}

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
            <div className="rounded-xl border border-slate-200 bg-white p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div>
                <div className="text-xs font-semibold text-slate-800">Test Model Connection</div>
                <div className="text-[11px] text-slate-500">
                  Sends a real-time verification ping to verify that Sir's endpoint is reachable.
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
                    ? "border border-emerald-200 bg-emerald-50 text-emerald-900"
                    : "border border-amber-200 bg-amber-50 text-amber-900"
                }`}
              >
                <div className="font-semibold flex items-center gap-1.5">
                  <span>{testResult.success ? "✓" : "⚠️"}</span>
                  <span>{testResult.success ? "Connection Successful!" : "Connection Warning"}</span>
                  {testResult.latencyMs !== undefined && (
                    <span className="ml-auto font-mono text-[11px] bg-white/60 px-2 py-0.5 rounded">
                      {testResult.latencyMs}ms latency
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
                  <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-1.5">
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
                    {loading ? "Generating Remarks with LLM..." : "✨ Generate AI Remarks"}
                  </button>
                </form>
              )}

              {activeTab === "quiz" && (
                <form onSubmit={handleGenerateQuiz} className="space-y-4">
                  <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-1.5">
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
                    {loading ? "Crafting Quiz with LLM..." : "⚡ Generate Quiz with Answer Key"}
                  </button>
                </form>
              )}

              {activeTab === "notice" && (
                <form onSubmit={handleGenerateNotice} className="space-y-4">
                  <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-1.5">
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
                    {loading ? "Drafting Circular with LLM..." : "📜 Draft Official Circular"}
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* Right Column: AI Output Viewer */}
          <div className="lg:col-span-7">
            <div className="card p-5 h-full flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-slate-800">Generated AI Output</span>
                    {providerUsed && (
                      <span className="rounded bg-indigo-50 px-2 py-0.5 text-[11px] font-medium text-indigo-700 border border-indigo-100">
                        {providerUsed}
                      </span>
                    )}
                  </div>
                  {resultText && (
                    <button
                      type="button"
                      onClick={handleCopy}
                      className="btn-ghost text-xs flex items-center gap-1 text-slate-600 hover:text-slate-900"
                    >
                      {copied ? "✓ Copied!" : "📋 Copy Output"}
                    </button>
                  )}
                </div>

                <div className="mt-4">
                  {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 space-y-3">
                      <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600"></div>
                      <p className="text-xs font-medium text-slate-500">
                        LLM is reasoning and formatting output...
                      </p>
                    </div>
                  ) : resultText ? (
                    <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4 text-xs text-slate-800 font-sans leading-relaxed whitespace-pre-wrap">
                      {resultText}
                    </div>
                  ) : (
                    <div className="rounded-xl border border-dashed border-slate-200 p-12 text-center text-slate-400">
                      <div className="mx-auto mb-2 text-2xl">✨</div>
                      <p className="text-xs font-medium text-slate-600">No output generated yet</p>
                      <p className="text-[11px] text-slate-400 mt-1">
                        Fill out the parameters on the left and click Generate to see the response.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-4 border-t border-slate-100 pt-3 flex items-center justify-between text-[11px] text-slate-400">
                <span>Active Provider: {settings.provider}</span>
                <span>Configurable in Model Settings</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Tab 4: Interactive AI Chat */
        <div className="lg:col-span-12">
          <div className="card flex flex-col h-[520px]">
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
                        : "bg-slate-200 text-slate-700"
                    }`}
                  >
                    {msg.sender === "user" ? "You" : "🤖"}
                  </div>
                  <div
                    className={`max-w-xl rounded-2xl p-3.5 text-xs leading-relaxed ${
                      msg.sender === "user"
                        ? "bg-brand-600 text-white rounded-tr-none"
                        : "bg-slate-100 text-slate-800 rounded-tl-none whitespace-pre-wrap"
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <span className="h-2 w-2 animate-ping rounded-full bg-brand-500"></span>
                  <span>Copilot is typing...</span>
                </div>
              )}
            </div>

            {/* Chat Input Bar */}
            <div className="border-t border-slate-100 p-4 bg-slate-50/50">
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
                  className="rounded bg-white border border-slate-200 px-2 py-0.5 text-[10px] text-slate-600 hover:border-brand-300 hover:text-brand-700"
                >
                  Attendance policy
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setChatInput("Explain the letter grading scale used in report cards")
                  }
                  className="rounded bg-white border border-slate-200 px-2 py-0.5 text-[10px] text-slate-600 hover:border-brand-300 hover:text-brand-700"
                >
                  Grading scale
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setChatInput("How can I register a new student via GraphQL?")
                  }
                  className="rounded bg-white border border-slate-200 px-2 py-0.5 text-[10px] text-slate-600 hover:border-brand-300 hover:text-brand-700"
                >
                  GraphQL student registration
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
