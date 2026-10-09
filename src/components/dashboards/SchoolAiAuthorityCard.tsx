import Link from "next/link";
import { getPublicInstitutionalAiConfig, isPrincipalOrAdmin } from "@/lib/ai/institutionalConfig";
import type { AuthContext } from "@/lib/auth/context";

export function SchoolAiAuthorityCard({ ctx }: { ctx: AuthContext }) {
  const config = getPublicInstitutionalAiConfig();
  const isPrincipal = isPrincipalOrAdmin(ctx);
  const isTeacher = Boolean(ctx.teacherId);
  const isStudent = Boolean(ctx.studentId);

  if (isPrincipal) {
    return (
      <div className="relative overflow-hidden rounded-2xl border border-amber-500/40 bg-gradient-to-r from-amber-950/40 via-slate-900 to-indigo-950/40 p-5 shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/20 text-amber-300 text-lg">
                👑
              </span>
              <h3 className="text-sm sm:text-base font-bold text-white font-display">
                Principal Authority: School-Wide AI API Key &amp; Multi-Member License
              </h3>
              <span className="rounded-full bg-amber-400/20 border border-amber-400/40 px-2.5 py-0.5 text-[10px] font-mono font-bold text-amber-300">
                PRINCIPAL PRIVILEGE
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              <strong>Only the Principal</strong> has authority to add and configure the school-wide AI API Key. Once saved, <strong>all Teachers and Students</strong> automatically inherit and use this AI license across the school without needing their own accounts or keys.
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-slate-400">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
                Status: <strong className="text-emerald-300 font-semibold">{config.hasKey || config.isConfigured ? "Active & Inherited by All Members" : "Ready for Principal Configuration"}</strong>
              </span>
              <span>•</span>
              <span>Model: <strong className="text-indigo-200 uppercase">{config.provider} ({config.modelName})</strong></span>
              {config.maskedKey && (
                <>
                  <span>•</span>
                  <span className="font-mono text-slate-300 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                    Key: {config.maskedKey} (Secured)
                  </span>
                </>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <Link
              href="/copilot"
              className="inline-flex items-center gap-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black px-4 py-2.5 text-xs shadow-md transition active:scale-95"
            >
              <span>⚙️</span> Manage Key &amp; Open Copilot ➔
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (isTeacher) {
    return (
      <div className="relative overflow-hidden rounded-2xl border border-indigo-500/40 bg-gradient-to-r from-indigo-950/40 via-slate-900 to-slate-950 p-5 shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-500/20 text-indigo-300 text-lg">
                👨‍🏫
              </span>
              <h3 className="text-sm sm:text-base font-bold text-white font-display">
                School-Wide AI Copilot (Covered by Principal&apos;s License)
              </h3>
              <span className="rounded-full bg-emerald-500/20 border border-emerald-400/40 px-2.5 py-0.5 text-[10px] font-mono font-bold text-emerald-300">
                NO KEY REQUIRED FOR TEACHERS
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              The School Principal (<strong>Dr. Anita Desai</strong>) has configured the institutional AI API key. You have full access to generate student report card remarks, curriculum quizzes, and official notices without buying or entering an API key.
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-slate-400">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
                Covered by: <strong className="text-white">{config.configuredBy || "School Principal"}</strong>
              </span>
              <span>•</span>
              <span>Engine: <strong className="text-indigo-200 uppercase">{config.provider} ({config.modelName})</strong></span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <Link
              href="/copilot"
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black px-4 py-2.5 text-xs shadow-md transition active:scale-95"
            >
              <span>🤖</span> Launch AI Copilot ➔
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Student view
  return (
    <div className="relative overflow-hidden rounded-2xl border border-emerald-500/40 bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-950 p-5 shadow-lg">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5 max-w-3xl">
          <div className="flex flex-wrap items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-300 text-lg">
              🎓
            </span>
            <h3 className="text-sm sm:text-base font-bold text-white font-display">
              Greenfield AI Academic Assistant (Institutional License Active)
            </h3>
            <span className="rounded-full bg-emerald-500/20 border border-emerald-400/40 px-2.5 py-0.5 text-[10px] font-mono font-bold text-emerald-300">
              FREE FOR STUDENTS
            </span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            School-wide AI learning tools are provided and licensed centrally by the School Principal. You can practice data structure quizzes and ask curriculum questions anytime.
          </p>
          <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
              License Authority: <strong className="text-white">{config.configuredBy || "School Principal"}</strong>
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <Link
            href="/copilot"
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black px-4 py-2.5 text-xs shadow-md transition active:scale-95"
          >
            <span>💬</span> Ask AI Copilot ➔
          </Link>
        </div>
      </div>
    </div>
  );
}
