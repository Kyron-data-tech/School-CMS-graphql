"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { NavItem } from "@/lib/nav";

const iconMap: Record<string, string> = {
  "/": "📊",
  "/students": "👥",
  "/attendance": "📅",
  "/homework": "📝",
  "/results": "🏆",
  "/timetable": "⏰",
  "/activities": "⚽",
  "/announcements": "📢",
  "/knowledge": "📚",
  "/copilot": "✨",
  "/graphql": "⚡",
  "/roles": "🛡️",
  "/audit": "📜",
  "/api/graphql": "↗",
};

export function Sidebar({ items }: { items: NavItem[] }) {
  const pathname = usePathname();

  // Categorize navigation items into clean logical clusters
  const academicGroup = items.filter((i) =>
    ["/", "/students", "/attendance", "/homework", "/results", "/timetable"].includes(i.href)
  );
  const communityGroup = items.filter((i) =>
    ["/activities", "/announcements", "/knowledge"].includes(i.href)
  );
  const toolsGroup = items.filter((i) =>
    ["/copilot", "/graphql", "/roles", "/audit", "/api/graphql"].includes(i.href)
  );

  const renderGroup = (title: string, groupItems: NavItem[]) => {
    if (groupItems.length === 0) return null;
    return (
      <div className="mb-5">
        <div className="px-3 mb-2 text-[10px] font-black uppercase tracking-widest text-slate-400 font-display">
          {title}
        </div>
        <div className="space-y-1">
          {groupItems.map((item) => {
            const isApi = item.href.startsWith("/api");
            const active =
              !isApi && (item.href === "/" ? pathname === "/" : pathname.startsWith(item.href));
            const icon = iconMap[item.href] || "•";
            const isAi = item.href === "/copilot";
            const isGql = item.href === "/graphql";

            return (
              <Link
                key={item.href}
                href={item.href}
                target={isApi ? "_blank" : undefined}
                rel={isApi ? "noreferrer" : undefined}
                aria-current={active ? "page" : undefined}
                className={`group relative flex items-center gap-3 rounded-2xl px-3.5 py-2.5 text-xs font-bold transition-all duration-200 ${
                  active
                    ? "bg-gradient-to-r from-brand-600 to-indigo-600 text-white shadow-sm ring-1 ring-white/10"
                    : isAi
                    ? "text-brand-800 bg-brand-50/70 hover:bg-brand-100/90 font-black"
                    : isGql
                    ? "text-indigo-800 bg-indigo-50/70 hover:bg-indigo-100/90 font-black"
                    : "text-slate-600 hover:bg-slate-100/80 hover:text-slate-900"
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
                  <span className="rounded-full bg-brand-200/70 text-brand-900 px-1.5 py-0.2 text-[9px] font-black uppercase">
                    AI
                  </span>
                )}
                {isApi && (
                  <span className="text-[10px] text-slate-400 group-hover:text-slate-700">↗</span>
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
      {renderGroup("Campus Life & Circulars", communityGroup)}
      {renderGroup("Intelligence & System", toolsGroup)}
    </nav>
  );
}
