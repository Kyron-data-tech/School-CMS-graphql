"use client";

import { useState } from "react";
import { GQL_QUERIES, GQL_MUTATIONS, gqlRequest } from "@/lib/graphql/client";

interface PresetQuery {
  id: string;
  name: string;
  category: "Academics" | "Operations" | "AI Copilot" | "Security";
  icon: string;
  query: string;
  variables: string;
  description: string;
}

const PRESET_QUERIES: PresetQuery[] = [
  {
    id: "students",
    name: "Student Directory & Attendance",
    category: "Academics",
    icon: "🎓",
    description: "Fetch all active students with enrollments, guardian details, and attendance rates.",
    query: GQL_QUERIES.GET_STUDENTS,
    variables: JSON.stringify({ search: "", limit: 10, offset: 0 }, null, 2),
  },
  {
    id: "faculty",
    name: "Faculty & Teaching Assignments",
    category: "Academics",
    icon: "👩‍🏫",
    description: "Fetch certified teachers with contact details and assigned subjects across sections.",
    query: GQL_QUERIES.GET_TEACHERS,
    variables: JSON.stringify({ isActive: true }, null, 2),
  },
  {
    id: "hierarchy",
    name: "Academic Structure (Grades & Subjects)",
    category: "Academics",
    icon: "🏫",
    description: "Fetch school organization, academic years, grades, sections, and curriculum subjects.",
    query: GQL_QUERIES.GET_ACADEMIC_HIERARCHY,
    variables: "{}",
  },
  {
    id: "attendance",
    name: "Section Attendance Register",
    category: "Operations",
    icon: "📅",
    description: "Query attendance records with student associations.",
    query: GQL_QUERIES.GET_ATTENDANCE_REGISTER,
    variables: JSON.stringify({ sectionId: "", date: "2026-09-25" }, null, 2),
  },
  {
    id: "homework",
    name: "Homework Assignments & Submissions",
    category: "Operations",
    icon: "📝",
    description: "Fetch homework assignments with deadlines and student submissions.",
    query: GQL_QUERIES.GET_HOMEWORKS,
    variables: JSON.stringify({ offeringId: "" }, null, 2),
  },
  {
    id: "exams",
    name: "Exams & Student Results",
    category: "Operations",
    icon: "🏆",
    description: "Query examination subjects, passing marks, and recorded assessment scores.",
    query: GQL_QUERIES.GET_EXAMS,
    variables: "{}",
  },
  {
    id: "ai_remarks",
    name: "AI Remarks Generator (Mutation)",
    category: "AI Copilot",
    icon: "✨",
    description: "Execute GraphQL mutation to generate student report card feedback using LLM.",
    query: GQL_MUTATIONS.AI_GENERATE_REMARKS,
    variables: JSON.stringify(
      {
        input: {
          studentName: "Arjun Mehta",
          gradeLevel: "Class 8-A",
          attendanceRate: "96%",
          strengths: "Curiosity in science and active participation",
          areasToImprove: "Mathematical problem-solving consistency",
          tone: "encouraging",
        },
      },
      null,
      2
    ),
  },
  {
    id: "ai_quiz",
    name: "AI Practice Quiz (Mutation)",
    category: "AI Copilot",
    icon: "🧠",
    description: "Generate structured curriculum practice quiz with answer key.",
    query: GQL_MUTATIONS.AI_GENERATE_QUIZ,
    variables: JSON.stringify(
      {
        input: {
          subject: "Science",
          topic: "Photosynthesis and Plant Respiration",
          gradeLevel: "Class 8",
          questionCount: 3,
        },
      },
      null,
      2
    ),
  },
  {
    id: "ping",
    name: "AI Model Diagnostic Ping",
    category: "AI Copilot",
    icon: "⚡",
    description: "Ping the AI Engine through GraphQL and measure roundtrip execution latency.",
    query: /* GraphQL */ `
      query PingAiEngine {
        aiTestConnection(provider: "builtin", modelName: "academic-domain-v1") {
          success
          message
          latencyMs
          provider
          model
        }
      }
    `,
    variables: "{}",
  },
];

