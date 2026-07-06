"use server";

import { createAdminClient } from "@/utils/supabase/admin";

export async function deleteFlashcardRequest(requestId: string) {
  const supabaseAdmin = createAdminClient();
  
  const { error } = await supabaseAdmin
    .from("flashcard_requests")
    .update({ status: "dismissed" })
    .eq("id", requestId);

  if (error) {
    throw new Error(error.message);
  }

  return { success: true };
}

export async function getUserEmails(userIds: string[]): Promise<Record<string, string>> {
  if (!userIds.length) return {};

  const supabaseAdmin = createAdminClient();
  const emailMap: Record<string, string> = {};

  // Deduplicate user IDs to avoid redundant calls
  const uniqueUserIds = Array.from(new Set(userIds));

  // Fetch only the specific users needed in parallel
  await Promise.all(
    uniqueUserIds.map(async (id) => {
      try {
        const { data, error } = await supabaseAdmin.auth.admin.getUserById(id);
        if (!error && data?.user?.email) {
          emailMap[id] = data.user.email;
        }
      } catch (err) {
        console.error(`Error fetching user profile for ID ${id}:`, err);
      }
    })
  );

  return emailMap;
}
