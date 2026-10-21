import type { Clock } from "./clock.js";
import type { Email, EmailSummary, MailState } from "./types.js";

export class AppError extends Error {}

/** The "backend" of the mail clone. Every agent action goes through here,
 * and graders read the final state through view(). */
export class MailStore {
  private state: MailState;

  constructor(initial: MailState, private readonly clock: Clock) {
    // Copy on the way in: a task's seed state must never be mutated by an
    // episode, or the next episode on the same task starts dirty.
    this.state = structuredClone(initial);
  }

  // ---------------------------------------------------------------- TODO 1
  /** Return a point-in-time copy of the full state.
   *
   * Used to checkpoint mid-episode (branching rollouts: run several
   * continuations from the same state) and to hand graders a frozen view.
   *
   * Requirement: the returned object must be fully independent. Mutating
   * the snapshot must not change the store, and later store mutations must
   * not change the snapshot. (Think: what does `return this.state` break?)
   */
  snapshot(): MailState {
    // Deep copy: emails are objects holding arrays, so a spread would still alias them.
    return structuredClone(this.state);
  }

  /** Replace the current state with a previously taken snapshot.
   * Same independence requirement: the store must not keep a reference to
   * the object passed in. */
  restore(snapshot: MailState): void {
    // Copy on the way in too, so the caller can keep mutating its snapshot safely.
    this.state = structuredClone(snapshot);
  }
  // -----------------------------------------------------------------------

  /** Read-only view for graders. Graders judge final STATE, not UI text. */
  view(): Readonly<MailState> {
    return this.state;
  }

  listInbox(): EmailSummary[] {
    return this.state.emails
      .filter((e) => e.folder === "inbox")
      .map(({ id, from, subject, read, labels }) => ({ id, from, subject, read, labels: [...labels] }));
  }

  read(id: string): Email {
    const email = this.find(id);
    email.read = true;
    return structuredClone(email);
  }

  send(to: string[], subject: string, body: string): Email {
    if (to.length === 0) throw new AppError("send: at least one recipient required");
    const email: Email = {
      id: `m${this.state.nextId++}`,
      from: this.state.owner,
      to: [...to],
      subject,
      body,
      folder: "sent",
      labels: [],
      read: true,
      sentAt: this.clock.now(),
    };
    this.state.emails.push(email);
    return structuredClone(email);
  }

  archive(id: string): void {
    const email = this.find(id);
    if (email.folder !== "inbox") throw new AppError(`archive: ${id} is not in the inbox`);
    email.folder = "archive";
  }

  addLabel(id: string, label: string): void {
    const email = this.find(id);
    if (!email.labels.includes(label)) email.labels.push(label);
  }

  private find(id: string): Email {
    const email = this.state.emails.find((e) => e.id === id);
    if (!email) throw new AppError(`no email with id ${id}`);
    return email;
  }
}
