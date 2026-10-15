"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { NavItem } from "@/lib/nav";
import { Sidebar } from "./Sidebar";
import { logoutAction } from "@/lib/auth/actions";

interface MobileNavigationProps {
  items: NavItem[];
  user: {
    name: string;
    email: string;
    roleKeys: string[];
  };
}

export function MobileNavigation({ items, user }: MobileNavigationProps) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  // Close drawer on route change
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Prevent background scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const getInitials = (name: string) =>
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();

  return (
    <>
      {/* ── MOBILE HAMBURGER TOGGLE BUTTON IN NAVBAR ── */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="md:hidden flex items-center justify-center h-9 w-9 rounded-xl bg-white/[0.06] border border-white/[0.12] text-slate-200 hover:text-white hover:bg-white/[0.12] transition active:scale-95 shadow-sm"
        aria-label="Open mobile navigation menu"
        title="Open navigation menu"
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
        </svg>
      </button>

      {/* ── SLIDE-OVER MOBILE DRAWER BACKDROP & PANEL ── */}
      {isOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex animate-in fade-in duration-200">
          {/* Dimmed Blurred Backdrop */}
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />

          {/* Slide-out Drawer Menu */}
          <div className="relative z-50 w-72 max-w-[85vw] h-full flex flex-col bg-slate-950/95 backdrop-blur-2xl border-r border-white/[0.12] shadow-2xl text-slate-100 animate-in slide-in-from-left duration-250">
            {/* Header: Brand & Close Button */}
            <div className="flex items-center justify-between border-b border-white/[0.08] p-4 bg-white/[0.02]">
              <div className="flex items-center gap-3">
                <div className="relative h-9 w-9 shrink-0 p-0.5 rounded-xl bg-gradient-to-tr from-brand-500 via-indigo-500 to-cyan-400 shadow-[0_0_15px_rgba(99,102,241,0.5)]">
                  <div className="h-full w-full rounded-[9px] bg-[#090d16] flex flex-col items-center justify-center text-center p-0.5 border border-white/20">
                    <span className="font-display font-extrabold text-white text-xs tracking-wider">GIA</span>
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full bg-emerald-400 ring-2 ring-slate-950 animate-pulse" />
                </div>
                <div>
                  <span className="block truncate text-sm font-extrabold tracking-tight text-white font-display">
                    Greenfield SIS
                  </span>
                  <span className="block truncate text-[10px] font-medium text-slate-400">
                    Academic Session 2026–27
                  </span>
                </div>
              </div>

              {/* Close Button */}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="h-8 w-8 rounded-xl bg-white/[0.06] border border-white/[0.1] text-slate-400 hover:text-white flex items-center justify-center transition"
                aria-label="Close navigation"
              >
                ✕
              </button>
            </div>

            {/* Academic Session Pill */}
            <div className="mx-3.5 my-2.5 rounded-xl bg-white/[0.03] p-2 border border-white/[0.08] flex items-center justify-between text-xs backdrop-blur-md">
              <div className="text-[11px] font-bold text-slate-200 flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                Session 2026–27
              </div>
              <span className="rounded-lg bg-brand-500/15 px-2 py-0.5 text-[10px] font-mono font-bold text-brand-300 border border-brand-500/30 uppercase">
                Term 1
              </span>
            </div>

            {/* Scrollable Navigation Items */}
            <div className="flex-1 overflow-y-auto px-1">
              <Sidebar items={items} onNavigate={() => setIsOpen(false)} />
            </div>

            {/* Admissions Quick Shortcut Link */}
            <div className="p-3 border-t border-white/[0.08] bg-white/[0.01]">
              <Link
                href="/register"
                onClick={() => setIsOpen(false)}
                className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] hover:border-white/[0.16] transition group text-xs text-white shadow-sm"
              >
                <div className="flex items-center gap-2">
                  <span className="text-base">📝</span>
                  <span className="font-bold text-slate-100">Admissions Desk</span>
                </div>
                <span className="text-brand-400 font-bold group-hover:translate-x-0.5 transition-transform">→</span>
              </Link>
            </div>

            {/* Mobile Footer: User Info & Sign Out */}
            <div className="border-t border-white/[0.08] p-3.5 bg-slate-900/60 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-brand-600 via-indigo-600 to-indigo-700 font-bold text-white text-xs shadow-sm">
                  {getInitials(user.name)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold text-white truncate leading-tight">{user.name}</div>
                  <div className="text-[10px] text-slate-400 font-mono truncate">{user.email}</div>
                </div>
              </div>

              <form action={logoutAction}>
                <button
                  type="submit"
                  className="px-2.5 py-1.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-[11px] font-bold text-rose-300 hover:bg-rose-500/25 transition shrink-0"
                >
                  Exit
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
