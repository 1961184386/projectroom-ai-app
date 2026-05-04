import Link from "next/link";

import { StageBadge } from "@/components/project/stage-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Project } from "@/lib/types";
import { formatRelativeTime } from "@/lib/utils";

export function ProjectCard({ project }: { project: Project }) {
  return (
    <Card className="h-full">
      <CardHeader className="gap-3">
        <div className="flex items-start justify-between gap-3">
          <CardTitle className="text-xl">{project.name}</CardTitle>
          <StageBadge stage={project.current_stage} />
        </div>
        {project.client_name ? <p className="text-sm text-gray-500">{project.client_name}</p> : null}
      </CardHeader>
      <CardContent className="flex h-[calc(100%-7rem)] flex-col justify-between gap-6">
        <div className="space-y-2 text-sm text-gray-600">
          <p>负责人：{project.owner_name || "未填写"}</p>
          <p>{project.meeting_count} 次会议</p>
          <p>最近更新：{formatRelativeTime(project.updated_at)}</p>
        </div>
        <Link href={`/projects/${project.id}`} className="inline-flex">
          <Button variant="outline">查看详情</Button>
        </Link>
      </CardContent>
    </Card>
  );
}
