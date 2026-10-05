"use server";

import { createAdminClient } from "@/utils/supabase/admin";
import { FeatureAnnouncement } from "@/utils/supabase/types";
import { revalidatePath } from "next/cache";

export interface FeatureAnnouncementInput {
  title: string;
  content: string;
  badge?: string | null;
  button_text?: string | null;
  button_url?: string | null;
  is_active?: boolean;
}

export async function getFeatureAnnouncementsAdmin(): Promise<FeatureAnnouncement[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("feature_announcements")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching feature announcements:", error);
    throw new Error(error.message);
  }

  return (data || []) as FeatureAnnouncement[];
}

export async function createFeatureAnnouncement(
  input: FeatureAnnouncementInput
): Promise<FeatureAnnouncement> {
  if (!input.title || !input.title.trim()) {
    throw new Error("Title is required");
  }
  if (!input.content || !input.content.trim()) {
    throw new Error("Content is required");
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("feature_announcements")
    .insert({
      title: input.title.trim(),
      content: input.content.trim(),
      badge: input.badge?.trim() || "New Feature",
      button_text: input.button_text?.trim() || null,
      button_url: input.button_url?.trim() || null,
      is_active: input.is_active ?? true,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating feature announcement:", error);
    throw new Error(error.message);
  }

  revalidatePath("/admin/feature-updates");
  return data as FeatureAnnouncement;
}

export async function updateFeatureAnnouncement(
  id: string,
  input: Partial<FeatureAnnouncementInput>
): Promise<FeatureAnnouncement> {
  if (!id) {
    throw new Error("Announcement ID is required");
  }

  const supabase = createAdminClient();
  const updatePayload: Record<string, any> = {
    updated_at: new Date().toISOString(),
  };

  if (input.title !== undefined) updatePayload.title = input.title.trim();
  if (input.content !== undefined) updatePayload.content = input.content.trim();
  if (input.badge !== undefined) updatePayload.badge = input.badge?.trim() || null;
  if (input.button_text !== undefined) updatePayload.button_text = input.button_text?.trim() || null;
  if (input.button_url !== undefined) updatePayload.button_url = input.button_url?.trim() || null;
  if (input.is_active !== undefined) updatePayload.is_active = input.is_active;

  const { data, error } = await supabase
    .from("feature_announcements")
    .update(updatePayload)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error updating feature announcement:", error);
    throw new Error(error.message);
  }

  revalidatePath("/admin/feature-updates");
  return data as FeatureAnnouncement;
}

export async function deleteFeatureAnnouncement(id: string): Promise<{ success: boolean }> {
  if (!id) {
    throw new Error("Announcement ID is required");
  }

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("feature_announcements")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Error deleting feature announcement:", error);
    throw new Error(error.message);
  }

  revalidatePath("/admin/feature-updates");
  return { success: true };
}

export async function toggleFeatureAnnouncementStatus(
  id: string,
  isActive: boolean
): Promise<{ success: boolean }> {
  if (!id) {
    throw new Error("Announcement ID is required");
  }

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("feature_announcements")
    .update({
      is_active: isActive,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    console.error("Error toggling feature announcement status:", error);
    throw new Error(error.message);
  }

  revalidatePath("/admin/feature-updates");
  return { success: true };
}
