"use client";
import { useEffect, useRef, useState } from "react";
import {
  BookOpen,
  ChartNoAxesCombined,
  FlaskConical,
  Repeat2,
  Plus,
  Sparkles,
  LockKeyhole,
  ChevronLeft,
  ChevronRight,
  Trash2,
  TriangleAlert,
  CheckCircle2,
  Lightbulb,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  PROBLEMS,
  SKILLS,
  LESSONS,
  DEMOS,
  questionFor,
} from "@/lib/relearn/curriculum";
import {
  diagnose,
  validateArtifact,
  type ModelArtifact,
} from "@/lib/relearn/model";
import { emptyHistory, addCheck, skillState } from "@/lib/relearn/progress";
import { loadHistory, saveHistory, exportJSON } from "@/lib/relearn/storage";
import type {
  Attempt,
  Diagnosis,
  History,
  Skill,
  CheckRecord,
} from "@/lib/relearn/types";
import { LearningVisual } from "@/components/relearn/visuals";
import { Evaluation } from "@/components/relearn/evaluation";
import { ProgressView } from "@/components/relearn/progress-view";
import {
  Assessment,
  AssessmentResult,
  type AssessmentConfig,
} from "@/components/relearn/assessment";

type Stage = "input" | "diagnosis" | "lesson" | "check" | "result";
export default function Home() {
  const [compactNav, setCompactNav] = useState(false);
  const [view, setView] = useState("learn"),
    [stage, setStage] = useState<Stage>("input"),
    [problemIndex, setProblemIndex] = useState(0),
    [answer, setAnswer] = useState(""),
    [steps, setSteps] = useState([""]),
    [reasoning, setReasoning] = useState(""),
    [demo, setDemo] = useState(false);
  const [model, setModel] = useState<ModelArtifact | null>(null),
    [modelError, setModelError] = useState(""),
    [history, setHistory] = useState<History>(emptyHistory),
    [loaded, setLoaded] = useState(false),
    [storageBlocked, setStorageBlocked] = useState(false),
    [storageError, setStorageError] = useState(""),
    [saving, setSaving] = useState(false);
  const [attempt, setAttempt] = useState<Attempt | null>(null),
    [diagnosis, setDiagnosis] = useState<Diagnosis | null>(null),
    [skill, setSkill] = useState<Skill>("negative_product"),
    [check, setCheck] = useState<AssessmentConfig | null>(null),
    [result, setResult] = useState<CheckRecord | null>(null),
    [formError, setFormError] = useState(""),
    [probeAnswer, setProbeAnswer] = useState(""),
    [probeReason, setProbeReason] = useState(""),
    [now, setNow] = useState(Date.now());
  const saveQueue = useRef(Promise.resolve()),
    mainRef = useRef<HTMLDivElement>(null);
  const problem = PROBLEMS[problemIndex];
  useEffect(() => {
    const query = window.matchMedia("(max-width: 680px)");
    const update = () => setCompactNav(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  useEffect(() => {
    let cancelled = false;
    fetch("/model/classifier.json", { cache: "no-store" })
      .then((r) => {
        if (!r.ok)
          throw Error(
            "The diagnosis model could not be loaded. Reload to try again.",
          );
        return r.json();
      })
      .then((v) => {
        if (!cancelled) setModel(validateArtifact(v as ModelArtifact));
      })
      .catch((e) => {
        if (!cancelled) setModelError(e.message);
      });
    loadHistory()
      .then((h) => {
        if (!cancelled) setHistory(h);
      })
      .catch((e) => {
        if (!cancelled) {
          setStorageError(e.message);
          setStorageBlocked(true);
        }
      })
      .finally(() => {
        if (!cancelled) setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);
  useEffect(() => {
    if (!loaded || storageBlocked) return;
    setSaving(true);
    let current = true;
    saveQueue.current = saveQueue.current
      .catch(() => {})
      .then(() => saveHistory(history));
    saveQueue.current
      .then(() => {
        if (current) {
          setSaving(false);
          setStorageError("");
        }
      })
      .catch((e) => {
        if (current) {
          setSaving(false);
          setStorageError(e.message);
        }
      });
    return () => {
      current = false;
    };
  }, [history, loaded, storageBlocked]);
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(t);
  }, []);
  useEffect(() => {
    mainRef.current?.focus({ preventScroll: true });
  }, [stage, view]);
  function recordAttempt(a: Attempt, d: Diagnosis) {
    setAttempt(a);
    setDiagnosis(d);
    if (d.status !== "invalid_input")
      setHistory((h) => ({
        ...h,
        attempts: [
          ...h.attempts.filter((x) => x.id !== a.id),
          { ...a, diagnosis: d },
        ],
      }));
  }
  function submitAttempt(e?: React.FormEvent) {
    e?.preventDefault();
    if (!model || !answer.trim()) return;
    setFormError("");
    const a: Attempt = {
      id: crypto.randomUUID(),
      createdAt: Date.now(),
      question: questionFor(problem),
      expression: problem.expression,
      answer: answer.trim(),
      steps: steps.map((s) => s.trim()).filter(Boolean),
      explanation: reasoning.trim(),
      problemId: problem.id,
      probes: [],
      demo,
    };
    const d = diagnose(model, a);
    if (d.status === "invalid_input") {
      setFormError(d.error || d.message);
      return;
    }
    recordAttempt(a, d);
    setStage("diagnosis");
  }
  function submitProbe(e: React.FormEvent) {
    e.preventDefault();
    if (!attempt || !diagnosis?.probe || !model) return;
    if (!probeAnswer.trim() || probeReason.trim().split(/\s+/).length < 3) {
      setFormError(
        "Give the follow-up answer and a short explanation of your reasoning.",
      );
      return;
    }
    const a = {
      ...attempt,
      probes: [
        ...attempt.probes,
        {
          question: diagnosis.probe,
          answer: probeAnswer,
          explanation: probeReason,
        },
      ],
    };
    recordAttempt(a, diagnose(model, a));
    setProbeAnswer("");
    setProbeReason("");
    setFormError("");
  }
  function resetInput(index = problemIndex, asDemo = false) {
    setProblemIndex(index);
    setStage("input");
    setAnswer("");
    setSteps([""]);
    setReasoning("");
    setDiagnosis(null);
    setAttempt(null);
    setFormError("");
    setDemo(asDemo);
    setCheck(null);
  }
  function startDemo(kind: "product" | "scope") {
    resetInput(0, true);
    setView("learn");
    setAnswer(DEMOS[kind].answer);
    setSteps([...DEMOS[kind].steps]);
    setReasoning(DEMOS[kind].explanation);
  }
  function lesson(s: Skill, isDemo = demo) {
    setSkill(s);
    setDemo(isDemo);
    setView("learn");
    setStage("lesson");
    setHistory((h) => ({
      ...h,
      lessons: [
        ...h.lessons,
        { skill: s, createdAt: Date.now(), demo: isDemo },
      ],
    }));
  }
  function startCheck(s = skill, retention = false, isDemo = demo) {
    if (retention) {
      const state = skillState(history, s);
      if (state.dueAt === null || state.dueAt > Date.now()) return;
    }
    const seed = crypto.getRandomValues(new Uint32Array(1))[0] % 1000000;
    setCheck({ skill: s, seed, retention, demo: isDemo });
    setSkill(s);
    setDemo(isDemo);
    setView("learn");
    setStage("check");
  }
  function finishCheck(c: CheckRecord) {
    setHistory((h) => addCheck(h, c));
    setResult(c);
    setStage("result");
  }
  function exitCheck(c: CheckRecord) {
    setHistory((h) => addCheck(h, c));
    setStage("lesson");
  }
  function navigate(v: string) {
    if (stage === "check" && check) {
      const c: CheckRecord = {
        id: crypto.randomUUID(),
        ...check,
        createdAt: Date.now(),
        passed: false,
        results: [false, false, false],
        assisted: true,
        answers: [],
      };
      setHistory((h) => addCheck(h, c));
      setStage("lesson");
    }
    setView(v);
  }
  // Optional WebMCP read tool uses the same current visible state. No hidden learner actions.
  useEffect(() => {
    type Tool = {
      name: string;
      description: string;
      inputSchema: object;
      annotations: object;
      execute: (input: unknown) => unknown;
    };
    const context = (
      document as Document & {
        modelContext?: {
          registerTool: (t: Tool, options: { signal: AbortSignal }) => unknown;
        };
      }
    ).modelContext;
    if (!context?.registerTool) return;
    const ctl = new AbortController();
    try {
      Promise.resolve(
        context.registerTool(
          {
            name: "get_relearn_progress",
            description:
              "Read learning progress stored in the current browser; does not submit answers or alter progress.",
            inputSchema: {
              type: "object",
              properties: {},
              additionalProperties: false,
            },
            annotations: { readOnlyHint: true, untrustedContentHint: true },
            execute(input) {
              if (
                input === null ||
                typeof input !== "object" ||
                Object.keys(input).length
              )
                throw Error("Expected an empty object.");
              return {
                view,
                stage,
                skills: SKILLS.map((s) => skillState(history, s)),
                personalAttempts: history.attempts.filter((a) => !a.demo)
                  .length,
              };
            },
          },
          { signal: ctl.signal },
        ),
      ).catch(() => {});
    } catch {}
    return () => ctl.abort();
  }, [history, view, stage]);
  const selectedSkill =
    diagnosis?.status === "likely" &&
    diagnosis.candidates[0].label !== "correct"
      ? (diagnosis.candidates[0].label as Skill)
      : problem.skill;
  return (
    <Tabs
      orientation={compactNav ? "horizontal" : "vertical"}
      value={view}
      onValueChange={navigate}
      className="app-shell"
    >
      <a className="skip-link" href="#workspace">
        Skip to learning workspace
      </a>
      <aside className="side">
        <div className="brand">
          <span className="brand-mark">
            <Repeat2 size={22} />
          </span>
          Re:Learn<span className="brand-dot">.</span>
        </div>
        <span className="eyebrow side-label">YOUR STUDY SPACE</span>
        <nav aria-label="Main navigation">
          <TabsList className="nav-list" aria-label="Study views">
            <TabsTrigger value="learn" className="nav-item">
              <BookOpen />
              Learn
            </TabsTrigger>
            <TabsTrigger value="progress" className="nav-item">
              <ChartNoAxesCombined />
              My Progress
            </TabsTrigger>
            <TabsTrigger value="evaluation" className="nav-item">
              <FlaskConical />
              Model Evaluation
            </TabsTrigger>
          </TabsList>
        </nav>
        <div className="side-note">
          <div className="orbit-mark">x</div>
          <h3>A mistake is a starting point.</h3>
          <p>
            Understand your thinking. Try a different approach. Make it stick.
          </p>
        </div>
        <div className="local-note">
          <LockKeyhole size={15} />
          {storageError
            ? "History is not being saved"
            : saving
              ? "Saving in this browser…"
              : "Progress stays in this browser"}
        </div>
      </aside>
      <TabsContent value={view} asChild>
        <main className="main" id="workspace">
          <header className="topbar">
            <span>
              Algebra foundations <span className="divider">/</span>{" "}
              {view === "learn"
                ? "Learning workspace"
                : view === "progress"
                  ? "Your progress"
                  : "Model evaluation"}
            </span>
            <span className="round-avatar" aria-hidden="true">
              R
            </span>
          </header>
          <div
            className="workspace"
            ref={mainRef}
            tabIndex={-1}
            style={{ outline: "none" }}
          >
            {view === "evaluation" ? (
              <Evaluation model={model} onDemo={startDemo} />
            ) : view === "progress" ? (
              <ProgressView
                history={history}
                now={now}
                onLesson={(s) => lesson(s, false)}
                onRetention={(s) => startCheck(s, true, false)}
                onReset={() => {
                  setHistory(emptyHistory());
                  setStorageBlocked(false);
                }}
              />
            ) : (
              <>
                <div className="page-heading">
                  <div>
                    <p className="eyebrow">
                      A LITTLE CLARITY, ONE STEP AT A TIME
                    </p>
                    <h1>
                      {stage === "input"
                        ? "Let’s work through it."
                        : stage === "diagnosis"
                          ? "Let’s look at your thinking."
                          : stage === "lesson"
                            ? "Make the idea click."
                            : stage === "check"
                              ? "Try it on your own."
                              : "Look at what changed."}
                    </h1>
                    <p>
                      {stage === "input"
                        ? "Show your steps. We’ll help you understand the why."
                        : stage === "check"
                          ? "Three different checks. No hints. Feedback at the end."
                          : "Understanding grows when we test the idea from another angle."}
                    </p>
                  </div>
                  <span className="pill">
                    {String(problemIndex + 1).padStart(2, "0")} / Foundations
                  </span>
                </div>
                {demo && (
                  <div className="notice">
                    <FlaskConical size={19} />
                    <p>
                      <strong>Example session.</strong> These authored responses
                      demonstrate the model. They are excluded from personal
                      progress.{" "}
                      <button
                        className="underline"
                        onClick={() => resetInput()}
                      >
                        Start my own attempt
                      </button>
                    </p>
                  </div>
                )}
                <div className="journey">
                  <span
                    className={
                      stage === "input" || stage === "diagnosis" ? "active" : ""
                    }
                  >
                    <b>1</b>Show your thinking
                  </span>
                  <i />
                  <span className={stage === "lesson" ? "active" : ""}>
                    <b>2</b>Explore the idea
                  </span>
                  <i />
                  <span
                    className={
                      stage === "check" || stage === "result" ? "active" : ""
                    }
                  >
                    <b>3</b>Check understanding
                  </span>
                </div>
                <div className="study-grid">
                  <div>
                    {stage === "input" && (
                      <section className="paper">
                        <div className="question-toolbar">
                          <div
                            className="section-top"
                            style={{ marginBottom: 0 }}
                          >
                            <span className="eyebrow">YOUR CHALLENGE</span>
                          </div>
                          <div className="problem-picker">
                            <span className="small-tag">{problem.topic}</span>
                            <button
                              aria-label="Previous challenge"
                              disabled={problemIndex === 0}
                              onClick={() => resetInput(problemIndex - 1)}
                            >
                              <ChevronLeft size={16} />
                            </button>
                            <button
                              aria-label="Next challenge"
                              disabled={problemIndex === PROBLEMS.length - 1}
                              onClick={() => resetInput(problemIndex + 1)}
                            >
                              <ChevronRight size={16} />
                            </button>
                          </div>
                        </div>
                        <h2>{problem.title}</h2>
                        <div className="equation-stage equation-text">
                          {problem.display}
                        </div>
                        <form onSubmit={submitAttempt}>
                          <label className="field-label" htmlFor="answer">
                            Your answer
                          </label>
                          <Input
                            id="answer"
                            placeholder={
                              problem.expression.includes("=")
                                ? "e.g. x = 4"
                                : "e.g. 3x + 6"
                            }
                            className="math-input"
                            value={answer}
                            onChange={(e) => setAnswer(e.target.value)}
                            maxLength={250}
                            autoComplete="off"
                          />
                          <div className="field-row">
                            <span className="field-label">Your working</span>
                            <span className="muted">
                              One expression per step
                            </span>
                          </div>
                          {steps.map((s, i) => (
                            <div className="step-input" key={i}>
                              <span>{String(i + 1).padStart(2, "0")}</span>
                              <Input
                                aria-label={`Step ${i + 1}`}
                                value={s}
                                onChange={(e) =>
                                  setSteps(
                                    steps.map((v, j) =>
                                      j === i ? e.target.value : v,
                                    ),
                                  )
                                }
                                placeholder="Write the next expression…"
                                maxLength={250}
                              />
                              {steps.length > 1 && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon-sm"
                                  aria-label={`Remove step ${i + 1}`}
                                  onClick={() =>
                                    setSteps(steps.filter((_, j) => j !== i))
                                  }
                                >
                                  <Trash2 size={14} />
                                </Button>
                              )}
                            </div>
                          ))}
                          <Button
                            type="button"
                            variant="ghost"
                            onClick={() => setSteps([...steps, ""])}
                            disabled={steps.length >= 8}
                            className="add-step"
                          >
                            <Plus size={16} />
                            Add a step
                          </Button>
                          <label className="field-label" htmlFor="reasoning">
                            Explain your reasoning
                          </label>
                          <Textarea
                            id="reasoning"
                            placeholder="What did you do, and why? A sentence or two is enough."
                            className="reasoning"
                            value={reasoning}
                            onChange={(e) => setReasoning(e.target.value)}
                            maxLength={2000}
                          />
                          {formError && (
                            <p className="form-error" role="alert">
                              {formError}
                            </p>
                          )}
                          {modelError && (
                            <p className="form-error" role="alert">
                              {modelError}
                            </p>
                          )}
                          <div className="submit-row">
                            <span className="muted">
                              Your reasoning matters more than a guess.
                            </span>
                            <Button
                              type="submit"
                              disabled={!model || !loaded || !answer.trim()}
                            >
                              <Sparkles size={15} />
                              {!model
                                ? "Loading model…"
                                : "Explore my thinking"}
                            </Button>
                          </div>
                        </form>
                        <details className="example-tools">
                          <summary>Try the same-answer demonstration</summary>
                          <p>
                            Two authored examples, one wrong answer. Example
                            attempts do not affect your progress.
                          </p>
                          <div className="button-wrap">
                            <Button
                              variant="outline"
                              onClick={() => startDemo("product")}
                            >
                              Learner 1: sign multiplication
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => startDemo("scope")}
                            >
                              Learner 2: leading minus
                            </Button>
                          </div>
                        </details>
                      </section>
                    )}
                    {stage === "diagnosis" && diagnosis && attempt && (
                      <section className="paper">
                        <div
                          className={
                            "status-card " +
                            (diagnosis.status === "insufficient"
                              ? "uncertain"
                              : "")
                          }
                        >
                          <span className="eyebrow">
                            {diagnosis.status === "likely"
                              ? "A LIKELY IDEA TO REVISIT"
                              : diagnosis.status === "consistent"
                                ? "CONSISTENT ON THIS PROBLEM"
                                : "MORE EVIDENCE NEEDED"}
                          </span>
                          <h3>
                            {diagnosis.status === "likely"
                              ? LESSONS[selectedSkill].name
                              : diagnosis.status === "consistent"
                                ? "Your steps preserve the mathematics."
                                : "Let’s avoid guessing why."}
                          </h3>
                          <p>{diagnosis.message}</p>
                          {diagnosis.evidenceStep !== null && (
                            <div className="evidence">
                              <b>
                                FIRST STEP THAT CHANGES THE VALUE ·{" "}
                                {diagnosis.evidenceStep + 1}
                              </b>
                              <span className="mono">
                                {attempt.steps[diagnosis.evidenceStep]}
                              </span>
                            </div>
                          )}
                          {diagnosis.evidenceStep === null &&
                            !diagnosis.answerCorrect && (
                              <div className="evidence">
                                <b>ANSWER TO REVISIT</b>
                                <span className="mono">{attempt.answer}</span>
                              </div>
                            )}
                          <p className="status-meta">
                            {diagnosis.status === "likely"
                              ? "This is a model hypothesis, not a judgement about your ability."
                              : diagnosis.status === "consistent"
                                ? "A correct attempt is not yet a demonstration of transfer."
                                : "Different reasoning can produce the same answer."}
                          </p>
                        </div>
                        {diagnosis.status === "insufficient" &&
                          diagnosis.probe && (
                            <form onSubmit={submitProbe} className="probe-box">
                              <span className="eyebrow">
                                FOLLOW-UP {attempt.probes.length + 1} OF 2
                              </span>
                              <h3>{diagnosis.probe}</h3>
                              <label
                                htmlFor="probe-answer"
                                className="field-label"
                              >
                                Follow-up answer
                              </label>
                              <Input
                                id="probe-answer"
                                value={probeAnswer}
                                onChange={(e) => setProbeAnswer(e.target.value)}
                                maxLength={250}
                              />
                              <label
                                htmlFor="probe-reason"
                                className="field-label"
                              >
                                How did you decide?
                              </label>
                              <Textarea
                                id="probe-reason"
                                value={probeReason}
                                onChange={(e) => setProbeReason(e.target.value)}
                                maxLength={1000}
                              />
                              {formError && (
                                <p className="form-error" role="alert">
                                  {formError}
                                </p>
                              )}
                              <Button type="submit">
                                Reconsider with this evidence
                              </Button>
                            </form>
                          )}
                        {diagnosis.status === "insufficient" &&
                          !diagnosis.probe && (
                            <p className="body-copy">
                              The two follow-ups still leave uncertainty. Review
                              the working with a teacher or explore the topic
                              without treating this as a diagnosis.
                            </p>
                          )}
                        <div className="lesson-finish">
                          <Button
                            variant="outline"
                            onClick={() => setStage("input")}
                          >
                            Edit my working
                          </Button>
                          {diagnosis.status === "consistent" ? (
                            <Button onClick={() => startCheck(problem.skill)}>
                              Check a new problem
                            </Button>
                          ) : (
                            <Button onClick={() => lesson(selectedSkill)}>
                              {diagnosis.status === "likely"
                                ? "Explore this idea"
                                : "Explore the topic"}
                            </Button>
                          )}
                        </div>
                      </section>
                    )}
                    {stage === "lesson" && (
                      <section className="paper">
                        <p className="eyebrow">EXPLORE THE IDEA</p>
                        <div className="stage-heading">
                          <h2 className="subheading">{LESSONS[skill].title}</h2>
                          <p>{LESSONS[skill].description}</p>
                        </div>
                        <div className="lesson-rule">{LESSONS[skill].rule}</div>
                        <p className="body-copy">
                          {LESSONS[skill].explanation}
                        </p>
                        <p className="lesson-example">
                          {LESSONS[skill].example}
                        </p>
                        <LearningVisual key={skill} skill={skill} />
                        <p className="footnote">{LESSONS[skill].activity}</p>
                        <div className="lesson-finish">
                          <p>Ready to try without the explanation?</p>
                          <Button onClick={() => startCheck()}>
                            Check my understanding
                          </Button>
                        </div>
                      </section>
                    )}
                    {stage === "check" && check && (
                      <Assessment
                        key={check.seed}
                        config={check}
                        onFinish={finishCheck}
                        onExit={exitCheck}
                      />
                    )}
                    {stage === "result" && result && (
                      <AssessmentResult
                        record={result}
                        onRetry={() => lesson(result.skill, result.demo)}
                        onProgress={() => navigate("progress")}
                      />
                    )}
                  </div>
                  <aside className="thinking-card">
                    <span className="icon-tile">
                      {stage === "input" ? (
                        <Sparkles size={22} />
                      ) : stage === "check" ? (
                        <CheckCircle2 size={22} />
                      ) : (
                        <Lightbulb size={22} />
                      )}
                    </span>
                    <h2>
                      {stage === "input"
                        ? "More than right or wrong."
                        : stage === "check"
                          ? "Make the idea travel."
                          : "Build understanding, not a streak."}
                    </h2>
                    <p>
                      {stage === "input"
                        ? "The same answer can come from different ideas. Your steps help us find the explanation that fits."
                        : stage === "check"
                          ? "A new problem, an explanation, and a visual check provide different evidence of understanding."
                          : "Explore why the rule works. Then use it in a setting you haven’t just practised."}
                    </p>
                    <div className="thinking-example">
                      <span className="eyebrow">THE LEARNING LOOP</span>
                      <p>Notice the pattern</p>
                      <div className="loop-line" />
                      <p>Explore it visually</p>
                      <div className="loop-line" />
                      <p>Try it a new way</p>
                    </div>
                    <p className="caption">
                      {stage === "check"
                        ? "Leave the lesson closed while you answer. Returning to it ends this unassisted check."
                        : "A correct answer is a clue. Understanding takes a little more evidence."}
                    </p>
                    {stage !== "input" && stage !== "check" && (
                      <Button
                        variant="outline"
                        className="mt-5 w-full"
                        onClick={() => resetInput()}
                      >
                        Start another attempt
                      </Button>
                    )}
                  </aside>
                </div>
              </>
            )}
          </div>
          {storageError && (
            <div className="notice error storage-banner" role="alert">
              <TriangleAlert size={20} />
              <div>
                <p>{storageError} Your current work remains in this tab.</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={() =>
                    exportJSON(history, "relearn-unsaved-session.json")
                  }
                >
                  Export this session
                </Button>
                {!storageBlocked && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-2"
                    onClick={() => setHistory((h) => ({ ...h }))}
                  >
                    Retry saving
                  </Button>
                )}
              </div>
            </div>
          )}
        </main>
      </TabsContent>
    </Tabs>
  );
}
