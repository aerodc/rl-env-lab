/** Time is a source of non-determinism. The app never calls Date.now();
 * it asks an injected Clock. Episodes get a FixedClock, so the same task +
 * the same actions always produce byte-identical state. */

export interface Clock {
  now(): string;
}

export class FixedClock implements Clock {
  private ticks = 0;
  constructor(private readonly start = "2026-01-05T09:00:00.000Z") {}

  /** Advances one minute per call: monotonic, but fully reproducible. */
  now(): string {
    const t = new Date(Date.parse(this.start) + this.ticks * 60_000);
    this.ticks += 1;
    return t.toISOString();
  }
}
