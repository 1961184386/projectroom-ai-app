import { Badge } from "@/components/ui/badge";

const platformLabelMap: Record<string, string> = {
  manual: "手动输入",
  tencent_meeting: "腾讯会议",
  dingtalk: "钉钉会议",
  feishu: "飞书妙记"
};

export function PlatformBadge({ platform }: { platform: string }) {
  return <Badge variant="default">{platformLabelMap[platform] ?? platform}</Badge>;
}
