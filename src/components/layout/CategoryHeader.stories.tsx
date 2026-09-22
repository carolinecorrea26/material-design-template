import type { Meta, StoryObj } from "@storybook/react-vite";
import Diversity1RoundedIcon from "@mui/icons-material/Diversity1Rounded";
import CategoryHeader from "./CategoryHeader";

/**
 * CategoryHeader is a coverage-category heading, rendered as a real h3
 * (nested correctly under the page's h2) with h6 visual styling — fixed
 * from h6 to h3 during the CL-022 accessibility pass so category headings
 * no longer skip a heading level.
 */
const meta = {
  title: "Layout/CategoryHeader",
  component: CategoryHeader,
  parameters: { layout: "padded" },
} satisfies Meta<typeof CategoryHeader>;

export default meta;

export const WithIcon: StoryObj = {
  render: () => <CategoryHeader label="Life Insurance" icon={Diversity1RoundedIcon} />,
};

export const WithoutIcon: StoryObj = {
  render: () => <CategoryHeader label="Life Insurance" />,
};