export function GraphQLStudioClient() {
  const [selectedPreset, setSelectedPreset] = useState<string>("students");
  const [queryInput, setQueryInput] = useState<string>(PRESET_QUERIES[0].query);
  const [variablesInput, setVariablesInput] = useState<string>(PRESET_QUERIES[0].variables);
  const [responseOutput, setResponseOutput] = useState<string | null>(null);
  const [executing, setExecuting] = useState<boolean>(false);
  const [latency, setLatency] = useState<number | null>(null);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  function handleSelectPreset(preset: PresetQuery) {
    setSelectedPreset(preset.id);
    setQueryInput(preset.query);
    setVariablesInput(preset.variables);
    setResponseOutput(null);
    setStatusMsg(null);
  }

  async function handleExecuteQuery() {
    setExecuting(true);
    setStatusMsg(null);
    setLatency(null);
    const start = performance.now();

    try {
      let vars: Record<string, any> = {};
      if (variablesInput.trim()) {
        try {
          vars = JSON.parse(variablesInput);
        } catch (e: any) {
          throw new Error(`Invalid JSON in Variables editor: ${e.message}`);
        }
      }

      const res = await fetch("/api/graphql", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: queryInput, variables: vars }),
      });

      const data = await res.json();
      const elapsed = Math.round(performance.now() - start);
      setLatency(elapsed);

      setResponseOutput(JSON.stringify(data, null, 2));
      setStatusMsg(`200 OK · ${res.statusText || "Success"}`);
    } catch (err: any) {
      const elapsed = Math.round(performance.now() - start);
      setLatency(elapsed);
      setResponseOutput(JSON.stringify({ error: err.message }, null, 2));
      setStatusMsg("Execution Failed");
    } finally {
      setExecuting(false);
    }
  }

  function handleCopyResponse() {
    if (!responseOutput) return;
    navigator.clipboard.writeText(responseOutput);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-6">
      {/* Studio Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-brand-950 via-slate-900 to-indigo-950 p-6 sm:p-8 text-white shadow-elevated border border-brand-900/60">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-brand-200 backdrop-blur-md border border-white/10">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              GraphQL API Studio & GraphiQL Explorer
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Greenfield Universal GraphQL Engine
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl font-normal">
              Execute live queries, mutations, and AI workflows against Greenfield CMS. Full schema covers Academics, Students, Faculty, Attendance, Homework, Exams, and AI Copilot.
            </p>
          </div>
          <div className="flex items-center gap-2.5 shrink-0">
            <a
              href="/api/graphql"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-md px-4 py-2.5 text-xs font-bold text-white border border-white/10 transition"
            >
              <span>⚡</span> Open GraphiQL ↗
            </a>
          </div>
        </div>
      </div>

      {/* Preset Queries Carousel Bar */}
      <div>
        <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2.5 flex items-center justify-between">
          <span>Interactive Query & Mutation Presets</span>
          <span className="text-[11px] text-slate-400 font-normal">Click any preset to load</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
          {PRESET_QUERIES.map((preset) => (
            <button
              key={preset.id}
              onClick={() => handleSelectPreset(preset)}
              className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                selectedPreset === preset.id
                  ? "border-brand-500 bg-brand-50/80 shadow-sm ring-2 ring-brand-400/20"
                  : "border-slate-200/90 bg-white hover:bg-slate-50 hover:border-slate-300"
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-base">{preset.icon}</span>
                <span className="text-xs font-bold text-slate-900 truncate">{preset.name}</span>
              </div>
              <span className="text-[10px] text-slate-400 font-medium mt-1 truncate">
                {preset.category}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Studio Workbench Grid */}
      <div className="grid lg:grid-cols-12 gap-6 items-start">
        {/* Left: Query & Variables Editor */}
        <div className="lg:col-span-6 space-y-4">
          <div className="card overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/80 px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-700">GraphQL Document</span>
                <span className="text-[10px] text-slate-400 font-mono">POST /api/graphql</span>
              </div>
              <button
                onClick={handleExecuteQuery}
                disabled={executing}
                className="btn-primary py-1.5 px-3.5 text-xs font-bold flex items-center gap-1.5 shadow-sm"
              >
                <span>{executing ? "⏳" : "▶"}</span>
                {executing ? "Executing Query…" : "Run Query (Ctrl+Enter)"}
              </button>
            </div>
            <div className="p-2 bg-slate-950 font-mono text-xs">
              <textarea
                value={queryInput}
                onChange={(e) => setQueryInput(e.target.value)}
                rows={16}
                spellCheck={false}
                className="w-full bg-transparent text-emerald-300 outline-none resize-y p-2 leading-relaxed"
                placeholder="query { ... }"
              />
            </div>
          </div>

          {/* Variables Editor */}
          <div className="card overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/80 px-4 py-2.5">
              <span className="text-xs font-bold text-slate-700">Query Variables (JSON)</span>
              <span className="text-[10px] text-slate-400 font-mono">optional parameters</span>
            </div>
            <div className="p-2 bg-slate-950 font-mono text-xs">
              <textarea
                value={variablesInput}
                onChange={(e) => setVariablesInput(e.target.value)}
                rows={5}
                spellCheck={false}
                className="w-full bg-transparent text-amber-200 outline-none resize-none p-2 leading-relaxed"
                placeholder="{}"
              />
            </div>
          </div>
        </div>

        {/* Right: Live JSON Response Viewer */}
        <div className="lg:col-span-6">
          <div className="card overflow-hidden sticky top-20">
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/80 px-4 py-3">
              <div className="flex items-center gap-2.5">
                <span className="text-xs font-bold text-slate-700">Execution Response</span>
                {statusMsg && (
                  <span className="rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 border border-emerald-200">
                    {statusMsg}
                  </span>
                )}
                {latency !== null && (
                  <span className="text-[10px] font-mono text-slate-400">
                    {latency}ms latency
                  </span>
                )}
              </div>
              {responseOutput && (
                <button
                  onClick={handleCopyResponse}
                  className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
                >
                  {copied ? "✓ Copied!" : "📋 Copy JSON"}
                </button>
              )}
            </div>

            <div className="p-4 bg-slate-950 font-mono text-xs min-h-[460px] max-h-[580px] overflow-auto">
              {executing ? (
                <div className="flex flex-col items-center justify-center h-64 text-slate-400 gap-3">
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
                  <span className="text-xs">Processing GraphQL AST & Resolvers…</span>
                </div>
              ) : responseOutput ? (
                <pre className="text-sky-300 whitespace-pre-wrap leading-relaxed">
                  {responseOutput}
                </pre>
              ) : (
                <div className="flex flex-col items-center justify-center h-64 text-slate-500 text-center p-6">
                  <span className="text-3xl mb-2">⚡</span>
                  <p className="text-xs font-medium text-slate-400">Click &ldquo;Run Query&rdquo; or select a preset above</p>
                  <p className="text-[11px] text-slate-600 mt-1">Queries are evaluated against the MariaDB relational engine in real-time.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
