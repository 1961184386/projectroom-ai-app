import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function SkeletonCard({
  lines = 3,
  hasButton = false
}: {
  lines?: number;
  hasButton?: boolean;
}) {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-5 w-40" />
      </CardHeader>
      <CardContent className="space-y-3">
        {Array.from({ length: lines }).map((_, index) => (
          <Skeleton
            key={index}
            className={`h-4 ${index === lines - 1 ? "w-3/5" : "w-full"}`}
          />
        ))}
        {hasButton ? <Skeleton className="mt-4 h-9 w-24" /> : null}
      </CardContent>
    </Card>
  );
}
