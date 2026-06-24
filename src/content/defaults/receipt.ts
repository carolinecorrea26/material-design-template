import type { ReceiptContent } from "../types";

export const receiptDefaults: ReceiptContent = {
  decisionSteps: ["Submitted", "Reviewed", "Decision"],
  decisionStatuses: {
    fullyUnderwritten: {
      label: "Sent for review",
      description:
        "QuickDecision is not currently available for this product. Your application will continue through the standard review process, and you'll be contacted if additional information is needed or when a decision is available.",
    },
    conditionallyApproved: {
      label: "Conditionally approved",
      description:
        "Congratulations! Your application has been conditionally approved. Once your group plan administrator confirms your eligibility, you'll receive details about your new coverage.",
    },
    referred: {
      label: "Sent for review",
      description:
        "We need a bit more information before we can make a decision. Your application will continue through the standard review process, and you'll be contacted if additional information is needed or when a decision is available.",
    },
    softDeclined: {
      label: "Unable to offer",
      description:
        "Based on the information provided and the data securely reviewed, we're unable to offer this coverage through QuickDecision at this time. Your application will still be reviewed by the plan administrator and carrier, and you'll be contacted if additional information is needed.",
    },
    databaseUnavailable: {
      label: "Sent for review",
      description:
        "We couldn't complete QuickDecision processing for this coverage in real time. Your application will continue through the standard review process, and you'll be contacted if additional information is needed or when a decision is available.",
    },
  },
};
