"use client";

import Link from "next/link";
import { FormEvent, KeyboardEvent, useEffect, useRef, useState } from "react";
import useSWR from "swr";

import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ErrorState } from "@/components/ui/error-state";
import { SkeletonCard } from "@/components/ui/skeleton-card";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/api";
import { ChatMessage } from "@/lib/types";

const EMPTY_PROMPTS = [
  "上次会议确定了哪些任务？",
  "当前有哪些未解决风险？",
  "最近的需求变更有哪些？",
];

export function ChatClient({ projectId }: { projectId: string }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const projectState = useSWR(`/api/projects/${projectId}`, () => api.getProject(projectId));

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  async function handleSubmit(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    const question = input.trim();
    if (!question || isLoading) {
      return;
    }

    const userMessage: ChatMessage = {
      role: "user",
      content: question,
    };
    setMessages((current) => [...current, userMessage]);
    setIsLoading(true);

    try {
      const response = await api.askProject(projectId, question);
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content: response.answer,
          sources: response.sources,
        },
      ]);
      setInput("");
    } catch (error) {
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content: error instanceof Error ? error.message : "发送失败，请稍后重试。",
          isError: true,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void handleSubmit();
    }
  }

  if (projectState.isLoading) {
    return (
      <div className="space-y-6">
        <SkeletonCard lines={2} />
        <SkeletonCard lines={5} hasButton />
      </div>
    );
  }

  if (projectState.error) {
    return <ErrorState message={projectState.error.message} />;
  }

  const project = projectState.data;
  if (!project) {
    return <ErrorState message="项目不存在" />;
  }

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <Breadcrumb href={`/projects/${projectId}`} label="返回项目详情" />
        <div>
          <h1 className="text-2xl font-semibold">项目问答 — {project.name}</h1>
          <p className="mt-2 text-sm text-gray-500">基于该项目已有会议记录进行单轮问答。</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>对话</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {messages.length === 0 ? (
            <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 p-6">
              <p className="text-sm font-medium text-gray-700">提示你可以问的问题类型：</p>
              <div className="mt-3 space-y-2">
                {EMPTY_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => setInput(prompt)}
                    className="block w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-left text-sm text-gray-700 transition hover:border-gray-300 hover:bg-gray-50"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message, index) => (
                <div
                  key={`${message.role}-${index}-${message.content}`}
                  className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div className="max-w-[85%] space-y-2">
                    <div
                      className={[
                        "rounded-2xl px-4 py-3 text-sm leading-6",
                        message.role === "user"
                          ? "bg-blue-600 text-white"
                          : message.isError
                            ? "bg-rose-50 text-rose-700"
                            : "bg-gray-100 text-gray-900",
                      ].join(" ")}
                    >
                      <pre className="whitespace-pre-wrap font-sans">{message.content}</pre>
                    </div>
                    {message.role === "assistant" && message.sources && message.sources.length > 0 ? (
                      <div className="text-xs text-gray-500">
                        来源：
                        {message.sources.map((source, sourceIndex) => (
                          <span key={source.meeting_id} className="ml-2">
                            <Link
                              href={`/projects/${projectId}/meetings/${source.meeting_id}`}
                              className="underline decoration-gray-300 underline-offset-2 hover:text-gray-900"
                            >
                              {source.meeting_title}
                            </Link>
                            {sourceIndex < message.sources!.length - 1 ? " " : ""}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </div>
              ))}
              {isLoading ? (
                <div className="flex justify-start">
                  <div className="rounded-2xl bg-gray-100 px-4 py-3 text-sm text-gray-600">
                    正在整理会议记录并回答...
                  </div>
                </div>
              ) : null}
              <div ref={messagesEndRef} />
            </div>
          )}

          <form className="space-y-3" onSubmit={(event) => void handleSubmit(event)}>
            <Textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="请输入你的问题，按 Enter 发送，Shift + Enter 换行"
              disabled={isLoading}
              className="min-h-[120px]"
            />
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs text-gray-400">回答仅基于当前项目已保存的会议记录。</p>
              <Button type="submit" disabled={isLoading || !input.trim()}>
                {isLoading ? "发送中..." : "发送"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
