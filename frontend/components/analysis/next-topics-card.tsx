import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function NextTopicsCard({ topics }: { topics: string[] }) {
  if (topics.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>下次会议建议议题</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="list-disc space-y-2 pl-5 text-sm text-gray-700">
          {topics.map((topic, index) => (
            <li key={`${topic}-${index}`}>{topic}</li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
