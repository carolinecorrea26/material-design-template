import type { Meta, StoryObj } from "@storybook/react-vite";
import HomeCoverageSection from "./HomeCoverageSection";
import withHomeStoryFrame from "../../../.storybook/homeSectionDecorator";
import ComponentFixture from "../../../.storybook/fixtures/ComponentFixture";

const meta = {
  id: "pages-home-coverage-options",
  title: "Components/Pages/Home/Sections/Coverage options",
  component: HomeCoverageSection,
  parameters: { standalone: true, catalog: { position: 2 }, layout: "fullscreen", docs: { description: { component: "Complete homepage coverage section: heading, description, category tabs and product information." } } },
  decorators: [withHomeStoryFrame],
} satisfies Meta<typeof HomeCoverageSection>;
export default meta;
export const Default: StoryObj = { render: () => <ComponentFixture>{fixture => <HomeCoverageSection content={fixture.content} coverageOptions={{ coverages: fixture.products, coverageConfig: fixture.client.coverages }} />}</ComponentFixture> };
