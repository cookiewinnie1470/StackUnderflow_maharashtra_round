import { test } from "node:test";
import assert from "node:assert/strict";
import { indexedDB } from "fake-indexeddb";
import { loadHistory, saveHistory } from "../lib/relearn/storage.ts";
import { emptyHistory } from "../lib/relearn/progress.ts";
test("IndexedDB persists history across reopening and rejects unavailable storage", async () => {
  Object.defineProperty(globalThis, "indexedDB", {
    value: indexedDB,
    writable: true,
    configurable: true,
  });
  assert.deepEqual(await loadHistory(), emptyHistory());
  const h = emptyHistory();
  h.lessons.push({ skill: "distribution", createdAt: 1000, demo: false });
  await saveHistory(h);
  assert.deepEqual(await loadHistory(), h);
  const h2 = {
    ...h,
    lessons: [
      ...h.lessons,
      { skill: "balance" as const, createdAt: 2000, demo: false },
    ],
  };
  await saveHistory(h2);
  assert.equal((await loadHistory()).lessons.length, 2);
  Object.defineProperty(globalThis, "indexedDB", {
    value: undefined,
    configurable: true,
  });
  await assert.rejects(loadHistory(), /unavailable/);
  await assert.rejects(saveHistory(h2), /unavailable/);
  Object.defineProperty(globalThis, "indexedDB", {
    value: indexedDB,
    configurable: true,
  });
  assert.deepEqual(await loadHistory(), h2);
});
