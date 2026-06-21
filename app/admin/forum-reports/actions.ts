"use server";

import { createAdminClient } from "@/utils/supabase/admin";

export async function handleReportAction(reportId: string, postId: string, action: "dismiss" | "block") {
  const supabase = createAdminClient();

  try {
    if (action === "block") {
      const { error: postErr } = await supabase
        .from("forum_posts")
        .update({ status: "blocked" })
        .eq("id", postId);

      if (postErr) {
        return { success: false, error: postErr.message };
      }
    }

    const { error: repErr } = await supabase
      .from("forum_reports")
      .update({ status: action === "block" ? "blocked" : "dismissed" })
      .eq("id", reportId);

    if (repErr) {
      return { success: false, error: repErr.message };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "An unexpected error occurred." };
  }
}
