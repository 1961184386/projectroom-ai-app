import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function ErrorState({ message }: { message: string }) {
  return (
    <Card className="border-rose-200 bg-rose-50">
      <CardHeader>
        <CardTitle className="text-rose-700">加载失败</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-rose-700">{message}</p>
      </CardContent>
    </Card>
  );
}
