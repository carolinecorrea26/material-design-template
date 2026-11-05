import type { Meta, StoryObj } from "@storybook/react-vite";
import { getContent } from "../../content";
import ReceiptNextSteps from "./ReceiptNextSteps";

const meta = {
  id: "receipt-receiptnextsteps",
  title: "Components/Pages/Receipt/Sections/Submission acknowledgement",
  component: ReceiptNextSteps,
  parameters: { layout: "padded" },
} satisfies Meta<typeof ReceiptNextSteps>;
export default meta;

export const Default: StoryObj = {
  render: () => <ReceiptNextSteps content={{ title: getContent().receipt.receivedMessage ?? 'Thank you! We’ve received your application.', items: [{ title: '', description: getContent().receipt.paymentNotice ?? '' }] }} />,
};
