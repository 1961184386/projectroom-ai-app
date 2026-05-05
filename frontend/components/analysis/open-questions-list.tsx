import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MeetingAnalysis } from "@/lib/types";

export function OpenQuestionsList({ items }: { items: MeetingAnalysis["open_questions"] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>待确认问题</CardTitle>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-sm text-gray-500">无待确认问题</p>
        ) : (
          <div className="space-y-4">
            {items.map((item, index) => (
              <div key={`${item.question}-${index}`} className="rounded-lg border border-gray-200 p-4">
                <p className="font-medium text-gray-900">{item.question}</p>
                <p className="mt-2 text-sm text-gray-600">负责人：{item.owner || "待确认"}</p>
                <p className="mt-1 text-sm text-gray-500">{item.reason || "未说明原因"}</p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
