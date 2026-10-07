import { redirect } from "next/navigation";
import { getAuthContext } from "@/lib/auth/context";
import { navFor } from "@/lib/nav";
import { Sidebar } from "@/components/Sidebar";
import { logoutAction } from "@/lib/auth/actions";
import Link from "next/link";

function roleBadge(roleKey: string) {
  const map: Record<string, { label: string; className: string }> = {
    headmaster: { label: "Principal", className: "bg-purple-950/70 border-purple-800/80 text-purple-300" },
    teacher: { label: "Faculty", className: "bg-blue-950/70 border-blue-800/80 text-blue-300" },
    class_teacher: { label: "Class Teacher", className: "bg-indigo-950/70 border-indigo-800/80 text-indigo-300" },
    student: { label: "Student", className: "bg-emerald-950/70 border-emerald-800/80 text-emerald-300" },
    exam_controller: { label: "Exam Controller", className: "bg-rose-950/70 border-rose-800/80 text-rose-300" },
  };

  const item = map[roleKey] || { label: roleKey, className: "bg-slate-800 border-slate-700 text-slate-300" };
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider ${item.className}`}>
      {item.label}
    </span>
  );
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();
}

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const ctx = await getAuthContext();
  if (!ctx) redirect("/login");

  const items = navFor(ctx);

  return (
    <div className="flex min-h-screen bg-slate-950/90 text-slate-100 font-sans selection:bg-brand-500 selection:text-white">
      {/* ── SIDEBAR ── */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-slate-800/90 bg-slate-900/95 backdrop-blur-md md:flex shadow-2xl z-20">
        {/* Brand Header */}
        <div className="flex items-center gap-3.5 border-b border-slate-800 px-5 py-4">
          <div className="relative h-10 w-10 shrink-0 p-0.5 rounded-2xl bg-gradient-to-tr from-brand-600 via-indigo-600 to-indigo-900 shadow-sm">
            <div className="h-full w-full rounded-[14px] bg-slate-950 flex flex-col items-center justify-center text-center p-0.5 border border-white/20">
              <span className="font-serif font-black text-amber-400 text-sm tracking-wider">GIA</span>
              <span className="text-[7px] font-mono text-slate-300">1984</span>
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-slate-900" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="block truncate text-sm font-black tracking-tight text-white font-display">
              Greenfield Academy
            </span>
            <span className="block truncate text-[11px] font-medium text-slate-400">
              Central Academic SIS
            </span>
          </div>
        </div>

        {/* Academic Context Badge */}
        <div className="mx-3.5 my-3 rounded-2xl bg-gradient-to-r from-slate-950 to-slate-900/90 p-2.5 border border-slate-800 flex items-center justify-between text-xs">
          <div className="text-[11px] font-bold text-slate-200 flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            2026–27 Session
          </div>
          <span className="rounded-lg bg-slate-800 px-2 py-0.5 text-[10px] font-black text-brand-300 border border-brand-800/80 shadow-subtle uppercase">
            Term 1
          </span>
        </div>

        {/* Navigation list */}
        <div className="flex-1 overflow-y-auto">
          <Sidebar items={items} />
        </div>

        {/* Admissions Quick Shortcut Link */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/40">
          <Link
            href="/register"
            className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/80 shadow-subtle hover:bg-slate-700/80 hover:border-slate-600 transition group text-xs text-white"
          >
            <div className="flex items-center gap-2">
              <span>📝</span>
              <span className="font-bold text-slate-100">Admissions Desk</span>
            </div>
            <span className="text-brand-400 font-black group-hover:translate-x-0.5 transition-transform">→</span>
          </Link>
        </div>

        {/* Institutional Footer Info */}
        <div className="border-t border-slate-800 p-3.5 bg-slate-950/60 text-[11px] text-slate-400 flex items-center justify-between">
          <span className="flex items-center gap-1.5 font-bold text-slate-300">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Campus Network
          </span>
          <span className="text-[10px] font-bold text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">
            CBSE 1930482
          </span>
        </div>
      </aside>

      {/* ── MAIN CONTENT AREA ── */}
      <div className="flex min-w-0 flex-1 flex-col bg-slate-950/80 backdrop-blur-sm min-h-screen">
        {/* Top Navbar */}
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-800/90 bg-slate-900/95 backdrop-blur-md px-5 sm:px-8 py-3.5 shadow-subtle">
          <div className="md:hidden flex items-center gap-2.5">
            <div className="grid h-8 w-8 place-items-center rounded-xl bg-brand-600 font-bold text-white text-xs">
              G
            </div>
            <span className="font-black text-sm text-white font-display">Greenfield SIS</span>
          </div>

          <div className="hidden sm:flex items-center gap-3 text-xs text-slate-400">
            <span className="font-bold text-slate-200">Active Scope:</span>
            {ctx.roleKeys.map((k) => (
              <span key={k}>{roleBadge(k)}</span>
            ))}
            <span className="text-slate-700">·</span>
            <span className="text-[11px] font-medium text-slate-400">
              Campus Net: <strong className="text-emerald-400">Connected</strong>
            </span>
          </div>

          <div className="ml-auto flex items-center gap-3">
            {/* User profile capsule */}
            <div className="flex items-center gap-2.5 rounded-2xl border border-slate-700/80 bg-slate-800/80 py-1.5 pl-2 pr-3.5 shadow-subtle">
              <div className="grid h-8 w-8 place-items-center rounded-xl bg-gradient-to-br from-brand-600 to-indigo-600 font-bold text-white text-xs shadow-sm">
                {getInitials(ctx.name)}
              </div>
              <div className="text-left hidden sm:block">
                <div className="text-xs font-bold text-white leading-tight">{ctx.name}</div>
                <div className="text-[10px] text-slate-400 font-mono leading-none mt-0.5 truncate max-w-[150px]">
                  {ctx.email}
                </div>
              </div>
            </div>

            {/* Logout button */}
            <form action={logoutAction}>
              <button
                className="btn-ghost py-1.5 px-3.5 text-xs font-bold text-slate-300 hover:text-rose-400 hover:bg-rose-950/60 hover:border-rose-800/80 transition-colors shadow-subtle"
                type="submit"
                title="Sign out of your session"
              >
                Sign out ↵
              </button>
            </form>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
