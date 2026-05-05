"use client";

import { useState } from "react";
import useSWR from "swr";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ErrorState } from "@/components/ui/error-state";
import { Spinner } from "@/components/ui/spinner";
import { ApiError, api } from "@/lib/api";
import { formatDateTime } from "@/lib/utils";

function renderParagraph(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, index) =>
    part.startsWith("**") && part.endsWith("**") ? (
      <strong key={index}>{part.slice(2, -2)}</strong>
    ) : (
      part
    )
  );
}

export function ProjectSummary({ projectId }: { projectId: string }) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [emptyMessage, setEmptyMessage] = useState<string | null>(null);

  const { data, error, isLoading, mutate } = useSWR(
    `/api/projects/${projectId}/summary`,
    () => api.getProjectSummary(projectId),
    {
      revalidateOnFocus: false,
    }
  );

  const isNotGenerated = error instanceof ApiError && error.status === 404;
  const loadError = error && !isNotGenerated ? error : null;

  async function handleGenerate() {
    setIsGenerating(true);
    setActionError(null);
    setEmptyMessage(null);

    try {
      const summary = await api.generateProjectSummary(projectId);
      if (summary) {
        await mutate(summary, false);
        return;
      }

      await mutate(undefined, false);
      setEmptyMessage("该项目暂无可用的会议分析数据，请先完成至少一次会议分析。");
    } catch (requestError) {
      setActionError(
        requestError instanceof Error ? requestError.message : "摘要生成失败"
      );
    } finally {
      setIsGenerating(false);
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>项目进度摘要</CardTitle>
        </CardHeader>
        <CardContent>
          <Spinner />
        </CardContent>
      </Card>
    );
  }

  if (loadError) {
    return <ErrorState message={loadError.message || "项目进度摘要加载失败"} />;
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-4">
        <CardTitle>项目进度摘要</CardTitle>
        <Button onClick={handleGenerate} disabled={isGenerating}>
          {isGenerating ? "生成中..." : data ? "重新生成" : "生成摘要"}
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {data ? (
          <>
            <div className="space-y-3">
              {data.summary_text.split("\n").filter(Boolean).map((paragraph, index) => (
                <p key={`${index}-${paragraph.slice(0, 16)}`} className="text-sm leading-7 text-gray-700">
                  {renderParagraph(paragraph)}
                </p>
              ))}
            </div>
            <p className="text-xs text-gray-500">生成时间：{formatDateTime(data.generated_at)}</p>
          </>
        ) : (
          <p className="text-sm text-gray-500">
            {emptyMessage || "尚未生成项目进度摘要，点击右上角按钮生成最新项目概览。"}
          </p>
        )}

        {actionError ? <p className="text-sm text-rose-700">{actionError}</p> : null}
      </CardContent>
    </Card>
  );
}
