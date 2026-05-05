"use client";

import Link from "next/link";
import useSWR from "swr";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ErrorState } from "@/components/ui/error-state";
import { SkeletonCard } from "@/components/ui/skeleton-card";
import { api } from "@/lib/api";
import { formatDateTime } from "@/lib/utils";

const typeVariantMap = {
  new: "info",
  modified: "warning",
  removed: "danger",
  unclear: "default"
} as const;

const typeLabelMap = {
  new: "新增",
  modified: "修改",
  removed: "删除",
  unclear: "待明确"
} as const;

export function AggregatedChanges({ projectId }: { projectId: string }) {
  const { data, error, isLoading } = useSWR(
    `/api/projects/${projectId}/changes`,
    () => api.listProjectChanges(projectId)
  );

  if (isLoading) {
    return (
      <SkeletonCard lines={4} />
    );
  }

  if (error) {
    return <ErrorState message={error.message || "需求变更加载失败"} />;
  }

  const items = data ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>需求变更</CardTitle>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-sm text-gray-500">暂无需求变更</p>
        ) : (
          <>
            <div className="space-y-3 sm:hidden">
              {items.map((item, index) => (
                <div
                  key={`${item.meeting_id}-${item.change}-${index}`}
                  className="space-y-2 rounded-lg border border-gray-100 p-4"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium text-gray-900">{item.change}</p>
                    <Badge variant={typeVariantMap[item.type]}>{typeLabelMap[item.type]}</Badge>
                  </div>
                  <p className="text-xs text-gray-500">影响：{item.impact_on_scope || "待补充"}</p>
                  <div className="flex items-center gap-2">
                    <Badge variant={item.need_confirmation ? "danger" : "success"}>
                      {item.need_confirmation ? "需确认" : "已明确"}
                    </Badge>
                    <Link
                      className="text-xs text-gray-700 underline-offset-2 hover:underline"
                      href={`/projects/${projectId}/meetings/${item.meeting_id}`}
                    >
                      {item.meeting_title}
                    </Link>
                  </div>
                  <p className="text-xs text-gray-500">{formatDateTime(item.meeting_time)}</p>
                </div>
              ))}
            </div>

            <div className="hidden overflow-x-auto sm:block">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-gray-200 text-gray-500">
                  <tr>
                    <th className="py-3 pr-4 font-medium">变更内容</th>
                    <th className="py-3 pr-4 font-medium">类型</th>
                    <th className="py-3 pr-4 font-medium">影响</th>
                    <th className="py-3 pr-4 font-medium">是否需确认</th>
                    <th className="py-3 font-medium">来源会议</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, index) => (
                    <tr key={`${item.meeting_id}-${item.change}-${index}`} className="border-b border-gray-100 last:border-0">
                      <td className="py-3 pr-4 text-gray-700">{item.change}</td>
                      <td className="py-3 pr-4">
                        <Badge variant={typeVariantMap[item.type]}>{typeLabelMap[item.type]}</Badge>
                      </td>
                      <td className="py-3 pr-4 text-gray-700">{item.impact_on_scope || "待补充"}</td>
                      <td className="py-3 pr-4">
                        <Badge variant={item.need_confirmation ? "danger" : "success"}>
                          {item.need_confirmation ? "需确认" : "已明确"}
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
