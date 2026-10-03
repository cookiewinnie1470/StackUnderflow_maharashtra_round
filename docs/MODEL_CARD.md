# Re:Learn model card and evaluation

Model: `relearn-lr-v1-21fc2d14d6`. Measured on 3 October 2026. This is a prototype for beginning algebra; no learner effectiveness claim is established.

## Trained artifact

A multinomial logistic-regression classifier (scikit-learn 1.7.2, C=8, seed=42) uses concatenated word and character TF-IDF vectors. Word tokens preserve algebra operators. Character n-grams span lengths 2–4; word n-grams span 1–2. Each feature block is L2-normalized. The export contains vocabularies, IDF, coefficients, intercepts, score gates and version. All inference executes locally in the browser; no paid API is used.

Inputs: problem, answer, ordered steps and typed learner reasoning. Seven classes: six specified misconceptions plus consistent reasoning. Scores are softmax outputs, not calibrated probabilities of a learner belief. The independent restricted linear-algebra parser validates mathematical equivalence and highlights the first invalid step; that step is mathematical evidence, not an explanation of model feature attribution.

## Data and provenance

700 balanced synthetic rows (100/class) are generated from agent-authored templates. They are not real learner records. No MaE source record or teacher annotation was imported into model training. MaE is used as a taxonomy reference and audited source snapshot; see `ml/data/source-audit.json` and its retained MIT notice. A source answer 5^-2 = 0.05 was excluded because the answer is 1/25 = 0.04.

Disjoint structural/reasoning families are assigned before variations: 490 training rows, 70 validation rows, 140 test rows. Shared algebraic concepts and vocabulary remain; this controls obvious variant leakage, not every form of synthetic-template bias. Splits and row provenance are saved under `ml/data/`. Independent teacher/peer review is pending.

## Held-out synthetic results

| Metric | Full reasoning model | Answer-only baseline |
|---|---:|---:|
| Accuracy (140 responses) | 97.9% | 70.7% |
| Macro-F1 (seven classes) | 0.978 | 0.652 |
| Matched same-answer accuracy (20 pairs / 40 responses) | 100.0% | 50.0% |

The matched pairs are the negative-product/leading-minus distinction. They are a useful controlled demonstration, not broad evidence of general reasoning comprehension. A problem-only or shuffled-reasoning ablation would further isolate how much problem structure contributes to the observed gain.

| Class | Precision | Recall | F1 | Support |
|---|---:|---:|---:|---:|
| Distribute to every term | 100.0% | 85.0% | 0.919 | 20 |
| Multiplying two negatives | 100.0% | 100.0% | 1.000 | 20 |
| A minus applies to the whole group | 100.0% | 100.0% | 1.000 | 20 |
| Combine only like terms | 100.0% | 100.0% | 1.000 | 20 |
| Choose the inverse operation | 100.0% | 100.0% | 1.000 | 20 |
| Keep both sides balanced | 100.0% | 100.0% | 1.000 | 20 |
| Consistent reasoning | 87.0% | 100.0% | 0.930 | 20 |

The complete confusion matrices, counts and baseline per-class scores are in `public/model/metrics.json` and in the app.

## Rejection policy

Validation selected a top score >= 0.35 and top-two margin >= 0.12 to maximize coverage among candidate gates achieving at least 90% validation precision. Validation precision was 100.0% with 98.6% coverage. On the held-out synthetic test these score gates accept 135/140 responses (96.4%) at 98.5% accuracy. This metric evaluates the score gates; app-level checks also reject missing, guessed, contradictory or unsupported mathematical evidence.

At most two probes are asked. Unresolved attempts remain insufficient evidence. The model has no unknown class and cannot name unfamiliar misconceptions.

## Development stress cases — not an independent benchmark

34 separately authored cases: 21 supported labels, seven unsupported misconceptions and six ambiguous cases. The set was used during development to identify missing correct-reasoning coverage and improve evidence handling, so it is not an untouched challenge set. Independent review remains pending. Fixed case hash: `8ed834eb9039d01bf1ddb83ff7176c5e69c40a48cdd53654f059a8e8cb41a63f`.

- Supported-case raw classifier accuracy: 76.2% (16/21).
- Full app accepts 16/21 supported cases; those 16 diagnoses are correct.
- Unsupported cases rejected: 5/7. **Two unfamiliar misconceptions are incorrectly assigned known labels.**
- Ambiguous cases rejected: 6/6.
- Across all 34 cases, 18 receive a diagnosis and 16 are correct: 88.9% accepted accuracy, 52.9% coverage.

Supported failures include unfamiliar distribution wording, combining three unlike terms, and a valid expansion classified as a negative-product error. The mathematical consistency checks send these for further evidence. A high model score can still be wrong.

## Verification and use limits

Python/JavaScript parity is tested on 35 fixtures to absolute tolerance 1e-8 (observed maximum approximately 5.1e-13). Independent SymPy verification confirms all 3,024 parameterized reassessment answer keys. Behavioral tests cover equivalent alternative methods, invalid intermediate steps, unsupported notation, missing reasoning, uncertainty probes, three-part assessment gates, assisted attempts, recurrence, delayed retention and IndexedDB persistence/error handling.

The explanation task is a selected rationale plus a mathematically checked correction, not open-ended language understanding. Assessment passage is evidence on three tasks, not permanent conceptual mastery. The app schedules a browser-local check after 24 hours; no real elapsed retention study has yet occurred.

Pending: independent seed/content/challenge review, supervised pilot with 3–5 college peers, fresh independent test cases, and classroom/age-appropriate evaluation. The pilot kit is in `public/pilot-kit.md`; participants and outcomes remain zero until actually collected. Peer usability results must be reported separately from synthetic benchmarks and school-student learning outcomes.
