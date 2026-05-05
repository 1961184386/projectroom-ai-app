import Link from "next/link";

import { StageBadge } from "@/components/project/stage-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Project } from "@/lib/types";
import { formatDateTime, formatRelativeTime } from "@/lib/utils";

export function ProjectCard({ project }: { project: Project }) {
  return (
    <Card className="h-full border-slate-200/80 bg-white/95 transition-all hover:-translate-y-0.5 hover:border-teal-200 hover:shadow-[0_24px_60px_-36px_rgba(15,118,110,0.45)]">
      <CardHeader className="gap-3">
        <div className="flex items-start justify-between gap-3">
          <CardTitle className="text-xl">{project.name}</CardTitle>
          <StageBadge stage={project.current_stage} />
        </div>
        {project.client_name ? <p className="text-sm text-gray-500">{project.client_name}</p> : null}
      </CardHeader>
      <CardContent className="flex h-[calc(100%-7rem)] flex-col justify-between gap-6">
        <div className="space-y-3 text-sm text-slate-600">
          <p>负责人：{project.owner_name || "未填写"}</p>
          <div className="flex flex-wrap gap-2">
            <Badge variant="info">{project.meeting_count} 次会议</Badge>
            <Badge variant={project.pending_action_count > 0 ? "warning" : "success"}>
              {project.pending_action_count} 个待办
            </Badge>
          </div>
          <p>最近更新：{formatRelativeTime(project.updated_at)}</p>
          <p>
            最近会议：
            {" "}
            {project.last_meeting_time ? formatDateTime(project.last_meeting_time) : "暂无会议"}
          </p>
        </div>
        <Link href={`/projects/${project.id}`} className="inline-flex">
          <Button variant="outline">查看详情</Button>
        </Link>
      </CardContent>
    </Card>
  );
}
