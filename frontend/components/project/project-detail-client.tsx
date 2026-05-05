"use client";

import Link from "next/link";
import { useState } from "react";
import useSWR from "swr";

import { AnalysisStatusBadge } from "@/components/meeting/analysis-status-badge";
import { PlatformBadge } from "@/components/meeting/platform-badge";
import { AggregatedChanges } from "@/components/project/aggregated-changes";
import { AggregatedDecisions } from "@/components/project/aggregated-decisions";
import { ProjectMaterials } from "@/components/project/project-materials";
import { AggregatedRisks } from "@/components/project/aggregated-risks";
import { ProjectSummary } from "@/components/project/project-summary";
import { ProjectTabs, type ProjectTabKey } from "@/components/project/project-tabs";
import { AggregatedTodos } from "@/components/project/aggregated-todos";
import { StageBadge } from "@/components/project/stage-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { SkeletonCard } from "@/components/ui/skeleton-card";
import { api } from "@/lib/api";
import { parseAcceptanceCriteria, formatDateTime } from "@/lib/utils";

export function ProjectDetailClient({ projectId }: { projectId: string }) {
  const [activeTab, setActiveTab] = useState<ProjectTabKey>("overview");
  const projectState = useSWR(`/api/projects/${projectId}`, () => api.getProject(projectId));
  const meetingsState = useSWR(`/api/projects/${projectId}/meetings`, () => api.listMeetings(projectId));
  const todosState = useSWR(`/api/projects/${projectId}/todos`, () => api.listProjectTodos(projectId));
  const risksState = useSWR(`/api/projects/${projectId}/risks`, () => api.listProjectRisks(projectId));
  const changesState = useSWR(`/api/projects/${projectId}/changes`, () => api.listProjectChanges(projectId));
  const decisionsState = useSWR(`/api/projects/${projectId}/decisions`, () => api.listProjectDecisions(projectId));

  if (
    projectState.isLoading ||
    meetingsState.isLoading ||
    todosState.isLoading ||
    risksState.isLoading ||
    changesState.isLoading ||
    decisionsState.isLoading
  ) {
    return (
      <div className="space-y-6">
        <SkeletonCard lines={3} hasButton />
        <SkeletonCard lines={2} />
        <SkeletonCard lines={4} />
      </div>
    );
  }

  if (
    projectState.error ||
    meetingsState.error ||
    todosState.error ||
    risksState.error ||
    changesState.error ||
    decisionsState.error
  ) {
    return (
      <ErrorState
        message={
          projectState.error?.message ||
          meetingsState.error?.message ||
          todosState.error?.message ||
          risksState.error?.message ||
          changesState.error?.message ||
          decisionsState.error?.message ||
          "加载失败"
        }
      />
    );
  }

  const project = projectState.data;
  const meetings = meetingsState.data ?? [];
  const todos = todosState.data ?? [];
  const risks = risksState.data ?? [];
  const changes = changesState.data ?? [];
  const decisions = decisionsState.data ?? [];

  if (!project) {
    return <ErrorState message="项目不存在" />;
  }

  const acceptanceItems = parseAcceptanceCriteria(project.acceptance_criteria);
  const tabs = [
    { key: "overview" as const, label: "概览", count: 4 },
    { key: "meetings" as const, label: "会议记录", count: meetings.length },
    { key: "todos" as const, label: "任务清单", count: todos.length },
    { key: "risks" as const, label: "风险台账", count: risks.length },
    { key: "changes" as const, label: "需求变更", count: changes.length },
    { key: "decisions" as const, label: "决策记录", count: decisions.length },
    { key: "acceptance" as const, label: "验收标准", count: acceptanceItems.length }
  ];

  const metrics = [
    { label: "会议沉淀", value: meetings.length, hint: "已归档会议" },
    { label: "待办推进", value: todos.filter((item) => item.status === "pending").length, hint: "待处理任务" },
    { label: "重点风险", value: risks.filter((item) => item.level === "high").length, hint: "高风险项" },
    { label: "待确认事项", value: [...todos, ...risks, ...changes, ...decisions].filter((item) => !item.confirmed).length, hint: "需人工确认" }
  ];

  return (
    <div className="space-y-8">
      <Card className="overflow-hidden border-slate-200 bg-[radial-gradient(circle_at_top_left,_rgba(20,184,166,0.14),_transparent_30%),linear-gradient(135deg,#ffffff_0%,#f8fafc_100%)]">
        <CardHeader className="gap-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-3xl font-semibold text-slate-900">{project.name}</h1>
                <StageBadge stage={project.current_stage} />
              </div>
              <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500">
                {project.client_name ? <span>{project.client_name}</span> : null}
                {project.owner_name ? <span>负责人：{project.owner_name}</span> : null}
                {project.last_meeting_time ? <span>最近会议：{formatDateTime(project.last_meeting_time)}</span> : null}
              </div>
              <p className="max-w-3xl text-sm leading-7 text-slate-600">{project.description || "暂无项目描述"}</p>
            </div>
            <div className="flex items-center gap-3">
              <Link href={`/projects/${projectId}/meetings/new`}>
                <Button variant="outline">导入会议</Button>
              </Link>
              <Link href={`/projects/${projectId}/chat`}>
                <Button>项目问答</Button>
              </Link>
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {metrics.map((metric) => (
            <div key={metric.label} className="rounded-2xl border border-white/70 bg-white/80 p-4">
              <p className="text-sm text-slate-500">{metric.label}</p>
              <p className="mt-3 text-3xl font-semibold text-slate-900">{metric.value}</p>
              <p className="mt-1 text-xs text-slate-400">{metric.hint}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <ProjectTabs activeTab={activeTab} onChange={setActiveTab} tabs={tabs} />

      {activeTab === "overview" ? (
        <div className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>项目目标</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm leading-7 text-slate-600">{project.goal || "暂无项目目标"}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>验收标准概览</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {acceptanceItems.length === 0 ? (
                      <p className="text-sm text-slate-500">暂无验收标准</p>
                    ) : (
                      acceptanceItems.slice(0, 3).map((item, index) => (
                        <div key={`${item}-${index}`} className="rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-600">
                          {item}
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>
              </div>
              <ProjectSummary projectId={projectId} />
            </div>
            <ProjectMaterials projectId={projectId} />
          </div>
        </div>
      ) : null}

      {activeTab === "meetings" ? (
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>会议记录</CardTitle>
            <Link href={`/projects/${projectId}/meetings/new`}>
              <Button>继续导入</Button>
            </Link>
          </CardHeader>
          <CardContent>
            {meetings.length === 0 ? (
              <EmptyState
                title="还没有会议记录"
                description="先导入一次会议转写，项目空间才能开始积累内容。"
                actionHref={`/projects/${projectId}/meetings/new`}
                actionLabel="导入会议"
              />
            ) : (
              <div className="space-y-4">
                {meetings.map((meeting) => (
                  <Link key={meeting.id} href={`/projects/${projectId}/meetings/${meeting.id}`}>
                    <Card className="transition hover:border-slate-300">
                      <CardContent className="flex flex-col gap-3 p-5 md:flex-row md:items-center md:justify-between">
                        <div className="space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-base font-medium">{meeting.title}</h3>
                            <Badge variant="info">{meeting.transcript_text.length} 字</Badge>
                            {meeting.external_meeting_id ? <Badge variant="warning">{meeting.external_platform || meeting.platform} · 已接入</Badge> : null}
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <PlatformBadge platform={meeting.platform} />
                            <AnalysisStatusBadge status={meeting.analysis_status} />
                          </div>
                        </div>
                        <div className="text-sm text-slate-500">{formatDateTime(meeting.meeting_time)}</div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      ) : null}

      {activeTab === "todos" ? <AggregatedTodos projectId={projectId} /> : null}
      {activeTab === "risks" ? <AggregatedRisks projectId={projectId} /> : null}
      {activeTab === "changes" ? <AggregatedChanges projectId={projectId} /> : null}
      {activeTab === "decisions" ? <AggregatedDecisions projectId={projectId} /> : null}

      {activeTab === "acceptance" ? (
        <Card>
          <CardHeader>
            <CardTitle>验收标准</CardTitle>
          </CardHeader>
          <CardContent>
            {acceptanceItems.length === 0 ? (
              <p className="text-sm text-slate-500">当前项目还没有拆分后的验收标准条目。</p>
            ) : (
              <div className="space-y-3">
                {acceptanceItems.map((item, index) => (
                  <div key={`${item}-${index}`} className="flex gap-3 rounded-2xl border border-slate-200 p-4">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-teal-50 text-sm font-semibold text-teal-700">
                      {index + 1}
                    </span>
                    <p className="text-sm leading-7 text-slate-600">{item}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
