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
  created_at: string;
  updated_at: string;
}

export interface KeyDecision {
  decision: string;
  owner: string;
  impact: string;
  evidence: string;
}

export interface ActionItem {
  task: string;
  owner: string;
  deadline: string;
  priority: "high" | "medium" | "low";
  status: string;
  evidence: string;
}

export interface RequirementChange {
  change: string;
  type: "new" | "modified" | "removed" | "unclear";
  impact_on_scope: string;
  need_confirmation: boolean;
  evidence: string;
}

export interface Risk {
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
  risk: string;
  level: "high" | "medium" | "low";
  suggestion: string;
  evidence: string;
}

export interface AggregatedChange {
  meeting_id: string;
  meeting_title: string;
  meeting_time: string;
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

export interface ApiResponse<T> {
  data: T;
  message: string;
}
