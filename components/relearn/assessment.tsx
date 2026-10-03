"use client";
import { useState, useEffect, useRef } from "react";
import { CheckCircle2, RefreshCcw, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Progress } from "@/components/ui/progress";
import { CheckVisual } from "./visuals";
import { makeChecks, gradeChecks, LESSONS } from "@/lib/relearn/curriculum";
import { parseLinear } from "@/lib/relearn/math";
import type { Skill, CheckRecord, CheckAnswer } from "@/lib/relearn/types";
export type AssessmentConfig = {
  skill: Skill;
  seed: number;
  retention: boolean;
  demo: boolean;
};
export function Assessment({
  config,
  onFinish,
  onExit,
}: {
  config: AssessmentConfig;
  onFinish: (record: CheckRecord) => void;
  onExit: (record: CheckRecord) => void;
}) {
  const tasks = makeChecks(config.skill, config.seed);
  const [answers, setAnswers] = useState<CheckAnswer[]>([]),
    [value, setValue] = useState(""),
    [choice, setChoice] = useState(""),
    [error, setError] = useState("");
  const index = answers.length,
    task = tasks[Math.min(index, 2)];
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    heading.current?.focus();
  }, [index]);
  function record(items: CheckAnswer[], assisted: boolean): CheckRecord {
    return {
      id: crypto.randomUUID(),
      skill: config.skill,
      createdAt: Date.now(),
      ...gradeChecks(tasks, items, assisted),
      assisted,
      retention: config.retention,
      seed: config.seed,
      answers: items,
      demo: config.demo,
    };
  }
  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    try {
      parseLinear(task.equation && !value.includes("=") ? "x=" + value : value);
    } catch (e) {
      setError((e as Error).message);
      return;
    }
    if (task.choices && !choice) {
      setError("Choose an explanation as well as entering your correction.");
      return;
    }
    const next = [...answers, { value, choice }];
    if (next.length === 3) {
      onFinish(record(next, false));
    } else {
      setAnswers(next);
      setValue("");
      setChoice("");
    }
  }
  return (
    <section className="paper">
      <div className="check-counter">
        <span className="eyebrow">
          {config.retention ? "RETENTION CHECK" : "CHECK UNDERSTANDING"}
        </span>
        <span>{index + 1} of 3</span>
      </div>
      <Progress
        value={(index / 3) * 100}
        aria-label={`${index} of 3 checks answered`}
      />
      <div className="stage-heading">
        <h2 className="subheading focus-heading" ref={heading} tabIndex={-1}>
          {
            ["Try a new problem", "Explain and repair", "See it another way"][
              index
            ]
          }
        </h2>
        <p>{task.prompt}</p>
      </div>
      {task.kind === "transfer" && (
        <div className="equation-stage equation-text">
          {task.expression.replace(/\*/g, "").replace(/-/g, "−")}
        </div>
      )}
      <CheckVisual task={task} />
      <form onSubmit={submit}>
        {task.choices && (
          <RadioGroup
            aria-label="Choose the explanation"
            value={choice}
            onValueChange={setChoice}
            className="mb-6"
          >
            {task.choices.map((c) => (
              <label className="choice" key={c.id}>
                <RadioGroupItem value={c.id} />
                <span>{c.text}</span>
              </label>
            ))}
          </RadioGroup>
        )}
        <label htmlFor="check-answer" className="field-label">
          {task.kind === "explain" ? "Your corrected answer" : "Your answer"}
          {task.equation ? " (x = …)" : ""}
        </label>
        <Input
          id="check-answer"
          autoComplete="off"
          autoFocus
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={
            task.equation
              ? "e.g. x = 4"
              : "Enter a simplified expression or number"
          }
          className="math-input"
          maxLength={250}
        />
        <p className="footnote">
          {task.help} Expand brackets, collect like terms, and solve fully for
          x.
        </p>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <div className="submit-row">
          <span className="muted">
            Feedback appears after all three checks.
          </span>
          <Button disabled={!value.trim()} type="submit">
            {index === 2 ? "Finish the check" : "Save and continue"}
          </Button>
        </div>
      </form>
      <div className="toolbar">
        <Button
          variant="ghost"
          className="action-link"
          onClick={() => onExit(record(answers, true))}
        >
          Return to the lesson
        </Button>
        <span className="muted">Returning ends this unassisted check.</span>
      </div>
    </section>
  );
}
export function AssessmentResult({
  record,
  onRetry,
  onProgress,
}: {
  record: CheckRecord;
  onRetry: () => void;
  onProgress: () => void;
}) {
  const tasks = makeChecks(record.skill, record.seed);
  return (
    <section className="paper">
      <span className={"result-icon " + (!record.passed ? "warn" : "")}>
        {record.passed ? <ShieldCheck size={26} /> : <RefreshCcw size={24} />}
      </span>
      <h2 className="result-title">
        {record.passed
          ? record.retention
            ? "The idea held up over time."
            : "You used the idea in three ways."
          : "There’s one more piece to work on."}
      </h2>
      <p className="body-copy">
        {record.passed
          ? record.retention
            ? "All three unassisted checks passed after the retention interval. This is evidence of retention for this tested skill."
            : "All three unassisted checks passed. Understanding is demonstrated for this skill; retention still needs a later check."
          : "A single correct answer isn’t enough. Revisit the idea, then try a fresh set of problems."}
      </p>
      {record.demo && (
        <div className="notice section-space">
          <p>
            This was an example session. It does not change your personal
            progress.
          </p>
        </div>
      )}
      <div>
        {record.results.map((passed, i) => (
          <div className="check-result-row" key={i}>
            <CheckCircle2 className={passed ? "good" : "warn"} size={20} />
            <div>
              <strong>
                {
                  [
                    "New problem",
                    "Explanation and correction",
                    "Different representation",
                  ][i]
                }{" "}
                · {passed ? "Passed" : "Revisit"}
              </strong>
              <p>
                Your answer:{" "}
                <span className="mono">
                  {record.answers[i]?.value || "Not answered"}
                </span>
              </p>
              {!passed && (
                <p>
                  Expected: <span className="mono">{tasks[i].expected}</span>
                  {tasks[i].correctChoice &&
                    ` · ${tasks[i].choices?.find((c) => c.id === tasks[i].correctChoice)?.text}`}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
      <div className="lesson-finish">
        <Button variant="outline" onClick={onRetry}>
          Revisit {LESSONS[record.skill].name.toLowerCase()}
        </Button>
        <Button onClick={onProgress}>View my progress</Button>
      </div>
    </section>
  );
}
