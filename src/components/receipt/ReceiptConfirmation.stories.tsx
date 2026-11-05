import type { Meta, StoryObj } from "@storybook/react-vite";
import { getContent } from "../../content";
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
    title="Application received"
    content={getContent().receipt}
    confirmationNumber="APP-12345678"
    onDownloadApplication={() => {}}
    onDownloadPayment={() => {}}
  />,
};
