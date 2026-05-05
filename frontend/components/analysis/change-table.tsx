import { useState } from "react";

import { ConfirmationToggle } from "@/components/analysis/confirmation-toggle";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/lib/api";
import { MeetingAnalysis } from "@/lib/types";

const typeVariantMap = {
  new: "info",
  modified: "warning",
  removed: "danger",
  unclear: "default"
} as const;

const typeLabelMap = {
  new: "新增",
  modified: "修改",
  removed: "删除",
  unclear: "待明确"
} as const;

export function ChangeTable({
  items,
  meetingId,
  onAnalysisUpdated
}: {
  items: MeetingAnalysis["requirement_changes"];
  meetingId: string;
  onAnalysisUpdated: (analysis: MeetingAnalysis) => void;
}) {
  const [pendingIndex, setPendingIndex] = useState<number | null>(null);

  async function handleConfirm(index: number, confirmed: boolean) {
    setPendingIndex(index);
    try {
      const nextAnalysis = await api.confirmAnalysisItem(meetingId, {
        item_type: "requirement_change",
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
        <CardTitle>需求变更</CardTitle>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-sm text-gray-500">本次会议无需求变更</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-gray-200 text-gray-500">
                <tr>
                  <th className="py-3 pr-4 font-medium">变更内容</th>
                  <th className="py-3 pr-4 font-medium">类型</th>
                  <th className="py-3 pr-4 font-medium">影响</th>
                  <th className="py-3 pr-4 font-medium">业务状态</th>
                  <th className="py-3 font-medium">确认</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, index) => (
                  <tr key={`${item.change}-${index}`} className="border-b border-gray-100 last:border-0">
                    <td className="py-3 pr-4 text-gray-700">{item.change}</td>
                    <td className="py-3 pr-4">
                      <Badge variant={typeVariantMap[item.type]}>{typeLabelMap[item.type]}</Badge>
                    </td>
                    <td className="py-3 pr-4 text-gray-700">{item.impact_on_scope || "待补充"}</td>
                    <td className="py-3 pr-4">
                      <Badge variant={item.need_confirmation ? "danger" : "success"}>
                        {item.need_confirmation ? "需确认" : "已明确"}
                      </Badge>
                    </td>
                    <td className="py-3">
                      <ConfirmationToggle
                        confirmed={item.confirmed}
                        isSubmitting={pendingIndex === index}
                        onClick={() => handleConfirm(index, item.confirmed)}
                      />
                    </td>
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
