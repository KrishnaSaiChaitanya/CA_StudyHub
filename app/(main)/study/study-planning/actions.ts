"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

async function verifyUser() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    throw new Error("Unauthorized: Please log in first.");
  }
  return { supabase, user };
}

/**
 * Save user target exam attempt.
 * Updates fields in profiles table to be in sync with navbar.
 * @param attemptLabel Format e.g., "May 2026" or "May-2026" or "none"
 */
export async function saveUserExamAttempt(attemptLabel: string) {
  const { supabase, user } = await verifyUser();

  let updatePayload = {};

  if (!attemptLabel || attemptLabel === "none") {
    updatePayload = {
      exam_attempt_month: null,
      exam_attempt_year: null,
    };
  } else {
    // Parse Month and Year (e.g., "May 2026" or "May-2026")
    const parts = attemptLabel.replace("-", " ").split(" ");
    if (parts.length < 2) {
      return { success: false, error: "Invalid attempt format" };
    }

    const monthName = parts[0];
    const year = parseInt(parts[1], 10);

    const monthsMap: Record<string, number> = {
      jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6,
      jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12
    };
    const month = monthsMap[monthName.toLowerCase().slice(0, 3)];

    if (!month || isNaN(year)) {
      return { success: false, error: "Could not parse month/year" };
    }

    updatePayload = {
      exam_attempt_month: month,
      exam_attempt_year: year,
    };
  }

  const { error } = await supabase
    .from("profiles")
    .update(updatePayload)
    .eq("id", user.id);

  if (error) {
    return { success: false, error: error.message };
  }

  // Reset all subjects allocated_days for the user's current level subjects to 0
  const { data: profile } = await supabase
    .from("profiles")
    .select("student_type")
    .eq("id", user.id)
    .single();

  if (profile?.student_type) {
    const { data: subjects } = await supabase
      .from("planner_subjects")
      .select("slug")
      .eq("level", profile.student_type);

    if (subjects && subjects.length > 0) {
      const slugs = subjects.map((s) => s.slug);
      await supabase
        .from("user_subject_states")
        .update({ allocated_days: 0, updated_at: new Date().toISOString() })
        .eq("user_id", user.id)
        .in("subject_slug", slugs);
    }
  }

  revalidatePath("/study/study-planning");
  return { success: true };
}

/**
 * Save user subject preparation states.
 */
export async function saveUserSubjectStates(states: Record<string, {
  classesDone: boolean;
  rev1Done: boolean;
  rev2Done: boolean;
  expertise: string;
  allocatedDays: number;
}>) {
  const { supabase, user } = await verifyUser();

  try {
    const upserts = Object.entries(states).map(([slug, s]) => ({
      user_id: user.id,
      subject_slug: slug,
      classes_done: s.classesDone,
      rev1_done: s.rev1Done,
      rev2_done: s.rev2Done,
      expertise: s.expertise,
      allocated_days: s.allocatedDays,
      updated_at: new Date().toISOString(),
    }));

    const { error } = await supabase
      .from("user_subject_states")
      .upsert(upserts, { onConflict: "user_id,subject_slug" });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Update user progress status or remarks for a chapter in a specific phase.
 */
export async function saveUserChapterProgress(progress: {
  chapterId: string;
  phase: "study1" | "rev1" | "rev2";
  status?: "pending" | "completed" | "skipped";
  remarks?: string;
}) {
  const { supabase, user } = await verifyUser();

  const payload: any = {
    user_id: user.id,
    chapter_id: progress.chapterId,
    phase: progress.phase,
    updated_at: new Date().toISOString(),
  };

  if (progress.status !== undefined) payload.status = progress.status;
  if (progress.remarks !== undefined) payload.remarks = progress.remarks;

  const { error } = await supabase
    .from("user_chapter_progress")
    .upsert(payload, { onConflict: "user_id,chapter_id,phase" });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * Save multiple chapter remarks in a single batch.
 */
export async function saveBatchChapterRemarks(updates: {
  chapterId: string;
  phase: "study1" | "rev1" | "rev2";
  remarks: string;
}[]) {
  const { supabase, user } = await verifyUser();

  try {
    const payloads = updates.map((u) => ({
      user_id: user.id,
      chapter_id: u.chapterId,
      phase: u.phase,
      remarks: u.remarks,
      updated_at: new Date().toISOString(),
    }));

    const { error } = await supabase
      .from("user_chapter_progress")
      .upsert(payloads, { onConflict: "user_id,chapter_id,phase" });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Update user progress for a subtopic.
 */
export async function saveUserSubtopicProgress(progress: {
  subtopicId: string;
  phase: "study1" | "rev1" | "rev2";
  status: "pending" | "completed" | "skipped";
}) {
  const { supabase, user } = await verifyUser();

  const { error } = await supabase
    .from("user_subtopic_progress")
    .upsert({
      user_id: user.id,
      subtopic_id: progress.subtopicId,
      phase: progress.phase,
      status: progress.status,
      updated_at: new Date().toISOString(),
    }, { onConflict: "user_id,subtopic_id,phase" });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * Save manual day allocations updated via table Plus/Minus adjust buttons.
 */
export async function saveManualAllocations(allocations: Record<string, number>) {
  const { supabase, user } = await verifyUser();

  try {
    for (const [slug, days] of Object.entries(allocations)) {
      // Try updating the manual days
      const { error: updateError, data } = await supabase
        .from("user_subject_states")
        .update({ allocated_days: days, updated_at: new Date().toISOString() })
        .eq("user_id", user.id)
        .eq("subject_slug", slug)
        .select();

      // If the row doesn't exist yet, insert a default row with the allocated days
      if (!updateError && (!data || data.length === 0)) {
        await supabase
          .from("user_subject_states")
          .insert({
            user_id: user.id,
            subject_slug: slug,
            allocated_days: days,
            classes_done: false,
            rev1_done: false,
            rev2_done: false,
            expertise: "Moderate",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
      }
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Save multiple subtopic progress states in a single batch.
 */
export async function saveBatchSubtopicProgress(updates: {
  subtopicId: string;
  phase: "study1" | "rev1" | "rev2";
  status: "pending" | "completed" | "skipped";
}[]) {
  const { supabase, user } = await verifyUser();

  try {
    const payloads = updates.map((u) => ({
      user_id: user.id,
      subtopic_id: u.subtopicId,
      phase: u.phase,
      status: u.status,
      updated_at: new Date().toISOString(),
    }));

    const { error } = await supabase
      .from("user_subtopic_progress")
      .upsert(payloads, { onConflict: "user_id,subtopic_id,phase" });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
