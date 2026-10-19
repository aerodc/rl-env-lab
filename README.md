# rl-env-lab

A miniature RL environment platform, built to understand the engineering
behind RL from verifiable rewards (RLVR): realistic app clones, tasks with
deterministic graders, and a harness that runs agents through them in
parallel and reports solve rates.

It is deliberately small — one mail-app clone, five tasks — but every piece
maps to a real platform concern at an RL-environment company.

```
task (seed state + instruction + grader + oracle)
        │
        ▼
MailEnv.reset(task) ──► fresh MailStore (copied seed, FixedClock)
        │
agent.act(obs) ──► MailEnv.step(action) ──► observation   (loop until done)
        │
MailEnv.grade() ──► task.grade(final state snapshot) ──► reward 0/1 + reason
        │
Trajectory ──► runSuite (parallel, bounded) ──► solve rate per task
```

## Concepts, mapped to code

| Concept | Where | Why it matters |
|---|---|---|
| Gym-style API | `src/env/mailEnv.ts` | `reset / step / grade` is the contract labs train against |
| Typed action space | `src/env/types.ts` | the agent can only do what the platform exposes |
| Determinism | `src/app/clock.ts`, counter ids | same actions ⇒ identical state; non-determinism poisons training data |
| Snapshot / restore | `src/app/store.ts` | checkpointing, branching rollouts, frozen state for graders |
| Isolation | one `MailEnv` per episode | in-process analogue of one container / microVM per rollout |
| Verifiable reward | `Task.grade` | a pure function of final **state**, not UI text, not an LLM judge |
| Grader validation | `Task.oracle` + `NullAgent` | oracle must score 1, doing nothing must score 0 |
| Reward hacking | `src/tasks/rewardHacking.ts` | a grader that measures the wrong thing gets gamed |
| Parallel rollouts | `src/harness/` | bounded concurrency, trajectories, solve-rate reports |
| Difficulty calibration | `summarize()` | tasks solved 0% or 100% by every model teach nothing |

## Exercises

Run `npm test` — each TODO is pinned by tests.

1. **Snapshot / restore** — `src/app/store.ts`. Full independence in both directions.
2. **Forward-invoice grader** — `src/tasks/catalog.ts`. Decide what "forwarded" means as state.
3. **Bounded concurrency** — `src/harness/concurrency.ts`. At most N in flight, results in order.
4. **Un-hackable grader** — `src/tasks/rewardHacking.ts`. Beat the "archive everything" agent.
5. **Investigate:** once 1–4 pass, `npm run demo` shows the random agent solving
   `reply_meeting` far more often than it should. Find out why, decide whether it's
   the grader or the agent, and fix it.

Then extend: add tasks (aim for a spread of difficulty), a second app clone,
an LLM-backed agent behind the `Agent` interface, or run episodes in real
containers instead of in-process.

## Run

```bash
npm install
npm test          # the exercises
npm run typecheck
npm run demo      # grader validation, reward-hacking check, random-agent solve rates
```
