"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type ProjectTabKey =
  | "overview"
  | "meetings"
  | "todos"
  | "risks"
  | "changes"
  | "decisions"
  | "acceptance";

export function ProjectTabs({
  activeTab,
  onChange,
  tabs
}: {
  activeTab: ProjectTabKey;
  onChange: (tab: ProjectTabKey) => void;
  tabs: Array<{ key: ProjectTabKey; label: string; count: number }>;
}) {
  return (
    <div className="overflow-x-auto">
      <div className="flex min-w-max gap-2 rounded-[1.5rem] border border-slate-200 bg-white/90 p-2 shadow-[0_24px_70px_-50px_rgba(15,23,42,0.45)]">
        {tabs.map((tab) => {
          const isActive = tab.key === activeTab;
          return (
            <Button
              key={tab.key}
              type="button"
              variant="ghost"
              onClick={() => onChange(tab.key)}
              className={cn(
                "h-auto rounded-xl px-4 py-3 text-sm",
                isActive ? "bg-slate-900 text-white hover:bg-slate-800" : "text-slate-600 hover:bg-slate-100"
              )}
            >
              <span>{tab.label}</span>
              <Badge variant={isActive ? "default" : "info"} className={isActive ? "bg-white/15 text-white" : ""}>
                {tab.count}
              </Badge>
            </Button>
          );
        })}
      </div>
    </div>
  );
}
