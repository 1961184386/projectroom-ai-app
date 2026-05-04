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
              <Link href="/projects" className="text-lg font-semibold tracking-tight">
                ProjectRoom AI
              </Link>
              <Link href="/projects/new">
                <Button>新建项目</Button>
              </Link>
            </div>
          </header>
          <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">{children}</main>
        </div>
      </body>
    </html>
  );
}
