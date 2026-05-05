"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/api";

const platformOptions = [
  { value: "manual", label: "手动输入" },
  { value: "tencent_meeting", label: "腾讯会议" },
  { value: "dingtalk", label: "钉钉会议" }
];

export function CreateMeetingForm({ projectId }: { projectId: string }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [platform, setPlatform] = useState("manual");
  const [transcriptText, setTranscriptText] = useState("");
  const [externalMeetingId, setExternalMeetingId] = useState("");

  const platformHint = useMemo(() => {
    switch (platform) {
      case "tencent_meeting":
      case "tencent":
        return "建议保留说话人姓名和时间顺序，直接粘贴腾讯会议转写全文。";
      case "dingtalk":
        return "建议包含发言人标识和关键决策原文，方便 AI 识别任务归属。";
      default:
        return "支持手动整理后的会议纪要，但尽量保留对话原文和责任人信息。";
    }
  }, [platform]);

  function getStringValue(formData: FormData, key: string) {
    return String(formData.get(key) ?? "");
  }

  function getOptionalStringValue(formData: FormData, key: string) {
    const value = String(formData.get(key) ?? "").trim();
    return value ? value : null;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    try {
      if (platform !== "manual") {
        if (externalMeetingId.trim()) {
          const imported = await api.importIntegrationTranscript(platform, externalMeetingId.trim(), {
            project_id: projectId,
            auto_analyze: true
          });
          router.push(`/projects/${projectId}/meetings/${imported.meeting_id}`);
          router.refresh();
          return;
        }

        const meetingTime = getStringValue(formData, "meeting_time");
        const endTime = new Date(new Date(meetingTime).getTime() + 60 * 60 * 1000).toISOString();
        const created = await api.createExternalMeeting(platform, {
          project_id: projectId,
          title: getStringValue(formData, "title"),
          start_time: meetingTime,
          end_time: endTime,
          participants: getOptionalStringValue(formData, "participants")?.split(",").map((item) => item.trim()).filter(Boolean) ?? [],
          agenda: getOptionalStringValue(formData, "agenda")
        });
        router.push(`/projects/${projectId}/meetings/${created.meeting.id}`);
        router.refresh();
        return;
      }

      const meeting = await api.createMeeting(projectId, {
        title: getStringValue(formData, "title"),
        meeting_time: getStringValue(formData, "meeting_time"),
        platform: getStringValue(formData, "platform") || "manual",
        participants: getOptionalStringValue(formData, "participants"),
        agenda: getOptionalStringValue(formData, "agenda"),
        transcript_text: getStringValue(formData, "transcript_text")
      });
      router.push(`/projects/${projectId}/meetings/${meeting.id}`);
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "保存会议失败");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>导入会议记录</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="title">会议主题</Label>
              <Input id="title" name="title" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="meeting_time">会议时间</Label>
              <Input id="meeting_time" name="meeting_time" type="datetime-local" required />
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
            <div className="space-y-2">
              <Label htmlFor="platform">会议平台</Label>
              <Select
                id="platform"
                name="platform"
                defaultValue="manual"
                value={platform}
                onChange={(event) => setPlatform(event.target.value)}
              >
                {platformOptions.map((platformOption) => (
                  <option key={platformOption.value} value={platformOption.value}>
                    {platformOption.label}
                  </option>
                ))}
              </Select>
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-500">{platformHint}</p>
            {platform !== "manual" ? (
              <div className="mt-4 space-y-2">
                <Label htmlFor="external_meeting_id">外部会议 ID（可选）</Label>
                <Input
                  id="external_meeting_id"
                  value={externalMeetingId}
                  onChange={(event) => setExternalMeetingId(event.target.value)}
                  placeholder="已有平台会议时填写，直接导入录制转写"
                />
                <p className="text-sm text-slate-500">
                  不填写则创建新的平台会议骨架；填写后直接走导入链路。也可以用下方按钮同步最近会议。
                </p>
              </div>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="participants">参会人</Label>
            <Input id="participants" name="participants" placeholder="例如：张三, 李四, 王五" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="agenda">会议议题</Label>
            <Textarea id="agenda" name="agenda" rows={4} />
          </div>
          {platform === "manual" ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <Label htmlFor="transcript_text">会议转写内容</Label>
                <Badge variant={transcriptText.length > 1000 ? "info" : "default"}>
                  {transcriptText.length} 字
                </Badge>
              </div>
              <Textarea
                id="transcript_text"
                name="transcript_text"
                rows={14}
                value={transcriptText}
                onChange={(event) => setTranscriptText(event.target.value)}
                className="rounded-2xl border-slate-200 bg-slate-50/70 text-[15px] leading-7"
                placeholder="请粘贴会议转写文本，建议包含发言人、原话、待办和风险讨论原文。"
                required
              />
              <p className="text-sm text-slate-500">
                演示建议：至少粘贴 300 字以上真实对话，AI 提炼的任务、风险和需求变更会更完整。
              </p>
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/60 p-4 text-sm leading-6 text-slate-600">
              当前将调用后端平台 connector。未配置真实密钥时，会自动回退到 mock/sandbox 并生成可演示数据。
            </div>
          )}
          {error ? <p className="text-sm text-rose-600">{error}</p> : null}
          <div className="flex flex-wrap gap-3">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting
                ? "处理中..."
                : platform === "manual"
                  ? "保存会议记录"
                  : externalMeetingId.trim()
                    ? "导入平台转写"
                    : "创建平台会议"}
            </Button>
            {platform !== "manual" ? (
              <Button
                type="button"
                variant="outline"
                disabled={isSubmitting}
                onClick={async () => {
                  setError("");
                  setIsSubmitting(true);
                  try {
                    const meetings = await api.syncIntegrationMeetings(platform, { project_id: projectId, limit: 3 });
                    if (meetings[0]) {
                      router.push(`/projects/${projectId}/meetings/${meetings[0].id}`);
                    } else {
                      router.push(`/projects/${projectId}`);
                    }
                    router.refresh();
                  } catch (syncError) {
                    setError(syncError instanceof Error ? syncError.message : "同步会议失败");
                  } finally {
                    setIsSubmitting(false);
                  }
                }}
              >
                同步最近会议
              </Button>
            ) : null}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
