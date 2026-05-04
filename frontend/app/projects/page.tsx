import { ProjectListClient } from "@/components/project/project-list-client";

export default function ProjectsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold">项目空间</h1>
        <p className="mt-2 text-sm text-gray-500">集中沉淀项目会议、决策与后续行动。</p>
      </div>
      <ProjectListClient />
    </div>
  );
}
