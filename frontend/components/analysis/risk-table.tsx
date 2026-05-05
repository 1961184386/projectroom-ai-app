import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MeetingAnalysis } from "@/lib/types";

const levelVariantMap = {
  high: "danger",
  medium: "warning",
  low: "success"
} as const;

const levelLabelMap = {
  high: "高",
  medium: "中",
  low: "低"
} as const;

export function RiskTable({ items }: { items: MeetingAnalysis["risks"] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>风险点</CardTitle>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-sm text-gray-500">未发现明显风险</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-gray-200 text-gray-500">
                <tr>
                  <th className="py-3 pr-4 font-medium">风险描述</th>
                  <th className="py-3 pr-4 font-medium">等级</th>
                  <th className="py-3 font-medium">建议措施</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, index) => (
                  <tr key={`${item.risk}-${index}`} className="border-b border-gray-100 last:border-0">
                    <td className="py-3 pr-4 text-gray-700">{item.risk}</td>
                    <td className="py-3 pr-4">
                      <Badge variant={levelVariantMap[item.level]}>{levelLabelMap[item.level]}</Badge>
                    </td>
                    <td className="py-3 text-gray-700">{item.suggestion || "待补充"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
