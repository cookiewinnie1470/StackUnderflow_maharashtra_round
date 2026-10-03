"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import type { Skill, CheckTask } from "@/lib/relearn/types";
export function Pieces({
  xs,
  units,
  negative = false,
}: {
  xs: number;
  units: number;
  negative?: boolean;
}) {
  return (
    <div
      className="pieces"
      aria-label={`${xs} x pieces and ${negative ? "negative " : ""}${units} units`}
    >
      {Array.from({ length: xs }, (_, i) => (
        <span className="x-piece" key={"x" + i}>
          x
        </span>
      ))}
      {Array.from({ length: units }, (_, i) => (
        <span
          className={"unit-piece " + (negative ? "negative" : "")}
          key={"u" + i}
        >
          {negative ? "−1" : "1"}
        </span>
      ))}
    </div>
  );
}
export function NumberLine({ value }: { value: number }) {
  return (
    <svg
      viewBox="0 0 420 95"
      role="img"
      aria-label={`Number line showing a product of ${value}`}
      className="numberline"
    >
      <line x1="25" x2="395" y1="54" y2="54" stroke="#9eafc9" strokeWidth="2" />
      {[-12, -6, 0, 6, 12].map((v) => (
        <g key={v}>
          <line
            x1={210 + v * 14}
            x2={210 + v * 14}
            y1="49"
            y2="59"
            stroke="#9eafc9"
          />
          <text
            x={210 + v * 14}
            y="80"
            textAnchor="middle"
            fontSize="13"
            fill="#61708a"
          >
            {v}
          </text>
        </g>
      ))}
      <path
        d={`M210 47 Q ${210 + value * 7} 0 ${210 + value * 14} 47`}
        fill="none"
        stroke="#3459dd"
        strokeWidth="3"
      />
      <circle cx={210 + value * 14} cy="47" r="5" fill="#3459dd" />
      <text
        x={210 + value * 7}
        y="15"
        textAnchor="middle"
        fill="#3459dd"
        fontSize="15"
        fontWeight="600"
      >
        {value > 0 ? "+" : ""}
        {value}
      </text>
    </svg>
  );
}
export function Scale({ left, right }: { left: number; right: number }) {
  const tilt = Math.max(-10, Math.min(10, (left - right) * 2));
  return (
    <svg
      viewBox="0 0 420 115"
      className="scale"
      role="img"
      aria-label={
        left === right ? "The scale is balanced" : "The scale is unbalanced"
      }
    >
      <line
        x1="210"
        y1="39"
        x2="210"
        y2="100"
        stroke="#99acc9"
        strokeWidth="4"
      />
      <line
        x1="168"
        y1="100"
        x2="252"
        y2="100"
        stroke="#99acc9"
        strokeWidth="4"
      />
      <g transform={`rotate(${tilt} 210 39)`}>
        <line
          x1="70"
          y1="39"
          x2="350"
          y2="39"
          stroke="#3459dd"
          strokeWidth="4"
        />
        <path
          d="M70 39 L35 83 L105 83 Z M350 39 L315 83 L385 83 Z"
          fill="#e5ecff"
          stroke="#3459dd"
          strokeWidth="2"
        />
      </g>
      <circle cx="210" cy="39" r="7" fill="#3459dd" />
    </svg>
  );
}
export function LearningVisual({ skill }: { skill: Skill }) {
  const [groups, setGroups] = useState(3),
    [firstNegative, setFirstNegative] = useState(true),
    [secondNegative, setSecondNegative] = useState(true),
    [flip, setFlip] = useState(false),
    [merge, setMerge] = useState(false),
    [left, setLeft] = useState(0),
    [right, setRight] = useState(0);
  if (skill === "distribution")
    return (
      <div className="activity">
        <div className="activity-top">
          <span>Number of groups</span>
          <b>{groups}</b>
        </div>
        <Slider
          aria-label="Number of groups"
          min={1}
          max={5}
          step={1}
          value={[groups]}
          onValueChange={(v) => setGroups(v[0])}
        />
        <div className="group-grid">
          {Array.from({ length: groups }, (_, i) => (
            <div className="tile-group" key={i}>
              <Pieces xs={1} units={4} />
            </div>
          ))}
        </div>
        <p className="visual-equation">
          <span className="blue">{groups}x</span> +{" "}
          <span className="orange">{groups * 4}</span>
        </p>
        <p className="visual-caption">
          {groups} groups, each containing x + 4. Both parts are multiplied.
        </p>
      </div>
    );
  if (skill === "negative_product") {
    const value = (firstNegative ? -2 : 2) * (secondNegative ? -3 : 3);
    return (
      <div className="activity">
        <div className="factor-controls">
          <Button
            variant="outline"
            onClick={() => setFirstNegative(!firstNegative)}
            aria-label="Toggle first factor sign"
          >
            {firstNegative ? "−" : "+"}2
          </Button>
          <span>×</span>
          <Button
            variant="outline"
            onClick={() => setSecondNegative(!secondNegative)}
            aria-label="Toggle second factor sign"
          >
            {secondNegative ? "−" : "+"}3
          </Button>
          <span>=</span>
          <b className="blue">{value}</b>
        </div>
        <NumberLine value={value} />
        <p className="visual-caption">
          Select a factor to reverse its sign. Reversing both signs leaves the
          product unchanged.
        </p>
      </div>
    );
  }
  if (skill === "negative_scope")
    return (
      <div className="activity">
        <div className="term-flip">
          <span className="eyebrow">
            {flip ? "AFTER NEGATING EVERY TERM" : "BEFORE NEGATING THE GROUP"}
          </span>
          <p className="visual-equation">
            <span className="blue">{flip ? "−2x" : "2x"}</span>
            <span className="orange">{flip ? " + 6" : " − 6"}</span>
          </p>
        </div>
        <Button variant="outline" onClick={() => setFlip(!flip)}>
          {flip ? "Restore the original group" : "Negate the whole group"}
        </Button>
        <p className="visual-caption">
          Multiplying the group by −1 reverses both signs.
        </p>
      </div>
    );
  if (skill === "unlike_terms")
    return (
      <div className="activity">
        {merge ? (
          <div className="tile-group">
            <Pieces xs={5} units={4} />
          </div>
        ) : (
          <div className="group-grid">
            <div className="tile-group">
              <Pieces xs={3} units={0} />
            </div>
            <div className="tile-group">
              <Pieces xs={2} units={0} />
            </div>
            <div className="tile-group">
              <Pieces xs={0} units={4} />
            </div>
          </div>
        )}
        <p className="visual-equation">
          <span className="blue">{merge ? "5x" : "3x + 2x"}</span> +{" "}
          <span className="orange">4</span>
        </p>
        <Button variant="outline" onClick={() => setMerge(!merge)}>
          {merge ? "Separate the x groups" : "Collect like terms"}
        </Button>
        <p className="visual-caption">
          The four unit pieces stay separate from the x pieces.
        </p>
      </div>
    );
  const a = skill === "inverse" ? 2 : 3,
    b = skill === "inverse" ? 5 : 4,
    x = skill === "inverse" ? 4 : 5,
    total = a * x + b,
    L = total + left,
    R = total + right;
  return (
    <div className="activity">
      <div className="balance-labels">
        <span>
          {a}x {b + left >= 0 ? "+" : "−"} {Math.abs(b + left)}
        </span>
        <span>{total + right}</span>
      </div>
      <Scale left={L} right={R} />
      <p className={"balance-status " + (L === R ? "good" : "warn")}>
        {L === R
          ? b + left === 0
            ? "Balanced, and the added constant is removed."
            : "Balanced. The added constant still needs removing."
          : "The sides are no longer equal."}
      </p>
      <div className="button-wrap">
        {skill === "inverse" ? (
          <>
            <Button
              variant="outline"
              onClick={() => {
                setLeft(left + b);
                setRight(right + b);
              }}
            >
              Add {b} to both
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setLeft(left - b);
                setRight(right - b);
              }}
            >
              Subtract {b} from both
            </Button>
          </>
        ) : (
          <>
            <Button variant="outline" onClick={() => setLeft(left - b)}>
              Subtract {b} left
            </Button>
            <Button variant="outline" onClick={() => setRight(right - b)}>
              Subtract {b} right
            </Button>
          </>
        )}
        <Button
          variant="ghost"
          onClick={() => {
            setLeft(0);
            setRight(0);
          }}
        >
          Reset
        </Button>
      </div>
      <p className="visual-caption">
        Illustration uses x = {x}. Watch the equality and the constant as you
        change each side.
      </p>
    </div>
  );
}
export function CheckVisual({ task }: { task: CheckTask }) {
  const v = task.visual;
  if (!v) return null;
  if (v.type === "groups")
    return (
      <div className="check-visual">
        {Array.from({ length: v.a }, (_, i) => (
          <div className="tile-group" key={i}>
            <Pieces xs={v.c || 1} units={v.b} />
          </div>
        ))}
      </div>
    );
  if (v.type === "negate")
    return (
      <div className="check-visual">
        <span className="negate-mark">−</span>
        <div className="tile-group">
          <Pieces xs={v.a} units={v.b} negative />
        </div>
      </div>
    );
  if (v.type === "balance")
    return (
      <div className="check-visual balance-check">
        <div className="balance-labels">
          <span>
            {v.a} x pieces + {v.b} units
          </span>
          <span>{v.c} units</span>
        </div>
        <Scale left={1} right={1} />
      </div>
    );
  return (
    <div className="check-visual number-check">
      <p>
        {v.a} leftward changes, each of size {v.b}
      </p>
      <div className="signed-arrows" aria-hidden="true">
        {Array.from({ length: v.a }, (_, i) => (
          <span key={i}>
            ← <b>−{v.b}</b>
          </span>
        ))}
      </div>
      <p>Reverse the total direction.</p>
    </div>
  );
}
