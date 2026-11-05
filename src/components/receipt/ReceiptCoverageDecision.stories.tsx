import type { Meta, StoryObj } from "@storybook/react-vite";
import { getContent } from "../../content";
import ReceiptCoverageDecision from "./ReceiptCoverageDecision";
import { getDecisionStatus } from "../../utils/coverageDecisions";

const meta = {
  id: "receipt-receiptcoveragedecision",
  title: "Components/Pages/Receipt/Sections/Coverage decision",
  component: ReceiptCoverageDecision,
  parameters: { layout: "padded" },
} satisfies Meta<typeof ReceiptCoverageDecision>;
export default meta;

export const SentForReview: StoryObj = {
  render: () => <ReceiptCoverageDecision productName="Group Term Life Insurance"
    status={getDecisionStatus({ underwritingType: "FUW", decisionResult: "referred" })}
    tone="primary"
    applicantLabel={getContent().shared.applicantLabels.member} applicant="member"
  />,
};
export const ConditionallyApproved: StoryObj = {
  render: () => <ReceiptCoverageDecision productName="Group Term Life Insurance"
    status={getDecisionStatus({ underwritingType: "QD", decisionResult: "conditionally-approved" })}
    tone="success"
    applicantLabel={getContent().shared.applicantLabels.spouse} applicant="spouse" showApplicant
  />,
};
