import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function SummaryCard({ summary }: { summary: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>会议摘要</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="leading-7 text-gray-700">{summary}</p>
      </CardContent>
    </Card>
  );
}
