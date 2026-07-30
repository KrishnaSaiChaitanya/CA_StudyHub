"use server";

import { syncContactToFirebase, syncFlashcardRequestToFirebase } from "@/utils/public-api";

/**
 * Server Action: Sync a contact submission to the external public API.
 * Called from Client Components after a successful Supabase insert.
 * Never throws — all errors are swallowed so the UI is never affected.
 */
export async function syncContactRequestAction(payload: {
  name: string;
  email: string;
  subject: string;
  message: string;
}): Promise<void> {
  await syncContactToFirebase(payload);
}

/**
 * Server Action: Sync a flashcard request to the external public API.
 * Called from Client Components after a successful Supabase insert.
 * Never throws — all errors are swallowed so the UI is never affected.
 */
export async function syncFlashcardRequestAction(payload: {
  studentName: string;
  email: string;
  examLevel: string;
  topic: string;
  notes: string;
}): Promise<void> {
  await syncFlashcardRequestToFirebase(payload);
}
