import type { Meta, StoryObj } from "@storybook/react-vite";
import OfflineBoltRoundedIcon from "@mui/icons-material/OfflineBoltRounded";
import ProcessingStatusPage from "./ProcessingStatusPage";

const meta = {
  id: "feedback-processingstatuspage",
  title: "Components/Feedback and overlays/Loading and processing/Processing status",
  component: ProcessingStatusPage,
  parameters: { docs: { description: { component: "Centered in-page processing status used while an external decision completes." } }, layout: "padded" },
} satisfies Meta<typeof ProcessingStatusPage>;

export default meta;

export const ExternalService: StoryObj<typeof meta> = {
  name: 'Local processing example',
  args: {
    mark: <OfflineBoltRoundedIcon color="success" />,
    heading: "Processing your application",
    body: "Please wait while we securely prepare the next step.",
  },
};
export const BoundedLocalStatus: StoryObj<typeof meta> = { args: { heading: 'Preparing this step', body: 'This local example changes to timeout feedback after two seconds.', timeoutMs: 2000, operation: 'signature', reference: 'REQ-7C2F91AB' } };
export const Complete: StoryObj<typeof meta> = { args: { heading: '', body: '', phase: 'complete', reference: 'REQ-7C2F91AB' } };
export const Timeout: StoryObj<typeof meta> = { args: { heading: '', body: '', phase: 'timeout', operation: 'signature', reference: 'REQ-7C2F91AB' } };
