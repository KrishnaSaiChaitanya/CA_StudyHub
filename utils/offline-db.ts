"use client";

const DB_NAME = "ca_studyhub_offline";
const DB_VERSION = 1;

export interface OfflineItem {
  id: string;
  type: "flashcard" | "mcq" | "planner";
  title: string;
  subject: string;
  metadata?: any;
  data?: any;
  pdfBlob?: Blob;
  downloadedAt: number;
}

export interface OfflineMcqAttempt {
  id: string;
  testId: string;
  testName: string;
  score: number;
  totalQuestions: number;
  answers: Record<number, number>;
  completedAt: number;
  timeTaken?: number;
}

function getDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") {
      reject(new Error("IndexedDB is only available in the browser"));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = request.result;
      if (!db.objectStoreNames.contains("downloads")) {
        db.createObjectStore("downloads", { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains("attempts")) {
        db.createObjectStore("attempts", { keyPath: "id" });
      }
    };
  });
}

// ----------------------------------------------------
// Download / Save Operations
// ----------------------------------------------------

export async function saveOfflineItem(item: Omit<OfflineItem, "downloadedAt">): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction("downloads", "readwrite");
    const store = transaction.objectStore("downloads");
    
    const record: OfflineItem = {
      ...item,
      downloadedAt: Date.now(),
    };

    const request = store.put(record);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function deleteOfflineItem(id: string): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction("downloads", "readwrite");
    const store = transaction.objectStore("downloads");
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function getOfflineItem(id: string): Promise<OfflineItem | null> {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction("downloads", "readonly");
      const store = transaction.objectStore("downloads");
      const request = store.get(id);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error("IndexedDB error:", error);
    return null;
  }
}

export async function listOfflineItems(type?: "flashcard" | "mcq" | "planner"): Promise<OfflineItem[]> {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction("downloads", "readonly");
      const store = transaction.objectStore("downloads");
      const request = store.getAll();

      request.onsuccess = () => {
        const results = request.result || [];
        if (type) {
          resolve(results.filter((item: OfflineItem) => item.type === type));
        } else {
          resolve(results);
        }
      };
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error("IndexedDB list error:", error);
    return [];
  }
}

// ----------------------------------------------------
// Local MCQ Attempts Log Operations
// ----------------------------------------------------

export async function saveOfflineMcqAttempt(attempt: Omit<OfflineMcqAttempt, "completedAt">): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction("attempts", "readwrite");
    const store = transaction.objectStore("attempts");

    const record: OfflineMcqAttempt = {
      ...attempt,
      completedAt: Date.now(),
    };

    const request = store.put(record);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function listOfflineMcqAttempts(testId?: string): Promise<OfflineMcqAttempt[]> {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction("attempts", "readonly");
      const store = transaction.objectStore("attempts");
      const request = store.getAll();

      request.onsuccess = () => {
        const results = request.result || [];
        if (testId) {
          resolve(results.filter((attempt: OfflineMcqAttempt) => attempt.testId === testId));
        } else {
          resolve(results);
        }
      };
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error("IndexedDB attempts error:", error);
    return [];
  }
}

export async function deleteOfflineMcqAttempt(id: string): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction("attempts", "readwrite");
    const store = transaction.objectStore("attempts");
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}
