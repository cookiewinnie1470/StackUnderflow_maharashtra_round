/** Restricted linear algebra parser. Never executes input or uses eval. */
export type Linear = { a: number; b: number };
export type Parsed =
  | { kind: "expression"; value: Linear }
  | { kind: "equation"; value: Linear };
export function normalizeMath(s: string) {
  return s
    .replace(/−|–/g, "-")
    .replace(/×|·/g, "*")
    .replace(/÷/g, "/")
    .replace(/X/g, "x")
    .trim();
}
const add = (u: Linear, v: Linear, sign = 1): Linear => ({
  a: u.a + sign * v.a,
  b: u.b + sign * v.b,
});
const mul = (u: Linear, v: Linear): Linear => {
  if (Math.abs(u.a * v.a) > 1e-12)
    throw Error(
      "Use linear expressions only; powers of x are outside this exercise.",
    );
  return { a: u.a * v.b + v.a * u.b, b: u.b * v.b };
};
export function parseLinear(source: string): Parsed {
  const s = normalizeMath(source);
  if (!s || s.length > 250)
    throw Error("Enter an expression of 1–250 characters.");
  if (/\d\s+\d/.test(s))
    throw Error("Put an operator between separate numbers.");
  const tokens = s.match(/(?:\d+(?:\.\d+)?|\.\d+)|x|[+\-*/()=]/g) || [];
  if (tokens.join("") !== s.replace(/\s/g, ""))
    throw Error("Use x, numbers, +, −, *, /, parentheses, and =.");
  if (tokens.length > 120) throw Error("Please use a shorter expression.");
  let i = 0,
    depth = 0;
  const peek = () => tokens[i];
  function atom(): Linear {
    if (++depth > 24) throw Error("Too many nested parentheses.");
    let out: Linear;
    const t = tokens[i++];
    if (t === "+" || t === "-") {
      out = atom();
      if (t === "-") out = { a: -out.a, b: -out.b };
    } else if (t === "(") {
      out = sum();
      if (tokens[i++] !== ")") throw Error("Check your parentheses.");
    } else if (t === "x") out = { a: 1, b: 0 };
    else if (t && /^(?:\d+(?:\.\d+)?|\.\d+)$/.test(t))
      out = { a: 0, b: Number(t) };
    else throw Error("An expression is missing a number or x.");
    depth--;
    return out;
  }
  function term(): Linear {
    let out = atom();
    while (
      peek() === "*" ||
      peek() === "/" ||
      peek() === "x" ||
      peek() === "("
    ) {
      const op = peek();
      if (op === "*" || op === "/") i++;
      const rhs = atom();
      if (op === "/") {
        if (Math.abs(rhs.a) > 1e-12)
          throw Error(
            "Division by an expression containing x is not supported.",
          );
        if (Math.abs(rhs.b) < 1e-12)
          throw Error("Division by zero is undefined.");
        out = { a: out.a / rhs.b, b: out.b / rhs.b };
      } else out = mul(out, rhs);
    }
    return out;
  }
  function sum(): Linear {
    let out = term();
    while (peek() === "+" || peek() === "-") {
      const op = tokens[i++];
      out = add(out, term(), op === "+" ? 1 : -1);
    }
    return out;
  }
  const lhs = sum();
  let result: Parsed = { kind: "expression", value: lhs };
  if (peek() === "=") {
    i++;
    result = { kind: "equation", value: add(lhs, sum(), -1) };
  }
  if (i !== tokens.length)
    throw Error(
      "Check operators and equals signs. Write one expression or equation per line.",
    );
  if (
    !Number.isFinite(result.value.a) ||
    !Number.isFinite(result.value.b) ||
    Math.max(Math.abs(result.value.a), Math.abs(result.value.b)) > 1e10
  )
    throw Error("Please use smaller numbers.");
  return result;
}
const near = (a: number, b: number) =>
  Math.abs(a - b) <= 1e-8 * Math.max(1, Math.abs(a), Math.abs(b));
export function equivalent(left: string, right: string): boolean {
  const l = parseLinear(left),
    r = parseLinear(right);
  if (l.kind !== r.kind) return false;
  if (l.kind === "expression")
    return near(l.value.a, r.value.a) && near(l.value.b, r.value.b);
  const lzero = near(l.value.a, 0),
    rzero = near(r.value.a, 0);
  if (lzero || rzero)
    return lzero && rzero && near(l.value.b, 0) === near(r.value.b, 0);
  return near(-l.value.b / l.value.a, -r.value.b / r.value.a);
}
export function answerEquivalent(
  value: string,
  expected: string,
  equation = false,
) {
  try {
    return equivalent(
      equation && !value.includes("=") ? "x=" + value : value,
      expected,
    );
  } catch {
    return false;
  }
}
export function inspectWorking(
  expression: string,
  answer: string,
  steps: string[],
) {
  const equation = expression.includes("=");
  let evidenceStep: number | null = null;
  parseLinear(expression);
  for (let i = 0; i < steps.length; i++) {
    try {
      parseLinear(steps[i]);
    } catch (e) {
      throw Error(`Step ${i + 1}: ${(e as Error).message}`);
    }
    if (evidenceStep === null && !equivalent(expression, steps[i]))
      evidenceStep = i;
  }
  const a = equation && !answer.includes("=") ? "x=" + answer : answer;
  parseLinear(a);
  return { answerCorrect: equivalent(expression, a), evidenceStep };
}

export function finalForm(
  value: string,
  expected: string,
  equation = false,
): boolean {
  const s = normalizeMath(value).replace(/\s/g, "");
  const number =
    /^[+-]?(?:\d+(?:\.\d+)?|\.\d+)(?:\/[+-]?(?:\d+(?:\.\d+)?|\.\d+))?$/;
  if (equation)
    return s.startsWith("x=") ? number.test(s.slice(2)) : number.test(s);
  if (!expected.includes("x")) return number.test(s);
  return !/[()]/.test(s) && (s.match(/x/g) || []).length <= 1;
}
