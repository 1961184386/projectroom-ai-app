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
        <div className="min-h-screen bg-gray-50">
          <header className="border-b border-gray-200 bg-white/90 backdrop-blur">
            <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
              <Link href="/projects" className="flex items-center gap-2 text-lg font-semibold tracking-tight">
                <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect width="22" height="22" rx="6" fill="#2563EB" />
                  <rect x="5" y="6" width="12" height="1.8" rx="0.9" fill="white" />
                  <rect x="5" y="10.1" width="8" height="1.8" rx="0.9" fill="white" />
                  <rect x="5" y="14.2" width="10" height="1.8" rx="0.9" fill="white" />
                </svg>
                <span>ProjectRoom AI</span>
              </Link>
              <Link href="/projects/new">
                <Button className="shadow-sm">新建项目</Button>
              </Link>
            </div>
          </header>
          <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">{children}</main>
        </div>
      </body>
    </html>
  );
}
