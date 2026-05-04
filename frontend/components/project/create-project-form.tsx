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

const stageOptions = ["需求确认", "开发中", "测试", "验收", "完成"];

export function CreateProjectForm() {
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
      const project = await api.createProject({
        name: getStringValue(formData, "name"),
        client_name: getOptionalStringValue(formData, "client_name"),
        description: getOptionalStringValue(formData, "description"),
        current_stage: getStringValue(formData, "current_stage") || "需求确认",
        owner_name: getOptionalStringValue(formData, "owner_name"),
        goal: getOptionalStringValue(formData, "goal"),
        acceptance_criteria: getOptionalStringValue(formData, "acceptance_criteria")
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
    <Card>
      <CardHeader>
        <CardTitle>新建项目</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="name">项目名称</Label>
            <Input id="name" name="name" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="client_name">客户名称</Label>
            <Input id="client_name" name="client_name" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">项目描述</Label>
            <Textarea id="description" name="description" rows={4} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="current_stage">当前阶段</Label>
            <Select id="current_stage" name="current_stage" defaultValue="需求确认">
              {stageOptions.map((stage) => (
                <option key={stage} value={stage}>
                  {stage}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="owner_name">负责人</Label>
            <Input id="owner_name" name="owner_name" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="goal">项目目标</Label>
            <Textarea id="goal" name="goal" rows={3} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="acceptance_criteria">验收标准</Label>
            <Textarea id="acceptance_criteria" name="acceptance_criteria" rows={3} />
          </div>
          {error ? <p className="text-sm text-rose-600">{error}</p> : null}
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "创建中..." : "创建项目"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
