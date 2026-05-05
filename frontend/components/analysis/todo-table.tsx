import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MeetingAnalysis } from "@/lib/types";

const priorityVariantMap = {
  high: "danger",
  medium: "warning",
  low: "default"
} as const;

const priorityLabelMap = {
  high: "高",
  medium: "中",
  low: "低"
} as const;

export function TodoTable({ items }: { items: MeetingAnalysis["action_items"] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>任务清单</CardTitle>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-sm text-gray-500">本次会议无待办任务</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-gray-200 text-gray-500">
                <tr>
                  <th className="py-3 pr-4 font-medium">任务</th>
                  <th className="py-3 pr-4 font-medium">负责人</th>
                  <th className="py-3 pr-4 font-medium">截止日期</th>
                  <th className="py-3 pr-4 font-medium">优先级</th>
                  <th className="py-3 font-medium">状态</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, index) => (
                  <tr key={`${item.task}-${index}`} className="border-b border-gray-100 last:border-0">
                    <td className="py-3 pr-4 text-gray-700">{item.task}</td>
                    <td className="py-3 pr-4 text-gray-700">{item.owner || "待确认"}</td>
                    <td className="py-3 pr-4 text-gray-700">{item.deadline || "待确认"}</td>
                    <td className="py-3 pr-4">
                      <Badge variant={priorityVariantMap[item.priority]}>{priorityLabelMap[item.priority]}</Badge>
                    </td>
                    <td className="py-3 text-gray-700">{item.status === "pending" ? "待处理" : item.status}</td>
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
