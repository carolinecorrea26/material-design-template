import type { Meta, StoryObj } from "@storybook/react-vite";
import { getContent } from "../../content";
import EstimatedRate from '../coverage/EstimatedRate';
import { configuredComponent } from '../../domain/componentDisplayNames';
import ReceiptCoverageDecision from "./ReceiptCoverageDecision";
import { getDecisionStatus } from "../../utils/coverageDecisions";
import { getOrderedDecisionEntries } from '../../utils/coverageDecisions';
import { getPrototypeLibrary } from '../../domain/prototypeLibrary';
import { receiptDecisionPresentation } from '../../domain/receiptPresentation';
import emailExample from '../../../requirements/global/prototype-fixtures/receipt-email.json';

const meta = {
  id: "receipt-receiptcoveragedecision",
  title: "Components/Pages/Receipt/Sections/Coverage decision",
  component: ReceiptCoverageDecision,
  parameters: { layout: 'padded', docs: { description: { component: configuredComponent('ReceiptCoverageDecision').description } } },
} satisfies Meta<typeof ReceiptCoverageDecision>;
export default meta;

export const SentForReview: StoryObj = {
  render: () => <ReceiptCoverageDecision productName="Group Term Life Insurance"
    status={getDecisionStatus({ underwritingType: "FUW", decisionResult: "referred" })}
    tone="primary"
    applicantLabel={getContent().shared.applicantLabels.member} applicant="member" requestedAmount={100000} estimatedPayment={<EstimatedRate amount={10} appearance="summary" suffix="/mo" />} paymentMethod="Bank account"
  />,
};
export const ConditionallyApproved: StoryObj = {
  render: () => <ReceiptCoverageDecision productName="Group Term Life Insurance"
    status={getDecisionStatus({ underwritingType: "QD", decisionResult: "conditionally-approved" })}
    tone="success"
    applicantLabel={getContent().shared.applicantLabels.spouse} applicant="spouse" showApplicant quickDecision requestedAmount={200000} estimatedPayment={<EstimatedRate amount={240} appearance="summary" suffix="/yr" />} paymentMethod="Bill me"
  />,
};

export const PaymentNotSelected: StoryObj = {
  render: () => <ReceiptCoverageDecision productName="Group Term Life Insurance"
    status={getDecisionStatus({ underwritingType: 'FUW', decisionResult: 'referred' })}
    tone="primary" applicantLabel={getContent().shared.applicantLabels.member} applicant="member"
    requestedAmount={100000} estimatedPayment={<EstimatedRate display={{ status: 'provided-separately' }} appearance="summary" />}
  />,
};

export const EmailSummary: StoryObj = {
  render: () => {
    const library = getPrototypeLibrary();
    if (!library) throw new Error('Missing fresh-start email example projection');
    const entry = getOrderedDecisionEntries(emailExample.application, library.products)[0];
    if (!entry) throw new Error('Missing configured email example product');
    return <ReceiptCoverageDecision presentation="email" productName={entry.coverage.name}
      applicant={entry.applicant} applicantLabel={library.content.shared.applicantLabels[entry.applicant]}
      {...receiptDecisionPresentation(entry, emailExample.application, library.content.receipt)} />;
  },
};
