# Re:Learn verification record

Verified 3 October 2026 with Node 26.10.0, TypeScript 5.9.3, Python 3.14.7 and scikit-learn 1.7.2.

## Automated verification

- TypeScript typecheck: passed.
- Production static export: built successfully; served from out/ without a backend and verified in the browser. Missing reasoning produced a follow-up question in the exported build.
- Behavioral tests: 25 passed, 0 failed (24 core tests, 1 IndexedDB test).
- Python/browser inference implementation parity: 35 fixtures, maximum absolute score error 5.0915e-13.
- Independent SymPy assessment oracle: all 3,024 generated answer keys pass, covering all 168 parameter combinations for all six skills and three task formats.
- Correct alternative linear expressions/equations, rational coefficients, invalid intermediate steps, unsupported notation and malicious strings are checked.
- Missing reasoning, contradictions, guessed evidence and the two-probe limit are covered.
- One correct answer, incomplete checks, assisted checks and demonstration sessions cannot establish personal understanding.
- Passing checks schedule retention after at least 24 hours; early retention is rejected. Repeated suspected mistakes and failed later checks reopen the skill.
- IndexedDB round-trip/reopening and unavailable-storage error handling pass using fake-indexeddb. This is fault injection at the storage layer, not a real-device disk-full simulation.

## Browser interactions verified

- Authored same-answer examples produce different diagnoses and interventions: negative multiplication versus leading-minus scope; the first invalid submitted step is shown.
- Sign-factor toggles update the number line correctly; negating the whole group reverses both signs.
- Distribution slider changes groups and both coefficient/constant totals; ArrowRight works.
- Completed a three-part example check and verified it contributes no personal mastery.
- Completed a personal distribution check: 5(x+3), explanation/repair of 6(x+4), and seven visual groups of x+8. One response advances only to part 2; grading waits until all three. The result shows understanding demonstrated and retention pending tomorrow, with zero retention checks yet due.
- Saved example history survives opening a fresh tab on the same origin.
- Keyboard navigation works for vertical desktop tabs and horizontal mobile tabs; intervention buttons and assessment submission work with Enter. Each subsequent assessment heading receives focus.
- Mobile evaluation and lesson views inspected at 390 x 844. Tables scroll within their own region. Mobile tab labels use a compact treatment.
- The browser-local progress WebMCP read tool returns the six skill states; unexpected parameters are rejected. It cannot submit attempts or change progress.

## Limits of this verification

These interactions were performed by the implementation agent, not pilot participants. There is no formal accessibility audit, real-screen-reader study, cross-browser/device certification or observed 24-hour learning study. The challenge set was used during development; its failures and uncertain cases are reported in the model card. Independent content review and the 3–5 peer pilot remain pending.
