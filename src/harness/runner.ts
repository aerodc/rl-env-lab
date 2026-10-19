import type { Agent } from "../agents/agents.js";
import { MailEnv } from "../env/mailEnv.js";
import type { Action, Task } from "../env/types.js";
import { runWithConcurrency } from "./concurrency.js";

export interface StepRecord {
  action: Action;
  result: unknown;
  error?: string;
}

/** A trajectory is the platform's core output: what a lab's RL trainer
 * consumes. Everything needed to replay and audit one episode. */
export interface Trajectory {
  taskId: string;
  agent: string;
  steps: StepRecord[];
  reward: number;
  reason: string;
  durationMs: number;
}

export async function runEpisode(task: Task, agent: Agent): Promise<Trajectory> {
  const start = performance.now();
  const env = new MailEnv(); // fresh, isolated environment per episode
  let obs = env.reset(task);
  const steps: StepRecord[] = [];
  for (;;) {
    const action = await agent.act(obs);
    const { observation, done } = env.step(action);
    steps.push({ action, result: observation.lastResult, error: observation.error });
    obs = observation;
    if (done) break;
  }
  const { reward, reason } = env.grade();
  return { taskId: task.id, agent: agent.name, steps, reward, reason, durationMs: performance.now() - start };
}

export interface SuiteOptions {
  concurrency: number;
  episodesPerTask: number;
}

/** Run every task `episodesPerTask` times, in parallel up to `concurrency`. */
export async function runSuite(
  tasks: Task[],
  makeAgent: (task: Task, episode: number) => Agent,
  opts: SuiteOptions,
): Promise<Trajectory[]> {
  const jobs = tasks.flatMap((task) =>
    Array.from({ length: opts.episodesPerTask }, (_, episode) => ({ task, episode })),
  );
  return runWithConcurrency(jobs, opts.concurrency, ({ task, episode }) =>
    runEpisode(task, makeAgent(task, episode)),
  );
}

export interface TaskStats {
  taskId: string;
  episodes: number;
  solveRate: number;
  meanSteps: number;
}

/** Solve rate per task — the signal used to calibrate task difficulty.
 * A task solved 0% or 100% of the time by every model teaches RL nothing. */
export function summarize(trajectories: Trajectory[]): TaskStats[] {
  const byTask = new Map<string, Trajectory[]>();
  for (const t of trajectories) byTask.set(t.taskId, [...(byTask.get(t.taskId) ?? []), t]);
  return [...byTask.entries()].map(([taskId, ts]) => ({
    taskId,
    episodes: ts.length,
    solveRate: ts.filter((t) => t.reward >= 1).length / ts.length,
    meanSteps: ts.reduce((n, t) => n + t.steps.length, 0) / ts.length,
  }));
}
