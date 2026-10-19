import type { MailState } from "../app/types.js";

/** The action space: everything an agent is allowed to do. A closed,
 * typed set — the agent cannot reach anything else in the system. */
export type Action =
  | { type: "list_inbox" }
  | { type: "read"; id: string }
  | { type: "send"; to: string[]; subject: string; body: string }
  | { type: "archive"; id: string }
  | { type: "label"; id: string; label: string }
  | { type: "done" };

export interface Observation {
  instruction: string; // the task, in natural language
  lastResult: unknown; // what the previous action returned
  error?: string; // set when the previous action failed
  step: number;
}

export interface StepResult {
  observation: Observation;
  done: boolean;
}

export interface GradeResult {
  reward: number; // 0..1 — this suite uses binary 0/1 (verifiable rewards)
  reason: string; // human-readable: WHY it passed or failed
}

export type Difficulty = "easy" | "medium" | "hard";

/** A task = seed state + instruction + verifier. This triple is the unit of
 * product at an RL-environment company. */
export interface Task {
  id: string;
  difficulty: Difficulty;
  instruction: string;
  initialState: MailState;
  /** Deterministic verifier over the FINAL state. Pure function: same state
   * in, same grade out. No LLM judging, no clock, no randomness. */
  grade(finalState: Readonly<MailState>): GradeResult;
  /** Reference solution. Used to validate the grader itself: the oracle must
   * score 1, doing nothing must score 0. A grader nobody has tested against
   * both is a liability. */
  oracle: Action[];
}
