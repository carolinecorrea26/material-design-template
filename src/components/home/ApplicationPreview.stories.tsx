import type { Meta, StoryObj } from "@storybook/react-vite";
import { Box } from "@mui/material";
import ApplicationPreview, {
  AnimatedApplicationPreview,
} from "./ApplicationPreview";

const meta = {
  id: "home-applicationpreview",
  title: "Components/Content and data display/Application illustrations/Application preview",
  component: ApplicationPreview,
  parameters: { docs: { description: { component: "Decorative homepage illustration of coverage, health, and receipt scenes. The drawn controls do not collect application answers; functional forms use FieldRenderer." } }, layout: "centered" },
} satisfies Meta<typeof ApplicationPreview>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Animated: Story = {
  args: { activeStep: "coverage" },
  render: args => <AnimatedApplicationPreview reducedMotion={args.reducedMotion} />,
  parameters: { controls: { exclude: ["activeStep"] } },
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
