export type Tab = "overview" | "materials" | "faqs" | "observations";

export interface Observation {
  id: string;
  author: string;
  set: "Set A" | "Set B" | "Set C" | "Set D" | "General";
  attemptedOn: string;
  body: string;
  likes: number;
  hasLiked?: boolean;
  replies: { id: string; author: string; body: string; isAppeared: boolean }[];
  createdAt: string;
}

export interface PaperMaterial {
  id: string;
  title: string;
  paper: "Set A" | "Set B" | "Set C" | "Set D";
  type: "Module" | "Practice Manual" | "Question Bank" | "Notes";
  pages: number;
  url: string;
}

export const PAPER_FILTERS = ["All", "Set A", "Set B", "Set C", "Set D"] as const;

export const DEMO_USER_ID = "00000000-0000-0000-0000-000000000000";
