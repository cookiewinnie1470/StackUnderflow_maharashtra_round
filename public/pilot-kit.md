# Re:Learn peer-pilot kit

Status: NOT RUN. No participants, independent reviews, or learning gains are claimed.

## Purpose
Run 3–5 supervised sessions with college peers to find confusing interactions and incorrect diagnoses. College peers are not a representative sample of school algebra learners. Role-playing a misconception is a diagnostic test, not evidence of a participant learning it.

## Before the sessions
- Ask each volunteer if they want to take part. Use participant codes P01–P05; names are unnecessary.
- Have a mathematically competent peer review the six lesson rules and examples. Mark each as approved, corrected, or ambiguous. Review is still pending until someone actually does it.
- Use a fresh browser profile for each participant, or export and clear the previous test history with their agreement.
- Explain that data stays in that browser. Exporting creates a file; it does not send anything automatically. Do not collect personal or school records.
- Freeze the deployed model version and copy the raw results JSON. Keep new pilot responses out of training until the evaluation is complete.

## A 15–20 minute session
1. Ask the participant to complete a personal attempt, without showing the expected answer.
2. Record whether the diagnosis matches their stated reasoning. Ask what the evidence supports, and whether another explanation is plausible.
3. Have them explore the suggested visual activity. Ask what changed on screen and why.
4. Ask them to complete the three independent checks with the lesson closed. Do not coach answers. Record any assistance separately.
5. Reload and check progress persistence. If feasible, return after at least 24 hours for the retention check. Do not change the device clock to simulate retention.
6. In Model Evaluation, run both same-answer examples. Verify that example sessions do not change personal mastery.
7. Ask: What was unclear? Did the system seem more certain than the evidence justified? Could you tell why an answer needed more work?

## Record for each session
| Field | Record |
|---|---|
| Participant code | |
| Date, duration, browser/device | |
| Model version | |
| Real answer / role-played misconception | |
| Problem and learner's exact working | |
| Learner's explanation | |
| Model diagnosis / insufficient evidence | |
| Independent reviewer label or ambiguity | |
| Did the targeted lesson fit? Why? | |
| Checks passed (0–3), assistance given | |
| Return after 24 hours: pending / completed | |
| Bugs or usability barriers | |
| Export filename, if voluntarily provided | |

## Review the challenge set
Use ml/data/challenge.json from the source package. A reviewer should label each case without seeing the model prediction, permit multiple plausible causes, and explain disagreements. The current 34 cases were authored and used during development by the implementation agent; they are NOT independently reviewed or an untouched benchmark. Add fresh peer-written cases for a new frozen test set.

## Report honestly
Separate (1) synthetic held-out metrics, (2) developmental challenge results, (3) independent diagnosis review, (4) usability observations, and (5) any genuine learner reassessment observations. Include sample counts, uncertain cases, failures, and assisted checks. A small convenience pilot cannot establish efficacy, causal learning gains, or durable resolution of a misconception.
