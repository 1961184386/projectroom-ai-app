"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

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
  { value: "dingtalk", label: "钉钉会议" },
  { value: "feishu", label: "飞书妙记" }
];

export function CreateMeetingForm({ projectId }: { projectId: string }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

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
          <div className="space-y-2">
            <Label htmlFor="title">会议主题</Label>
            <Input id="title" name="title" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="meeting_time">会议时间</Label>
            <Input id="meeting_time" name="meeting_time" type="datetime-local" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="platform">会议平台</Label>
            <Select id="platform" name="platform" defaultValue="manual">
              {platformOptions.map((platform) => (
                <option key={platform.value} value={platform.value}>
                  {platform.label}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="participants">参会人</Label>
            <Input id="participants" name="participants" placeholder="例如：张三, 李四, 王五" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="agenda">会议议题</Label>
            <Textarea id="agenda" name="agenda" rows={4} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="transcript_text">会议转写内容</Label>
            <Textarea
              id="transcript_text"
              name="transcript_text"
              rows={14}
              placeholder="请粘贴会议转写文本…"
              required
            />
          </div>
          {error ? <p className="text-sm text-rose-600">{error}</p> : null}
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "保存中..." : "保存会议记录"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
