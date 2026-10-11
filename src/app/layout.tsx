import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Greenfield International Academy | SIS & Academic Portal",
  description: "Comprehensive Student Information System & Enterprise Academic Management Platform.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark scroll-smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="font-sans text-slate-100 antialiased selection:bg-brand-500 selection:text-white min-h-screen relative bg-[#07090e]">
        {/* ── Modern Atmospheric Ambient Mesh Background ── */}
        <div className="fixed inset-0 z-[-1] pointer-events-none overflow-hidden">
          {/* Top ambient radial glow */}
          <div className="absolute -top-[300px] left-1/2 -translate-x-1/2 w-[1000px] h-[600px] rounded-full bg-gradient-to-b from-brand-600/15 via-indigo-600/10 to-transparent blur-[120px]" />
          {/* Bottom subtle secondary glow */}
          <div className="absolute -bottom-[300px] right-[-100px] w-[800px] h-[600px] rounded-full bg-gradient-to-t from-indigo-700/10 via-purple-700/5 to-transparent blur-[140px]" />
          {/* Sleek noise/grid matrix pattern */}
          <div
            className="absolute inset-0 opacity-[0.03] pointer-events-none"
            style={{
              backgroundImage: `radial-gradient(rgba(255, 255, 255, 0.4) 1px, transparent 1px)`,
              backgroundSize: "24px 24px",
            }}
          />
        </div>
        {children}
      </body>
    </html>
  );
}
