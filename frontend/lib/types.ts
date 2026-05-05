export interface Project {
  id: string;
  name: string;
  client_name: string | null;
  description: string | null;
  current_stage: string;
  owner_name: string | null;
  goal: string | null;
  acceptance_criteria: string | null;
  meeting_count: number;
  last_meeting_time: string | null;
  pending_action_count: number;
  created_at: string;
  updated_at: string;
}

export interface Meeting {
  id: string;
  project_id: string;
  title: string;
  platform: string;
  meeting_time: string;
  participants: string | null;
  agenda: string | null;
  transcript_text: string;
  analysis_status: string;
  external_meeting_id: string | null;
  external_platform: string | null;
  created_at: string;
  updated_at: string;
}

export interface IntegrationConfig {
  id: string;
  platform: "tencent_meeting" | "dingtalk";
  api_mode: "real" | "mock" | "sandbox";
  config_json: Record<string, string>;
  is_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface IntegrationPlatformInfo {
  platform: "tencent_meeting" | "dingtalk";
  requested_mode: string;
  effective_mode: string;
  health: {
    platform: string;
    mode: string;
    configured: boolean;
    webhook_configured: boolean;
    capabilities: string[];
    warnings: string[];
  };
}

export interface ConnectionTestResult {
  connected: boolean;
  message: string;
  details: Record<string, string | boolean>;
}

export interface ExternalMeeting {
  external_id: string;
  title: string;
  start_time: string;
  end_time: string;
  participants: string[];
  platform: string;
  status: string;
  join_url: string | null;
  agenda: string | null;
}

export interface ExternalMeetingCreateResponse {
  external_meeting: ExternalMeeting;
  meeting: Meeting;
}

export interface TranscriptImportResult {
  meeting_id: string;
  external_meeting_id: string;
  imported: boolean;
  transcript_preview: string;
  analysis_status: string;
  platform: string;
}

export interface KeyDecision {
  confirmed: boolean;
  decision: string;
  owner: string;
  impact: string;
  evidence: string;
}

export interface ActionItem {
  confirmed: boolean;
  task: string;
  owner: string;
  deadline: string;
  priority: "high" | "medium" | "low";
  status: string;
  evidence: string;
}

export interface RequirementChange {
  confirmed: boolean;
  change: string;
  type: "new" | "modified" | "removed" | "unclear";
  impact_on_scope: string;
  need_confirmation: boolean;
  evidence: string;
}

export interface Risk {
  confirmed: boolean;
  risk: string;
  level: "high" | "medium" | "low";
  suggestion: string;
  evidence: string;
}

export interface OpenQuestion {
  question: string;
  owner: string;
  reason: string;
}

export interface MeetingAnalysis {
  id: string;
  meeting_id: string;
  meeting_summary: string;
  key_decisions: KeyDecision[];
  action_items: ActionItem[];
  requirement_changes: RequirementChange[];
  risks: Risk[];
  open_questions: OpenQuestion[];
  next_meeting_topics: string[];
  created_at: string;
  updated_at: string;
}

export interface AggregatedTodo {
  meeting_id: string;
  meeting_title: string;
  meeting_time: string;
  confirmed: boolean;
  task: string;
  owner: string;
  deadline: string;
  priority: "high" | "medium" | "low";
  status: string;
  evidence: string;
}

export interface AggregatedRisk {
  meeting_id: string;
  meeting_title: string;
  meeting_time: string;
  confirmed: boolean;
  risk: string;
  level: "high" | "medium" | "low";
  suggestion: string;
  evidence: string;
}

export interface AggregatedChange {
  meeting_id: string;
  meeting_title: string;
  meeting_time: string;
  confirmed: boolean;
  change: string;
  type: "new" | "modified" | "removed" | "unclear";
  impact_on_scope: string;
  need_confirmation: boolean;
  evidence: string;
}

export interface AggregatedDecision {
  meeting_id: string;
  meeting_title: string;
  meeting_time: string;
  confirmed: boolean;
  decision: string;
  owner: string;
  impact: string;
  evidence: string;
}

export interface ChatSource {
  meeting_id: string;
  meeting_title: string;
  meeting_time: string;
}

export interface ChatResponse {
  answer: string;
  sources: ChatSource[];
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  sources?: ChatSource[];
  isError?: boolean;
}

export interface ProjectSummary {
  id: string;
  project_id: string;
  summary_text: string;
  generated_at: string;
}

export interface ProjectMaterial {
  id: string;
  project_id: string;
  title: string;
  material_type: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface DashboardStats {
  total_projects: number;
  total_meetings: number;
  pending_action_items: number;
  active_risks: number;
}

export interface DemoStatus {
  seeded: boolean;
  project_name: string;
}

export interface DemoSeedResponse {
  seeded: boolean;
  project_id: string;
  project_name: string;
}

export interface ApiResponse<T> {
  data: T;
  message: string;
}
