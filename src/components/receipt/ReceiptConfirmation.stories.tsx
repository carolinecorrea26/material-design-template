import type { Meta, StoryObj } from "@storybook/react-vite";
import { getContent } from "../../content";
import { getPageTitle, getPageSubhead } from '../../config/pages';
import ReceiptConfirmation from "./ReceiptConfirmation";

const meta = {
  id: "receipt-receiptconfirmation",
  title: "Components/Pages/Receipt/Sections/Confirmation",
  component: ReceiptConfirmation,
  parameters: { layout: "padded" },
} satisfies Meta<typeof ReceiptConfirmation>;
export default meta;

export const Documents: StoryObj = {
  render: () => <ReceiptConfirmation
    title={getPageTitle('receipt')}
    description={getPageSubhead('receipt')}
    content={getContent().receipt}
    confirmationNumber="APP-12345678"
    hasActivePaymentInformation
    onDownloadApplication={() => {}}
    onDownloadPayment={() => {}}
  />,
};

export const ApplicationDocumentOnly: StoryObj = {
  render: () => <ReceiptConfirmation title={getPageTitle('receipt')} description={getPageSubhead('receipt')} content={getContent().receipt} confirmationNumber="APP-12345678" hasActivePaymentInformation={false} onDownloadApplication={() => {}} />,
};
