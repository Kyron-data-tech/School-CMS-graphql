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
      <div className="relative overflow-hidden rounded-2xl border border-brand-500/30 bg-slate-900/50 backdrop-blur-2xl p-5 shadow-[0_8px_32px_0_rgba(0,0,0,0.36)] ring-1 ring-inset ring-white/[0.04]">
        <div className="absolute right-0 top-0 w-64 h-32 bg-brand-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-500/15 text-brand-300 border border-brand-500/30">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                </svg>
              </span>
              <h3 className="text-sm sm:text-base font-bold text-white font-display">
                Principal Authority: School-Wide AI API Key &amp; Multi-Member License
              </h3>
              <span className="rounded-full bg-brand-500/15 border border-brand-500/30 px-2.5 py-0.5 text-[10px] font-mono font-bold text-brand-300">
                PRINCIPAL PRIVILEGE
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-slate-400">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
                Status: <strong className="text-emerald-300 font-semibold">{config.hasKey || config.isConfigured ? "Active & Inherited by All Members" : "Ready for Principal Configuration"}</strong>
              </span>
              <span>•</span>
              <span>Model: <strong className="text-slate-200 uppercase font-mono">{config.provider} ({config.modelName})</strong></span>
              {config.maskedKey && (
                <>
                  <span>•</span>
                  <span className="font-mono text-slate-300 bg-white/[0.04] px-2 py-0.5 rounded border border-white/[0.08]">
                    Key: {config.maskedKey} (Secured)
                  </span>
                </>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <Link
              href="/copilot"
              className="btn-primary"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.343 3.94c.09-.542.56-.94 1.11-.94h1.093c.55 0 1.02.398 1.11.94l.149.894c.07.424.384.764.78.93.398.164.855.142 1.205-.108l.737-.527a1.125 1.125 0 011.45.12l.773.774c.39.389.44 1.002.12 1.45l-.527.737c-.25.35-.272.806-.107 1.204.165.397.505.71.93.78l.893.15c.543.09.94.559.94 1.109v1.094c0 .55-.397 1.02-.94 1.11l-.894.149c-.424.07-.764.383-.929.78-.165.398-.143.854.107 1.204l.527.738c.32.447.27.1.06-.12l-.773.773a1.125 1.125 0 01-1.449.12l-.738-.527c-.35-.25-.806-.272-1.203-.107-.398.165-.71.505-.781.929l-.149.894c-.09.542-.56.94-1.11.94h-1.094c-.55 0-1.019-.398-1.11-.94l-.148-.894c-.071-.424-.384-.764-.781-.93-.398-.164-.854-.142-1.204.108l-.738.527c-.447.32-1.06.27-1.45-.12l-.773-.774a1.125 1.125 0 01-.12-1.45l.527-.737c.25-.35.272-.806.108-1.204-.165-.397-.506-.71-.93-.78l-.894-.15c-.542-.09-.94-.56-.94-1.11v-1.093c0-.55.398-1.02.94-1.11l.894-.149c.424-.07.765-.383.93-.78.165-.398.143-.854-.108-1.204l-.526-.738a1.125 1.125 0 01.12-1.45l.773-.773a1.125 1.125 0 011.45-.12l.737.527c.35.25.807.272 1.204.107.397-.165.71-.505.78-.929l.15-.894z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>Manage Key &amp; Open Copilot ➔</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (isTeacher) {
    return (
      <div className="relative overflow-hidden rounded-2xl border border-indigo-500/30 bg-slate-900/50 backdrop-blur-2xl p-5 shadow-[0_8px_32px_0_rgba(0,0,0,0.36)] ring-1 ring-inset ring-white/[0.04]">
        <div className="absolute right-0 top-0 w-64 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342" />
                </svg>
              </span>
              <h3 className="text-sm sm:text-base font-bold text-white font-display">
                School-Wide AI Copilot (Covered by Principal&apos;s License)
              </h3>
              <span className="rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 text-[10px] font-mono font-bold text-emerald-300">
                NO KEY REQUIRED FOR TEACHERS
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-slate-400">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
                Covered by: <strong className="text-white">{config.configuredBy || "School Principal"}</strong>
              </span>
              <span>•</span>
              <span>Engine: <strong className="text-indigo-200 uppercase font-mono">{config.provider} ({config.modelName})</strong></span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <Link
              href="/copilot"
              className="btn-primary"
            >
              <span>Launch AI Copilot ➔</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Student view
  return (
    <div className="relative overflow-hidden rounded-2xl border border-emerald-500/30 bg-slate-900/50 backdrop-blur-2xl p-5 shadow-[0_8px_32px_0_rgba(0,0,0,0.36)] ring-1 ring-inset ring-white/[0.04]">
      <div className="absolute right-0 top-0 w-64 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5 max-w-3xl">
          <div className="flex flex-wrap items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
              </svg>
            </span>
            <h3 className="text-sm sm:text-base font-bold text-white font-display">
              Greenfield AI Academic Assistant (Institutional License Active)
            </h3>
            <span className="rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 text-[10px] font-mono font-bold text-emerald-300">
              FREE FOR STUDENTS
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
              License Authority: <strong className="text-white">{config.configuredBy || "School Principal"}</strong>
            </span>
            <span>•</span>
            <span>Engine: <strong className="text-emerald-200 uppercase font-mono">{config.provider} ({config.modelName})</strong></span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <Link
            href="/copilot"
            className="btn-accent"
          >
            <span>Ask AI Tutor ➔</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
