/**
 * Express Server API integration.
 * BASE_URL is trimmed to remove any trailing slash so paths join cleanly.
 */
const PUBLIC_API_BASE_URL = (
  process.env.PUBLIC_API_BASE_URL || "http://localhost:4000"
).replace(/\/$/, "");

const PUBLIC_API_KEY = process.env.PUBLIC_API_KEY || "";

/**
 * Utility: Format current date as DD-MM-YYYY
 */
function getFormattedDate(): string {
  const date = new Date();
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${year}-${month}-${day}`;
}

/**
 * Map the contact form's free-text subject into one of the allowed schema categories.
 */
function mapSubjectToCategory(
  subject: string
): "Bug Report" | "Feature Request" | "Feedback" | "Other" {
  const lower = subject.toLowerCase();
  if (lower.includes("bug") || lower.includes("error") || lower.includes("issue")) {
    return "Bug Report";
  }
  if (
    lower.includes("feature") ||
    lower.includes("request") ||
    lower.includes("suggestion")
  ) {
    return "Feature Request";
  }
  if (lower.includes("feedback")) return "Feedback";
  return "Other";
}

/**
 * Common headers for all API calls.
 */
function apiHeaders(): HeadersInit {
  return {
    "Content-Type": "application/json",
    ...(PUBLIC_API_KEY ? { "x-api-key": PUBLIC_API_KEY } : {}),
  };
}

/**
 * Fetch helper with retry logic and cache disabled (no-store)
 * to prevent Next.js fetch caching errors and handle transient connection resets (ECONNRESET).
 */
async function fetchWithRetry(
  input: string,
  init?: RequestInit,
  retries = 3,
  delayMs = 500
): Promise<Response> {
  let lastError: unknown;
  for (let i = 0; i < retries; i++) {
    try {
      return await fetch(input, {
        cache: "no-store",
        ...init,
      });
    } catch (err) {
      lastError = err;
      if (i < retries - 1) {
        await new Promise((res) => setTimeout(res, delayMs * (i + 1)));
      }
    }
  }
  throw lastError;
}

/**
 * Silently sync a Contact Us submission to the Express Server API.
 */
export async function syncContactToFirebase(payload: {
  name: string;
  email: string;
  subject: string;
  message: string;
}): Promise<void> {
  // console.log("[PublicAPI] syncContactToFirebase — start", {
  //   baseUrl: PUBLIC_API_BASE_URL,
  //   payload,
  // });

  try {
    // 1. Fetch current data
    const getUrl = `${PUBLIC_API_BASE_URL}/api/requests`;
    // console.log("[PublicAPI] GET", getUrl);
    const getRes = await fetchWithRetry(getUrl, { headers: apiHeaders() });
    // console.log("[PublicAPI] GET status:", getRes.status);

    if (!getRes.ok) {
      const text = await getRes.text();
      throw new Error(`GET /api/requests failed (${getRes.status}): ${text}`);
    }

    const currentData = await getRes.json();
    console.log("[PublicAPI] Current data keys:", Object.keys(currentData));

    const contacts = currentData.contacts || [];
    const flashcards = currentData.flashcards || [];

    // 2. Prepare new record
    const contactRecord = {
      id: `c_${crypto.randomUUID()}`,
      name: payload.name,
      email: payload.email,
      category: mapSubjectToCategory(payload.subject),
      bugStatus: "Yet to work",
      featureStatus: "Yet to work",
      emailStatus: "yet to mail",
      dateRequested: getFormattedDate(),
      replyDate: "",
      notes: payload.message,
    };
    // console.log("[PublicAPI] New contact record:", contactRecord);

    // 3. Append and save
    contacts.push(contactRecord);

    const postUrl = `${PUBLIC_API_BASE_URL}/api/requests`;
    console.log("[PublicAPI] POST", postUrl, "— total contacts:", contacts.length);

    const postRes = await fetchWithRetry(postUrl, {
      method: "POST",
      headers: apiHeaders(),
      body: JSON.stringify({ contacts, flashcards }),
    });

    // console.log("[PublicAPI] POST status:", postRes.status);

    if (!postRes.ok) {
      const text = await postRes.text();
      throw new Error(`POST /api/requests failed (${postRes.status}): ${text}`);
    }

    const postData = await postRes.json();
    // console.log("[PublicAPI] Contact sync success:", postData);
  } catch (err) {
    console.warn("[PublicAPI] Contact sync error (non-fatal):", err);
  }
}

/**
 * Silently sync a Flashcard Request to the Express Server API.
 */
export async function syncFlashcardRequestToFirebase(payload: {
  studentName: string;
  email: string;
  examLevel: string;
  topic: string;
  notes: string;
}): Promise<void> {
  console.log("[PublicAPI] syncFlashcardRequestToFirebase — start", {
    baseUrl: PUBLIC_API_BASE_URL,
    payload,
  });

  try {
    // 1. Fetch current data
    const getUrl = `${PUBLIC_API_BASE_URL}/api/requests`;
    console.log("[PublicAPI] GET", getUrl);
    const getRes = await fetchWithRetry(getUrl, { headers: apiHeaders() });
    console.log("[PublicAPI] GET status:", getRes.status);

    if (!getRes.ok) {
      const text = await getRes.text();
      throw new Error(`GET /api/requests failed (${getRes.status}): ${text}`);
    }

    const currentData = await getRes.json();
    console.log("[PublicAPI] Current data keys:", Object.keys(currentData));

    const contacts = currentData.contacts || [];
    const flashcards = currentData.flashcards || [];

    // 2. Prepare new record
    const flashcardRecord = {
      id: `fc_${crypto.randomUUID()}`,
      studentName: payload.studentName,
      email: payload.email,
      examLevel: payload.examLevel,
      topic: payload.topic,
      notes: payload.notes,
      dateRequested: getFormattedDate(),
      dateUploaded: "",
      flashcardStatus: "Pending",
      emailStatus: "yet to mail",
    };
    console.log("[PublicAPI] New flashcard record:", flashcardRecord);

    // 3. Append and save
    flashcards.push(flashcardRecord);

    const postUrl = `${PUBLIC_API_BASE_URL}/api/requests`;
    console.log("[PublicAPI] POST", postUrl, "— total flashcards:", flashcards.length);

    const postRes = await fetchWithRetry(postUrl, {
      method: "POST",
      headers: apiHeaders(),
      body: JSON.stringify({ contacts, flashcards }),
    });

    console.log("[PublicAPI] POST status:", postRes.status);

    if (!postRes.ok) {
      const text = await postRes.text();
      throw new Error(`POST /api/requests failed (${postRes.status}): ${text}`);
    }

    const postData = await postRes.json();
    console.log("[PublicAPI] Flashcard sync success:", postData);
  } catch (err) {
    console.warn("[PublicAPI] Flashcard sync error (non-fatal):", err);
  }
}