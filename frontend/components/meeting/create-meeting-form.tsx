"use client";

import { useRouter } from "next/navigation";
import { ChangeEvent, DragEvent, FormEvent, useMemo, useRef, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/api";
import { parseTranscript, type ParsedTranscript } from "@/lib/parse-transcript";

const platformOptions = [
  { value: "manual", label: "手动输入" },
  { value: "tencent_meeting", label: "腾讯会议" },
  { value: "dingtalk", label: "钉钉会议" }
];

export function CreateMeetingForm({ projectId }: { projectId: string }) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [platform, setPlatform] = useState("manual");
  const [title, setTitle] = useState("");
  const [meetingTime, setMeetingTime] = useState("");
  const [participants, setParticipants] = useState("");
  const [agenda, setAgenda] = useState("");
  const [transcriptText, setTranscriptText] = useState("");
  const [externalMeetingId, setExternalMeetingId] = useState("");
  const [uploadedFileName, setUploadedFileName] = useState("");
  const [parseWarning, setParseWarning] = useState("");
  const [detectedFormat, setDetectedFormat] = useState<ParsedTranscript["detectedFormat"] | null>(null);
  const [isDraggingFile, setIsDraggingFile] = useState(false);

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

  function formatIsoToDatetimeLocal(value: string) {
    const parsedDate = new Date(value);
    if (Number.isNaN(parsedDate.getTime())) {
      return "";
    }

    const year = parsedDate.getFullYear();
    const month = String(parsedDate.getMonth() + 1).padStart(2, "0");
    const day = String(parsedDate.getDate()).padStart(2, "0");
    const hours = String(parsedDate.getHours()).padStart(2, "0");
    const minutes = String(parsedDate.getMinutes()).padStart(2, "0");

    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }

  function applyParsedTranscript(parsed: ParsedTranscript, fileName: string) {
    setUploadedFileName(fileName);
    setDetectedFormat(parsed.detectedFormat);
    setParseWarning(parsed.warning ?? "");

    if (parsed.title) {
      setTitle(parsed.title);
    }

    if (parsed.meetingTime) {
      const formattedMeetingTime = formatIsoToDatetimeLocal(parsed.meetingTime);
      if (formattedMeetingTime) {
        setMeetingTime(formattedMeetingTime);
      }
    }

    if (parsed.participants.length > 0) {
      setParticipants(parsed.participants.join(", "));
    }

    setTranscriptText(parsed.transcriptText);
  }

  async function handleTranscriptFile(file?: File) {
    if (!file) {
      return;
    }

    if (!file.name.toLowerCase().endsWith(".txt")) {
      setError("仅支持上传 .txt 转写文件");
      return;
    }

    try {
      setError("");
      const fileContent = await file.text();
      const parsed = parseTranscript(fileContent, file.name);
      applyParsedTranscript(parsed, file.name);
    } catch {
      setError("读取转写文件失败，请重试");
    }
  }

  function clearUploadedFile() {
    setUploadedFileName("");
    setParseWarning("");
    setDetectedFormat(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function handleFileInputChange(event: ChangeEvent<HTMLInputElement>) {
    const [file] = Array.from(event.target.files ?? []);
    void handleTranscriptFile(file);
  }

  function handleFileDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setIsDraggingFile(false);
    const [file] = Array.from(event.dataTransfer.files ?? []);
    void handleTranscriptFile(file);
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
              <Input id="title" name="title" required value={title} onChange={(event) => setTitle(event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="meeting_time">会议时间</Label>
              <Input
                id="meeting_time"
                name="meeting_time"
                type="datetime-local"
                required
                value={meetingTime}
                onChange={(event) => setMeetingTime(event.target.value)}
              />
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
            <Input
              id="participants"
              name="participants"
              placeholder="例如：张三, 李四, 王五"
              value={participants}
              onChange={(event) => setParticipants(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="agenda">会议议题</Label>
            <Textarea id="agenda" name="agenda" rows={4} value={agenda} onChange={(event) => setAgenda(event.target.value)} />
          </div>
          {platform === "manual" ? (
            <div className="space-y-2">
              <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-slate-900">上传腾讯会议转写文件</p>
                    <p className="text-sm text-slate-500">支持拖拽或选择 `.txt` 文件，自动识别标题、时间、参会人与转写内容。</p>
                  </div>
                  {uploadedFileName ? (
                    <div className="flex items-center gap-2">
                      <Badge variant="info">{uploadedFileName}</Badge>
                      <Button type="button" variant="ghost" size="sm" onClick={clearUploadedFile}>
                        清除
                      </Button>
                    </div>
                  ) : null}
                </div>
                <Label
                  htmlFor="transcript_file"
                  className={`flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed px-6 py-8 text-center transition ${
                    isDraggingFile
                      ? "border-teal-400 bg-teal-50 text-teal-900"
                      : "border-slate-300 bg-white/80 text-slate-600 hover:border-slate-400 hover:bg-white"
                  }`}
                  onDragOver={(event) => {
                    event.preventDefault();
                    setIsDraggingFile(true);
                  }}
                  onDragLeave={() => setIsDraggingFile(false)}
                  onDrop={handleFileDrop}
                >
                  <input
                    ref={fileInputRef}
                    id="transcript_file"
                    type="file"
                    accept=".txt,text/plain"
                    className="sr-only"
                    onChange={handleFileInputChange}
                  />
                  <span className="text-sm font-medium">拖拽文件到这里，或点击选择 `.txt` 文件</span>
                  <span className="mt-2 text-xs text-slate-500">推荐直接上传腾讯会议导出的转写文本，系统会先在浏览器端完成解析。</span>
                </Label>
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                  {detectedFormat ? <Badge variant="default">识别格式：{detectedFormat}</Badge> : null}
                  {parseWarning ? <span className="text-amber-700">{parseWarning}</span> : null}
                </div>
              </div>
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
