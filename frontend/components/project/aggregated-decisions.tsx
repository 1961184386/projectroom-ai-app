"use client";

import Link from "next/link";
import useSWR from "swr";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ErrorState } from "@/components/ui/error-state";
import { SkeletonCard } from "@/components/ui/skeleton-card";
import { api } from "@/lib/api";
import { formatDateTime } from "@/lib/utils";

export function AggregatedDecisions({ projectId }: { projectId: string }) {
  const { data, error, isLoading } = useSWR(
    `/api/projects/${projectId}/decisions`,
    () => api.listProjectDecisions(projectId)
  );

  if (isLoading) {
    return (
      <SkeletonCard lines={4} />
    );
  }

  if (error) {
    return <ErrorState message={error.message || "决策记录加载失败"} />;
  }

  const items = data ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>决策记录</CardTitle>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-sm text-gray-500">暂无正式决策</p>
        ) : (
          <>
            <div className="space-y-3 sm:hidden">
              {items.map((item, index) => (
                <div
                  key={`${item.meeting_id}-${item.decision}-${index}`}
                  className="space-y-2 rounded-lg border border-gray-100 p-4"
                >
                  <p className="text-sm font-medium text-gray-900">{item.decision}</p>
                  <p className="text-xs text-gray-500">负责人：{item.owner || "待确认"}</p>
                  <p className="text-xs text-gray-500">影响：{item.impact || "未补充影响说明"}</p>
                  <Link
                    className="text-xs text-gray-700 underline-offset-2 hover:underline"
                    href={`/projects/${projectId}/meetings/${item.meeting_id}`}
                  >
                    {item.meeting_title}
                  </Link>
                  <p className="text-xs text-gray-500">{formatDateTime(item.meeting_time)}</p>
                </div>
              ))}
            </div>

            <div className="hidden space-y-4 sm:block">
              {items.map((item, index) => (
                <div key={`${item.meeting_id}-${item.decision}-${index}`} className="rounded-lg border border-gray-200 p-4">
                  <p className="font-medium text-gray-900">{item.decision}</p>
                  <p className="mt-2 text-sm text-gray-600">负责人：{item.owner || "待确认"}</p>
                  <p className="mt-1 text-sm text-gray-500">{item.impact || "未补充影响说明"}</p>
                  <p className="mt-3 text-sm text-gray-600">
                    来源会议：
                    {" "}
                    <Link
                      className="font-medium text-gray-900 underline-offset-4 hover:underline"
                      href={`/projects/${projectId}/meetings/${item.meeting_id}`}
                    >
                      {item.meeting_title}
                    </Link>
                    <span className="ml-2 text-gray-500">{formatDateTime(item.meeting_time)}</span>
                  </p>
                  {item.evidence ? (
                    <details className="mt-3 text-sm text-gray-500">
                      <summary className="cursor-pointer">引用原文</summary>
                      <p className="mt-2 leading-6">{item.evidence}</p>
                    </details>
                  ) : null}
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
