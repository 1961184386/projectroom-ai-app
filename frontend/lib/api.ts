import { ApiResponse, Meeting, Project } from "@/lib/types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {})
    },
    cache: "no-store"
  });

  if (!response.ok) {
    let detail = "Request failed.";
    try {
      const payload = await response.json();
      detail = payload.detail ?? detail;
    } catch {
      detail = response.statusText || detail;
    }
    throw new Error(detail);
  }

  const payload = (await response.json()) as ApiResponse<T>;
  return payload.data;
}

export const api = {
  listProjects: () => request<Project[]>("/api/projects"),
  getProject: (projectId: string) => request<Project>(`/api/projects/${projectId}`),
  createProject: (payload: Partial<Project>) =>
    request<Project>("/api/projects", {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  updateProject: (projectId: string, payload: Partial<Project>) =>
    request<Project>(`/api/projects/${projectId}`, {
      method: "PATCH",
      body: JSON.stringify(payload)
    }),
  listMeetings: (projectId: string) =>
    request<Meeting[]>(`/api/projects/${projectId}/meetings`),
  getMeeting: (projectId: string, meetingId: string) =>
    request<Meeting>(`/api/projects/${projectId}/meetings/${meetingId}`),
  createMeeting: (projectId: string, payload: Partial<Meeting>) =>
    request<Meeting>(`/api/projects/${projectId}/meetings`, {
      method: "POST",
      body: JSON.stringify(payload)
    })
};
