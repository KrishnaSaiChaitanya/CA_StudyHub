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

  const { data, error } = await supabaseAdmin.auth.admin.listUsers({
    perPage: 1000,
  });

  if (error || !data?.users) return emailMap;

  const idSet = new Set(userIds);
  for (const user of data.users) {
    if (idSet.has(user.id) && user.email) {
      emailMap[user.id] = user.email;
    }
  }

  return emailMap;
}
