"use server";

import { createClient } from "@/utils/supabase/server";
import { DEFAULT_SUBJECTS } from "@/lib/studyData";
import { StudentLevel, SubjectCategory } from "@/utils/supabase/types";
import { revalidatePath } from "next/cache";

async function verifyAdmin() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user || !user.email) {
    throw new Error("Unauthorized: Access Denied");
  }

  const adminEmails = (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((email) => email.trim().toLowerCase());

  if (!adminEmails.includes(user.email.toLowerCase())) {
    throw new Error("Unauthorized: Access Denied");
  }

  return supabase;
}

export async function seedDefaultPlannerData() {
  const supabase = await verifyAdmin();

  try {
    for (const sub of DEFAULT_SUBJECTS) {
      // 1. Insert Subject
      const { data: subjectData, error: subError } = await supabase
        .from("planner_subjects")
        .upsert({
          slug: sub.slug,
          name: sub.name,
          short_name: sub.shortName,
          level: sub.level,
          base_weight: sub.baseWeight,
          updated_at: new Date().toISOString(),
        }, { onConflict: "slug" })
        .select()
        .single();

      if (subError) {
        console.error(`Error upserting subject ${sub.slug}:`, subError);
        continue;
      }

      // 2. Insert Chapters and their Subtopics
      let sortOrder = 1;
      for (const ch of sub.chapters) {
        // Check if chapter already exists to avoid duplicates
        const { data: existingChapter } = await supabase
          .from("planner_chapters")
          .select("id")
          .eq("subject_slug", sub.slug)
          .eq("topic", ch.topic)
          .maybeSingle();

        let chapterId = existingChapter?.id;

        if (!chapterId) {
          const { data: newChapter, error: chError } = await supabase
            .from("planner_chapters")
            .insert({
              subject_slug: sub.slug,
              topic: ch.topic,
              hours: ch.hours,
              sort_order: sortOrder++,
            })
            .select()
            .single();

          if (chError) {
            console.error(`Error inserting chapter ${ch.topic}:`, chError);
            continue;
          }
          chapterId = newChapter.id;
        } else {
          // Update hours and sort order
          await supabase
            .from("planner_chapters")
            .update({
              hours: ch.hours,
              sort_order: sortOrder++,
            })
            .eq("id", chapterId);
        }

        // 3. Insert Subtopics
        let subOrder = 1;
        for (const stName of ch.subtopics) {
          const { data: existingSub } = await supabase
            .from("planner_subtopics")
            .select("id")
            .eq("chapter_id", chapterId)
            .eq("name", stName)
            .maybeSingle();

          if (!existingSub) {
            await supabase
              .from("planner_subtopics")
              .insert({
                chapter_id: chapterId,
                name: stName,
                sort_order: subOrder++,
              });
          }
        }
      }
    }

    revalidatePath("/admin/practice-planner");
    return { success: true, message: "Default data seeded successfully!" };
  } catch (error: any) {
    console.error("Seeding failed:", error);
    return { success: false, error: error.message };
  }
}

export async function upsertPlannerSubject(subject: {
  id?: string;
  slug: SubjectCategory;
  name: string;
  short_name: string;
  level: StudentLevel;
  base_weight: number;
}) {
  const supabase = await verifyAdmin();

  const payload = {
    slug: subject.slug,
    name: subject.name,
    short_name: subject.short_name,
    level: subject.level,
    base_weight: subject.base_weight,
    updated_at: new Date().toISOString(),
  };

  let error;
  if (subject.id) {
    const { error: updateError } = await supabase
      .from("planner_subjects")
      .update(payload)
      .eq("id", subject.id);
    error = updateError;
  } else {
    const { error: insertError } = await supabase
      .from("planner_subjects")
      .insert(payload);
    error = insertError;
  }

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/admin/practice-planner");
  return { success: true };
}

export async function deletePlannerSubject(id: string) {
  const supabase = await verifyAdmin();
  const { error } = await supabase
    .from("planner_subjects")
    .delete()
    .eq("id", id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/admin/practice-planner");
  return { success: true };
}

export async function upsertPlannerChapter(chapter: {
  id?: string;
  subject_slug: SubjectCategory;
  topic: string;
  hours: number;
  sort_order?: number;
}) {
  const supabase = await verifyAdmin();

  const payload = {
    subject_slug: chapter.subject_slug,
    topic: chapter.topic,
    hours: chapter.hours,
    sort_order: chapter.sort_order ?? 0,
    updated_at: new Date().toISOString(),
  };

  let error;
  if (chapter.id) {
    const { error: updateError } = await supabase
      .from("planner_chapters")
      .update(payload)
      .eq("id", chapter.id);
    error = updateError;
  } else {
    const { error: insertError } = await supabase
      .from("planner_chapters")
      .insert(payload);
    error = insertError;
  }

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/admin/practice-planner");
  return { success: true };
}

export async function deletePlannerChapter(id: string) {
  const supabase = await verifyAdmin();
  const { error } = await supabase
    .from("planner_chapters")
    .delete()
    .eq("id", id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/admin/practice-planner");
  return { success: true };
}

export async function upsertPlannerSubtopic(subtopic: {
  id?: string;
  chapter_id: string;
  name: string;
  sort_order?: number;
}) {
  const supabase = await verifyAdmin();

  const payload = {
    chapter_id: subtopic.chapter_id,
    name: subtopic.name,
    sort_order: subtopic.sort_order ?? 0,
    updated_at: new Date().toISOString(),
  };

  let error;
  if (subtopic.id) {
    const { error: updateError } = await supabase
      .from("planner_subtopics")
      .update(payload)
      .eq("id", subtopic.id);
    error = updateError;
  } else {
    const { error: insertError } = await supabase
      .from("planner_subtopics")
      .insert(payload);
    error = insertError;
  }

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/admin/practice-planner");
  return { success: true };
}

export async function deletePlannerSubtopic(id: string) {
  const supabase = await verifyAdmin();
  const { error } = await supabase
    .from("planner_subtopics")
    .delete()
    .eq("id", id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/admin/practice-planner");
  return { success: true };
}
