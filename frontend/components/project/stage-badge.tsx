import { Badge } from "@/components/ui/badge";

const stageVariantMap: Record<string, "default" | "info" | "warning" | "success"> = {
  "需求确认": "default",
  "开发中": "info",
  "测试": "warning",
  "验收": "success",
  "完成": "success"
};

export function StageBadge({ stage }: { stage: string }) {
  return <Badge variant={stageVariantMap[stage] ?? "default"}>{stage}</Badge>;
}
