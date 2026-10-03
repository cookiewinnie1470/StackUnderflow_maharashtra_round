export type Label =
  | "distribution"
  | "negative_product"
  | "negative_scope"
  | "unlike_terms"
  | "inverse"
  | "balance"
  | "correct";
export type Skill = Exclude<Label, "correct">;
export type Probe = { question: string; answer: string; explanation: string };
export type Attempt = {
  id: string;
  createdAt: number;
  question: string;
  expression: string;
  answer: string;
  steps: string[];
  explanation: string;
  problemId: string;
  probes: Probe[];
  demo?: boolean;
};
export type Candidate = { label: Label; score: number };
export type Diagnosis = {
  status: "likely" | "consistent" | "insufficient" | "invalid_input";
  candidates: Candidate[];
  evidenceStep: number | null;
  answerCorrect: boolean;
  message: string;
  modelVersion: string;
  probe?: string;
  error?: string;
};
export type CheckAnswer = { value: string; choice: string };
export type CheckRecord = {
  id: string;
  skill: Skill;
  createdAt: number;
  passed: boolean;
  results: boolean[];
  assisted: boolean;
  retention: boolean;
  seed: number;
  answers: CheckAnswer[];
  demo: boolean;
};
export type History = {
  schemaVersion: 1;
  attempts: (Attempt & { diagnosis: Diagnosis })[];
  lessons: { skill: Skill; createdAt: number; demo: boolean }[];
  checks: CheckRecord[];
};
export type SkillState = {
  skill: Skill;
  status:
    | "not_started"
    | "suspected"
    | "practising"
    | "demonstrated"
    | "retained"
    | "recurring";
  dueAt: number | null;
  lastPassedAt: number | null;
  attempts: number;
  passes: number;
};
export type CheckTask = {
  kind: "transfer" | "explain" | "visual";
  prompt: string;
  expression: string;
  expected: string;
  equation?: boolean;
  choices?: { id: string; text: string }[];
  correctChoice?: string;
  visual?: {
    type: "groups" | "numberline" | "balance" | "negate";
    a: number;
    b: number;
    c?: number;
  };
  help: string;
};
