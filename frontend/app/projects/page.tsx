import { ProjectListClient } from "@/components/project/project-list-client";

export default function ProjectsPage() {
  return (
    <div className="space-y-10">
      <div className="relative overflow-hidden rounded-[2rem] border border-slate-200/80 bg-[radial-gradient(circle_at_top_left,_rgba(15,118,110,0.18),_transparent_35%),linear-gradient(135deg,#f8fafc_0%,#eefbf8_45%,#fffdf5_100%)] px-6 py-8 shadow-[0_24px_80px_-48px_rgba(15,23,42,0.45)] sm:px-8">
        <div className="absolute inset-y-0 right-0 hidden w-1/3 bg-[linear-gradient(180deg,rgba(251,191,36,0.18),rgba(255,255,255,0))] lg:block" />
        <div className="relative space-y-4">
          <span className="inline-flex rounded-full border border-slate-300 bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-slate-600">
            Demo Ready Workspace
          </span>
          <h1 className="max-w-3xl text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
            把散落在会议里的项目事实，整理成可以直接演示和推进的交付驾驶舱。
          </h1>
          <p className="max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
            从项目创建、会议沉淀、AI 提炼到任务确认闭环，一套页面就能展示当前风险、决策和下一步行动。
          </p>
        </div>
      </div>
      <ProjectListClient />
    </div>
  );
}
