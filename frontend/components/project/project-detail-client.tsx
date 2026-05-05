"use client";

import Link from "next/link";
import useSWR from "swr";

import { AnalysisStatusBadge } from "@/components/meeting/analysis-status-badge";
import { PlatformBadge } from "@/components/meeting/platform-badge";
import { AggregatedChanges } from "@/components/project/aggregated-changes";
import { AggregatedDecisions } from "@/components/project/aggregated-decisions";
import { AggregatedRisks } from "@/components/project/aggregated-risks";
import { ProjectSummary } from "@/components/project/project-summary";
import { AggregatedTodos } from "@/components/project/aggregated-todos";
import { StageBadge } from "@/components/project/stage-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { SkeletonCard } from "@/components/ui/skeleton-card";
import { api } from "@/lib/api";
import { formatDateTime } from "@/lib/utils";

export function ProjectDetailClient({ projectId }: { projectId: string }) {
  const projectState = useSWR(`/api/projects/${projectId}`, () => api.getProject(projectId));
  const meetingsState = useSWR(`/api/projects/${projectId}/meetings`, () => api.listMeetings(projectId));

  if (projectState.isLoading || meetingsState.isLoading) {
    return (
      <div className="space-y-6">
        <SkeletonCard lines={3} hasButton />
        <SkeletonCard lines={4} />
        <div className="grid gap-6 md:grid-cols-2">
          <SkeletonCard lines={4} />
          <SkeletonCard lines={4} />
        </div>
      </div>
    );
  }

  if (projectState.error || meetingsState.error) {
    return <ErrorState message={projectState.error?.message || meetingsState.error?.message || "加载失败"} />;
  }

  const project = projectState.data;
  const meetings = meetingsState.data ?? [];
  if (!project) {
    return <ErrorState message="项目不存在" />;
  }

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader className="gap-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="space-y-2">
              <h1 className="text-3xl font-semibold">{project.name}</h1>
              <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
                {project.client_name ? <span>{project.client_name}</span> : null}
                {project.owner_name ? <span>负责人：{project.owner_name}</span> : null}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <StageBadge stage={project.current_stage} />
              <Link href={`/projects/${projectId}/chat`}>
                <Button variant="secondary">项目问答</Button>
              </Link>
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid gap-6 md:grid-cols-3">
          <div className="rounded-xl border border-gray-100 bg-gray-50/80 p-4">
            <h2 className="mb-2 text-sm font-medium text-gray-500">项目目标</h2>
            <p className="text-sm text-gray-700">{project.goal || "暂无项目目标"}</p>
          </div>
          <div className="rounded-xl border border-gray-100 bg-gray-50/80 p-4">
            <h2 className="mb-2 text-sm font-medium text-gray-500">项目描述</h2>
            <p className="text-sm text-gray-700">{project.description || "暂无项目描述"}</p>
          </div>
          <div className="rounded-xl border border-gray-100 bg-gray-50/80 p-4">
            <h2 className="mb-2 text-sm font-medium text-gray-500">验收标准</h2>
            <p className="text-sm text-gray-700">{project.acceptance_criteria || "暂无验收标准"}</p>
          </div>
        </CardContent>
      </Card>

      <ProjectSummary projectId={projectId} />

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>会议记录</CardTitle>
          <Link href={`/projects/${projectId}/meetings/new`}>
            <Button>导入会议</Button>
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
                  <Card className="transition hover:border-gray-300">
                    <CardContent className="flex flex-col gap-3 p-5 md:flex-row md:items-center md:justify-between">
                      <div className="space-y-2">
                        <h3 className="text-base font-medium">{meeting.title}</h3>
                        <div className="flex flex-wrap gap-2">
                          <PlatformBadge platform={meeting.platform} />
                          <AnalysisStatusBadge status={meeting.analysis_status} />
                        </div>
                      </div>
                      <div className="text-sm text-gray-500">{formatDateTime(meeting.meeting_time)}</div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <AggregatedTodos projectId={projectId} />
        <AggregatedRisks projectId={projectId} />
        <AggregatedChanges projectId={projectId} />
        <AggregatedDecisions projectId={projectId} />
      </div>
    </div>
  );
}
