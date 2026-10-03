import type { Skill, CheckTask, CheckAnswer, Attempt } from "./types.ts";
import { answerEquivalent, finalForm } from "./math.ts";
export const SKILLS: Skill[] = [
  "distribution",
  "negative_product",
  "negative_scope",
  "unlike_terms",
  "inverse",
  "balance",
];
export const LESSONS: Record<
  Skill,
  {
    name: string;
    title: string;
    description: string;
    rule: string;
    example: string;
    explanation: string;
    activity: string;
  }
> = {
  distribution: {
    name: "Distribute to every term",
    title: "Every term gets a share.",
    description: "The outside factor multiplies the entire group.",
    rule: "a(x + b) = ax + ab",
    example: "3(x + 4) = 3x + 12",
    explanation:
      "Three groups of x + 4 contain three x parts and twelve unit parts. Multiplying only x would leave two groups of four behind.",
    activity:
      "Change the number of groups. Compare how the x parts and the units both grow.",
  },
  negative_product: {
    name: "Multiplying two negatives",
    title: "A negative reverses direction.",
    description: "A negative multiplied by a negative is positive.",
    rule: "(−a) × (−b) = ab",
    example: "−2(x − 3) = −2x + 6",
    explanation:
      "Distribute −2 to both terms. The first product is −2x. The second is (−2) × (−3), which is +6. Keep the multiplication rule separate from addition of signed numbers.",
    activity:
      "Toggle the sign of each factor and watch the product move along the number line.",
  },
  negative_scope: {
    name: "A minus affects the whole group",
    title: "The minus reaches every term.",
    description: "Negating a group changes the sign of every term.",
    rule: "−(a − b) = −a + b",
    example: "−(2x − 6) = −2x + 6",
    explanation:
      "The leading minus is multiplication by −1. It acts on 2x and on −6. Reversing just the first term changes the expression’s value.",
    activity:
      "Flip the whole group. Notice that both term signs change together.",
  },
  unlike_terms: {
    name: "Combine only like terms",
    title: "Match the variable part.",
    description:
      "A count of x and a plain number represent different quantities.",
    rule: "ax + bx = (a + b)x",
    example: "3x + 2x + 4 = 5x + 4",
    explanation:
      "Three x pieces and two x pieces make five x pieces. Four unit pieces remain four units. The value of x is unknown, so four units are not necessarily four more x pieces.",
    activity: "Combine the x groups. The unit pieces must remain separate.",
  },
  inverse: {
    name: "Choose the inverse operation",
    title: "Undo with the opposite operation.",
    description: "Subtraction undoes addition. Division undoes multiplication.",
    rule: "ax + b = c  ⇒  ax = c − b",
    example: "2x + 5 = 13  ⇒  2x = 8  ⇒  x = 4",
    explanation:
      "To remove +5, subtract 5 from both sides. Adding another 5 does not undo +5. Then divide both sides by 2.",
    activity:
      "Try adding or subtracting from both sides. Which operation removes the extra units?",
  },
  balance: {
    name: "Keep both sides balanced",
    title: "Equality is a balance.",
    description: "Make the same reversible change to each side of an equation.",
    rule: "A = B  ⇒  A − c = B − c",
    example: "3x + 4 = 19  ⇒  3x = 15  ⇒  x = 5",
    explanation:
      "The equals sign says both sides have the same value. Removing four from only the left side breaks that relationship. Remove four from both, then divide both by three.",
    activity:
      "Remove units from one side, then the other. See when the balance is restored.",
  },
};
export const PROBLEMS = [
  {
    id: "signs",
    skill: "negative_product" as Skill,
    title: "Simplify the expression.",
    expression: "-2*(x-3)",
    display: "−2(x − 3)",
    topic: "Expressions",
  },
  {
    id: "distribute",
    skill: "distribution" as Skill,
    title: "Expand and simplify.",
    expression: "3*(x+4)",
    display: "3(x + 4)",
    topic: "Expressions",
  },
  {
    id: "whole-minus",
    skill: "negative_scope" as Skill,
    title: "Remove the brackets.",
    expression: "-(2*x-6)",
    display: "−(2x − 6)",
    topic: "Expressions",
  },
  {
    id: "like-terms",
    skill: "unlike_terms" as Skill,
    title: "Simplify if possible.",
    expression: "4*x+3",
    display: "4x + 3",
    topic: "Expressions",
  },
  {
    id: "undo",
    skill: "inverse" as Skill,
    title: "Solve for x.",
    expression: "2*x+5=13",
    display: "2x + 5 = 13",
    topic: "Equations",
  },
  {
    id: "equality",
    skill: "balance" as Skill,
    title: "Solve for x.",
    expression: "3*x+4=19",
    display: "3x + 4 = 19",
    topic: "Equations",
  },
];
export function questionFor(p: (typeof PROBLEMS)[number]) {
  return `${p.expression.includes("=") ? "Solve" : "Simplify"} ${p.expression}`;
}
export const DEMOS: Record<
  "product" | "scope",
  Pick<Attempt, "answer" | "steps" | "explanation">
