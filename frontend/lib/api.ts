import {
  AggregatedChange,
  AggregatedDecision,
  AggregatedRisk,
  AggregatedTodo,
  ApiResponse,
  ChatResponse,
  Meeting,
  MeetingAnalysis,
  ProjectSummary,
  Project
} from "@/lib/types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

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
    throw new ApiError(detail, response.status);
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
    }),
  listProjectTodos: (projectId: string) =>
    request<AggregatedTodo[]>(`/api/projects/${projectId}/todos`),
  listProjectRisks: (projectId: string) =>
    request<AggregatedRisk[]>(`/api/projects/${projectId}/risks`),
  listProjectChanges: (projectId: string) =>
    request<AggregatedChange[]>(`/api/projects/${projectId}/changes`),
  listProjectDecisions: (projectId: string) =>
    request<AggregatedDecision[]>(`/api/projects/${projectId}/decisions`),
  getProjectSummary: (projectId: string) =>
    request<ProjectSummary>(`/api/projects/${projectId}/summary`),
  generateProjectSummary: (projectId: string) =>
    request<ProjectSummary | null>(`/api/projects/${projectId}/summary`, {
      method: "POST"
    }),
  askProject: (projectId: string, question: string) =>
    request<ChatResponse>(`/api/projects/${projectId}/chat`, {
      method: "POST",
      body: JSON.stringify({ question })
    }),
  analyzeMeeting: (meetingId: string) =>
    request<MeetingAnalysis>(`/api/meetings/${meetingId}/analyze`, {
      method: "POST"
    }),
  getAnalysis: (meetingId: string) =>
    request<MeetingAnalysis>(`/api/meetings/${meetingId}/analysis`)
};
