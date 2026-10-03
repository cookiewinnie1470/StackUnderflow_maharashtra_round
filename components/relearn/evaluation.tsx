"use client";
import { useEffect, useState } from "react";
import { Download, FlaskConical, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DEMOS,
  LESSONS,
  PROBLEMS,
  questionFor,
} from "@/lib/relearn/curriculum";
import { predict, type ModelArtifact } from "@/lib/relearn/model";
import type { Label, Skill } from "@/lib/relearn/types";
type Score = {
  n: number;
  accuracy: number;
  macro_f1: number;
  per_class: Record<
    string,
    { precision: number; recall: number; "f1-score": number; support: number }
  >;
  confusion_matrix: number[][];
};
type Metrics = {
  model_version: string;
  dataset: {
    total: number;
    train: number;
    validation: number;
    test: number;
    provenance: string;
    split_policy: string;
  };
  labels: Label[];
  label_names: string[];
  full_model: Score;
  answer_only: Score;
  validation_selection: {
    threshold: number;
    margin: number;
    precision: number;
    coverage: number;
  };
  test_selective: {
    accuracy: number | null;
    coverage: number;
    accepted: number;
  };
  same_answer_pairs: { pairs: number; full_model: Score; answer_only: Score };
  limitations: string[];
};
type Challenge = {
  overall_selective: {
    accepted: number;
    correct: number;
    accuracy: number | null;
  };
  total: number;
  labelled: number;
  raw_accuracy: number;
  system: {
    accepted: number;
    correct: number;
    coverage: number;
    accuracy: number | null;
  };
  unknown: { total: number; rejected: number };
  ambiguous: { total: number; rejected: number };
  review_status: string;
  failures: {
    id: string;
    expected: string;
    predicted: string;
    status: string;
  }[];
};
const pct = (v: number | null) =>
  v === null ? "—" : (v * 100).toFixed(1) + "%";
