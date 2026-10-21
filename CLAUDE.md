# CLAUDE.md

Learning project: a miniature RL-environment platform in TypeScript (Node 22,
Vitest, tsx). Mail-app clone + gym-style env + deterministic graders +
parallel rollout harness.

## How to help here
- TODOs 1–4 are implemented. Exercise 5 (why the random agent solves
  reply_meeting 75% of the time) is still open: explain, hint and review.
- Plumbing, new seed data and extra tests are fine to generate.
- Graders must stay pure functions of final state: no clock, no randomness,
  no LLM calls. Every new task needs an oracle that scores 1 and must score
  0 for the null agent.
- Keep `npm test` and `npm run typecheck` passing for anything you touch.
