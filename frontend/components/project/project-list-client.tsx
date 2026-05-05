"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import useSWR from "swr";

import { ProjectCard } from "@/components/project/project-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { SkeletonCard } from "@/components/ui/skeleton-card";
import { api } from "@/lib/api";

const stageOptions = ["全部", "需求确认", "开发中", "测试", "验收", "完成"];

export function ProjectListClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isSeeding, setIsSeeding] = useState(false);
  const selectedStage = searchParams.get("stage") ?? "";

  const projectsKey = `/api/projects${selectedStage ? `?stage=${selectedStage}` : ""}`;

  const { data, error, isLoading, mutate } = useSWR(projectsKey, () => api.listProjects(selectedStage || undefined));
  const statsState = useSWR("/api/dashboard/stats", api.getDashboardStats);
  const demoState = useSWR("/api/demo/status", api.getDemoStatus);

  async function handleSeedDemo() {
    setIsSeeding(true);
    try {
      await api.seedDemoData();
      await Promise.all([mutate(), statsState.mutate(), demoState.mutate()]);
    } finally {
      setIsSeeding(false);
    }
  }

  function handleStageChange(stage: string) {
    const next = new URLSearchParams(searchParams.toString());
    if (!stage || stage === "全部") {
      next.delete("stage");
    } else {
      next.set("stage", stage);
    }
    router.push(`/projects${next.toString() ? `?${next.toString()}` : ""}`);
  }

  const stats = statsState.data;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <SkeletonCard lines={2} />
          <SkeletonCard lines={2} />
          <SkeletonCard lines={2} />
          <SkeletonCard lines={2} />
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <SkeletonCard lines={3} hasButton />
          <SkeletonCard lines={3} hasButton />
          <SkeletonCard lines={3} hasButton />
        </div>
      </div>
    );
  }

  if (error) {
    return <ErrorState message={error.message} />;
  }

  if (!data || data.length === 0) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            { label: "项目总数", value: stats?.total_projects ?? 0 },
            { label: "会议总数", value: stats?.total_meetings ?? 0 },
            { label: "待处理任务", value: stats?.pending_action_items ?? 0 },
            { label: "活跃风险", value: stats?.active_risks ?? 0 }
          ].map((item) => (
            <div key={item.label} className="rounded-3xl border border-slate-200 bg-white px-5 py-4 shadow-[0_20px_50px_-40px_rgba(15,23,42,0.5)]">
              <p className="text-sm text-slate-500">{item.label}</p>
              <p className="mt-3 text-3xl font-semibold text-slate-900">{item.value}</p>
            </div>
          ))}
        </div>
        <EmptyState
          title="还没有项目空间"
          description="可以先创建真实项目，也可以一键加载演示数据，直接查看完整的会议分析、任务确认和汇总页面。"
        />
        <div className="flex flex-wrap gap-3">
          <Button onClick={handleSeedDemo} disabled={isSeeding}>
            {isSeeding ? "加载中..." : "快速体验"}
          </Button>
          <Button variant="outline" onClick={() => router.push("/projects/new")}>
            新建项目
          </Button>
          {demoState.data?.seeded ? <Badge variant="success">已存在 Demo 数据</Badge> : null}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "项目总数", value: stats?.total_projects ?? 0 },
          { label: "会议总数", value: stats?.total_meetings ?? 0 },
          { label: "待处理任务", value: stats?.pending_action_items ?? 0 },
          { label: "活跃风险", value: stats?.active_risks ?? 0 }
        ].map((item) => (
          <div key={item.label} className="rounded-3xl border border-slate-200 bg-white px-5 py-4 shadow-[0_20px_50px_-40px_rgba(15,23,42,0.5)]">
            <p className="text-sm text-slate-500">{item.label}</p>
            <p className="mt-3 text-3xl font-semibold text-slate-900">{item.value}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-4 rounded-[1.75rem] border border-slate-200 bg-white/90 p-5 shadow-[0_24px_70px_-50px_rgba(15,23,42,0.45)] md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap gap-2">
          {stageOptions.map((stage) => {
            const isActive = (stage === "全部" && !selectedStage) || stage === selectedStage;
            return (
              <Button
                key={stage}
                type="button"
                variant={isActive ? "default" : "outline"}
                size="sm"
                onClick={() => handleStageChange(stage)}
              >
                {stage}
              </Button>
            );
          })}
        </div>
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" onClick={handleSeedDemo} disabled={isSeeding}>
            {isSeeding ? "加载 Demo..." : "加载 Demo 数据"}
          </Button>
          <Button onClick={() => router.push("/projects/new")}>新建项目</Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {data.map((project) => (
          <ProjectCard key={project.id} project={project} />
        ))}
      </div>
    </div>
  );
}
