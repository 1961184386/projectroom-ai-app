"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/api";

const stageOptions = [
  { value: "需求确认", label: "需求确认", hint: "适合刚启动、需求仍在梳理的项目" },
  { value: "开发中", label: "开发中", hint: "适合已进入交付推进和联调阶段的项目" },
  { value: "测试", label: "测试", hint: "适合已进入验收前联测与缺陷收敛阶段" },
  { value: "验收", label: "验收", hint: "适合客户确认、上线准备和交付收尾阶段" },
  { value: "完成", label: "完成", hint: "适合已归档的项目空间" }
] as const;

const templates = [
  {
    id: "software-delivery",
    name: "软件交付",
    client_name: "甲方数字化平台主管部门",
    current_stage: "需求确认",
    description: "围绕需求梳理、方案评审、开发排期和上线验收推进的标准软件交付项目。",
    goal: "在约定周期内完成核心功能上线，并建立可追踪的风险、决策和任务闭环。",
    acceptance_criteria: "核心流程可用；关键接口联通；客户完成 UAT；上线问题可控。"
  },
  {
    id: "consulting",
    name: "咨询项目",
    client_name: "企业战略与流程管理部",
    current_stage: "开发中",
    description: "适合咨询诊断、方案输出、里程碑复盘和交付建议沉淀的项目空间。",
    goal: "形成可执行的阶段性结论和行动建议，保证每次会议输出可回溯。",
    acceptance_criteria: "阶段汇报完成；关键建议达成共识；风险和依赖已识别并跟踪。"
  },
  {
    id: "product-launch",
    name: "产品发布",
    client_name: "产品运营与市场团队",
    current_stage: "测试",
    description: "适合新产品上线、市场准备、跨团队协同和上线复盘场景。",
    goal: "在发布窗口前完成研发、运营和市场动作对齐，确保发布节奏稳定。",
    acceptance_criteria: "版本冻结；上线预案完成；关键指标可监控；复盘计划已排定。"
  }
];

type FormState = {
  name: string;
  client_name: string;
  description: string;
  current_stage: string;
  owner_name: string;
  goal: string;
  acceptance_criteria: string;
};

const emptyForm: FormState = {
  name: "",
  client_name: "",
  description: "",
  current_stage: "需求确认",
  owner_name: "",
  goal: "",
  acceptance_criteria: ""
};

function parseBrief(brief: string) {
  const text = brief.trim();
  if (!text) {
    return null;
  }

  const lines = text.split("\n").map((line) => line.trim()).filter(Boolean);
  const firstLine = lines[0] ?? "";
  const ownerMatch = text.match(/负责人[:：]\s*([^\n]+)/i);
  const clientMatch = text.match(/客户[:：]\s*([^\n]+)/i);
  const goalMatch = text.match(/目标[:：]\s*([^\n]+)/i);
  const criteriaMatch = text.match(/验收标准[:：]\s*([^\n]+)/i);
  const stageMatch = stageOptions.find((option) => text.includes(option.value));

  return {
    name: firstLine.replace(/^(项目名称|项目)[:：]\s*/i, "") || "未命名项目",
    client_name: clientMatch?.[1]?.trim() ?? "",
    description: lines.slice(1, 4).join(" ") || text.slice(0, 120),
    current_stage: stageMatch?.value ?? "需求确认",
    owner_name: ownerMatch?.[1]?.trim() ?? "",
    goal: goalMatch?.[1]?.trim() ?? "",
    acceptance_criteria: criteriaMatch?.[1]?.trim() ?? ""
  };
}

