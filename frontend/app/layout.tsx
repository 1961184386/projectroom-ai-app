import Link from "next/link";
import type { Metadata } from "next";

import "@/app/globals.css";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "ProjectRoom AI",
  description: "AI-powered project meeting workspace"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>
        <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(20,184,166,0.08),_transparent_30%),linear-gradient(180deg,#f8fafc_0%,#f8fafc_55%,#fdfcf7_100%)]">
          <header className="border-b border-white/30 bg-[linear-gradient(120deg,rgba(15,23,42,0.96),rgba(15,118,110,0.9),rgba(245,158,11,0.72))] text-white shadow-[0_18px_50px_-28px_rgba(15,23,42,0.75)] backdrop-blur">
            <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
              <Link href="/projects" className="flex items-center gap-2 text-lg font-semibold tracking-tight">
                <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect width="22" height="22" rx="6" fill="#0F172A" />
                  <rect x="5" y="6" width="12" height="1.8" rx="0.9" fill="white" />
                  <rect x="5" y="10.1" width="8" height="1.8" rx="0.9" fill="white" />
                  <rect x="5" y="14.2" width="10" height="1.8" rx="0.9" fill="white" />
                </svg>
                <span>ProjectRoom AI</span>
              </Link>
              <div className="flex items-center gap-3">
                <Link href="/settings/integrations" className="text-sm text-white/90 transition hover:text-white">
                  集成设置
                </Link>
                <Link href="/projects/new">
                  <Button className="border border-white/15 bg-white text-slate-900 hover:bg-slate-100">新建项目</Button>
                </Link>
              </div>
            </div>
          </header>
          <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">{children}</main>
          <footer className="border-t border-slate-200/80 bg-white/80">
            <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-6 text-sm text-slate-500 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
              <p>© 2026 ProjectRoom AI</p>
              <p>Demo path: Create project → Import transcript → AI analysis → Confirm items → Review aggregated workspace</p>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
