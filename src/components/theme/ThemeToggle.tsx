"use client";

import { useState, useEffect } from "react";

export type ThemeMode = "combined" | "dark" | "light";

export function ThemeToggle() {
  const [theme, setTheme] = useState<ThemeMode>("combined");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const saved = (localStorage.getItem("gia_theme") as ThemeMode) || "combined";
    setTheme(saved);
    applyTheme(saved);
    setMounted(true);
  }, []);

  const applyTheme = (mode: ThemeMode) => {
    const root = document.documentElement;
    root.setAttribute("data-theme", mode);
    document.body.setAttribute("data-theme", mode);
    localStorage.setItem("gia_theme", mode);
    document.cookie = `gia_theme=${mode}; path=/; max-age=31536000; SameSite=Lax`;
  };

  const handleSelect = (mode: ThemeMode) => {
    setTheme(mode);
    applyTheme(mode);
  };

  if (!mounted) {
    return (
      <div className="h-8 w-24 rounded-xl bg-white/[0.04] border border-white/[0.08] animate-pulse" />
    );
  }

  return (
    <div
      className="flex items-center rounded-xl border border-white/[0.08] bg-white/[0.04] p-1 backdrop-blur-md shadow-sm"
      title="Switch Theme: Combined (Dark Sidebar + White Cards), Dark, or Light"
    >
      <button
        type="button"
        onClick={() => handleSelect("combined")}
        className={`flex items-center gap-1.5 rounded-lg px-2 py-1 text-[11px] font-bold transition ${
          theme === "combined"
            ? "bg-gradient-to-r from-brand-600 to-indigo-600 text-white shadow-sm ring-1 ring-white/10"
            : "text-slate-400 hover:text-white"
        }`}
        title="Combined Mode: Dark Frosted Sidebar + Crisp High-Contrast White Workspace"
      >
        <span>🌓</span>
        <span className="hidden sm:inline">Combined</span>
      </button>

      <button
        type="button"
        onClick={() => handleSelect("dark")}
        className={`flex items-center gap-1.5 rounded-lg px-2 py-1 text-[11px] font-bold transition ${
          theme === "dark"
            ? "bg-gradient-to-r from-brand-600 to-indigo-600 text-white shadow-sm ring-1 ring-white/10"
            : "text-slate-400 hover:text-white"
        }`}
        title="Dark Mode: Obsidian Dark Across All Screens"
      >
        <span>🌙</span>
        <span className="hidden sm:inline">Dark</span>
      </button>

      <button
        type="button"
        onClick={() => handleSelect("light")}
        className={`flex items-center gap-1.5 rounded-lg px-2 py-1 text-[11px] font-bold transition ${
          theme === "light"
            ? "bg-gradient-to-r from-brand-600 to-indigo-600 text-white shadow-sm ring-1 ring-white/10"
            : "text-slate-400 hover:text-white"
        }`}
        title="Light Mode: Bright Daylight Clean Theme"
      >
        <span>☀️</span>
        <span className="hidden sm:inline">Light</span>
      </button>
    </div>
  );
}
