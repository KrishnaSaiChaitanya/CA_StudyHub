"use server";

import { createAdminClient } from "@/utils/supabase/admin";

export async function updateContactSubmissionStatus(
  submissionId: string,
  status: "resolved" | "dismissed"
) {
  const supabaseAdmin = createAdminClient();
  
  const { error } = await supabaseAdmin
    .from("contact_submissions")
    .update({ status })
    .eq("id", submissionId);

  if (error) {
    throw new Error(error.message);
  }

  return { success: true };
}
