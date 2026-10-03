import type { Attempt, Candidate, Diagnosis, Label } from "./types.ts";
import { inspectWorking, normalizeMath } from "./math.ts";
export type ModelArtifact = {
  version: string;
  classes: Label[];
  vectors: {
    name: string;
    analyzer: string;
    ngram_range: number[];
    vocabulary: Record<string, number>;
    idf: number[];
  }[];
  coef: number[][];
  intercept: number[];
  threshold: number;
  margin: number;
};
export const normalize = (s: string) =>
  s
    .toLowerCase()
    .replace(/−/g, "-")
    .replace(/×/g, "*")
    .replace(/÷/g, "/")
    .replace(/’/g, "'")
    .replace(/\s+/g, " ")
    .trim();
export function inputText(
  a: Pick<Attempt, "question" | "answer" | "steps" | "explanation">,
) {
  return normalize(
    a.question +
      " answer " +
      a.answer +
      " working " +
      a.steps.join(" ; ") +
      " reasoning " +
      a.explanation,
  );
}
export function predict(
  model: ModelArtifact,
  a: Pick<Attempt, "question" | "answer" | "steps" | "explanation">,
): Candidate[] {
  const text = inputText(a);
  let offset = 0;
  const sparse: [number, number][] = [];
  for (const v of model.vectors) {
    const items =
      v.analyzer === "char"
        ? Array.from(text)
        : text.match(/[a-z]+|[0-9]+|[()+*/=;\-]/g) || [];
    const counts = new Map<number, number>();
    for (let n = v.ngram_range[0]; n <= v.ngram_range[1]; n++)
      for (let i = 0; i + n <= items.length; i++) {
        const token = items
          .slice(i, i + n)
          .join(v.analyzer === "char" ? "" : " ");
        const idx = v.vocabulary[token];
        if (idx !== undefined) counts.set(idx, (counts.get(idx) || 0) + 1);
      }
    const weights = [...counts].map(
      ([idx, count]) => [idx, count * v.idf[idx]] as [number, number],
    );
    const norm = Math.sqrt(weights.reduce((sum, [, w]) => sum + w * w, 0)) || 1;
    weights.forEach(([idx, w]) => sparse.push([offset + idx, w / norm]));
    offset += v.idf.length;
  }
  const scores = model.coef.map((row, i) =>
    sparse.reduce((s, [idx, w]) => s + row[idx] * w, model.intercept[i]),
  );
  const max = Math.max(...scores),
    exp = scores.map((s) => Math.exp(s - max)),
    total = exp.reduce((a, b) => a + b, 0);
  return model.classes
    .map((label, i) => ({ label, score: exp[i] / total }))
    .sort((a, b) => b.score - a.score);
}
export function validateArtifact(v: ModelArtifact) {
  const n = v?.vectors?.reduce((s, x) => s + x.idf.length, 0);
  if (
    !v?.version ||
    !n ||
    v.classes?.length !== 7 ||
    v.coef?.length !== 7 ||
    v.coef.some((r) => r.length !== n) ||
    v.intercept?.length !== 7
  )
    throw Error("The model file is incomplete. Reload to try again.");
  return v;
}
export function probeFor(a: Attempt, candidates: Candidate[]): string {
  if (a.probes.length >= 2) return "";
  if (/-/.test(a.expression) && /[()]/.test(a.expression))
    return a.probes.length === 0
      ? "Calculate (-2)*(-3). Explain how you chose the sign."
      : "Simplify -(x-4). Explain which terms the leading minus affects.";
  const label = candidates[0]?.label;
  if (label === "balance" || label === "inverse" || a.expression.includes("="))
    return a.probes.length === 0
      ? "Solve x+4=11. Show the same operation on both sides and explain your choice."
      : "Solve 2*x+3=13. Show the step before you divide and explain it.";
  if (label === "unlike_terms")
    return "Simplify 3*x+2. Can the constant and the x term be combined? Explain.";
  return "Simplify 3*(x+2). Write both products and explain what the outside factor changes.";
}
export function diagnose(model: ModelArtifact, a: Attempt): Diagnosis {
  const explanation = [
    a.explanation,
    ...a.probes.map(
      (p) => `${p.question} My answer: ${p.answer}. ${p.explanation}`,
    ),
  ].join(" ");
  const candidates = predict(model, { ...a, explanation });
  const base = {
    candidates,
    modelVersion: model.version,
    evidenceStep: null,
    answerCorrect: false,
  } as const;
  let math: ReturnType<typeof inspectWorking>;
  try {
    math = inspectWorking(
      a.expression,
      a.answer,
      a.steps.filter((s) => s.trim()),
    );
  } catch (e) {
    return {
      ...base,
      status: "invalid_input",
      message: "Check the notation before we interpret your thinking.",
      error: (e as Error).message,
    };
  }
  const uncertain = (message: string): Diagnosis => ({
    ...base,
    ...math,
    status: "insufficient",
    message,
    probe: probeFor(a, candidates),
  });
  if (
    !a.steps.some((s) => s.trim()) ||
    [a.explanation, ...a.probes.map((p) => p.explanation)]
      .join(" ")
      .trim()
      .split(/\s+/).length < 5
  )
    return uncertain(
      "Your answer alone does not tell us which idea led to it. Add working and explain a step.",
    );
  if (
    /\b(guessed|guessing|no idea|not sure)\b|copied.{0,60}answer|remembered.{0,60}answer/i.test(
      explanation,
    )
  )
    return uncertain(
      "You mentioned guessing or relying on an answer. Let’s collect an independent explanation before choosing a diagnosis.",
    );
  const top = candidates[0];
  const wordVocab =
    model.vectors.find((v) => v.name === "words")?.vocabulary || {};
  const words = normalize(explanation).match(/[a-z]+/g) || [];
  const coverage =
    words.filter((w) => wordVocab[w] !== undefined).length /
    Math.max(words.length, 1);
  if (
    top.score < model.threshold ||
    top.score - candidates[1].score < model.margin ||
    coverage < 0.25
  )
    return uncertain(
      "There is not enough consistent evidence to choose one misconception.",
    );
  if (math.answerCorrect && math.evidenceStep === null) {
    if (top.label !== "correct")
      return uncertain(
        "The algebra is equivalent, but the explanation suggests a different rule. Let’s check it before drawing a conclusion.",
      );
    if (!a.expression.includes("=") && normalizeMath(a.answer).includes("("))
      return uncertain(
        "This is equivalent. Expand the brackets and show how each term changes.",
      );
    return {
      ...base,
      ...math,
      status: "consistent",
      message:
        "Your working is consistent on this problem. A new check will test whether the idea transfers.",
    };
  }
  if (top.label === "correct")
    return uncertain(
      "The explanation sounds consistent, but a mathematical step changes the original value. We need more evidence.",
    );
  return {
    ...base,
    ...math,
    status: "likely",
    message: math.answerCorrect
      ? "The final answer matches, but an earlier step changes the value. The underlying idea still needs checking."
      : "Your working suggests a specific idea to revisit. This is a hypothesis about this attempt.",
  };
}
