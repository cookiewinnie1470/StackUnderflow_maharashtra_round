# Hackathon handoff

Published demo: https://relearn-algebra-lab.sohamborhade93.chatgpt.site

## Before submitting

- Confirm the repository visibility and submission branch match the event rules and judges can open the demo.
- Add the required team names, member roles, presentation/video and problem-statement identifier using the event’s submission format.
- Merge the Re:Learn source branch into the repository default branch after review.
- Verify a fresh checkout with npm ci, npm run typecheck, npm test and npm run build. Use a compatible Node version documented in README.md.
- Run supervised peer sessions using public/pilot-kit.md. Record real findings; mark incomplete review or sessions as pending.
- Prepare the demonstration in docs/DEMO.md and keep a local build available if venue connectivity is unreliable.
- Check the event’s rules for AI assistance, reused starter code and third-party attribution. The dataset provenance and retained licences are in the repository.

## A two-minute demonstration

1. Show the first question and open the authored same-answer demonstration.
2. Analyse learner 1: incorrect multiplication of negatives; show the signed-number activity.
3. Analyse learner 2: the same final answer, a different leading-minus explanation, and a different intervention.
4. Show the three independent assessment formats and retention-pending progress state. A single correct answer cannot complete a check.
5. Open Model Evaluation and state the synthetic benchmark and developmental stress-test results separately.

## Defensible claims

- We trained a seven-class logistic-regression model using Python/scikit-learn on 490 training examples from a 700-example synthetic dataset, with separate validation and test families.
- The full model achieves 97.9% held-out synthetic accuracy; the question-and-answer baseline achieves 70.7%.
- Supported developmental stress cases achieve 76.2% raw accuracy; two of seven unsupported misconceptions are assigned known labels incorrectly.
- All 25 behavioral/storage tests pass. The browser inference implementation agrees with 35 Python fixtures. All 3,024 generated assessment keys passed independent SymPy verification.
- Independent human review, a peer pilot, and actual delayed-retention observations remain pending until completed and documented.

Do not present synthetic accuracy as student learning improvement or claim that the fixed classifier understands every algebra misconception. The current challenge set was used in development and is not an untouched independent benchmark.

## Source and deployment

GitHub stores the reproducible source; the current website is hosted separately through Sites. Pushing to this GitHub repository does not automatically redeploy the live Site. Its existing Site project identifier in .openai/hosting.json is not a credential; deployments still require the owner's authorized Sites workflow. To make a separate Site, create a separate hosting registration rather than reusing that identifier.
