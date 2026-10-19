import type { Email, MailState } from "../app/types.js";

const inbox = (id: string, from: string, subject: string, body: string): Email => ({
  id, from, to: ["me@acme.com"], subject, body,
  folder: "inbox", labels: [], read: false, sentAt: "2026-01-04T08:00:00.000Z",
});

/** One seed mailbox shared by every task. Real environment companies build
 * rich, realistic seed data — the distractors (promo, a second newsletter)
 * are what make tasks non-trivial. */
export function seedMailbox(): MailState {
  return {
    owner: "me@acme.com",
    nextId: 8,
    emails: [
      inbox("m1", "newsletter@techdigest.io", "This week in AI", "Top stories of the week..."),
      inbox("m2", "alice@acme.com", "Meeting Thursday 3pm?",
        "Can you confirm you're available Thursday at 3pm for the roadmap review?"),
      inbox("m3", "billing@cloudvendor.com", "Invoice March",
        "Your March invoice: EUR 4,210. Ref INV-2026-03."),
      inbox("m4", "newsletter@techdigest.io", "Your weekly roundup", "Five links worth your time..."),
      inbox("m5", "manager@acme.com", "Q3 report",
        "Could you send me the link to the Q3 report? Bob has it."),
      inbox("m6", "bob@acme.com", "Q3 report draft",
        "Here is the Q3 report: https://docs.acme.com/q3-report-final"),
      inbox("m7", "promo@shop.example", "50% off everything", "Limited time offer!"),
    ],
  };
}

/** Helpers graders use. Keep them tiny and obvious — graders are code that
 * decides what the model gets rewarded for, so they deserve the most review. */
export const sentTo = (s: Readonly<MailState>, addr: string) =>
  s.emails.filter((e) => e.folder === "sent" && e.to.includes(addr));

export const pass = (reason: string) => ({ reward: 1, reason });
export const fail = (reason: string) => ({ reward: 0, reason });
