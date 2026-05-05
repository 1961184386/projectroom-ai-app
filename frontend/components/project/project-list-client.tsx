"use client";

import useSWR from "swr";

import { ProjectCard } from "@/components/project/project-card";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { SkeletonCard } from "@/components/ui/skeleton-card";
import { api } from "@/lib/api";

export function ProjectListClient() {
  const { data, error, isLoading } = useSWR("/api/projects", api.listProjects);

  if (isLoading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <SkeletonCard lines={3} hasButton />
        <SkeletonCard lines={3} hasButton />
        <SkeletonCard lines={3} hasButton />
      </div>
    );
  }

  if (error) {
    return <ErrorState message={error.message} />;
  }

  if (!data || data.length === 0) {
    return (
      <EmptyState
        title="还没有项目"
        description="还没有项目，点击新建项目开始"
        actionHref="/projects/new"
        actionLabel="新建项目"
      />
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {data.map((project) => (
        <ProjectCard key={project.id} project={project} />
      ))}
    </div>
  );
}
