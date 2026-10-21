import type { MailState } from "../app/types.js";
import type { GradeResult, Task } from "../env/types.js";
import { tightArchiveGrader } from "./rewardHacking.js";
import { fail, pass, seedMailbox, sentTo } from "./seed.js";

const archiveNewsletters: Task = {
  id: "archive_newsletters",
  difficulty: "easy",
  instruction: "Archive every email from the newsletter, and nothing else.",
  initialState: seedMailbox(),
  grade: tightArchiveGrader,
  oracle: [{ type: "list_inbox" }, { type: "archive", id: "m1" }, { type: "archive", id: "m4" }, { type: "done" }],
};

const labelInvoice: Task = {
  id: "label_invoice",
  difficulty: "easy",
  instruction: "Add the label 'finance' to the March invoice email.",
  initialState: seedMailbox(),
  grade(s) {
    const tagged = s.emails.filter((e) => e.labels.includes("finance"));
    if (!tagged.some((e) => e.id === "m3")) return fail("invoice m3 not labelled 'finance'");
    if (tagged.length > 1) return fail(`'finance' also applied to ${tagged.length - 1} other email(s)`);
    return pass("invoice labelled, nothing else");
  },
  oracle: [{ type: "list_inbox" }, { type: "label", id: "m3", label: "finance" }, { type: "done" }],
};

const replyMeeting: Task = {
  id: "reply_meeting",
  difficulty: "medium",
  instruction: "Reply to Alice confirming you can attend the Thursday meeting.",
  initialState: seedMailbox(),
  grade(s) {
    const replies = sentTo(s, "alice@acme.com");
    if (replies.length === 0) return fail("nothing sent to alice@acme.com");
    const ok = replies.some(
      (e) => /\b(yes|confirm|confirmed|available|works)\b/i.test(e.body) && !/\b(not available|can't|cannot)\b/i.test(e.body),
    );
    return ok ? pass("confirmation sent to Alice") : fail("reply to Alice does not confirm attendance");
  },
  oracle: [
    { type: "read", id: "m2" },
    { type: "send", to: ["alice@acme.com"], subject: "Re: Meeting Thursday 3pm?", body: "Yes, I'm available Thursday at 3pm." },
    { type: "done" },
  ],
};

// ------------------------------------------------------------------ TODO 2
/** Grader for "Forward the March invoice to accounting@acme.com".
 * Decide what "forwarded" means in terms of final STATE, then check it:
 *   - something was sent to accounting@acme.com
 *   - it actually carries the invoice (hint: the reference INV-2026-03 is the
 *     one fact that proves the content was forwarded, not just mentioned)
 * Return fail(reason) / pass(reason). The tests also check that doing
 * nothing fails and that the oracle below passes.
 */
function gradeForwardInvoice(s: Readonly<MailState>): GradeResult {
  const toAccounting = sentTo(s, "accounting@acme.com");
  if (toAccounting.length === 0) return fail("nothing was sent to accounting@acme.com");
  // The invoice reference is the verifiable fact; subject lines like "Fwd: Invoice" can be faked.
  const carriesInvoice = toAccounting.some((e) => e.body.includes("INV-2026-03"));
  return carriesInvoice
    ? pass("invoice INV-2026-03 forwarded to accounting")
    : fail("email to accounting does not contain invoice INV-2026-03");
}
// -------------------------------------------------------------------------

const forwardInvoice: Task = {
  id: "forward_invoice",
  difficulty: "medium",
  instruction: "Forward the March invoice from our cloud vendor to accounting@acme.com.",
  initialState: seedMailbox(),
  grade: gradeForwardInvoice,
  oracle: [
    { type: "read", id: "m3" },
    {
      type: "send", to: ["accounting@acme.com"], subject: "Fwd: Invoice March",
      body: "Forwarding the March invoice:\n\nYour March invoice: EUR 4,210. Ref INV-2026-03.",
    },
    { type: "done" },
  ],
};

const sendReportLink: Task = {
  id: "send_report_link",
  difficulty: "hard",
  instruction: "Your manager asked for something by email. Find what they need and send it to them.",
  initialState: seedMailbox(),
  grade(s) {
    const toManager = sentTo(s, "manager@acme.com");
    if (toManager.length === 0) return fail("nothing sent to manager@acme.com");
    return toManager.some((e) => e.body.includes("https://docs.acme.com/q3-report-final"))
      ? pass("Q3 report link sent to manager")
      : fail("email to manager lacks the Q3 report link");
  },
  oracle: [
    { type: "read", id: "m5" },
    { type: "read", id: "m6" },
    { type: "send", to: ["manager@acme.com"], subject: "Q3 report", body: "Here it is: https://docs.acme.com/q3-report-final" },
    { type: "done" },
  ],
};

export const TASKS: Task[] = [archiveNewsletters, labelInvoice, replyMeeting, forwardInvoice, sendReportLink];
