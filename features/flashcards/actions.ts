import { createClient } from "@/utils/supabase/client";

export async function getFlashcardFolders(userId: string) {
  const supabase = createClient();
  const [foldersRes, linksRes] = await Promise.all([
    supabase.from("flashcard_folders").select("*").order("created_at", { ascending: false }),
    supabase.from("flashcard_folder_sets").select("folder_id")
  ]);

  if (foldersRes.error) throw foldersRes.error;
  if (linksRes.error) throw linksRes.error;

  return { folders: foldersRes.data, links: linksRes.data };
}

export async function getFlashcardSets(userId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("flashcard_sets")
    .select("*, flashcards(count)")
    .or(`user_id.eq.${userId},is_admin.eq.true`)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}
