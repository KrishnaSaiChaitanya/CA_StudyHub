"use server";

import { createClient } from "@/utils/supabase/server";
import { DEFAULT_SUBJECTS } from "@/lib/studyData";
import { StudentLevel, SubjectCategory } from "@/utils/supabase/types";
import { revalidatePath } from "next/cache";
import path from "path";
import fs from "fs/promises";
import { ParsedSubject } from "@/components/admin/practice-planner/excel-parser";

async function verifyAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

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

/**
 * Reads the bundled system default Syllabus Ledger Excel file and returns as base64
 */
export async function getDefaultSyllabusBase64() {
  await verifyAdmin();

  try {
    const filePath = path.join(process.cwd(), "assets", "Syllabus Ledger.xlsx");
    const fileBuffer = await fs.readFile(filePath);
    return {
      success: true,
      base64: fileBuffer.toString("base64"),
      filename: "Syllabus Ledger.xlsx",
    };
  } catch (error: any) {
    console.error("Failed to read default syllabus file:", error);
    return {
      success: false,
      error: error.message || "Failed to load system default Syllabus Ledger.xlsx",
    };
  }
}

/**
 * Clears all existing planner master data and all user progress trackers
 */
export async function clearAllPlannerData() {
  const supabase = await verifyAdmin();

  try {
    // Delete in relational order (child tables first, then master tables)
    await supabase
      .from("user_subtopic_progress")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000");

    await supabase
      .from("user_chapter_progress")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000");

    await supabase
      .from("user_subject_states")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000");

    await supabase
      .from("planner_subtopics")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000");

    await supabase
      .from("planner_chapters")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000");

    const { error } = await supabase
      .from("planner_subjects")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000");

    if (error) {
      throw error;
    }

    revalidatePath("/admin/practice-planner");
    revalidatePath("/study/practice-planner");
    revalidatePath("/study/study-planning");

    return {
      success: true,
      message: "All planner master data and user progress trackers cleared successfully.",
    };
  } catch (error: any) {
    console.error("Failed to clear planner data:", error);
    return {
      success: false,
      error: error.message || "Failed to clear planner data",
    };
  }
}

/**
 * Clears all existing data and imports newly parsed syllabus subjects, chapters, and subtopics
 */
