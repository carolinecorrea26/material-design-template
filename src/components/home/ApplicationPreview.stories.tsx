import type { Meta, StoryObj } from "@storybook/react-vite";
import { Box } from "@mui/material";
import ApplicationPreview, {
  AnimatedApplicationPreview,
} from "./ApplicationPreview";

const meta = {
  title: "Home/ApplicationPreview",
  component: ApplicationPreview,
  parameters: { layout: "centered" },
} satisfies Meta<typeof ApplicationPreview>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Animated: Story = {
  args: { activeStep: "coverage" },
  render: () => <AnimatedApplicationPreview />,
};

export const NarrowContainer: Story = {
  args: { activeStep: "health" },
  render: (args) => (
    <Box sx={{ width: 280, maxWidth: "100%" }}>
      <ApplicationPreview {...args} />
    </Box>
  ),
};

export const ReducedMotion: Story = {
  args: { activeStep: "coverage", reducedMotion: true },
};
