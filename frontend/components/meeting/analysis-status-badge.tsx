import { Badge } from "@/components/ui/badge";

const analysisVariantMap: Record<string, "default" | "info" | "success" | "danger"> = {
  pending: "default",
  processing: "info",
  done: "success",
  failed: "danger"
};

const analysisLabelMap: Record<string, string> = {
  pending: "待分析",
  processing: "分析中",
  done: "已完成",
  failed: "失败"
};

export function AnalysisStatusBadge({ status }: { status: string }) {
  return <Badge variant={analysisVariantMap[status] ?? "default"}>{analysisLabelMap[status] ?? status}</Badge>;
}
