import type { History } from "./types.ts";
import { emptyHistory } from "./progress.ts";
const DB = "relearn-local-v1";
export function validateHistory(value: unknown): History {
  const h = value as History;
  if (
    !h ||
    h.schemaVersion !== 1 ||
    !Array.isArray(h.attempts) ||
    !Array.isArray(h.checks) ||
    !Array.isArray(h.lessons)
  )
    throw Error(
      "Saved history has an unsupported format. Export it before resetting.",
    );
  if (
    h.attempts.some(
      (a) =>
        !a.id ||
        !Number.isFinite(a.createdAt) ||
        !Array.isArray(a.steps) ||
        !a.diagnosis?.status,
    ) ||
    h.checks.some(
      (c) =>
        !c.id || !Number.isFinite(c.createdAt) || !Array.isArray(c.results),
    )
  )
    throw Error(
      "Saved history could not be read safely. Export it before resetting.",
    );
  return h;
}
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(
        Error(
          "Browser storage is unavailable. Your work is kept in this tab only.",
        ),
      );
      return;
    }
    const r = indexedDB.open(DB, 1);
    r.onupgradeneeded = () => r.result.createObjectStore("state");
    r.onsuccess = () => resolve(r.result);
    r.onerror = () =>
      reject(
        Error(
          "Could not open browser storage. Your work is kept in this tab only.",
        ),
      );
    r.onblocked = () =>
      reject(Error("Close other Re:Learn tabs and retry saving."));
  });
}
export async function loadHistory(): Promise<History> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("state", "readonly");
    const r = tx.objectStore("state").get("history");
    r.onsuccess = () => {
      try {
        resolve(r.result ? validateHistory(r.result) : emptyHistory());
      } catch (e) {
        reject(e);
      } finally {
        db.close();
      }
    };
    r.onerror = () => {
      db.close();
      reject(Error("Could not load saved progress."));
    };
  });
}
export async function saveHistory(history: History): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("state", "readwrite");
    tx.objectStore("state").put(history, "history");
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onerror = () => {
      db.close();
      reject(
        Error(
          "Progress could not be saved. Keep this tab open or export your history.",
        ),
      );
    };
    tx.onabort = tx.onerror;
  });
}
export function exportJSON(value: unknown, name: string) {
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(value, null, 2)], { type: "application/json" }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
