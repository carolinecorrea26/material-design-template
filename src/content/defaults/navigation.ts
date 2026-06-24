import type { NavigationContent } from "../types";

export const navigationDefaults: NavigationContent = {
  progressStepLabels: {
    "getting-started": "Getting started",
    "coverage-options": "Choose your coverage",
    profile: "Your application details",
    "application-review": "Review your application",
    "esign-submit": "E-sign and submit",
  },
  transitionMessages: {
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
    beneficiary: [
      "Saving beneficiary information...",
      "Checking that the next section has what it needs...",
    ],
    contact: [
      "Saving your contact information...",
      "Preparing the next section with your contact details...",
    ],
    profile: [
      "Saving your personal information...",
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
  },
  transitionDefaults: [
    "Saving your information...",
    "Preparing the next step...",
  ],
  backMessage: "Returning to the previous step...",
};