const short = [
  "Distr.",
  "Neg. ×",
  "− group",
  "Unlike",
  "Inverse",
  "Balance",
  "Valid",
];
export function Evaluation({
  model,
  onDemo,
}: {
  model: ModelArtifact | null;
  onDemo: (kind: "product" | "scope") => void;
}) {
  const [metrics, setMetrics] = useState<Metrics | null>(null),
    [challenge, setChallenge] = useState<Challenge | null>(null),
    [error, setError] = useState("");
  useEffect(() => {
    fetch("/model/metrics.json", { cache: "no-store" })
      .then((r) => {
        if (!r.ok) throw Error("Evaluation results could not be loaded.");
        return r.json();
      })
      .then((v) => setMetrics(v as Metrics))
      .catch((e) => setError(e.message));
    fetch("/model/challenge-results.json", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((v) => setChallenge(v as Challenge | null))
      .catch(() => {});
  }, []);
  if (error)
    return (
      <div className="paper">
        <h2>Evaluation unavailable</h2>
        <p>{error}</p>
      </div>
    );
  if (!metrics)
    return (
      <div className="paper" role="status">
        Loading measured evaluation results…
      </div>
    );
  return (
    <div className="evaluation">
      <div className="page-heading">
        <div>
          <p className="eyebrow">THE EVIDENCE BEHIND THE TUTOR</p>
          <h1>A model you can question.</h1>
          <p>Measured results, explicit limits, and a reproducible baseline.</p>
        </div>
        <Button variant="outline" asChild>
          <a href="/model/metrics.json" download>
            <Download size={16} />
            Results JSON
          </a>
        </Button>
      </div>
      <div className="notice">
        <FlaskConical size={20} />
        <p>
          <strong>Prototype evaluation.</strong> These results use synthetic
          responses, not real student records. Independent review and the peer
          pilot are pending.
        </p>
      </div>
      <div className="stat-grid">
        <div className="stat-card">
          <span>Diagnosis accuracy</span>
          <b>{pct(metrics.full_model.accuracy)}</b>
          <small>{metrics.full_model.n} held-out synthetic responses</small>
        </div>
        <div className="stat-card">
          <span>Macro-F1</span>
          <b>{metrics.full_model.macro_f1.toFixed(3)}</b>
          <small>Each of the seven classes weighted equally</small>
        </div>
        <div className="stat-card">
          <span>Answer-only baseline</span>
          <b>{pct(metrics.answer_only.accuracy)}</b>
          <small>Same split, without working or explanation</small>
        </div>
      </div>
      <section className="paper section-space">
        <div className="section-top">
          <div>
            <p className="eyebrow">THE CENTRAL TEST</p>
            <h2>Same answer. Different thinking.</h2>
          </div>
          <span className="small-tag">
            {metrics.same_answer_pairs.pairs} pairs
          </span>
        </div>
        <p className="body-copy">
          Both learners simplify −2(x − 3) to −2x − 6. The working and
          explanation provide the evidence to distinguish them.
        </p>
        <div className="comparison-grid">
          {(["product", "scope"] as const).map((kind, i) => {
            const item = DEMOS[kind],
              p = model
                ? predict(model, {
                    ...item,
                    question: questionFor(PROBLEMS[0]),
                  })[0]
                : null;
            return (
              <div className="comparison" key={kind}>
                <span className="eyebrow">
                  LEARNER {i + 1} · AUTHORED EXAMPLE
                </span>
                <p className="mono">{item.answer}</p>
                <blockquote>“{item.explanation}”</blockquote>
                <div className="predicted">
                  <span>Live model prediction</span>
                  <strong>
                    {p
                      ? p.label === "correct"
                        ? "Consistent reasoning"
                        : LESSONS[p.label as Skill].name
                      : "Model unavailable"}
                  </strong>
                </div>
                <Button variant="outline" onClick={() => onDemo(kind)}>
                  Try learner {i + 1}’s example
                </Button>
              </div>
            );
          })}
        </div>
        <p className="footnote">
          Matched-pair response accuracy:{" "}
          {pct(metrics.same_answer_pairs.full_model.accuracy)} with reasoning;{" "}
          {pct(metrics.same_answer_pairs.answer_only.accuracy)} with the
          answer-only baseline. These pairs use held-out synthetic template
          families.
        </p>
      </section>
      <div className="eval-grid">
        <section className="paper">
          <p className="eyebrow">WHAT WAS TRAINED</p>
          <h2>A small, inspectable baseline.</h2>
          <dl className="details-list">
            <div>
              <dt>Model</dt>
              <dd>Multinomial logistic regression</dd>
            </div>
            <div>
              <dt>Features</dt>
              <dd>Word + character TF-IDF</dd>
            </div>
            <div>
              <dt>Data</dt>
              <dd>{metrics.dataset.total} synthetic responses</dd>
            </div>
            <div>
              <dt>Split</dt>
              <dd>
                {metrics.dataset.train} train / {metrics.dataset.validation}{" "}
                validation / {metrics.dataset.test} test
              </dd>
            </div>
            <div>
              <dt>Runtime</dt>
              <dd>In your browser, without an AI API</dd>
            </div>
          </dl>
          <p className="footnote">{metrics.dataset.split_policy}</p>
          <p className="footnote">
            Source taxonomy informed by the{" "}
            <a
              href="https://github.com/nancyotero-projects/math-misconceptions"
              target="_blank"
              rel="noreferrer"
            >
              MaE benchmark
            </a>
            . No source rows or teacher annotations were imported as learner
            responses. An incorrect source answer was excluded during review.
          </p>
        </section>
        <section className="paper">
          <p className="eyebrow">KNOWING WHEN TO ASK</p>
          <h2>Diagnosis includes uncertainty.</h2>
          <div className="metric-pair">
            <div>
              <b>{pct(metrics.test_selective.coverage)}</b>
              <span>Test responses above the score gates</span>
            </div>
            <div>
              <b>{pct(metrics.test_selective.accuracy)}</b>
              <span>Accuracy among those responses</span>
            </div>
          </div>
          <p className="body-copy">
            The rejection threshold ({metrics.validation_selection.threshold})
            and margin ({metrics.validation_selection.margin}) were chosen using
            validation data. The app also checks notation, working, missing
            evidence, and contradictory algebra.
          </p>
          <p className="footnote">
            Model scores are not calibrated probabilities that a learner holds a
            belief. High scores can still be wrong.
          </p>
        </section>
      </div>
      <section className="paper section-space">
        <p className="eyebrow">WHERE THE MODEL GETS CONFUSED</p>
        <h2>Per-class results</h2>
        <div className="table-scroll">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Class</TableHead>
                <TableHead>Precision</TableHead>
                <TableHead>Recall</TableHead>
                <TableHead>F1</TableHead>
                <TableHead>Responses</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {metrics.labels.map((l, i) => {
                const r = metrics.full_model.per_class[l];
                return (
                  <TableRow key={l}>
                    <TableCell>{metrics.label_names[i]}</TableCell>
                    <TableCell>{pct(r.precision)}</TableCell>
                    <TableCell>{pct(r.recall)}</TableCell>
                    <TableCell>{r["f1-score"].toFixed(3)}</TableCell>
                    <TableCell>{r.support}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
        <h3 className="subheading">Confusion matrix</h3>
        <p className="footnote">
          Rows = expected class. Columns = predicted class. Values are response
          counts.
        </p>
        <div className="table-scroll">
          <Table className="matrix">
            <TableHeader>
              <TableRow>
                <TableHead>Expected ↓ / Predicted →</TableHead>
                {short.map((s) => (
                  <TableHead key={s}>{s}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {metrics.full_model.confusion_matrix.map((row, i) => (
                <TableRow key={i}>
                  <TableCell>{metrics.label_names[i]}</TableCell>
                  {row.map((n, j) => (
                    <TableCell
                      key={j}
                      style={{
                        background: `rgba(52,89,221,${0.04 + (n / 25) * 0.3})`,
                      }}
                    >
                      {n}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </section>
      {challenge && (
        <section className="paper section-space">
          <p className="eyebrow">DEVELOPMENT STRESS TEST</p>
          <h2>New wording and uncertain cases</h2>
          <p className="body-copy">
            {challenge.total} separately authored cases.{" "}
            {challenge.review_status}. These cases are separate from the
            generated dataset, but are not an independently reviewed benchmark.
          </p>
          <div className="metric-pair">
            <div>
              <b>
                {challenge.unknown.rejected}/{challenge.unknown.total}
              </b>
              <span>Unsupported misconceptions rejected</span>
            </div>
            <div>
              <b>
                {challenge.ambiguous.rejected}/{challenge.ambiguous.total}
              </b>
              <span>Ambiguous cases sent for more evidence</span>
            </div>
          </div>
          <p className="body-copy">
            On supported labelled cases, raw classifier accuracy is{" "}
            {pct(challenge.raw_accuracy)}. The full app accepts{" "}
            {challenge.system.accepted} of {challenge.labelled}; accuracy among
            accepted diagnoses is {pct(challenge.system.accuracy)}.
          </p>
          <p className="footnote">
            Including unsupported cases, {challenge.overall_selective.correct}{" "}
            of {challenge.overall_selective.accepted} accepted diagnoses are
            correct ({pct(challenge.overall_selective.accuracy)}). The model
            incorrectly assigns a known label to{" "}
            {challenge.unknown.total - challenge.unknown.rejected} unfamiliar
            misconceptions.
          </p>
          {challenge.failures.length > 0 && (
            <details>
              <summary>
                Inspect {challenge.failures.length} failed or uncertain
                supported cases
              </summary>
              <ul className="failure-list">
                {challenge.failures.map((f) => (
                  <li key={f.id}>
                    <b>{f.id}</b>: expected {f.expected}; model returned{" "}
                    {f.predicted} ({f.status}).
                  </li>
                ))}
              </ul>
            </details>
          )}
        </section>
      )}
      <section className="paper section-space">
        <div className="section-top">
          <h2>What this does—and does not—establish</h2>
          <TriangleAlert size={20} />
        </div>
        <ul className="limitations">
          {metrics.limitations.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
        <div className="pilot-strip">
          <div>
            <strong>Peer pilot: not yet run</strong>
            <p>
              No participants or outcomes have been invented. Use the kit for
              3–5 supervised peer sessions.
            </p>
          </div>
          <Button variant="outline" asChild>
            <a href="/pilot-kit.md" download>
              Download pilot kit
            </a>
          </Button>
        </div>
        <p className="footnote mono">{metrics.model_version}</p>
      </section>
    </div>
  );
}
