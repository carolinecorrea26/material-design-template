import type { StatusMessagesContent } from "../types";

export const statusMessagesDefaults: StatusMessagesContent = {
  // ─── DocuSign ─────────────────────────────────────────────────────────────────
  docusign: {
    heading: "DocuSign",
    body: "You are about to be taken to a new page to securely review and sign your application with DocuSign. Please do not close this window.",
  },

  // ─── Health QD ────────────────────────────────────────────────────────────────
  healthQd: {
    heading: "QuickDecision",
    bodyBeforeMark:
      "You are about to be taken to a new page to answer health questions online for",
    bodyAfterMark: ". Please do not close this window.",
  },

  // ─── Health CIR ───────────────────────────────────────────────────────────────
  healthCir: {
    body: "This page is a placeholder for CIR health questions.",
  },
};
