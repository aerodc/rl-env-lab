import { describe, expect, it } from "vitest";
import { ArchiveEverythingAgent, NullAgent, OracleAgent } from "../src/agents/agents.js";
import { MailEnv } from "../src/env/mailEnv.js";
import type { Action, Task } from "../src/env/types.js";
import { runEpisode } from "../src/harness/runner.js";
import { TASKS } from "../src/tasks/catalog.js";
import { looseArchiveGrader, tightArchiveGrader } from "../src/tasks/rewardHacking.js";

const task = (id: string) => TASKS.find((t) => t.id === id)!;

/** Final state after a scripted list of actions. */
function finalState(t: Task, actions: Action[]) {
  const env = new MailEnv();
  env.reset(t);
  for (const a of actions) env.step(a);
  return env.checkpoint();
}

describe("grader validation — every task", () => {
  for (const t of TASKS) {
    it(`${t.id}: oracle scores 1`, async () => {
      const r = await runEpisode(t, new OracleAgent(t));
      expect(r.reward, r.reason).toBe(1);
    });
    it(`${t.id}: doing nothing scores 0`, async () => {
      expect((await runEpisode(t, new NullAgent())).reward).toBe(0);
    });
  }
});

describe("TODO 2 — forward_invoice grader", () => {
  const t = task("forward_invoice");
  it("fails when the email to accounting does not carry the invoice", () => {
    const s = finalState(t, [{ type: "send", to: ["accounting@acme.com"], subject: "Fwd: Invoice March", body: "see attached" }]);
    expect(t.grade(s).reward).toBe(0);
  });
  it("fails when the invoice goes to the wrong person", () => {
    const s = finalState(t, [{ type: "send", to: ["bob@acme.com"], subject: "Fwd", body: "Ref INV-2026-03" }]);
    expect(t.grade(s).reward).toBe(0);
  });
  it("gives a reason string either way", () => {
    expect(t.grade(finalState(t, [])).reason.length).toBeGreaterThan(0);
  });
});

describe("TODO 4 — reward hacking", () => {
  const t = task("archive_newsletters");
  it("the loose grader is fooled by archiving everything (this is the bug)", async () => {
    const r = await runEpisode(t, new ArchiveEverythingAgent());
    const s = finalState(t, r.steps.map((x) => x.action));
    expect(looseArchiveGrader(s).reward).toBe(1);
  });
  it("the tight grader is not fooled", async () => {
    const r = await runEpisode(t, new ArchiveEverythingAgent());
    expect(r.reward).toBe(0);
    const s = finalState(t, r.steps.map((x) => x.action));
    expect(tightArchiveGrader(s).reward).toBe(0);
  });
  it("the tight grader fails if only one of two newsletters is archived", () => {
    expect(tightArchiveGrader(finalState(t, [{ type: "archive", id: "m1" }])).reward).toBe(0);
  });
});
