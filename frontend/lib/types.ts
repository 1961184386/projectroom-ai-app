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

export interface ApiResponse<T> {
  data: T;
  message: string;
}
