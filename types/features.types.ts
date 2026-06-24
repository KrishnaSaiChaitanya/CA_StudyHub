// Add feature-specific types here

export interface Profile {
  full_name: string | null;
}

export interface Group {
  id: string;
  name: string;
  description: string | null;
  profile_image_url?: string | null;
  banner_image_url?: string | null;
  follower_count?: number;
  created_at: string;
}

export interface Post {
  id: string;
  user_id: string;
  group_id: string | null;
  title: string;
  content: string;
  image_url: string | null;
  category: string;
  status: string;
  is_spom_observation: boolean;
  created_at: string;
  profiles: Profile;
  reply_count: number;
  upvotes: number;
  downvotes: number;
  myVote: number;
}

export interface Reply {
  id: string;
  user_id: string;
  post_id: string;
  parent_reply_id: string | null;
  content: string;
  created_at: string;
  profiles: Profile;
  replies?: Reply[]; // for nested replies
}

export interface SPOMCategory {
  id: string;
  name: string;
  video_id: string;
}

export interface SPOMVideo {
  id: string;
  title: string;
  url: string;
  category_id: string;
  duration_minutes: number;
}

export const DEMO_USER_ID = "00000000-0000-0000-0000-000000000000";

export const PAPER_FILTERS = [
  "All",
  "Set A",
  "Set B",
  "Set C",
  "Set D"
] as const;

export type Tab = "overview" | "lectures" | "materials" | "observations" | "faqs";

export interface Observation {
  id: string;
  user_id?: string;
  author?: string;
  attemptedOn?: string;
  body?: string;
  replies?: any[];
  title?: string;
  content?: string;
  created_at?: string;
  createdAt?: string;
  upvotes?: number;
  likes?: number;
  downvotes?: number;
  hasLiked?: boolean;
  profiles?: Profile;
  set?: typeof PAPER_FILTERS[number] | string;
}

export interface PaperMaterial {
  id: string;
  title: string;
  url: string;
  set: typeof PAPER_FILTERS[number] | string;
  paper?: string;
  type?: string;
  pages?: number;
}

export interface BookmarkItem {
  id: string;
  type: "pdf" | "video" | "link" | "question" | "spom" | string;
  title: string;
  source: string;
  savedAt: string;
  url?: string;
  subject?: string;
  exam_year?: string;
  targetId?: string;
  questionId?: string;
  test_no?: string;
  spom_material_id?: string;
  planner?: any;
  question?: any;
  created_at?: string;
}

export interface DbNote {
  id: string;
  bookmark_id?: string;
  note_text?: string;
  title: string;
  content: string;
  created_at: string;
  updated_at?: string;
}
