import type { History, Skill, SkillState, CheckRecord } from "./types.ts";
export const DAY = 24 * 60 * 60 * 1000;
export const emptyHistory = (): History => ({
  schemaVersion: 1,
  attempts: [],
  lessons: [],
  checks: [],
});
export function skillState(
  h: History,
  skill: Skill,
  now = Date.now(),
): SkillState {
  const attempts = h.attempts.filter(
    (a) =>
      !a.demo &&
      a.diagnosis.status === "likely" &&
      a.diagnosis.candidates[0]?.label === skill,
  );
  const checks = h.checks
    .filter((c) => !c.demo && c.skill === skill)
    .sort((a, b) => a.createdAt - b.createdAt);
  const lessons = h.lessons.filter((l) => !l.demo && l.skill === skill);
  let status: SkillState["status"] = attempts.length
    ? "suspected"
    : lessons.length
      ? "practising"
      : "not_started";
  let lastPassedAt: number | null = null,
    dueAt: number | null = null,
    passes = 0;
  const events = [
    ...attempts.map((a) => ({ time: a.createdAt, type: "attempt" as const })),
    ...lessons.map((l) => ({ time: l.createdAt, type: "lesson" as const })),
    ...checks.map((c) => ({
      time: c.createdAt,
      type: "check" as const,
      check: c,
    })),
  ].sort((a, b) => a.time - b.time);
  for (const e of events) {
    if (e.type === "attempt") {
      status = lastPassedAt !== null ? "recurring" : "suspected";
      dueAt = null;
    }
    if (
      e.type === "lesson" &&
      status !== "demonstrated" &&
      status !== "retained" &&
      status !== "recurring"
    )
      status = "practising";
    if (e.type === "check" && "check" in e) {
      const c = e.check;
      const valid =
        c.passed &&
        !c.assisted &&
        c.results.length === 3 &&
        c.results.every(Boolean);
      if (valid) {
        if (c.retention) {
          if (dueAt !== null && c.createdAt >= dueAt && c.createdAt <= now) {
            status = "retained";
            lastPassedAt = c.createdAt;
            dueAt = null;
            passes++;
          }
        } else {
          status = "demonstrated";
          lastPassedAt = c.createdAt;
          dueAt = c.createdAt + DAY;
          passes++;
        }
      } else if (!c.assisted) {
        status = lastPassedAt !== null ? "recurring" : "practising";
        dueAt = null;
      }
    }
  }
  return {
    skill,
    status,
    dueAt,
    lastPassedAt,
    attempts: attempts.length,
    passes,
  };
}
export function addCheck(h: History, record: CheckRecord): History {
  // Early retention attempts are never evidence of retention.
  const state = skillState(h, record.skill, record.createdAt);
  const safe = {
    ...record,
    passed:
      record.passed &&
      !record.assisted &&
      record.results.length === 3 &&
      record.results.every(Boolean) &&
      (!record.retention ||
        (state.dueAt !== null && record.createdAt >= state.dueAt)),
  };
  return { ...h, checks: [...h.checks, safe] };
}
