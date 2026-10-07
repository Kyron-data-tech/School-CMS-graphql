"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { NavItem } from "@/lib/nav";

const iconMap: Record<string, string> = {
  "/": "📊",
  "/students": "👥",
  "/attendance": "📅",
  "/homework": "📝",
  "/notes": "📖",
  "/results": "🏆",
  "/timetable": "⏰",
  "/transport": "🚌",
  "/library": "📚",
  "/fees": "💳",
  "/activities": "⚽",
  "/announcements": "📢",
  "/copilot": "✨",
  "/roles": "🛡️",
  "/audit": "📜",
};

export function Sidebar({ items }: { items: NavItem[] }) {
  const pathname = usePathname();

  // Categorize navigation items into clean logical clusters
  const academicGroup = items.filter((i) =>
    ["/", "/students", "/attendance", "/homework", "/notes", "/results", "/timetable", "/library"].includes(i.href)
  );
  const operationsGroup = items.filter((i) =>
    ["/transport", "/fees", "/activities", "/announcements"].includes(i.href)
  );
  const adminGroup = items.filter((i) =>
    ["/copilot", "/roles", "/audit"].includes(i.href)
  );

  const renderGroup = (title: string, groupItems: NavItem[]) => {
    if (groupItems.length === 0) return null;
    return (
      <div className="mb-5">
        <div className="px-3 mb-2 text-[10px] font-black uppercase tracking-widest text-slate-500 font-display">
          {title}
        </div>
        <div className="space-y-1">
          {groupItems.map((item) => {
            const active =
              item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            const icon = iconMap[item.href] || "•";
            const isAi = item.href === "/copilot";

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`group relative flex items-center gap-3 rounded-2xl px-3.5 py-2.5 text-xs font-bold transition-all duration-200 ${
                  active
                    ? "bg-gradient-to-r from-brand-600 to-indigo-600 text-white shadow-glow ring-1 ring-white/10"
                    : isAi
                    ? "text-brand-300 bg-brand-950/60 hover:bg-brand-900/80 border border-brand-800/60 font-black"
                    : "text-slate-400 hover:bg-slate-800/70 hover:text-white"
                }`}
              >
                {active && (
                  <span className="absolute left-1 top-1/2 -translate-y-1/2 h-6 w-1 rounded-full bg-white shadow-sm" />
                )}
                <span
                  className={`text-base transition-transform duration-150 group-hover:scale-110 ${
                    active ? "opacity-100" : "opacity-80"
                  }`}
                >
                  {icon}
                </span>
                <span className="flex-1 truncate tracking-tight">{item.label}</span>
                {isAi && (
                  <span className="rounded-full bg-brand-900/80 text-brand-300 px-1.5 py-0.2 text-[9px] font-black uppercase border border-brand-700/60">
                    AI
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <nav className="flex flex-col p-3.5" aria-label="Main navigation">
      {renderGroup("Academic Operations", academicGroup)}
      {renderGroup("Campus Operations & Finance", operationsGroup)}
      {renderGroup("Staff & System Governance", adminGroup)}
    </nav>
  );
}
