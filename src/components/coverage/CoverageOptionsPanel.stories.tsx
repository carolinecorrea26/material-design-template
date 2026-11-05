import type { Meta, StoryObj } from "@storybook/react-vite";
import { Box } from "@mui/material";
import CoverageOptionsPanel from "./CoverageOptionsPanel";
import ComponentFixture from "../../../.storybook/fixtures/ComponentFixture";

const meta = {
  id: "coverage-commerce-coverageoptionspanel",
  title: "Components/Coverage and pricing/Coverage options",
  component: CoverageOptionsPanel,
  parameters: { standalone: true, docs: { description: { component: "Explains available coverage categories and products on the homepage or in a drawer." } }, layout: "padded" },
} satisfies Meta<typeof CoverageOptionsPanel>;

export default meta;

export const PageVariant: StoryObj = {
  name: 'variant="page" (Home page)',
  render: () => (
    <Box sx={{ maxWidth: 900 }}>
      <ComponentFixture capability="multipleTerms">{fixture => <CoverageOptionsPanel variant="page"  content={fixture.content} coverages={fixture.products} coverageConfig={fixture.client.coverages} />}</ComponentFixture>
    </Box>
  ),
};

export const DrawerVariant: StoryObj = {
  name: 'variant="drawer" (AppMenu)',
  render: () => (
    <Box sx={{ maxWidth: 420 }}>
      <ComponentFixture capability="multipleTerms">{fixture => <CoverageOptionsPanel variant="drawer"  content={fixture.content} coverages={fixture.products} coverageConfig={fixture.client.coverages} />}</ComponentFixture>
    </Box>
  ),
};

export const InitialCategory: StoryObj = {
  name: 'initialCategory="DI"',
  render: () => (
    <Box sx={{ maxWidth: 900 }}>
      <ComponentFixture>{fixture => <CoverageOptionsPanel variant="page" initialCategory="DI"  content={fixture.content} coverages={fixture.products} coverageConfig={fixture.client.coverages} />}</ComponentFixture>
    </Box>
  ),
};
