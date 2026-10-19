/** Domain model for the mail-app clone. Plain JSON on purpose: the whole
 * app state must be serializable so it can be snapshotted, restored, diffed,
 * and handed to a grader. */

export type Folder = "inbox" | "sent" | "archive";

export interface Email {
  id: string;
  from: string;
  to: string[];
  subject: string;
  body: string;
  folder: Folder;
  labels: string[];
  read: boolean;
  sentAt: string; // ISO timestamp, always from the injected Clock
}

export interface MailState {
  owner: string; // the mailbox owner, i.e. the user the agent acts for
  emails: Email[];
  nextId: number; // ids come from a counter, never randomness -> deterministic
}

/** Compact view returned by list operations — what a UI would show. */
export interface EmailSummary {
  id: string;
  from: string;
  subject: string;
  read: boolean;
  labels: string[];
}
