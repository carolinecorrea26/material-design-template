import type { PageId } from "../types/page";

export type TransitionMessagePair = [string, string];

const forwardMessages: Partial<Record<PageId, TransitionMessagePair>> = {
  membership: [
    "Saving your membership information...",
    "Checking your member details before we continue...",
  ],
  eligibility: [
    "Saving your eligibility information...",
    "Confirming which coverage options may apply...",
  ],
  coverage: [
    "Saving your coverage selections...",
    "Preparing questions for the coverage you selected...",
  ],
  "coverage-questions": [
    "Saving your coverage answers...",
    "Checking how your answers affect available options...",
  ],
  "coverage-options": [
    "Saving your coverage options...",
    "Preparing the rest of your application around your selections...",
  ],
  beneficiary: [
    "Saving beneficiary information...",
    "Checking that the next section has what it needs...",
  ],
  contact: [
    "Saving your contact information...",
    "Preparing the next section with your contact details...",
  ],
  personal: [
    "Saving your personal information...",
    "Checking the details needed to identify the applicant...",
  ],
  financial: [
    "Saving your financial information...",
    "Preparing your application for review...",
  ],
  review: [
    "Preparing your application review...",
    "Checking for anything that needs attention...",
  ],
  "health-si": [
    "Saving your health information...",
    "Preparing the next health questions...",
  ],
  "health-qd": [
    "Saving your health information...",
    "Preparing the next health questions...",
  ],
  "health-di": [
    "Saving your health information...",
    "Preparing the next health questions...",
  ],
  "health-cir": [
    "Saving your health information...",
    "Preparing the next health questions...",
  ],
  payment: [
    "Preparing your payment step...",
    "Setting up a secure path to complete your application...",
  ],
  docusign: [
    "Preparing your signature step...",
    "Getting your documents ready to sign...",
  ],
  receipt: [
    "Finalizing your confirmation...",
    "Preparing your receipt details...",
  ],
};

export const BACK_MESSAGE = "Returning to the previous step...";

export const MESSAGE_DURATION = 2200;

export function getForwardMessages(pageId: PageId): TransitionMessagePair {
  return (
    forwardMessages[pageId] ?? [
      "Saving your information...",
      "Preparing the next step...",
    ]
  );
}
