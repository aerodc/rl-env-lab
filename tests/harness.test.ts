import { describe, expect, it } from "vitest";
import { OracleAgent } from "../src/agents/agents.js";
import { runWithConcurrency } from "../src/harness/concurrency.js";
import { runEpisode, runSuite, summarize } from "../src/harness/runner.js";
import { TASKS } from "../src/tasks/catalog.js";
import { seedMailbox } from "../src/tasks/seed.js";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

describe("TODO 3 — runWithConcurrency", () => {
  it("never exceeds the limit", async () => {
    let inFlight = 0;
    let peak = 0;
    await runWithConcurrency([...Array(20).keys()], 4, async () => {
      peak = Math.max(peak, ++inFlight);
      await sleep(5);
      inFlight--;
    });
    expect(peak).toBe(4);
  });

  it("keeps results in input order even when they finish out of order", async () => {
    const out = await runWithConcurrency([30, 5, 20, 1], 4, async (ms) => {
      await sleep(ms);
      return ms;
    });
    expect(out).toEqual([30, 5, 20, 1]);
  });

  it("propagates failures", async () => {
    await expect(
      runWithConcurrency([1, 2, 3], 2, async (x) => {
        if (x === 2) throw new Error("boom");
        return x;
      }),
    ).rejects.toThrow("boom");
  });
});

describe("platform properties", () => {
  it("episodes are isolated: parallel runs don't leak state, seed stays clean", async () => {
    const trajectories = await runSuite(TASKS, (t) => new OracleAgent(t), { concurrency: 8, episodesPerTask: 10 });
    expect(summarize(trajectories).every((s) => s.solveRate === 1)).toBe(true);
    for (const t of TASKS) expect(t.initialState).toEqual(seedMailbox());
  });

  it("episodes are deterministic: same task + same actions = identical trajectory", async () => {
    const t = TASKS.find((x) => x.id === "forward_invoice")!;
    const a = await runEpisode(t, new OracleAgent(t));
    const b = await runEpisode(t, new OracleAgent(t));
    expect(JSON.stringify(a.steps)).toBe(JSON.stringify(b.steps));
  });
});
