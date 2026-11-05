import type { Meta, StoryObj } from "@storybook/react-vite";
import UnderwriterCredentials from "./UnderwriterCredentials";
import withHomeStoryFrame from "../../../.storybook/homeSectionDecorator";
import ComponentFixture from "../../../.storybook/fixtures/ComponentFixture";

const meta = {
  id: "pages-home-new-york-life-credentials",
  title: "Components/Pages/Home/Sections/New York Life credentials",
  component: UnderwriterCredentials,
  parameters: { standalone: true, catalog: { position: 4 }, layout: "fullscreen", docs: { description: { component: "Insurer logo, name, tagline, description, financial strength ratings and footnote." } } },
  decorators: [withHomeStoryFrame],
} satisfies Meta<typeof UnderwriterCredentials>;
export default meta;
export const Default: StoryObj = { render: () => <ComponentFixture>{fixture => <UnderwriterCredentials content={fixture.content} />}</ComponentFixture> };
