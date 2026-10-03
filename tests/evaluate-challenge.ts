import fs from "node:fs";
import { createHash } from "node:crypto";
import { challenge } from "./challenge.ts";
import { diagnose, predict, type ModelArtifact } from "../lib/relearn/model.ts";
const model: ModelArtifact = JSON.parse(
  fs.readFileSync("public/model/classifier.json", "utf8"),
);
const results = challenge.map((c) => {
  const d = diagnose(model, c.attempt),
    pred = predict(model, c.attempt)[0].label;
  return {
    id: c.id,
    expected: c.expected,
    predicted: pred,
    status: d.status,
    score: d.candidates[0].score,
  };
});
const labelled = results.filter(
  (r) => r.expected !== "ambiguous" && r.expected !== "unknown",
);
const accepted = labelled.filter(
  (r) => r.status === "likely" || r.status === "consistent",
);
const unknown = results.filter((r) => r.expected === "unknown"),
  ambiguous = results.filter((r) => r.expected === "ambiguous");
const rejected = (r: (typeof results)[number]) =>
  r.status !== "likely" && r.status !== "consistent";
const allAccepted = results.filter((r) => !rejected(r));
const metrics = {
  overall_selective: {
    accepted: allAccepted.length,
    correct: allAccepted.filter((r) => r.expected === r.predicted).length,
    accuracy:
      allAccepted.filter((r) => r.expected === r.predicted).length /
      Math.max(allAccepted.length, 1),
  },
  total: results.length,
  labelled: labelled.length,
  raw_accuracy:
    labelled.filter((r) => r.expected === r.predicted).length / labelled.length,
  system: {
    accepted: accepted.length,
    correct: accepted.filter((r) => r.expected === r.predicted).length,
    coverage: accepted.length / labelled.length,
    accuracy: accepted.length
      ? accepted.filter((r) => r.expected === r.predicted).length /
        accepted.length
      : null,
  },
  unknown: { total: unknown.length, rejected: unknown.filter(rejected).length },
  ambiguous: {
    total: ambiguous.length,
    rejected: ambiguous.filter(rejected).length,
  },
  review_status:
    "Development stress set authored by the implementation agent; used to identify training-coverage gaps; independent peer review pending",
  challenge_sha256: createHash("sha256")
    .update(JSON.stringify(challenge))
    .digest("hex"),
  failures: labelled.filter((r) => r.expected !== r.predicted || rejected(r)),
  results,
};
fs.writeFileSync(
  "public/model/challenge-results.json",
  JSON.stringify(metrics, null, 2) + "\n",
);
fs.writeFileSync(
  "ml/data/challenge.json",
  JSON.stringify(challenge, null, 2) + "\n",
);
console.log(JSON.stringify({ ...metrics, results: undefined }, null, 2));
