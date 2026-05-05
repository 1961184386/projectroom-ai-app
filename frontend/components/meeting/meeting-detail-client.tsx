"use client";

import { useState } from "react";
import useSWR from "swr";

import { AnalysisResult } from "@/components/analysis/analysis-result";
import { AnalysisStatusBadge } from "@/components/meeting/analysis-status-badge";
import { PlatformBadge } from "@/components/meeting/platform-badge";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ErrorState } from "@/components/ui/error-state";
import { SkeletonCard } from "@/components/ui/skeleton-card";
import { api } from "@/lib/api";
import { formatDateTime } from "@/lib/utils";

export function MeetingDetailClient({
  projectId,
  meetingId
}: {
  projectId: string;
  meetingId: string;
}) {
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const meetingState = useSWR(
    `/api/projects/${projectId}/meetings/${meetingId}`,
    () => api.getMeeting(projectId, meetingId)
  );
  const analysisState = useSWR(
    meetingState.data?.analysis_status === "done"
      ? `/api/meetings/${meetingId}/analysis`
      : null,
    () => api.getAnalysis(meetingId)
  );

  async function handleAnalyze() {
    setSubmitError("");
    setIsSubmitting(true);
    await meetingState.mutate(
      (current) => (current ? { ...current, analysis_status: "processing" } : current),
      { revalidate: false }
    );

    try {
      const analysis = await api.analyzeMeeting(meetingId);
      await analysisState.mutate(analysis, { revalidate: false });
      await meetingState.mutate();
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "AI 分析失败，请重试");
      await meetingState.mutate();
    } finally {
      setIsSubmitting(false);
    }
  }

  if (meetingState.isLoading) {
    return (
      <div className="space-y-6">
        <SkeletonCard lines={3} />
        <SkeletonCard lines={5} />
        <SkeletonCard lines={4} />
      </div>
    );
  }

  if (meetingState.error) {
    return <ErrorState message={meetingState.error.message} />;
  }

  const meeting = meetingState.data;
  if (!meeting) {
    return <ErrorState message="会议不存在" />;
  }

  const analysisStatus = meeting.analysis_status;

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4">
        <Breadcrumb href={`/projects/${projectId}`} label="返回项目详情" />
        <Card>
          <CardHeader className="gap-3">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-2xl font-semibold">{meeting.title}</h1>
                <p className="mt-2 text-sm text-gray-500">{formatDateTime(meeting.meeting_time)}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <PlatformBadge platform={meeting.platform} />
                <AnalysisStatusBadge status={meeting.analysis_status} />
              </div>
            </div>
            {meeting.participants ? (
              <p className="text-sm text-gray-600">参会人：{meeting.participants}</p>
            ) : null}
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between gap-3">
          <CardTitle>会议转写内容</CardTitle>
          <span className="text-xs text-gray-400">{meeting.transcript_text.length} 字</span>
        </CardHeader>
        <CardContent>
          <div className="max-h-[420px] overflow-y-auto rounded-lg bg-gray-50 p-4 text-sm leading-7 text-gray-700">
            <pre className="whitespace-pre-wrap font-sans">{meeting.transcript_text}</pre>
          </div>
        </CardContent>
      </Card>

      <Card className="border-dashed">
        <CardHeader>
          <CardTitle>AI 分析结果</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 animate-[fade-in_0.4s_ease-out]">
          {analysisStatus === "processing" ? (
            <div className="space-y-4">
              <SkeletonCard lines={4} />
              <p className="text-sm text-gray-500">AI 分析中，请稍候...</p>
            </div>
          ) : null}

          {analysisStatus === "done" ? (
            analysisState.isLoading ? (
              <SkeletonCard lines={5} />
            ) : analysisState.error ? (
              <ErrorState message={analysisState.error.message} />
            ) : analysisState.data ? (
              <AnalysisResult analysis={analysisState.data} />
            ) : (
              <ErrorState message="分析结果加载失败" />
            )
          ) : null}

          {analysisStatus === "failed" ? (
            <Card className="border-rose-200 bg-rose-50">
              <CardContent className="space-y-4 p-6">
                <p className="text-sm text-rose-700">AI 分析失败，请重试</p>
                <Button onClick={handleAnalyze} disabled={isSubmitting}>
                  {isSubmitting ? "分析中..." : "重新分析"}
                </Button>
              </CardContent>
            </Card>
          ) : null}

          {analysisStatus === "pending" ? (
            <>
              <p className="text-sm text-gray-500">
                点击开始 AI 分析，自动提取任务、风险、需求变更和决策
              </p>
              {submitError ? <p className="text-sm text-rose-600">{submitError}</p> : null}
              <Button onClick={handleAnalyze} disabled={isSubmitting}>
                {isSubmitting ? "分析中..." : "开始 AI 分析"}
              </Button>
            </>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
