import { FixedClock } from "../app/clock.js";
import { AppError, MailStore } from "../app/store.js";
import type { Action, GradeResult, Observation, StepResult, Task } from "./types.js";

/** Gym-style environment: reset(task) -> step(action)* -> grade().
 * One instance per episode — instances share nothing, which is the
 * in-process analogue of one container / microVM per rollout. */
export class MailEnv {
  private store?: MailStore;
  private task?: Task;
  private steps = 0;
  private finished = false;

  constructor(private readonly maxSteps = 25) {}

  reset(task: Task): Observation {
    this.task = task;
    this.store = new MailStore(task.initialState, new FixedClock());
    this.steps = 0;
    this.finished = false;
    return { instruction: task.instruction, lastResult: null, step: 0 };
  }

  step(action: Action): StepResult {
    const { store, task } = this.requireStarted();
    if (this.finished) throw new Error("episode already finished; call reset()");
    this.steps += 1;

    let lastResult: unknown = null;
    let error: string | undefined;
    try {
      lastResult = this.apply(store, action);
    } catch (e) {
      // App-level errors (bad id, empty recipients) are observations the
      // agent should see and recover from — not crashes of the platform.
      if (!(e instanceof AppError)) throw e;
      error = e.message;
    }

    this.finished = action.type === "done" || this.steps >= this.maxSteps;
    return {
      observation: { instruction: task.instruction, lastResult, error, step: this.steps },
      done: this.finished,
    };
  }

  grade(): GradeResult {
    const { store, task } = this.requireStarted();
    return task.grade(store.snapshot());
  }

  /** Mid-episode checkpointing, built on the store snapshot. */
  checkpoint() {
    return this.requireStarted().store.snapshot();
  }

  private apply(store: MailStore, action: Action): unknown {
    switch (action.type) {
      case "list_inbox":
        return store.listInbox();
      case "read":
        return store.read(action.id);
      case "send":
        return store.send(action.to, action.subject, action.body);
      case "archive":
        store.archive(action.id);
        return "ok";
      case "label":
        store.addLabel(action.id, action.label);
        return "ok";
      case "done":
        return "done";
    }
  }

  private requireStarted() {
    if (!this.store || !this.task) throw new Error("call reset(task) first");
    return { store: this.store, task: this.task };
  }
}
