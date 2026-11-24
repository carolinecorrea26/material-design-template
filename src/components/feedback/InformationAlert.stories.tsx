import type { Meta, StoryObj } from "@storybook/react-vite";
import { getContent } from "../../content";
import InformationAlert from "./InformationAlert";

const meta = {
  id: "feedback-information-alert",
  title: "Components/Feedback and overlays/Alerts/Information alert",
  component: InformationAlert,
  parameters: { layout: "padded" },
} satisfies Meta<typeof InformationAlert>;
export default meta;

export const Default: StoryObj = {
  render: () => <InformationAlert title={getContent().receipt.whatHappensNext.title} description={getContent().receipt.paymentNotice} />,
};
