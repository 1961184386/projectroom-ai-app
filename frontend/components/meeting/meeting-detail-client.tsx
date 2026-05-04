"use client";

import Link from "next/link";
import useSWR from "swr";

import { AnalysisStatusBadge } from "@/components/meeting/analysis-status-badge";
import { PlatformBadge } from "@/components/meeting/platform-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ErrorState } from "@/components/ui/error-state";
import { Spinner } from "@/components/ui/spinner";
import { api } from "@/lib/api";
import { formatDateTime } from "@/lib/utils";

export function MeetingDetailClient({
  projectId,
  meetingId
}: {
  projectId: string;
  meetingId: string;
}) {
  const meetingState = useSWR(
    `/api/projects/${projectId}/meetings/${meetingId}`,
    () => api.getMeeting(projectId, meetingId)
  );

  if (meetingState.isLoading) {
    return <Spinner />;
  }

  if (meetingState.error) {
    return <ErrorState message={meetingState.error.message} />;
  }

  const meeting = meetingState.data;
  if (!meeting) {
    return <ErrorState message="会议不存在" />;
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4">
        <Link href={`/projects/${projectId}`} className="text-sm text-gray-500 hover:text-gray-900">
          返回项目详情
        </Link>
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
        <CardHeader>
          <CardTitle>会议转写内容</CardTitle>
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
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-500">
            点击开始 AI 分析，自动提取任务、风险、需求变更和决策
          </p>
          <Button disabled>开始 AI 分析</Button>
        </CardContent>
      </Card>
    </div>
  );
}