> = {
  product: {
    answer: "-2*x-6",
    steps: ["(-2)*x+(-2)*(-3)", "-2*x-6"],
    explanation:
      "I multiplied both terms by negative two. I think the product of two negative numbers is negative, so the number part is minus six.",
  },
  scope: {
    answer: "-2*x-6",
    steps: ["-(2*x-6)", "-2*x-6"],
    explanation:
      "I expanded using positive two first. Then I applied the leading minus only to the x term and kept the second sign unchanged.",
  },
};
function rotate<T>(items: T[], n: number) {
  const k = n % items.length;
  return [...items.slice(k), ...items.slice(0, k)];
}
export function makeChecks(skill: Skill, seed: number): CheckTask[] {
  const a = 2 + (seed % 4),
    b = 3 + (Math.floor(seed / 4) % 7),
    c = 4 + (Math.floor(seed / 28) % 6);
  const common = (choices: { id: string; text: string }[]) =>
    rotate(choices, seed % choices.length);
  const help =
    "Use x for the variable, * for multiplication, and one expression per answer.";
  if (skill === "distribution")
    return [
      {
        kind: "transfer",
        prompt: "Expand this new expression.",
        expression: `${a}*(x+${b})`,
        expected: `${a}*x+${a * b}`,
        help,
      },
      {
        kind: "explain",
        prompt: `Someone writes ${a + 1}(x + ${b + 1}) = ${a + 1}x + ${b + 1}. Choose the explanation and enter the corrected expression.`,
        expression: `${a + 1}*(x+${b + 1})`,
        expected: `${a + 1}*x+${(a + 1) * (b + 1)}`,
        choices: common([
          { id: "all", text: "The outside factor must multiply both terms." },
          { id: "x", text: "Only the variable receives the outside factor." },
          {
            id: "add",
            text: "The outside factor should be added to the constant.",
          },
        ]),
        correctChoice: "all",
        help,
      },
      {
        kind: "visual",
        prompt: "Write one simplified expression for all of these groups.",
        expression: `${a + 2}*(x+${c})`,
        expected: `${a + 2}*x+${(a + 2) * c}`,
        visual: { type: "groups", a: a + 2, b: c },
        help,
      },
    ];
  if (skill === "negative_product")
    return [
      {
        kind: "transfer",
        prompt: "Expand and simplify. Keep track of both products.",
        expression: `-${a}*(x-${b})`,
        expected: `-${a}*x+${a * b}`,
        help,
      },
      {
        kind: "explain",
        prompt: `Someone writes (−${a + 1}) × (−${b + 1}) = −${(a + 1) * (b + 1)}. Choose why it is incorrect, then enter the correct product.`,
        expression: `(-${a + 1})*(-${b + 1})`,
        expected: `${(a + 1) * (b + 1)}`,
        choices: common([
          {
            id: "positive",
            text: "The product of two negative numbers is positive.",
          },
          { id: "sum", text: "Two negative numbers always add to a positive." },
          { id: "one", text: "The product takes the sign of either factor." },
        ]),
        correctChoice: "positive",
        help,
      },
      {
        kind: "visual",
        prompt:
          "Each arrow represents a negative change. Reverse the total direction to represent a negative number of these changes. Enter the product.",
        expression: `(-${a + 2})*(-${c})`,
        expected: `${(a + 2) * c}`,
        visual: { type: "numberline", a: a + 2, b: c },
        help,
      },
    ];
  if (skill === "negative_scope")
    return [
      {
        kind: "transfer",
        prompt: "Remove the brackets.",
        expression: `-(${a}*x-${b})`,
        expected: `-${a}*x+${b}`,
        help,
      },
      {
        kind: "explain",
        prompt: `Someone writes −(${a + 1}x − ${b + 1}) = −${a + 1}x − ${b + 1}. Choose what went wrong and enter the corrected expression.`,
        expression: `-(${a + 1}*x-${b + 1})`,
        expected: `-${a + 1}*x+${b + 1}`,
        choices: common([
          {
            id: "every",
            text: "The leading minus must change every term’s sign.",
          },
          {
            id: "first",
            text: "The leading minus changes only the first sign.",
          },
          { id: "drop", text: "A minus before a bracket can be dropped." },
        ]),
        correctChoice: "every",
        help,
      },
      {
        kind: "visual",
        prompt: "Write the opposite of this entire group.",
        expression: `-(${a + 2}*x-${c})`,
        expected: `-${a + 2}*x+${c}`,
        visual: { type: "negate", a: a + 2, b: c },
        help,
      },
    ];
  if (skill === "unlike_terms")
    return [
      {
        kind: "transfer",
        prompt: "Collect like terms. Keep other terms separate.",
        expression: `${a}*x+${b}+${c}*x`,
        expected: `${a + c}*x+${b}`,
        help,
      },
      {
        kind: "explain",
        prompt: `Someone writes ${a + 1}x + ${b + 1} = ${a + b + 2}x. Choose the explanation and enter a valid expression.`,
        expression: `${a + 1}*x+${b + 1}`,
        expected: `${a + 1}*x+${b + 1}`,
        choices: common([
          {
            id: "unlike",
            text: "The constant has no x, so these are unlike terms.",
          },
          {
            id: "always",
            text: "Any two terms can be combined by adding their numbers.",
          },
          { id: "zero", text: "x must be zero when adding a constant." },
        ]),
        correctChoice: "unlike",
        help,
      },
      {
        kind: "visual",
        prompt:
          "Count the x pieces and unit pieces. Write their total without merging different kinds.",
        expression: `${a + 2}*x+${c}`,
        expected: `${a + 2}*x+${c}`,
        visual: { type: "groups", a: 1, b: c, c: a + 2 },
        help,
      },
    ];
  const total = a * c + b;
  if (skill === "inverse")
    return [
      {
        kind: "transfer",
        prompt: "Solve this new equation for x.",
        expression: `${a}*x+${b}=${total}`,
        expected: `x=${c}`,
        equation: true,
        help,
      },
      {
        kind: "explain",
        prompt: `To solve x + ${b + 1} = ${b + c + 3}, someone adds ${b + 1} to the total. Choose the inverse operation and enter x.`,
        expression: `x+${b + 1}=${b + c + 3}`,
        expected: `x=${c + 2}`,
        equation: true,
        choices: common([
          { id: "subtract", text: `Subtract ${b + 1} from both sides.` },
          { id: "add", text: `Add ${b + 1} again to the total.` },
          { id: "left", text: "Erase the constant from the left only." },
        ]),
        correctChoice: "subtract",
        help,
      },
      {
        kind: "visual",
        prompt: "The scale is balanced. Find the value of each x piece.",
        expression: `${a + 1}*x+${b + 2}=${(a + 1) * (c + 1) + b + 2}`,
        expected: `x=${c + 1}`,
        equation: true,
        visual: {
          type: "balance",
          a: a + 1,
          b: b + 2,
          c: (a + 1) * (c + 1) + b + 2,
        },
        help,
      },
    ];
  return [
    {
      kind: "transfer",
      prompt: "Solve for x while preserving equality.",
      expression: `${a}*x+${b}=${total}`,
      expected: `x=${c}`,
      equation: true,
      help,
    },
    {
      kind: "explain",
      prompt: `Someone removes ${b + 1} from the left of x + ${b + 1} = ${b + c + 2}, but leaves the right unchanged. Choose the correction and enter x.`,
      expression: `x+${b + 1}=${b + c + 2}`,
      expected: `x=${c + 1}`,
      equation: true,
      choices: common([
        { id: "both", text: "Subtract the same amount from both sides." },
        { id: "one", text: "Only the variable side needs to change." },
        {
          id: "switch",
          text: "Swap the left and right sides without calculating.",
        },
      ]),
      correctChoice: "both",
      help,
    },
    {
      kind: "visual",
      prompt: "These quantities are equal. Find the value of one x piece.",
      expression: `${a + 2}*x+${b + 2}=${(a + 2) * (c + 2) + b + 2}`,
      expected: `x=${c + 2}`,
      equation: true,
      visual: {
        type: "balance",
        a: a + 2,
        b: b + 2,
        c: (a + 2) * (c + 2) + b + 2,
      },
      help,
    },
  ];
}
export function gradeChecks(
  tasks: CheckTask[],
  answers: CheckAnswer[],
  assisted = false,
) {
  const results = tasks.map(
    (t, i) =>
      !!answers[i] &&
      answerEquivalent(answers[i].value, t.expected, t.equation) &&
      finalForm(answers[i].value, t.expected, t.equation) &&
      (!t.correctChoice || answers[i].choice === t.correctChoice),
  );
  return {
    results,
    passed:
      tasks.length === 3 &&
      answers.length === 3 &&
      results.every(Boolean) &&
      !assisted,
  };
}
