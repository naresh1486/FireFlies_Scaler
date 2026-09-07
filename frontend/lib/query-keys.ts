export const queryKeys = {
  health: ["health"] as const,
  currentUser: ["current-user"] as const,
  meetings: {
    all: ["meetings"] as const,
    list: (filters: Record<string, unknown>) => ["meetings", "list", filters] as const,
    detail: (id: number) => ["meetings", "detail", id] as const,
    transcript: (id: number) => ["meetings", id, "transcript"] as const,
    summary: (id: number) => ["meetings", id, "summary"] as const,
    notes: (id: number) => ["meetings", id, "notes"] as const,
    actionItems: (id: number) => ["meetings", id, "action-items"] as const,
  },
  actionItem: {
    detail: (id: number) => ["action-items", id] as const,
  },
  search: (q: string) => ["search", q] as const,
  participants: {
    list: (q?: string) => ["participants", "list", q ?? ""] as const,
  },
};

export interface UserRead {
  id: number;
  name: string;
  avatar_url: string | null;
  created_at: string;
}

export interface HealthResponse {
  status: string;
  app_env: string;
  version: string;
}

export type Channel = "my" | "all" | "voice" | "uploads";
export type CaptureSource = "upload" | "mic" | "bot" | "desktop" | "browser";
export type SortOption =
  | "recent"
  | "oldest"
  | "longest"
  | "shortest"
  | "title_asc";

export interface MeetingParticipantRead {
  id: number;
  name: string;
  email: string | null;
  avatar_url: string | null;
  role: string | null;
}

export interface MeetingRead {
  id: number;
  title: string;
  starts_at: string;
  duration_seconds: number;
  host: string;
  channel: Channel;
  capture_source: CaptureSource;
  language: string;
  media_url: string;
  bookmarked: boolean;
  participants: MeetingParticipantRead[];
  created_at: string;
  updated_at: string;
}

export interface MeetingListResponse {
  items: MeetingRead[];
  page: number;
  page_size: number;
  total: number;
  has_more: boolean;
}

export interface MeetingUpdatePayload {
  title?: string;
  starts_at?: string;
  duration_seconds?: number;
  host?: string;
  channel?: Channel;
  capture_source?: CaptureSource;
  language?: string;
  media_url?: string;
  bookmarked?: boolean;
  participant_names?: string[];
}

export interface MeetingCreatePayload extends MeetingUpdatePayload {
  title: string;
  starts_at: string;
  duration_seconds: number;
  host: string;
  channel?: Channel;
  capture_source?: CaptureSource;
  language?: string;
  media_url?: string;
  bookmarked?: boolean;
  participant_names?: string[];
}

export interface SummaryRead {
  meeting_id: number;
  overview: string;
  key_points: string[];
  decisions: string[];
}

export interface NotesSectionRead {
  id: number;
  meeting_id: number;
  heading: string;
  subheading: string | null;
  body: string;
  sequence: number;
}

export interface NotesRead {
  meeting_id: number;
  sections: NotesSectionRead[];
}

export interface ActionItemRead {
  id: number;
  meeting_id: number;
  title: string;
  description: string | null;
  assignee: string | null;
  due_date: string | null;
  completed: boolean;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ActionItemListResponse {
  items: ActionItemRead[];
  total: number;
}

export interface ActionItemCreatePayload {
  title: string;
  description?: string | null;
  assignee?: string | null;
  due_date?: string | null;
}

export interface ActionItemUpdatePayload {
  title?: string;
  description?: string | null;
  assignee?: string | null;
  due_date?: string | null;
  completed?: boolean;
}

export interface TranscriptSegmentRead {
  id: number;
  meeting_id: number;
  speaker_name: string;
  speaker_key: string;
  start_time: number;
  end_time: number;
  text: string;
  sequence: number;
}

export interface TranscriptRead {
  meeting_id: number;
  segments: TranscriptSegmentRead[];
}