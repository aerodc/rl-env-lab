import type { Action, Observation, Task } from "../env/types.js";

/** The policy interface. Async because a real agent calls an LLM; the
 * environment and harness don't care what's behind it. */
export interface Agent {
  readonly name: string;
  act(obs: Observation): Promise<Action>;
}

/** Replays the task's reference solution. Used to validate graders. */
export class OracleAgent implements Agent {
  readonly name = "oracle";
  private i = 0;
  constructor(private readonly task: Task) {}
  async act(): Promise<Action> {
    return this.task.oracle[this.i++] ?? { type: "done" };
  }
}

/** Does nothing. Any task it "passes" has a broken grader. */
export class NullAgent implements Agent {
  readonly name = "null";
  async act(): Promise<Action> {
    return { type: "done" };
  }
}

/** Games the archive task: archives the whole inbox. Exists to prove a
 * grader is (or isn't) hackable. */
export class ArchiveEverythingAgent implements Agent {
  readonly name = "archive-everything";
  private queue: string[] | null = null;
  async act(obs: Observation): Promise<Action> {
    if (this.queue === null) {
      if (Array.isArray(obs.lastResult)) {
        this.queue = (obs.lastResult as { id: string }[]).map((e) => e.id);
      } else {
        return { type: "list_inbox" };
      }
    }
    const id = this.queue.shift();
    return id ? { type: "archive", id } : { type: "done" };
  }
}

/** Seeded random policy — a floor for solve rates. Seeded so a "random"
 * run is still reproducible. */
export class RandomAgent implements Agent {
  readonly name = "random";
  private steps = 0;
  constructor(private seed: number, private readonly maxSteps = 6) {}
  private rand(): number {
    // mulberry32: tiny deterministic PRNG
    let t = (this.seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  async act(): Promise<Action> {
    if (++this.steps > this.maxSteps) return { type: "done" };
    const id = `m${1 + Math.floor(this.rand() * 7)}`;
    const choices: Action[] = [
      { type: "list_inbox" },
      { type: "read", id },
      { type: "archive", id },
      { type: "label", id, label: "finance" },
      { type: "send", to: ["alice@acme.com"], subject: "hi", body: "yes" },
    ];
    return choices[Math.floor(this.rand() * choices.length)]!;
  }
}
