import { redirect } from "next/navigation";
import { getAuthContext } from "@/lib/auth/context";
import { navFor } from "@/lib/nav";
import { Sidebar } from "@/components/Sidebar";
import { logoutAction } from "@/lib/auth/actions";
import Link from "next/link";

function roleBadge(roleKey: string) {
  const map: Record<string, { label: string; className: string; dot: string }> = {
    headmaster: { label: "Principal", className: "bg-purple-500/15 border-purple-500/30 text-purple-300", dot: "bg-purple-400" },
    teacher: { label: "Faculty", className: "bg-blue-500/15 border-blue-500/30 text-blue-300", dot: "bg-blue-400" },
    class_teacher: { label: "Class Teacher", className: "bg-indigo-500/15 border-indigo-500/30 text-indigo-300", dot: "bg-indigo-400" },
    student: { label: "Student", className: "bg-emerald-500/15 border-emerald-500/30 text-emerald-300", dot: "bg-emerald-400" },
    exam_controller: { label: "Exam Controller", className: "bg-rose-500/15 border-rose-500/30 text-rose-300", dot: "bg-rose-400" },
  };

  const item = map[roleKey] || { label: roleKey, className: "bg-white/[0.05] border-white/[0.1] text-slate-300", dot: "bg-slate-400" };
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider backdrop-blur-md ${item.className}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${item.dot}`} />
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
    <div className="relative flex min-h-screen text-slate-100 font-sans selection:bg-brand-500 selection:text-white bg-slate-950 overflow-x-hidden">
      {/* ── LIGHT NOSTALGIC CAMPUS BACKGROUND IMAGE ON DASHBOARD ── */}
      <div 
        className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat pointer-events-none opacity-[0.38] filter sepia-[0.22] contrast-[1.10] brightness-[1.14] saturate-[1.25]"
        style={{ backgroundImage: `url('/campus-background.jpg')` }}
      />
      {/* Soft warm nostalgic golden-hour vignette */}
      <div className="fixed inset-0 z-0 bg-gradient-to-b from-slate-950/45 via-slate-950/68 to-slate-950/85 pointer-events-none" />
      <div className="fixed inset-0 z-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-500/12 via-transparent to-transparent pointer-events-none" />

      {/* ── MODERN FROSTED SIDEBAR ── */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-white/[0.08] bg-slate-950/80 backdrop-blur-2xl md:flex shadow-2xl z-20 relative">
        {/* Brand Header with Heritage Touch */}
        <div className="flex items-center gap-3.5 border-b border-white/[0.08] px-5 py-4 bg-white/[0.02]">
          <div className="relative h-10 w-10 shrink-0 p-0.5 rounded-xl bg-gradient-to-tr from-amber-400 via-brand-500 to-indigo-500 shadow-[0_0_20px_rgba(245,158,11,0.4)]">
            <div className="h-full w-full rounded-[10px] bg-[#090d16] flex flex-col items-center justify-center text-center p-0.5 border border-white/20">
              <span className="font-display font-extrabold text-amber-200 text-xs tracking-wider">GIA</span>
              <span className="text-[7px] font-mono text-cyan-300">EST.88</span>
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-amber-400 ring-2 ring-slate-950 animate-pulse" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="block truncate text-sm font-extrabold tracking-tight text-white font-display">
              Greenfield Academy
            </span>
            <span className="block truncate text-[11px] font-medium text-amber-200/70">
              Heritage SIS &amp; Campus
            </span>
          </div>
        </div>

        {/* Academic Context Badge */}
        <div className="mx-3.5 my-3 rounded-xl bg-white/[0.03] p-2.5 border border-amber-500/15 flex items-center justify-between text-xs backdrop-blur-md shadow-sm">
          <div className="text-[11px] font-bold text-slate-200 flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
            2026–27 Session
          </div>
          <span className="rounded-lg bg-amber-500/15 px-2 py-0.5 text-[10px] font-mono font-bold text-amber-300 border border-amber-500/30 uppercase">
            Term 1
          </span>
        </div>

        {/* Navigation list */}
        <div className="flex-1 overflow-y-auto">
          <Sidebar items={items} />
        </div>

        {/* Admissions Quick Shortcut Link */}
        <div className="p-3 border-t border-white/[0.08] bg-white/[0.01]">
          <Link
            href="/register"
            className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] hover:border-white/[0.16] transition group text-xs text-white shadow-sm"
          >
            <div className="flex items-center gap-2">
              <svg className="h-4 w-4 text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m3.75 9v6m3-3H9m1.5-12H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
              <span className="font-bold text-slate-100">Admissions Desk</span>
            </div>
            <span className="text-brand-400 font-bold group-hover:translate-x-0.5 transition-transform">→</span>
          </Link>
        </div>

        {/* Institutional Footer Info */}
        <div className="border-t border-white/[0.08] p-3.5 bg-white/[0.01] text-[11px] text-slate-400 flex items-center justify-between">
          <span className="flex items-center gap-1.5 font-bold text-slate-300">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Campus Network
          </span>
          <span className="text-[10px] font-mono font-bold text-slate-300 bg-white/[0.05] px-2 py-0.5 rounded border border-white/[0.08]">
            CBSE 1930482
          </span>
        </div>
      </aside>

      {/* ── MAIN CONTENT AREA ── */}
      <div className="relative z-10 flex min-w-0 flex-1 flex-col min-h-screen">
        {/* Top Navbar */}
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-white/[0.08] bg-slate-950/75 backdrop-blur-2xl px-5 sm:px-8 py-3.5 shadow-sm">
          <div className="md:hidden flex items-center gap-2.5">
            <div className="grid h-8 w-8 place-items-center rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-600 font-bold text-white text-xs shadow-sm">
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
            <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Campus Net: <strong className="text-emerald-300 font-semibold">Online</strong>
            </span>
            <span className="text-slate-700 hidden lg:inline">·</span>
            <span className="hidden lg:inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 border border-amber-500/25 px-2.5 py-0.5 text-[10px] font-bold text-amber-300 backdrop-blur-md">
              <span>🏛️</span>
              <span>Heritage Campus · Est. 1988</span>
            </span>
          </div>

          <div className="ml-auto flex items-center gap-3">
            {/* User profile capsule */}
            <div className="flex items-center gap-2.5 rounded-2xl border border-white/[0.08] bg-white/[0.04] backdrop-blur-md py-1.5 pl-2 pr-3.5 shadow-sm">
              <div className="grid h-8 w-8 place-items-center rounded-xl bg-gradient-to-br from-brand-600 via-indigo-600 to-indigo-700 font-bold text-white text-xs shadow-[0_0_15px_-2px_rgba(99,102,241,0.4)]">
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
                className="btn-ghost py-1.5 px-3.5 text-xs font-bold text-slate-300 hover:text-rose-400 hover:bg-rose-500/10 hover:border-rose-500/30 transition-all shadow-sm"
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
