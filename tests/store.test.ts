import { describe, expect, it } from "vitest";
import { FixedClock } from "../src/app/clock.js";
import { MailStore } from "../src/app/store.js";
import { seedMailbox } from "../src/tasks/seed.js";

const fresh = () => new MailStore(seedMailbox(), new FixedClock());

describe("TODO 1 — snapshot / restore", () => {
  it("snapshot is not affected by later store mutations", () => {
    const store = fresh();
    const snap = store.snapshot();
    store.archive("m1");
    expect(snap.emails.find((e) => e.id === "m1")!.folder).toBe("inbox");
  });

  it("mutating a snapshot does not change the store", () => {
    const store = fresh();
    const snap = store.snapshot();
    snap.emails[0]!.labels.push("tampered");
    expect(store.view().emails[0]!.labels).toEqual([]);
  });

  it("restore rolls the store back to the snapshot", () => {
    const store = fresh();
    const snap = store.snapshot();
    store.send(["x@acme.com"], "s", "b");
    store.archive("m2");
    store.restore(snap);
    expect(store.view()).toEqual(seedMailbox());
  });

  it("store does not alias the object passed to restore", () => {
    const store = fresh();
    const snap = store.snapshot();
    store.restore(snap);
    snap.emails[0]!.subject = "changed after restore";
    expect(store.view().emails[0]!.subject).toBe("This week in AI");
  });
});
