"use client";

import { useState, useEffect } from "react";

export function ThemeToggle() {
  // isWhiteMode: true = Combined White Mode (Dark Sidebar + Crisp White Cards), false = Pure Dark Mode
  const [isWhiteMode, setIsWhiteMode] = useState<boolean>(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("gia_theme") || "combined";
    const whiteActive = saved === "combined" || saved === "light";
    setIsWhiteMode(whiteActive);
    applyTheme(whiteActive ? "combined" : "dark");
    setMounted(true);
  }, []);

  const applyTheme = (mode: "combined" | "dark") => {
    const root = document.documentElement;
    root.setAttribute("data-theme", mode);
    document.body.setAttribute("data-theme", mode);
    localStorage.setItem("gia_theme", mode);
    document.cookie = `gia_theme=${mode}; path=/; max-age=31536000; SameSite=Lax`;
  };

  const handleToggle = () => {
    const nextState = !isWhiteMode;
    setIsWhiteMode(nextState);
    applyTheme(nextState ? "combined" : "dark");
  };

  if (!mounted) {
    return (
      <div className="h-8 w-28 rounded-full bg-white/[0.04] border border-white/[0.08] animate-pulse" />
    );
  }

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isWhiteMode}
      onClick={handleToggle}
      className={`group relative inline-flex items-center gap-2 rounded-full py-1 pl-2 pr-3 transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 border shadow-sm ${
        isWhiteMode
          ? "bg-white border-slate-300 text-slate-800 shadow-slate-200"
          : "bg-slate-900 border-white/[0.15] text-slate-300 shadow-slate-950"
      }`}
      title={isWhiteMode ? "Switch to Pure Dark Mode" : "Switch to Combined White Mode"}
    >
      {/* Sliding Track & Thumb Knob */}
      <span
        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-300 ease-in-out ${
          isWhiteMode ? "bg-amber-500 shadow-sm shadow-amber-500/30" : "bg-slate-700"
        }`}
      >
        <span
          className={`pointer-events-none inline-flex h-4 w-4 transform items-center justify-center rounded-full bg-white shadow ring-0 transition-transform duration-300 ease-in-out text-[9px] ${
            isWhiteMode ? "translate-x-4" : "translate-x-0"
          }`}
        >
          {isWhiteMode ? "☀️" : "🌙"}
        </span>
      </span>

      {/* Mode Label */}
      <span className="text-[11px] font-bold select-none tracking-tight font-display">
        {isWhiteMode ? "White Mode" : "Dark Mode"}
      </span>
    </button>
  );
}
