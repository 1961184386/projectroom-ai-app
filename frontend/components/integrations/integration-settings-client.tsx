"use client";

import useSWR from "swr";

import { PlatformConfigCard } from "@/components/integrations/platform-config-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ErrorState } from "@/components/ui/error-state";
import { SkeletonCard } from "@/components/ui/skeleton-card";
import { api } from "@/lib/api";

const platforms = ["tencent_meeting", "dingtalk"] as const;

export function IntegrationSettingsClient() {
  const configState = useSWR("/api/integrations/configs", api.listIntegrationConfigs);
  const tencentInfoState = useSWR("/api/integrations/tencent_meeting/info", () => api.getIntegrationInfo("tencent_meeting"));
  const dingtalkInfoState = useSWR("/api/integrations/dingtalk/info", () => api.getIntegrationInfo("dingtalk"));

  if (configState.isLoading || tencentInfoState.isLoading || dingtalkInfoState.isLoading) {
    return (
      <div className="space-y-6">
        <SkeletonCard lines={3} />
        <SkeletonCard lines={4} />
      </div>
    );
  }

  if (configState.error || tencentInfoState.error || dingtalkInfoState.error) {
    return (
      <ErrorState
        message={
          configState.error?.message ||
          tencentInfoState.error?.message ||
          dingtalkInfoState.error?.message ||
          "加载集成配置失败"
        }
      />
    );
  }

  const configs = configState.data ?? [];
  const infoMap = {
    tencent_meeting: tencentInfoState.data,
    dingtalk: dingtalkInfoState.data,
  };

  return (
    <div className="space-y-6">
      <Card className="border-slate-200 bg-[radial-gradient(circle_at_top_left,_rgba(20,184,166,0.12),_transparent_30%),linear-gradient(135deg,#ffffff_0%,#f8fafc_100%)]">
        <CardHeader>
          <CardTitle>会议平台集成</CardTitle>
        </CardHeader>
        <CardContent className="text-sm leading-7 text-slate-600">
          在这里配置腾讯会议和钉钉接入。真实密钥仅从环境变量和本页配置读取；如果没有密钥，系统会自动退回 mock/sandbox，保证本地演示不崩溃。
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-2">
        {platforms.map((platform) => (
          <PlatformConfigCard
            key={platform}
            platform={platform}
            config={configs.find((item) => item.platform === platform)}
            info={infoMap[platform]}
          />
        ))}
      </div>
    </div>
  );
}
