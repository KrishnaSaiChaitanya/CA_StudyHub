export type DbNote = {
  id: string;
  user_id: string;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
};

export interface BookmarkItem {
  id: string;
  title: string;
  type: "pdf" | "rtp" | "pyq" | "mtp" | "question" | "spom";
  source: string;
  savedAt: string;
  url?: string;
  targetId?: string;
  questionId?: string;
  subject?: string;
  exam_year?: string;
  test_no?: string;
  spom_material_id?: string;
}

