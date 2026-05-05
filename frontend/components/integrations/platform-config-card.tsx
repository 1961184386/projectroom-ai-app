"use client";

import { FormEvent, useState } from "react";
import { mutate } from "swr";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { api } from "@/lib/api";
import { ConnectionTestResult, IntegrationConfig, IntegrationPlatformInfo } from "@/lib/types";

const platformLabelMap = {
  tencent_meeting: "腾讯会议",
  dingtalk: "钉钉",
};

interface PlatformConfigCardProps {
  platform: "tencent_meeting" | "dingtalk";
  config?: IntegrationConfig;
  info?: IntegrationPlatformInfo;
}

export function PlatformConfigCard({ platform, config, info }: PlatformConfigCardProps) {
  const [apiMode, setApiMode] = useState<"real" | "mock" | "sandbox">(config?.api_mode ?? "mock");
  const [isEnabled, setIsEnabled] = useState(config?.is_enabled ?? true);
  const [message, setMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [lastTest, setLastTest] = useState<ConnectionTestResult | null>(null);

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setIsSaving(true);
    const formData = new FormData(event.currentTarget);
    const configJson = Object.fromEntries(
      Array.from(formData.entries())
        .filter(([key, value]) => key.startsWith("config_") && String(value).trim())
        .map(([key, value]) => [key.replace("config_", ""), String(value)])
    );

    try {
      await api.saveIntegrationConfig({
        platform,
        api_mode: apiMode as "real" | "mock" | "sandbox",
        is_enabled: isEnabled,
        config_json: configJson
      });
      await Promise.all([mutate("/api/integrations/configs"), mutate(`/api/integrations/${platform}/info`)]);
      setMessage("配置已保存");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "保存失败");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleTest() {
    setMessage("");
    setIsTesting(true);
    try {
      const result = await api.testIntegrationConnection(platform);
      setLastTest(result);
      setMessage(result.message);
      await mutate(`/api/integrations/${platform}/info`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "连接测试失败");
    } finally {
      setIsTesting(false);
    }
  }

  const fields =
    platform === "tencent_meeting"
      ? [
          ["app_id", "App ID"],
          ["corp_id", "Corp ID"],
          ["secret_id", "Secret ID"],
          ["secret_key", "Secret Key"],
          ["webhook_token", "Webhook Token"]
        ]
      : [
          ["app_key", "App Key"],
          ["app_secret", "App Secret"],
          ["corp_id", "Corp ID"],
          ["agent_id", "Agent ID"],
          ["webhook_token", "Webhook Token"]
        ];

  return (
    <Card className="border-slate-200 bg-white/90">
      <CardHeader className="gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle>{platformLabelMap[platform]}</CardTitle>
          <div className="flex flex-wrap gap-2">
            <Badge variant={info?.effective_mode === "real" ? "success" : "info"}>
              {info?.effective_mode === "real" ? "真实模式" : "Mock / Sandbox"}
            </Badge>
            <Badge variant={info?.health.configured ? "success" : "warning"}>
              {info?.health.configured ? "已配置" : "待配置"}
            </Badge>
          </div>
        </div>
        <p className="text-sm text-slate-500">
          支持真实环境变量接入；无密钥时默认走 mock，页面和后端仍可演示。
        </p>
      </CardHeader>
      <CardContent className="space-y-5">
        <form className="space-y-5" onSubmit={handleSave}>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor={`${platform}-mode`}>API 模式</Label>
              <Select
                id={`${platform}-mode`}
                value={apiMode}
                onChange={(event) => setApiMode(event.target.value as "real" | "mock" | "sandbox")}
              >
                <option value="mock">mock</option>
                <option value="sandbox">sandbox</option>
                <option value="real">real</option>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor={`${platform}-enabled`}>启用状态</Label>
              <Select
                id={`${platform}-enabled`}
                value={isEnabled ? "enabled" : "disabled"}
                onChange={(event) => setIsEnabled(event.target.value === "enabled")}
              >
                <option value="enabled">启用</option>
                <option value="disabled">禁用</option>
              </Select>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {fields.map(([key, label]) => (
              <div key={key} className="space-y-2">
                <Label htmlFor={`${platform}-${key}`}>{label}</Label>
                <Input
                  id={`${platform}-${key}`}
                  name={`config_${key}`}
                  defaultValue={config?.config_json?.[key] ?? ""}
                  placeholder={label}
                />
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-3">
            <Button type="submit" disabled={isSaving}>
              {isSaving ? "保存中..." : "保存配置"}
            </Button>
            <Button type="button" variant="outline" onClick={handleTest} disabled={isTesting}>
              {isTesting ? "测试中..." : "测试连接"}
            </Button>
          </div>
        </form>

        {info ? (
          <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 text-sm text-slate-600">
            <p>能力：{info.health.capabilities.join(" / ")}</p>
            <p className="mt-2">Webhook：{info.health.webhook_configured ? "已配置" : "未配置"}</p>
            {info.health.warnings.length > 0 ? <p className="mt-2 text-amber-700">{info.health.warnings.join("；")}</p> : null}
            {lastTest ? (
              <p className="mt-2 text-teal-700">
                最近测试：{lastTest.connected ? "成功" : "失败"}，{lastTest.message}
              </p>
            ) : null}
          </div>
        ) : null}

        {message ? <p className="text-sm text-slate-600">{message}</p> : null}
      </CardContent>
    </Card>
  );
}
