import {
  AggregatedChange,
  AggregatedDecision,
  AggregatedRisk,
  AggregatedTodo,
  ApiResponse,
  ChatResponse,
  ConnectionTestResult,
  DashboardStats,
  DemoSeedResponse,
  DemoStatus,
  ExternalMeetingCreateResponse,
  IntegrationConfig,
  IntegrationPlatformInfo,
  Meeting,
  MeetingAnalysis,
  ProjectMaterial,
  ProjectSummary,
  Project,
  TranscriptImportResult
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
  listProjects: (stage?: string) =>
    request<Project[]>(`/api/projects${stage ? `?stage=${encodeURIComponent(stage)}` : ""}`),
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
  listIntegrationConfigs: () => request<IntegrationConfig[]>("/api/integrations/configs"),
  saveIntegrationConfig: (payload: Partial<IntegrationConfig>) =>
    request<IntegrationConfig>("/api/integrations/configs", {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  deleteIntegrationConfig: (configId: string) =>
    request<{ id: string }>(`/api/integrations/configs/${configId}`, {
      method: "DELETE"
    }),
  getIntegrationInfo: (platform: string) =>
    request<IntegrationPlatformInfo>(`/api/integrations/${platform}/info`),
  testIntegrationConnection: (platform: string) =>
    request<ConnectionTestResult>(`/api/integrations/${platform}/test`, {
      method: "POST"
    }),
  createExternalMeeting: (
    platform: string,
    payload: {
      project_id: string;
      title: string;
      start_time: string;
      end_time: string;
      participants: string[];
      agenda?: string | null;
    }
  ) =>
    request<ExternalMeetingCreateResponse>(`/api/integrations/${platform}/meetings`, {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  syncIntegrationMeetings: (platform: string, payload: { project_id: string; limit?: number }) =>
    request<Meeting[]>(`/api/integrations/${platform}/meetings/sync`, {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  importIntegrationTranscript: (
    platform: string,
    externalMeetingId: string,
    payload: { project_id: string; recording_id?: string | null; auto_analyze?: boolean }
  ) =>
    request<TranscriptImportResult>(`/api/integrations/${platform}/import/${externalMeetingId}`, {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  listProjectMaterials: (projectId: string) =>
    request<ProjectMaterial[]>(`/api/projects/${projectId}/materials`),
  createProjectMaterial: (projectId: string, payload: Partial<ProjectMaterial>) =>
    request<ProjectMaterial>(`/api/projects/${projectId}/materials`, {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  deleteProjectMaterial: (projectId: string, materialId: string) =>
    request<{ id: string }>(`/api/projects/${projectId}/materials/${materialId}`, {
      method: "DELETE"
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
    request<MeetingAnalysis>(`/api/meetings/${meetingId}/analysis`),
  confirmAnalysisItem: (
    meetingId: string,
    payload: {
      item_type: "action_item" | "risk" | "requirement_change" | "key_decision";
      item_index: number;
      confirmed: boolean;
    }
  ) =>
    request<MeetingAnalysis>(`/api/meetings/${meetingId}/analysis/confirm`, {
      method: "PATCH",
      body: JSON.stringify(payload)
    }),
  getDashboardStats: () => request<DashboardStats>("/api/dashboard/stats"),
  getDemoStatus: () => request<DemoStatus>("/api/demo/status"),
  seedDemoData: () =>
    request<DemoSeedResponse>("/api/demo/seed", {
      method: "POST"
    })
};
