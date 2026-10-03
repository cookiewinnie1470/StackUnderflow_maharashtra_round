import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {
  parseLinear,
  equivalent,
  inspectWorking,
  answerEquivalent,
  finalForm,
} from "../lib/relearn/math.ts";
import {
  predict,
  diagnose,
  validateArtifact,
  type ModelArtifact,
} from "../lib/relearn/model.ts";
import {
  emptyHistory,
  skillState,
  addCheck,
  DAY,
} from "../lib/relearn/progress.ts";
import {
  makeChecks,
  gradeChecks,
  SKILLS,
  DEMOS,
  PROBLEMS,
  questionFor,
} from "../lib/relearn/curriculum.ts";
import { validateHistory } from "../lib/relearn/storage.ts";
import type { Attempt, CheckRecord } from "../lib/relearn/types.ts";
const model: ModelArtifact = JSON.parse(
  fs.readFileSync("public/model/classifier.json", "utf8"),
);
function attempt(overrides: Partial<Attempt> = {}): Attempt {
  return {
    id: "test",
    createdAt: 100,
    question: questionFor(PROBLEMS[0]),
    expression: PROBLEMS[0].expression,
    problemId: "signs",
    probes: [],
    ...DEMOS.product,
    ...overrides,
  };
}
function pass(overrides: Partial<CheckRecord> = {}): CheckRecord {
  return {
    id: "pass",
    skill: "distribution",
    createdAt: 1000,
    passed: true,
    results: [true, true, true],
    assisted: false,
    retention: false,
    seed: 1,
    answers: [
      { value: "", choice: "" },
      { value: "", choice: "" },
      { value: "", choice: "" },
    ],
    demo: false,
    ...overrides,
  };
}
test("linear equivalence preserves signs, rational values and implicit multiplication", () => {
  for (const [a, b] of [
    ["-2(x-3)", "6-2x"],
    ["x/2+x/3", "5*x/6"],
    ["-(2x-6)", "-2x+6"],
    ["3(x+4)", "3x+12"],
  ])
    assert.ok(equivalent(a, b));
  assert.ok(!equivalent("-2(x-3)", "-2x-6"));
});
test("equations compare solution sets, not superficial syntax", () => {
  assert.ok(equivalent("2x+5=13", "x=4"));
  assert.ok(equivalent("4= x", "2x=8"));
  assert.ok(!equivalent("2x+5=13", "x=9"));
  assert.ok(!equivalent("x=4", "4=4"));
  assert.ok(equivalent("x=x", "2=2"));
  assert.ok(!equivalent("x=x", "0=1"));
});
test("unsupported syntax and malicious strings are rejected", () => {
  for (const s of [
    "x^2",
    "2**3",
    "alert(1)",
    "constructor",
    "1/0",
    "1/x",
    "x*x",
    "(x+1",
    "x=2=3",
    "2 3",
    "z+1",
    "",
  ])
    assert.throws(() => parseLinear(s), s);
});
test("correct final answer does not erase invalid intermediate step", () => {
  const r = inspectWorking("-2(x-3)", "-2x+6", ["-2x-6", "-2x+6"]);
  assert.equal(r.answerCorrect, true);
  assert.equal(r.evidenceStep, 0);
});
test("answer validation accepts equivalent solved forms", () => {
  assert.ok(answerEquivalent("4", "x=4", true));
  assert.ok(answerEquivalent("x=8/2", "x=4", true));
  assert.ok(!answerEquivalent("x=5", "x=4", true));
});
test("final check requires expansion, collection and an isolated variable", () => {
  assert.ok(!finalForm("3*(x+2)", "3*x+6"));
  assert.ok(!finalForm("x+x+2", "2*x+2"));
  assert.ok(!finalForm("2*x=8", "x=4", true));
  assert.ok(finalForm("6+3x", "3*x+6"));
  assert.ok(finalForm("x=8/2", "x=4", true));
});
test("exported JS inference matches Python across all parity fixtures", () => {
  const fixtures = JSON.parse(
    fs.readFileSync("tests/parity-fixtures.json", "utf8"),
  );
  let maxError = 0;
  for (const f of fixtures) {
    const p = predict(model, f.attempt);
    model.classes.forEach((label, i) => {
      const err = Math.abs(
        p.find((x) => x.label === label)!.score - f.probabilities[i],
      );
      maxError = Math.max(maxError, err);
      assert.ok(err < 1e-8, `${f.attempt.id} ${label} error ${err}`);
    });
  }
  console.log(
    "Parity fixture count:",
    fixtures.length,
    "maximum absolute error:",
    maxError,
  );
});
test("same wrong answer produces distinct learned diagnoses", () => {
  const a = diagnose(model, attempt()),
    b = diagnose(model, attempt({ ...DEMOS.scope }));
  assert.equal(a.status, "likely");
  assert.equal(a.candidates[0].label, "negative_product");
  assert.equal(b.status, "likely");
  assert.equal(b.candidates[0].label, "negative_scope");
});
test("missing explanation triggers a probe rather than a diagnosis", () => {
  const d = diagnose(model, attempt({ explanation: "" }));
  assert.equal(d.status, "insufficient");
  assert.ok(d.probe);
});
test("two unanswered probes cannot cause an invented diagnosis", () => {
  const d = diagnose(
    model,
    attempt({
      explanation: "",
      probes: [
        { question: "a", answer: "6", explanation: "" },
        { question: "b", answer: "-x+4", explanation: "" },
      ],
    }),
  );
  assert.equal(d.status, "insufficient");
  assert.ok(!d.probe);
});
test("invalid notation requests correction", () => {
  assert.equal(
    diagnose(model, attempt({ answer: "window.location" })).status,
    "invalid_input",
  );
});
test("contradictory correct answer with flawed reasoning is not consistent", () => {
  assert.notEqual(
    diagnose(model, attempt({ answer: "-2*x+6", steps: ["-2*x-6", "-2*x+6"] }))
      .status,
    "consistent",
  );
});
test("damaged model artifacts fail visibly", () => {
  assert.throws(() => validateArtifact({ version: "bad" } as ModelArtifact));
});
test("one correct response cannot establish understanding", () => {
  const t = makeChecks("distribution", 15);
  assert.equal(
    gradeChecks(t, [{ value: t[0].expected, choice: "" }]).passed,
    false,
  );
});
test("every skill has 3 distinct checks and correct answer plus explanation is needed", () => {
  for (const s of SKILLS)
    for (const seed of [1, 19, 25, 99, 101]) {
      const tasks = makeChecks(s, seed);
      assert.deepEqual(
        tasks.map((t) => t.kind),
        ["transfer", "explain", "visual"],
      );
      const answers = tasks.map((t) => ({
        value: t.expected,
        choice: t.correctChoice || "",
      }));
      assert.equal(gradeChecks(tasks, answers).passed, true, s);
      assert.equal(gradeChecks(tasks, answers, true).passed, false, s);
      answers[1].choice = "wrong";
      assert.equal(gradeChecks(tasks, answers).passed, false, s);
    }
});
test("copying unexpanded questions cannot pass a transfer assessment", () => {
  const tasks = makeChecks("distribution", 12);
  assert.equal(
    gradeChecks(
      tasks,
      tasks.map((t) => ({
        value: t.expression,
        choice: t.correctChoice || "",
      })),
    ).passed,
    false,
  );
});
test("a completed unassisted check starts retention timer", () => {
  const h = addCheck(emptyHistory(), pass());
  assert.equal(skillState(h, "distribution").status, "demonstrated");
  assert.equal(skillState(h, "distribution").dueAt, 1000 + DAY);
});
test("early retention check is rejected and later check demonstrates retention", () => {
  const h = addCheck(emptyHistory(), pass());
  assert.equal(
    addCheck(h, pass({ id: "early", retention: true, createdAt: 1100 }))
      .checks[1].passed,
    false,
  );
  const late = addCheck(
    h,
    pass({ id: "late", retention: true, createdAt: 1000 + DAY }),
  );
  assert.equal(skillState(late, "distribution", 1000 + DAY).status, "retained");
});
test("failed later check tracks recurrence and removes retention due state", () => {
  const h = addCheck(
    addCheck(emptyHistory(), pass()),
    pass({
      id: "failed",
      createdAt: 2000,
      passed: false,
      results: [true, false, true],
    }),
  );
  assert.equal(skillState(h, "distribution").status, "recurring");
  assert.equal(skillState(h, "distribution").dueAt, null);
});
test("example and assisted sessions cannot change mastery", () => {
  const h = addCheck(emptyHistory(), pass({ demo: true }));
  assert.equal(skillState(h, "distribution").status, "not_started");
  const assisted = addCheck(emptyHistory(), pass({ assisted: true }));
  assert.notEqual(skillState(assisted, "distribution").status, "demonstrated");
});
test("new suspected mistake after passing marks possible recurrence", () => {
  let h = addCheck(emptyHistory(), pass());
  h.attempts.push({
    ...attempt({ createdAt: 2000 }),
    diagnosis: {
      ...diagnose(model, attempt()),
      candidates: [{ label: "distribution", score: 0.9 }],
    },
  });
  assert.equal(skillState(h, "distribution").status, "recurring");
});
test("storage schema rejects unsupported histories", () => {
  assert.deepEqual(validateHistory(emptyHistory()), emptyHistory());
  assert.throws(() =>
    validateHistory({
      schemaVersion: 2,
      attempts: [],
      checks: [],
      lessons: [],
    }),
  );
});
test("template family split remains disjoint and target count is 700", () => {
  const data = ["train", "validation", "test"].map((s) =>
    JSON.parse(fs.readFileSync(`ml/data/${s}.json`, "utf8")),
  );
  assert.equal(data.flat().length, 700);
  const groups = data.map(
    (rs) => new Set(rs.map((r: { family_id: string }) => r.family_id)),
  );
  for (let i = 0; i < 3; i++)
    for (let j = i + 1; j < 3; j++)
      for (const k of groups[i]) assert.ok(!groups[j].has(k));
});
test("an admission of guessing does not become a confident diagnosis", () => {
  const d = diagnose(
    model,
    attempt({
      explanation: "I guessed the answer after looking at someone else’s page.",
    }),
  );
  assert.equal(d.status, "insufficient");
});
