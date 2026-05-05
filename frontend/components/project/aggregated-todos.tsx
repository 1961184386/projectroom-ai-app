"use client";

import Link from "next/link";
import useSWR from "swr";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ErrorState } from "@/components/ui/error-state";
import { SkeletonCard } from "@/components/ui/skeleton-card";
import { api } from "@/lib/api";
import { formatDateTime } from "@/lib/utils";

const priorityVariantMap = {
  high: "danger",
  medium: "warning",
  low: "default"
} as const;

const priorityLabelMap = {
  high: "高",
  medium: "中",
  low: "低"
} as const;

export function AggregatedTodos({ projectId }: { projectId: string }) {
  const { data, error, isLoading } = useSWR(
    `/api/projects/${projectId}/todos`,
    () => api.listProjectTodos(projectId)
  );

  if (isLoading) {
    return (
      <SkeletonCard lines={4} />
    );
  }

  if (error) {
    return <ErrorState message={error.message || "任务清单加载失败"} />;
  }

  const items = data ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>任务清单</CardTitle>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-sm text-gray-500">暂无任务，完成会议 AI 分析后自动汇总</p>
        ) : (
          <>
            <div className="space-y-3 sm:hidden">
              {items.map((item, index) => (
                <div
                  key={`${item.meeting_id}-${item.task}-${index}`}
                  className="space-y-2 rounded-lg border border-gray-100 p-4"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium text-gray-900">{item.task}</p>
                    <Badge variant={priorityVariantMap[item.priority]}>{priorityLabelMap[item.priority]}</Badge>
                  </div>
                  <p className="text-xs text-gray-500">
                    负责人：{item.owner || "待确认"} · 截止：{item.deadline || "待确认"}
                  </p>
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

            <div className="hidden overflow-x-auto sm:block">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-gray-200 text-gray-500">
                  <tr>
                    <th className="py-3 pr-4 font-medium">任务</th>
                    <th className="py-3 pr-4 font-medium">负责人</th>
                    <th className="py-3 pr-4 font-medium">截止日期</th>
                    <th className="py-3 pr-4 font-medium">优先级</th>
                    <th className="py-3 font-medium">来源会议</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, index) => (
                    <tr key={`${item.meeting_id}-${item.task}-${index}`} className="border-b border-gray-100 last:border-0">
                      <td className="py-3 pr-4 text-gray-700">{item.task}</td>
                      <td className="py-3 pr-4 text-gray-700">{item.owner || "待确认"}</td>
                      <td className="py-3 pr-4 text-gray-700">{item.deadline || "待确认"}</td>
                      <td className="py-3 pr-4">
                        <Badge variant={priorityVariantMap[item.priority]}>{priorityLabelMap[item.priority]}</Badge>
                      </td>
                      <td className="py-3 text-gray-700">
                        <Link
                          className="font-medium text-gray-900 underline-offset-4 hover:underline"
                          href={`/projects/${projectId}/meetings/${item.meeting_id}`}
                        >
                          {item.meeting_title}
                        </Link>
                        <p className="mt-1 text-xs text-gray-500">{formatDateTime(item.meeting_time)}</p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
