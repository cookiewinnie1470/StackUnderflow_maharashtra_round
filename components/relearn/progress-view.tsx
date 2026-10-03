"use client";
import { BookOpen, Download, Clock3, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { SKILLS, LESSONS } from "@/lib/relearn/curriculum";
import { skillState } from "@/lib/relearn/progress";
import { exportJSON } from "@/lib/relearn/storage";
import type { History, Skill } from "@/lib/relearn/types";
const LABELS = {
  not_started: "Not assessed",
  suspected: "Possible misconception",
  practising: "Practising",
  demonstrated: "Understanding demonstrated",
  retained: "Retention demonstrated",
  recurring: "Possible recurrence",
};
export function ProgressView({
  history,
  onLesson,
  onRetention,
  onReset,
  now,
}: {
  history: History;
  onLesson: (s: Skill) => void;
  onRetention: (s: Skill) => void;
  onReset: () => void;
  now: number;
}) {
  const states = SKILLS.map((s) => skillState(history, s, now)),
    attempts = history.attempts.filter((a) => !a.demo),
    demonstrated = states.filter(
      (s) => s.status === "demonstrated" || s.status === "retained",
    ).length,
    due = states.filter((s) => s.dueAt !== null && s.dueAt <= now).length;
  return (
    <div>
      <div className="page-heading">
        <div>
          <p className="eyebrow">EVIDENCE, NOT JUST A SCORE</p>
          <h1>Your understanding, over time.</h1>
          <p>Each topic keeps a history of attempts and independent checks.</p>
        </div>
        <Button
          variant="outline"
          onClick={() => exportJSON(history, "relearn-progress.json")}
        >
          <Download size={16} />
          Export history
        </Button>
      </div>
      <div className="stat-grid">
        <div className="stat-card">
          <span>Personal attempts</span>
          <b>{attempts.length}</b>
          <small>Authored examples are excluded</small>
        </div>
        <div className="stat-card">
          <span>Skills demonstrated</span>
          <b>
            {demonstrated}
            <span className="muted"> / 6</span>
          </b>
          <small>Three unassisted checks per skill</small>
        </div>
        <div className="stat-card">
          <span>Retention checks due</span>
          <b>{due}</b>
          <small>At least 24 hours after a passing check</small>
        </div>
      </div>
      {attempts.length === 0 &&
        history.checks.filter((c) => !c.demo).length === 0 && (
          <div className="paper section-space empty-state">
            <BookOpen size={28} />
            <h2>Your progress starts with your thinking.</h2>
            <p>
              Complete your own attempt or practise a topic below. Example
              sessions are kept separate from your learning record.
            </p>
            <Button onClick={() => onLesson("distribution")}>
              Explore distribution
            </Button>
          </div>
        )}
      <div className="skill-grid">
        {states.map((s) => (
          <section className="skill-card" key={s.skill}>
            <span className={"status-pill " + s.status}>
              {LABELS[s.status]}
            </span>
            <h3>{LESSONS[s.skill].name}</h3>
            <p>{LESSONS[s.skill].description}</p>
            {s.dueAt !== null && (
              <div className="due-label">
                <Clock3 size={13} className="inline mr-1" />
                {s.dueAt <= now
                  ? "Retention check ready"
                  : `Retention pending · ${new Date(s.dueAt).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}`}
              </div>
            )}
            <div
              className="button-wrap"
              style={{ justifyContent: "flex-start" }}
            >
              <Button variant="outline" onClick={() => onLesson(s.skill)}>
                Practise this idea
              </Button>
              {s.dueAt !== null && s.dueAt <= now && (
                <Button onClick={() => onRetention(s.skill)}>
                  Check retention
                </Button>
              )}
            </div>
          </section>
        ))}
      </div>
      <section className="paper attempt-log">
        <h2>Recent attempts</h2>
        {history.attempts.length === 0 ? (
          <p className="body-copy">No attempts recorded yet.</p>
        ) : (
          history.attempts
            .slice(-15)
            .reverse()
            .map((a) => (
              <details key={a.id}>
                <summary>
                  {a.demo ? "Example · " : ""}
                  {a.question}{" "}
                  <span className="muted">
                    · {new Date(a.createdAt).toLocaleDateString()} ·{" "}
                    {a.diagnosis.status === "likely"
                      ? "Idea to revisit"
                      : a.diagnosis.status === "consistent"
                        ? "Consistent working"
                        : "More evidence needed"}
                  </span>
                </summary>
                <p>
                  Answer: <span className="mono">{a.answer}</span>
                </p>
                <p>
                  Working: <span className="mono">{a.steps.join(" ; ")}</span>
                </p>
                <p>{a.explanation}</p>
                <p>{a.diagnosis.message}</p>
                {a.probes.map((p, i) => (
                  <p key={i}>
                    Follow-up: {p.question} / {p.answer} / {p.explanation}
                  </p>
                ))}
              </details>
            ))
        )}
      </section>
      <div className="toolbar">
        <p className="muted">
          Saved only in this browser. Clearing site data removes this history.
        </p>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" className="clear-button">
              <Trash2 size={15} />
              Clear local history
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Clear your learning history?</AlertDialogTitle>
              <AlertDialogDescription>
                This removes attempts, teaching activity records, and checks
                from this browser. Export your history first if you want a copy.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Keep history</AlertDialogCancel>
              <AlertDialogAction onClick={onReset} variant="destructive">
                Clear history
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
