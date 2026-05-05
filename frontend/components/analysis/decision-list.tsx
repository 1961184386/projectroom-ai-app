import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MeetingAnalysis } from "@/lib/types";

export function DecisionList({ items }: { items: MeetingAnalysis["key_decisions"] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>关键决策</CardTitle>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-sm text-gray-500">本次会议无正式决策</p>
        ) : (
          <div className="space-y-4">
            {items.map((item, index) => (
              <div key={`${item.decision}-${index}`} className="rounded-lg border border-gray-200 p-4">
                <p className="font-medium text-gray-900">{item.decision}</p>
                <p className="mt-2 text-sm text-gray-600">负责人：{item.owner || "待确认"}</p>
                <p className="mt-1 text-sm text-gray-500">{item.impact || "未补充影响说明"}</p>
                {item.evidence ? (
                  <details className="mt-3 text-sm text-gray-500">
                    <summary className="cursor-pointer">引用原文</summary>
                    <p className="mt-2 leading-6">{item.evidence}</p>
                  </details>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
