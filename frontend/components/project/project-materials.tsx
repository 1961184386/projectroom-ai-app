"use client";

import { ChangeEvent, DragEvent, FormEvent, useRef, useState } from "react";
import useSWR from "swr";
import { FileText, Trash2, Upload } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ErrorState } from "@/components/ui/error-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/api";
import { parseFileContent, type ParsedFileContent } from "@/lib/parse-file-content";
import { formatDateTime } from "@/lib/utils";

const materialTypes = [
  { value: "prd", label: "PRD" },
  { value: "sow", label: "SOW" },
  { value: "rfp", label: "RFP" },
  { value: "meeting_notes", label: "会议纪要" },
  { value: "other", label: "其他" }
];

export function ProjectMaterials({ projectId }: { projectId: string }) {
  const [title, setTitle] = useState("");
  const [materialType, setMaterialType] = useState("prd");
  const [content, setContent] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState("");
  const [fileSourceType, setFileSourceType] = useState<ParsedFileContent["sourceType"]>("unknown");
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [parseWarning, setParseWarning] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data, error: fetchError, isLoading, mutate } = useSWR(
    `/api/projects/${projectId}/materials`,
    () => api.listProjectMaterials(projectId)
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);
    try {
      await api.createProjectMaterial(projectId, {
        title,
        material_type: materialType,
        content
      });
      setTitle("");
      setMaterialType("prd");
      setContent("");
      await mutate();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "保存资料失败");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleMaterialFile(file?: File) {
    if (!file) return;

    const name = file.name.toLowerCase();
    if (!name.endsWith(".txt") && !name.endsWith(".docx") && !name.endsWith(".pdf")) {
      setError("仅支持上传 .txt、.docx、.pdf 文件");
      return;
    }

    try {
      setError("");
      setParseWarning("");
      const parsed = await parseFileContent(file);
      setFileSourceType(parsed.sourceType);
      setUploadedFileName(file.name);

      if (parsed.warning) {
        setParseWarning(parsed.warning);
      }

      if (!parsed.text.trim()) {
        setError(parsed.warning ?? "文件内容为空，请检查后重试");
        return;
      }

      // Auto-extract: use filename as title, extracted text as content
      if (!title) {
        setTitle(file.name.replace(/\.[^.]+$/, ""));
      }
      setContent(parsed.text.slice(0, 20000)); // limit to 20k chars

      // Auto-guess material type from filename/content
      const lowered = parsed.text.toLowerCase();
      if (lowered.includes("prd") || lowered.includes("产品需求")) {
        setMaterialType("prd");
      } else if (lowered.includes("sow") || lowered.includes("工作说明书")) {
        setMaterialType("sow");
      } else if (lowered.includes("rfp") || lowered.includes("招标")) {
        setMaterialType("rfp");
      } else if (name.includes("会议") || lowered.includes("纪要") || lowered.includes("会议记录")) {
        setMaterialType("meeting_notes");
      }
    } catch {
      setError("读取文件失败，请重试");
    }
  }

  function clearUploadedFile() {
    setUploadedFileName("");
    setFileSourceType("unknown");
    setParseWarning("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function handleFileInputChange(event: ChangeEvent<HTMLInputElement>) {
    const [file] = Array.from(event.target.files ?? []);
    void handleMaterialFile(file);
  }

  function handleFileDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setIsDraggingFile(false);
    const [file] = Array.from(event.dataTransfer.files ?? []);
    void handleMaterialFile(file);
  }

  async function handleDelete(materialId: string) {
    setDeletingId(materialId);
    try {
      await api.deleteProjectMaterial(projectId, materialId);
      await mutate();
    } finally {
      setDeletingId(null);
    }
  }

  if (fetchError) {
    return <ErrorState message={fetchError.message} />;
  }

  const materials = data ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>项目资料</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <form className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50/70 p-4" onSubmit={handleSubmit}>
          <div className="grid gap-4 md:grid-cols-[1.3fr_0.7fr]">
            <div className="space-y-2">
              <Label htmlFor="material-title">资料标题</Label>
              <Input id="material-title" value={title} onChange={(event) => setTitle(event.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="material-type">资料类型</Label>
              <Select id="material-type" value={materialType} onChange={(event) => setMaterialType(event.target.value)}>
                {materialTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          {/* File upload drop zone */}
          <div className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Label>上传文件（可选）</Label>
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
              htmlFor="material-file"
              className={`flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed px-4 py-3 text-center transition ${
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
                id="material-file"
                type="file"
                accept=".txt,.docx,.pdf,text/plain,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/pdf"
                className="sr-only"
                onChange={handleFileInputChange}
              />
              <Upload className="mb-1 h-4 w-4" />
              <span className="text-xs font-medium">点击或拖拽上传 .txt .docx .pdf 文件，自动提取文本内容</span>
            </Label>
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
              {fileSourceType !== "unknown" ? <Badge variant="default">文件类型：{fileSourceType.toUpperCase()}</Badge> : null}
              {parseWarning ? <span className="text-amber-700">{parseWarning}</span> : null}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="material-content">内容摘录</Label>
            <Textarea
              id="material-content"
              value={content}
              onChange={(event) => setContent(event.target.value)}
              rows={5}
              placeholder="可粘贴 PRD、SOW、RFP 或客户邮件中的关键段落。也可以上传 PDF/DOCX/TXT 自动提取。"
              required
            />
          </div>
          {error ? <p className="text-sm text-rose-600">{error}</p> : null}
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "保存中..." : "添加资料"}
          </Button>
        </form>

        {isLoading ? (
          <p className="text-sm text-slate-500">资料加载中...</p>
        ) : materials.length === 0 ? (
          <p className="text-sm text-slate-500">还没有沉淀项目资料，可先补充 PRD / SOW / RFP 摘录。</p>
        ) : (
          <div className="space-y-3">
            {materials.map((material) => (
              <div key={material.id} className="rounded-2xl border border-slate-200 p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-slate-500" />
                      <p className="font-medium text-slate-900">{material.title}</p>
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                        {material.material_type}
                      </span>
                    </div>
                    <p className="text-sm leading-6 text-slate-600">{material.content}</p>
                    <p className="text-xs text-slate-400">更新时间：{formatDateTime(material.updated_at)}</p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={deletingId === material.id}
                    onClick={() => handleDelete(material.id)}
                    className="text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                  >
                    <Trash2 className="mr-1 h-4 w-4" />
                    删除
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
