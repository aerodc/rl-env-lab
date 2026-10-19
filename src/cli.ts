import { mkdirSync, writeFileSync } from "node:fs";
import { ArchiveEverythingAgent, NullAgent, OracleAgent, RandomAgent } from "./agents/agents.js";
import { runEpisode, runSuite, summarize } from "./harness/runner.js";
import { looseArchiveGrader, tightArchiveGrader } from "./tasks/rewardHacking.js";
import { TASKS } from "./tasks/catalog.js";

const pct = (x: number) => `${Math.round(x * 100)}%`.padStart(5);

async function main() {
  // 1. Grader validation: oracle must pass, doing nothing must fail.
  console.log("\n== Grader validation (oracle should be 1, null should be 0) ==");
  for (const task of TASKS) {
    const o = await runEpisode(task, new OracleAgent(task));
    const n = await runEpisode(task, new NullAgent());
    const ok = o.reward === 1 && n.reward === 0 ? "OK  " : "FAIL";
    console.log(`${ok} ${task.id.padEnd(20)} oracle=${o.reward} null=${n.reward}  ${o.reward !== 1 ? o.reason : ""}`);
  }

  // 2. Reward-hacking check on the archive task.
  console.log("\n== Reward hacking: 'archive everything' agent ==");
  const archiveTask = TASKS.find((t) => t.id === "archive_newsletters")!;
  const cheat = await runEpisode(archiveTask, new ArchiveEverythingAgent());
  // Re-grade the cheater's final state with both graders.
  const { MailEnv } = await import("./env/mailEnv.js");
  const env = new MailEnv();
  env.reset(archiveTask);
  for (const s of cheat.steps) env.step(s.action);
  const finalState = env.checkpoint();
  console.log(`loose grader: ${looseArchiveGrader(finalState).reward}  (${looseArchiveGrader(finalState).reason})`);
  console.log(`tight grader: ${tightArchiveGrader(finalState).reward}  (${tightArchiveGrader(finalState).reason})`);

  // 3. Parallel suite with a random policy -> solve-rate report.
  console.log("\n== Random-agent suite (20 episodes/task, concurrency 8) ==");
  const t0 = performance.now();
  const trajectories = await runSuite(TASKS, (_t, ep) => new RandomAgent(1000 + ep), {
    concurrency: 8,
    episodesPerTask: 20,
  });
  for (const s of summarize(trajectories)) {
    console.log(`${s.taskId.padEnd(20)} solve=${pct(s.solveRate)}  meanSteps=${s.meanSteps.toFixed(1)}`);
  }
  console.log(`${trajectories.length} episodes in ${(performance.now() - t0).toFixed(0)} ms`);

  mkdirSync("runs", { recursive: true });
  writeFileSync("runs/random-suite.json", JSON.stringify(trajectories, null, 2));
  console.log("trajectories written to runs/random-suite.json\n");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
