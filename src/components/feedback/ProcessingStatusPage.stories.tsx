import type { Meta, StoryObj } from "@storybook/react-vite";
import OfflineBoltIcon from "@mui/icons-material/OfflineBolt";
import ProcessingStatusPage from "./ProcessingStatusPage";

const meta = {
  title: "Feedback/ProcessingStatusPage",
  component: ProcessingStatusPage,
  parameters: { layout: "padded" },
} satisfies Meta<typeof ProcessingStatusPage>;

export default meta;

export const ExternalService: StoryObj<typeof meta> = {
  args: {
    mark: <OfflineBoltIcon color="success" />,
    heading: "Processing your application",
    body: "Please wait while we securely prepare the next step.",
  },
};
