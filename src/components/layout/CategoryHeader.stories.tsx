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
  id: "layout-categoryheader",
  title: "Components/Layout/Headings and dividers/Category heading",
  component: CategoryHeader,
  parameters: { docs: { description: { component: "Heading with an optional icon for coverage category sections. Rendered as an h3 (nested under the page's h2) with h6 visual styling preserved. Icon renders in primary color; label renders in default text color." } }, layout: "padded" },
} satisfies Meta<typeof CategoryHeader>;

export default meta;

export const WithIcon: StoryObj = {
  render: () => <CategoryHeader label="Life Insurance" icon={Diversity1RoundedIcon} />,
};

export const WithoutIcon: StoryObj = {
  render: () => <CategoryHeader label="Life Insurance" />,
};
