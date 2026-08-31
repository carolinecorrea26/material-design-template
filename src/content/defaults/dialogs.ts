import type { DialogsContent } from "../types";

export const dialogsDefaults: DialogsContent = {
  // ─── Confirmation Dialog ──────────────────────────────────────────────────────
  confirmation: {
    editApplication: {
      title: "Edit your application",
      message:
        "To edit your application, you will be sent back to the page where that information is collected. Do you want to go to this page to make edits?",
    },
    dependentCoverage: {
      title: "Dependent coverage",
      message:
        "To apply for dependent coverage, the member must be insured with this group coverage.",
    },
  },

  // ─── Send Application Dialog ─────────────────────────────────────────────────
  sendApplication: {
    sendToApplicant: {
      title: "Send to applicant for review",
      introText:
        "This application will be sent to the following applicant for review, completion of any remaining steps, and e-signature.",
    },
    requestEditToApplication: {
      title: "Request edit to application",
      introText:
        "Your advisor will be notified of your request to edit your application and will contact you for additional details",
    },
  },

  // ─── Beneficiary Modal ────────────────────────────────────────────────────────
  beneficiary: {
    addTitle: "Add Beneficiary",
    editTitle: "Edit Beneficiary",
    applyToOthersTitle: "Apply to Other Coverages",
    applyToOthersPrompt:
      "Would you like to apply this beneficiary to other coverages?",
  },

  // ─── Coverage Details Dialog ──────────────────────────────────────────────────
  coverageDetails: {
    fallbackTitle: "Coverage Details",
    benefitAmountLabel: "Benefit amount:",
    coverageNoteLabel: "Coverage note:",
    eligibleApplicantsLabel: "Eligible applicants:",
    waitingPeriodsLabel: "Waiting periods:",
    maxBenefitPeriodsLabel: "Max benefit periods:",
    availableRidersLabel: "Available riders",
    viewFullDetailsLinkLabel: "View full coverage details",
  },
};
