"use client";

import Link from "next/link";
import useSWR from "swr";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ErrorState } from "@/components/ui/error-state";
import { SkeletonCard } from "@/components/ui/skeleton-card";
import { api } from "@/lib/api";
import { formatDateTime } from "@/lib/utils";

const levelVariantMap = {
  high: "danger",
  medium: "warning",
  low: "success"
} as const;

const levelLabelMap = {
  high: "高",
  medium: "中",
  low: "低"
} as const;

export function AggregatedRisks({ projectId }: { projectId: string }) {
  const { data, error, isLoading } = useSWR(
    `/api/projects/${projectId}/risks`,
    () => api.listProjectRisks(projectId)
  );

  if (isLoading) {
    return (
      <SkeletonCard lines={4} />
    );
  }

  if (error) {
    return <ErrorState message={error.message || "风险台账加载失败"} />;
  }

  const items = data ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>风险台账</CardTitle>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-sm text-gray-500">暂无风险记录</p>
        ) : (
          <>
            <div className="space-y-3 sm:hidden">
              {items.map((item, index) => (
                <div
                  key={`${item.meeting_id}-${item.risk}-${index}`}
                  className="space-y-2 rounded-lg border border-gray-100 p-4"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium text-gray-900">{item.risk}</p>
                    <Badge variant={levelVariantMap[item.level]}>{levelLabelMap[item.level]}</Badge>
                  </div>
                  <p className="text-xs text-gray-500">建议措施：{item.suggestion || "待补充"}</p>
                  <Badge variant={item.confirmed ? "success" : "warning"}>
                    {item.confirmed ? "已确认" : "待确认"}
                  </Badge>
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
                    <th className="py-3 pr-4 font-medium">风险描述</th>
                    <th className="py-3 pr-4 font-medium">等级</th>
                    <th className="py-3 pr-4 font-medium">建议措施</th>
                    <th className="py-3 pr-4 font-medium">确认</th>
                    <th className="py-3 font-medium">来源会议</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, index) => (
                    <tr key={`${item.meeting_id}-${item.risk}-${index}`} className="border-b border-gray-100 last:border-0">
                      <td className="py-3 pr-4 text-gray-700">{item.risk}</td>
                      <td className="py-3 pr-4">
                        <Badge variant={levelVariantMap[item.level]}>{levelLabelMap[item.level]}</Badge>
                      </td>
                      <td className="py-3 pr-4 text-gray-700">{item.suggestion || "待补充"}</td>
                      <td className="py-3 pr-4">
                        <Badge variant={item.confirmed ? "success" : "warning"}>
                          {item.confirmed ? "已确认" : "待确认"}
                        </Badge>
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