export async function importAndReplaceSyllabus(subjects: ParsedSubject[]) {
  const supabase = await verifyAdmin();

  if (!subjects || subjects.length === 0) {
    return { success: false, error: "No subjects provided for import." };
  }

  try {
    // 1. Wipe existing data
    await supabase
      .from("user_subtopic_progress")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000");

    await supabase
      .from("user_chapter_progress")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000");

    await supabase
      .from("user_subject_states")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000");

    await supabase
      .from("planner_subtopics")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000");

    await supabase
      .from("planner_chapters")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000");

    await supabase
      .from("planner_subjects")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000");

    let totalSubjectsCount = 0;
    let totalChaptersCount = 0;
    let totalSubtopicsCount = 0;

    // 2. Insert Subjects and their nested Chapters + Subtopics
    for (const sub of subjects) {
      const { error: subError } = await supabase
        .from("planner_subjects")
        .upsert(
          {
            slug: sub.slug,
            name: sub.name,
            short_name: sub.short_name,
            level: sub.level,
            base_weight: sub.base_weight || 5.0,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "slug" }
        );

      if (subError) {
        console.error(`Error inserting subject ${sub.name}:`, subError);
        throw new Error(`Failed to insert subject "${sub.name}": ${subError.message}`);
      }

      totalSubjectsCount++;

      if (!sub.chapters || sub.chapters.length === 0) continue;

      // Insert chapters for this subject
      const chaptersPayload = sub.chapters.map((ch, idx) => ({
        subject_slug: sub.slug,
        topic: ch.topic,
        hours: ch.hours || 5.0,
        sort_order: ch.sort_order || idx + 1,
      }));

      const { data: insertedChapters, error: chError } = await supabase
        .from("planner_chapters")
        .insert(chaptersPayload)
        .select("id, topic");

      if (chError || !insertedChapters) {
        console.error(`Error inserting chapters for ${sub.slug}:`, chError);
        throw new Error(`Failed to insert chapters for "${sub.name}": ${chError?.message}`);
      }

      totalChaptersCount += insertedChapters.length;

      // Map topic names to inserted chapter UUIDs
      const chapterIdByTopic = new Map<string, string>();
      insertedChapters.forEach((ch) => {
        chapterIdByTopic.set(ch.topic, ch.id);
      });

      // Prepare subtopics payload
      const subtopicsPayload: {
        chapter_id: string;
        name: string;
        sort_order: number;
      }[] = [];

      for (const ch of sub.chapters) {
        const chapterId = chapterIdByTopic.get(ch.topic);
        if (!chapterId || !ch.subtopics || ch.subtopics.length === 0) continue;

        ch.subtopics.forEach((st, sIdx) => {
          subtopicsPayload.push({
            chapter_id: chapterId,
            name: st.name,
            sort_order: st.sort_order || sIdx + 1,
          });
        });
      }

      if (subtopicsPayload.length > 0) {
        // Insert subtopics in chunks of 100
        const CHUNK_SIZE = 100;
        for (let i = 0; i < subtopicsPayload.length; i += CHUNK_SIZE) {
          const chunk = subtopicsPayload.slice(i, i + CHUNK_SIZE);
          const { error: stError } = await supabase
            .from("planner_subtopics")
            .insert(chunk);

          if (stError) {
            console.error(`Error inserting subtopics chunk for ${sub.slug}:`, stError);
            throw new Error(`Failed to insert subtopics for "${sub.name}": ${stError.message}`);
          }
        }
        totalSubtopicsCount += subtopicsPayload.length;
      }
    }

    revalidatePath("/admin/practice-planner");
    revalidatePath("/study/practice-planner");
    revalidatePath("/study/study-planning");

    return {
      success: true,
      stats: {
        subjectsCount: totalSubjectsCount,
        chaptersCount: totalChaptersCount,
        subtopicsCount: totalSubtopicsCount,
      },
    };
  } catch (error: any) {
    console.error("Import and replace syllabus failed:", error);
    return {
      success: false,
      error: error.message || "Failed to import and replace syllabus data",
    };
  }
}

export async function seedDefaultPlannerData() {
  const supabase = await verifyAdmin();

  try {
    for (const sub of DEFAULT_SUBJECTS) {
      // 1. Insert Subject
      const { error: subError } = await supabase
        .from("planner_subjects")
        .upsert(
          {
            slug: sub.slug,
            name: sub.name,
            short_name: sub.shortName,
            level: sub.level,
            base_weight: sub.baseWeight,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "slug" }
        );

      if (subError) {
        console.error(`Error upserting subject ${sub.slug}:`, subError);
        continue;
      }

      // 2. Insert Chapters and their Subtopics
      let sortOrder = 1;
      for (const ch of sub.chapters) {
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
            await supabase.from("planner_subtopics").insert({
              chapter_id: chapterId,
              name: stName,
              sort_order: subOrder++,
            });
          }
        }
      }
    }

    revalidatePath("/admin/practice-planner");
    revalidatePath("/study/practice-planner");
    revalidatePath("/study/study-planning");
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
  revalidatePath("/study/practice-planner");
  revalidatePath("/study/study-planning");
  return { success: true };
}

export async function deletePlannerSubject(id: string) {
  const supabase = await verifyAdmin();
  const { error } = await supabase.from("planner_subjects").delete().eq("id", id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/admin/practice-planner");
  revalidatePath("/study/practice-planner");
  revalidatePath("/study/study-planning");
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
  revalidatePath("/study/practice-planner");
  revalidatePath("/study/study-planning");
  return { success: true };
}

export async function deletePlannerChapter(id: string) {
  const supabase = await verifyAdmin();
  const { error } = await supabase.from("planner_chapters").delete().eq("id", id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/admin/practice-planner");
  revalidatePath("/study/practice-planner");
  revalidatePath("/study/study-planning");
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
  revalidatePath("/study/practice-planner");
  revalidatePath("/study/study-planning");
  return { success: true };
}

export async function deletePlannerSubtopic(id: string) {
  const supabase = await verifyAdmin();
  const { error } = await supabase.from("planner_subtopics").delete().eq("id", id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/admin/practice-planner");
  revalidatePath("/study/practice-planner");
  revalidatePath("/study/study-planning");
  return { success: true };
}
