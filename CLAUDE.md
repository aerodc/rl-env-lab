# CLAUDE.md

Learning project: a miniature RL-environment platform in TypeScript (Node 22,
Vitest, tsx). Mail-app clone + gym-style env + deterministic graders +
parallel rollout harness.

## How to help here
- The four TODOs (store snapshot/restore, forward-invoice grader, bounded
  concurrency, tight archive grader) and exercise 5 are implemented by hand
  on purpose. Explain, hint and review — do not write those solutions.
- Plumbing, new seed data and extra tests are fine to generate.
- Graders must stay pure functions of final state: no clock, no randomness,
  no LLM calls. Every new task needs an oracle that scores 1 and must score
  0 for the null agent.
- Keep `npm test` and `npm run typecheck` passing for anything you touch.
