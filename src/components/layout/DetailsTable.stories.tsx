import type { Meta, StoryObj } from "@storybook/react-vite";
import DetailsTable from "./DetailsTable";

const meta = {
  id: "application-patterns-detailstable",
  title: "Components/Content and data display/Details table",
  component: DetailsTable,
  parameters: { docs: { description: { component: "Presents labeled values in a compact details table." } }, layout: "padded" },
} satisfies Meta<typeof DetailsTable>;

export default meta;

export const ConfirmationDetails: StoryObj<typeof meta> = {
  args: {
    rows: [
      { label: "Applicant name", value: "Taylor Morgan" },
      { label: "Applicant email", value: "taylor@example.com" },
      { label: "Sent for signature", value: "September 18, 2026 at 11:30 AM" },
    ],
  },
};
