"use client";

import { FormEvent, useState } from "react";
import useSWR from "swr";
import { FileText, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ErrorState } from "@/components/ui/error-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/api";
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
          <div className="space-y-2">
            <Label htmlFor="material-content">内容摘录</Label>
            <Textarea
              id="material-content"
              value={content}
              onChange={(event) => setContent(event.target.value)}
              rows={5}
              placeholder="可粘贴 PRD、SOW、RFP 或客户邮件中的关键段落"
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