export function CreateProjectForm() {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(emptyForm);
  const [brief, setBrief] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function applyTemplate(templateId: string) {
    const template = templates.find((item) => item.id === templateId);
    if (!template) {
      return;
    }

    setSelectedTemplate(templateId);
    setForm((current) => ({
      ...current,
      name: current.name || template.name,
      client_name: current.client_name || template.client_name,
      current_stage: template.current_stage,
      description: current.description || template.description,
      goal: current.goal || template.goal,
      acceptance_criteria: current.acceptance_criteria || template.acceptance_criteria
    }));
  }

  function applyBrief() {
    const parsed = parseBrief(brief);
    if (!parsed) {
      return;
    }

    setForm((current) => ({
      ...current,
      ...Object.fromEntries(
        Object.entries(parsed).map(([key, value]) => [key, current[key as keyof FormState] || value])
      )
    }) as FormState);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const project = await api.createProject({
        ...form,
        client_name: form.client_name || null,
        description: form.description || null,
        owner_name: form.owner_name || null,
        goal: form.goal || null,
        acceptance_criteria: form.acceptance_criteria || null
      });
      router.push(`/projects/${project.id}`);
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "创建项目失败");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card className="border-slate-200 bg-[linear-gradient(135deg,#f8fafc_0%,#f0fdf4_100%)]">
        <CardHeader>
          <CardTitle>项目模板</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 lg:grid-cols-3">
          {templates.map((template) => (
            <button
              key={template.id}
              type="button"
              onClick={() => applyTemplate(template.id)}
              className={`rounded-2xl border p-4 text-left transition ${
                selectedTemplate === template.id
                  ? "border-teal-400 bg-white shadow-[0_18px_40px_-32px_rgba(13,148,136,0.8)]"
                  : "border-slate-200 bg-white/80 hover:border-slate-300"
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <p className="font-semibold text-slate-900">{template.name}</p>
                <Badge variant="info">{template.current_stage}</Badge>
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-600">{template.description}</p>
            </button>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>粘贴项目资料自动补全</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            value={brief}
            onChange={(event) => setBrief(event.target.value)}
            rows={6}
            placeholder="可粘贴 PRD / 需求摘要 / 邮件说明，例如包含：项目名称、客户、负责人、目标、验收标准。"
          />
          <div className="flex flex-wrap items-center gap-3">
            <Button type="button" variant="outline" onClick={applyBrief}>
              自动补全
            </Button>
            <p className="text-sm text-slate-500">会优先补齐空字段，不会覆盖你已手动填写的内容。</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>新建项目</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">项目名称</Label>
                <Input id="name" value={form.name} onChange={(event) => updateField("name", event.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="client_name">客户名称</Label>
                <Input id="client_name" value={form.client_name} onChange={(event) => updateField("client_name", event.target.value)} />
              </div>
            </div>
            <div className="grid gap-6 md:grid-cols-[1.4fr_1fr]">
              <div className="space-y-2">
                <Label htmlFor="description">项目描述</Label>
                <Textarea id="description" value={form.description} onChange={(event) => updateField("description", event.target.value)} rows={4} />
              </div>
              <div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                <div className="space-y-2">
                  <Label htmlFor="current_stage">当前阶段</Label>
                  <Select id="current_stage" value={form.current_stage} onChange={(event) => updateField("current_stage", event.target.value)}>
                    {stageOptions.map((stage) => (
                      <option key={stage.value} value={stage.value}>
                        {stage.label}
                      </option>
                    ))}
                  </Select>
                </div>
                <p className="text-sm leading-6 text-slate-500">
                  {stageOptions.find((stage) => stage.value === form.current_stage)?.hint}
                </p>
              </div>
            </div>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="owner_name">负责人</Label>
                <Input id="owner_name" value={form.owner_name} onChange={(event) => updateField("owner_name", event.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="goal">项目目标</Label>
                <Textarea id="goal" value={form.goal} onChange={(event) => updateField("goal", event.target.value)} rows={3} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="acceptance_criteria">验收标准</Label>
              <Textarea
                id="acceptance_criteria"
                value={form.acceptance_criteria}
                onChange={(event) => updateField("acceptance_criteria", event.target.value)}
                rows={4}
                placeholder="建议按分号或换行拆分多个验收条目"
              />
            </div>
            {error ? <p className="text-sm text-rose-600">{error}</p> : null}
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "创建中..." : "创建项目"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
