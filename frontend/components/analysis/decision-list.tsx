import { useState } from "react";

import { ConfirmationToggle } from "@/components/analysis/confirmation-toggle";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/lib/api";
import { MeetingAnalysis } from "@/lib/types";

export function DecisionList({
  items,
  meetingId,
  onAnalysisUpdated
}: {
  items: MeetingAnalysis["key_decisions"];
  meetingId: string;
  onAnalysisUpdated: (analysis: MeetingAnalysis) => void;
}) {
  const [pendingIndex, setPendingIndex] = useState<number | null>(null);

  async function handleConfirm(index: number, confirmed: boolean) {
    setPendingIndex(index);
    try {
      const nextAnalysis = await api.confirmAnalysisItem(meetingId, {
        item_type: "key_decision",
        item_index: index,
        confirmed: !confirmed
      });
      onAnalysisUpdated(nextAnalysis);
    } finally {
      setPendingIndex(null);
    }
  }

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
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <p className="font-medium text-gray-900">{item.decision}</p>
                  <ConfirmationToggle
                    confirmed={item.confirmed}
                    isSubmitting={pendingIndex === index}
                    onClick={() => handleConfirm(index, item.confirmed)}
                  />
                </div>
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
