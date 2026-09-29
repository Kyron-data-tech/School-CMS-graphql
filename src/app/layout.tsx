import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Greenfield International Academy | SIS & Academic Portal",
  description: "Comprehensive Student Information System & Enterprise Academic Management Platform.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="font-sans text-slate-800 antialiased selection:bg-brand-500 selection:text-white min-h-screen relative">
        {/* ── Fixed Atmospheric Educational Campus Wallpaper across entire website ── */}
        <div
          className="fixed inset-0 z-[-1] pointer-events-none bg-cover bg-center bg-fixed transition-all"
          style={{
            backgroundImage: "linear-gradient(to bottom, rgba(15, 23, 42, 0.84), rgba(15, 23, 42, 0.94)), url('/campus-background.jpg')",
          }}
        />
        {children}
      </body>
    </html>
  );
}
