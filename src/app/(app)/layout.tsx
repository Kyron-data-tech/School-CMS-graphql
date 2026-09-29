import { redirect } from "next/navigation";
import { getAuthContext } from "@/lib/auth/context";
import { navFor } from "@/lib/nav";
import { Sidebar } from "@/components/Sidebar";
import { logoutAction } from "@/lib/auth/actions";
import Link from "next/link";

function roleBadge(roleKey: string) {
  const map: Record<string, { label: string; className: string }> = {
    headmaster: { label: "Principal", className: "bg-purple-50 border-purple-200 text-purple-800" },
    teacher: { label: "Faculty", className: "bg-blue-50 border-blue-200 text-blue-800" },
    class_teacher: { label: "Class Teacher", className: "bg-indigo-50 border-indigo-200 text-indigo-800" },
    student: { label: "Student", className: "bg-emerald-50 border-emerald-200 text-emerald-800" },
    exam_controller: { label: "Exam Controller", className: "bg-rose-50 border-rose-200 text-rose-800" },
  };

  const item = map[roleKey] || { label: roleKey, className: "bg-slate-100 border-slate-200 text-slate-700" };
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
    <div className="flex min-h-screen bg-slate-950/60 backdrop-blur-[1px] font-sans selection:bg-brand-500 selection:text-white">
      {/* ── SIDEBAR ── */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-slate-200/90 bg-white/95 backdrop-blur-md md:flex shadow-sm z-20">
        {/* Brand Header */}
        <div className="flex items-center gap-3.5 border-b border-slate-100 px-5 py-4">
          <div className="relative h-10 w-10 shrink-0 p-0.5 rounded-2xl bg-gradient-to-tr from-brand-600 via-indigo-600 to-indigo-900 shadow-sm">
            <div className="h-full w-full rounded-[14px] bg-slate-900 flex flex-col items-center justify-center text-center p-0.5 border border-white/20">
              <span className="font-serif font-black text-amber-400 text-sm tracking-wider">GIA</span>
              <span className="text-[7px] font-mono text-slate-300">1984</span>
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-white" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="block truncate text-sm font-black tracking-tight text-slate-900 font-display">
              Greenfield Academy
            </span>
            <span className="block truncate text-[11px] font-medium text-slate-500">
              Central Academic SIS
            </span>
          </div>
        </div>

        {/* Academic Context Badge */}
        <div className="mx-3.5 my-3 rounded-2xl bg-gradient-to-r from-slate-50 to-brand-50/60 p-2.5 border border-slate-200/80 flex items-center justify-between text-xs">
          <div className="text-[11px] font-bold text-slate-800 flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            2026–27 Session
          </div>
          <span className="rounded-lg bg-white px-2 py-0.5 text-[10px] font-black text-brand-700 border border-brand-200/80 shadow-subtle uppercase">
            Term 1
          </span>
        </div>

        {/* Navigation list */}
        <div className="flex-1 overflow-y-auto">
          <Sidebar items={items} />
        </div>

        {/* Admissions Quick Shortcut Link */}
        <div className="p-3 border-t border-slate-100 bg-slate-50/50">
          <Link
            href="/register"
            className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-brand-200/80 shadow-subtle hover:bg-brand-50/60 transition group text-xs"
          >
            <div className="flex items-center gap-2">
              <span>📝</span>
              <span className="font-bold text-slate-800">Admissions Desk</span>
            </div>
            <span className="text-brand-600 font-black group-hover:translate-x-0.5 transition-transform">→</span>
          </Link>
        </div>

        {/* Institutional Footer Info */}
        <div className="border-t border-slate-100 p-3.5 bg-slate-50/30 text-[11px] text-slate-500 flex items-center justify-between">
          <span className="flex items-center gap-1.5 font-bold text-slate-600">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Campus Network
          </span>
          <span className="text-[10px] font-bold text-slate-400 bg-white px-1.5 py-0.5 rounded border border-slate-200">
            CBSE 1930482
          </span>
        </div>
      </aside>

      {/* ── MAIN CONTENT AREA ── */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top Navbar */}
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200/90 bg-white/95 backdrop-blur-md px-5 sm:px-8 py-3.5 shadow-subtle">
          <div className="md:hidden flex items-center gap-2.5">
            <div className="grid h-8 w-8 place-items-center rounded-xl bg-brand-600 font-bold text-white text-xs">
              G
            </div>
            <span className="font-black text-sm text-slate-900 font-display">Greenfield SIS</span>
          </div>

          <div className="hidden sm:flex items-center gap-3 text-xs text-slate-600">
            <span className="font-bold text-slate-800">Active Scope:</span>
            {ctx.roleKeys.map((k) => (
              <span key={k}>{roleBadge(k)}</span>
            ))}
            <span className="text-slate-300">·</span>
            <span className="text-[11px] font-medium text-slate-500">
              Campus Net: <strong>Connected</strong>
            </span>
          </div>

          <div className="ml-auto flex items-center gap-3">
            {/* User profile capsule */}
            <div className="flex items-center gap-2.5 rounded-2xl border border-slate-200/90 bg-slate-50/80 py-1.5 pl-2 pr-3.5 shadow-subtle">
              <div className="grid h-8 w-8 place-items-center rounded-xl bg-gradient-to-br from-brand-600 to-indigo-600 font-bold text-white text-xs shadow-sm">
                {getInitials(ctx.name)}
              </div>
              <div className="text-left hidden sm:block">
                <div className="text-xs font-bold text-slate-900 leading-tight">{ctx.name}</div>
                <div className="text-[10px] text-slate-500 font-mono leading-none mt-0.5 truncate max-w-[150px]">
                  {ctx.email}
                </div>
              </div>
            </div>

            {/* Logout button */}
            <form action={logoutAction}>
              <button
                className="btn-ghost py-1.5 px-3.5 text-xs font-bold text-slate-700 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-200 transition-colors shadow-subtle"
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
