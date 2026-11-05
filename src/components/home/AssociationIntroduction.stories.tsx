import type { Meta, StoryObj } from "@storybook/react-vite";
import AssociationIntroduction from "./AssociationIntroduction";
import withHomeStoryFrame from "../../../.storybook/homeSectionDecorator";
import ComponentFixture from "../../../.storybook/fixtures/ComponentFixture";

const meta = {
  id: "pages-home-association-introduction",
  title: "Components/Pages/Home/Sections/Association introduction",
  component: AssociationIntroduction,
  parameters: { standalone: true, catalog: { position: 3 }, layout: "fullscreen", docs: { description: { component: "Optional association logo, tagline and descriptive paragraphs. Uses generic example association content." } } },
  decorators: [withHomeStoryFrame],
} satisfies Meta<typeof AssociationIntroduction>;
export default meta;
export const Default: StoryObj = { render: () => <ComponentFixture>{fixture => <AssociationIntroduction content={fixture.content} effectiveBranding={fixture.client.branding} />}</ComponentFixture> };
