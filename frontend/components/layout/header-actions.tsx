"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";

const toastMessage = "钉钉扫码登录功能即将开放，当前请使用手动导入或文件上传";

export function HeaderActions() {
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    if (!showToast) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      setShowToast(false);
    }, 2800);

    return () => window.clearTimeout(timeoutId);
  }, [showToast]);

  return (
    <div className="relative flex items-center gap-3">
      <div
        role="button"
        tabIndex={0}
        className="rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
        onClick={() => setShowToast(true)}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            setShowToast(true);
          }
        }}
      >
        <Button variant="outline" disabled className="gap-2 border-white/15 bg-white/10 text-white hover:bg-white/10">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <path d="M2.4 3.2C2.4 2.54 2.94 2 3.6 2H12.4C13.06 2 13.6 2.54 13.6 3.2V9.6C13.6 10.26 13.06 10.8 12.4 10.8H9.64L7.2 13.4C6.92 13.7 6.4 13.5 6.4 13.08V10.8H3.6C2.94 10.8 2.4 10.26 2.4 9.6V3.2Z" fill="currentColor" fillOpacity="0.92" />
            <circle cx="5.4" cy="6.4" r="0.85" fill="#0F172A" />
            <circle cx="8" cy="6.4" r="0.85" fill="#0F172A" />
            <circle cx="10.6" cy="6.4" r="0.85" fill="#0F172A" />
          </svg>
          钉钉登录
          <span className="ml-1 text-xs text-white/65">即将开放</span>
        </Button>
      </div>
      <Link href="/settings/integrations" className="text-sm text-white/90 transition hover:text-white">
        集成设置
      </Link>
      <Link href="/projects/new">
        <Button className="border border-white/15 bg-white text-slate-900 hover:bg-slate-100">新建项目</Button>
      </Link>
      {showToast ? (
        <div className="absolute right-0 top-full z-20 mt-3 w-80 rounded-2xl border border-white/20 bg-slate-950/95 px-4 py-3 text-sm text-white shadow-2xl backdrop-blur">
          {toastMessage}
        </div>
      ) : null}
    </div>
  );
}
