import { ProjectListClient } from "@/components/project/project-list-client";

export default function ProjectsPage() {
  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <h1 className="text-3xl font-semibold">项目空间</h1>
        <p className="max-w-2xl text-sm leading-6 text-gray-500">
          集中沉淀项目会议、决策与后续行动，让每一次讨论都能持续转化为可追踪的项目资产。
        </p>
      </div>
      <ProjectListClient />
    </div>
  );
}
