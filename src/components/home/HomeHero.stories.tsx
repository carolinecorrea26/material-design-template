import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Box, Typography } from "@mui/material";
import HomeHero from "./HomeHero";
import withHomeStoryFrame from "../../../.storybook/homeSectionDecorator";
import type { PrototypeLibrary } from "../../domain/prototypeLibrary";
import ComponentFixture from "../../../.storybook/fixtures/ComponentFixture";

const meta = {
  id: "pages-home-hero",
  title: "Components/Pages/Home/Sections/Hero",
  component: HomeHero,
  parameters: { standalone: true, catalog: { position: 0 },
    layout: "fullscreen",
    docs: { description: { component: "Member badge, heading, introduction and entry actions, alongside either the instant-quote card or hero photograph. These pieces stay together as one section." } },
  },
  decorators: [withHomeStoryFrame],
} satisfies Meta<typeof HomeHero>;
export default meta;

function HeroExample({ variant, fixture }: { variant: "default" | "hero-image"; fixture: PrototypeLibrary }) {
  const client = fixture.client;
  const [action, setAction] = useState("");
  return (
    <>
      <HomeHero
        content={fixture.content}
        client={client}
        effectiveBranding={client.branding}
        variant={variant}
        isSingleTemplate={false}
        onApply={(event) => { event.preventDefault(); setAction("Start my application selected."); }}
        onOpenQuote={() => setAction("Quote requested. The quote workflow is reviewed in its integration examples.")}
      />
      <Box role="status" sx={{ mt: action ? 2 : 0 }}><Typography>{action}</Typography></Box>
    </>
  );
}

export const StandardQuote: StoryObj = { render: () => <ComponentFixture>{fixture => <HeroExample fixture={fixture} variant="default" />}</ComponentFixture> };
export const HeroImage: StoryObj = { render: () => <ComponentFixture>{fixture => <HeroExample fixture={fixture} variant="hero-image" />}</ComponentFixture> };
