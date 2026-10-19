// -------------------------------------------------------------------- TODO 3
/** Run `fn` over every item with AT MOST `limit` calls in flight at once,
 * and return results in the SAME ORDER as `items`.
 *
 * Why it matters: rollouts are expensive (LLM calls, environment boot). The
 * platform must saturate capacity without exceeding it — the same reason a
 * real fleet caps environments per machine.
 *
 * Requirements (see tests/harness.test.ts):
 *   - never more than `limit` concurrent fn() calls
 *   - result[i] corresponds to items[i], whatever order they finish in
 *   - limit >= items.length behaves like Promise.all
 *   - if any fn() rejects, the returned promise rejects
 * Hint: start `limit` workers that each pull the next index from a shared
 * counter until it runs out. JavaScript is single-threaded, so `next++`
 * between awaits is race-free — explain to yourself why.
 */
export async function runWithConcurrency<T, R>(
  items: readonly T[],
  limit: number,
  fn: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  throw new Error("TODO 3: implement runWithConcurrency()");
}
// ---------------------------------------------------------------------------
