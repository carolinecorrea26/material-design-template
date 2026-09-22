import type { Meta } from "@storybook/react-vite";
import { useTheme, type Theme } from "@mui/material/styles";
import { Divider, Stack, Typography as MuiTypography } from "@mui/material";
import type { ComponentProps } from "react";
import {
  DocsPage,
  DocsSection,
  SourceNote,
  DocsTable,
  TableRow,
  TableCell,
} from "../shared/DocsBlocks";

const meta = {
  title: "Foundations/Typography",
  parameters: { layout: "padded" },
} satisfies Meta;

export default meta;

type TypographyVariant = NonNullable<ComponentProps<typeof MuiTypography>["variant"]>;

const STANDARD_VARIANTS: {
  variant: TypographyVariant;
  sample: string;
  element: string;
}[] = [
  { variant: "h1", sample: "The quick brown fox", element: "h1" },
  { variant: "h2", sample: "The quick brown fox", element: "h2" },
  { variant: "h3", sample: "The quick brown fox", element: "h3" },
  { variant: "h4", sample: "The quick brown fox", element: "h4" },
  { variant: "h5", sample: "The quick brown fox", element: "h5" },
  { variant: "h6", sample: "The quick brown fox", element: "h6" },
  { variant: "subtitle1", sample: "Medium-weight subtitle text", element: "h6" },
  { variant: "subtitle2", sample: "Semibold subtitle text", element: "h6" },
  { variant: "body1", sample: "Body copy uses text.primary at regular weight.", element: "p" },
  { variant: "body2", sample: "Smaller body copy, same color as body1.", element: "p" },
  { variant: "overline", sample: "Overline label", element: "span" },
  { variant: "button", sample: "Button label", element: "span (button text, not a heading)" },
];

// Only the 11 custom form-specific variants declared via module augmentation
// in theme.ts and mapped to non-heading elements via MuiTypography's
// defaultProps.variantMapping — kept separate from MUI's built-ins above.
const CUSTOM_VARIANTS: {
  variant: TypographyVariant;
  sample: string;
  usage: string;
}[] = [
  { variant: "formPageTitle", sample: "Application page title", usage: "The one on-page heading for a FormRoutePage-based application page (renders as an h2 — see PageTitle)." },
  { variant: "formSectionLabel", sample: "SECTION LABEL", usage: "Uppercase small-caps-style label above a form section." },
  { variant: "formBackLink", sample: "Back", usage: "The text of PageTitle's back-navigation control." },
  { variant: "formTransitionStatus", sample: "Loading next page…", usage: "Status message shown above PageTransitionSkeleton during route transitions." },
  { variant: "formBreadcrumb", sample: "Coverage", usage: "Breadcrumb-style step label in VerticalStepperBreadcrumbs." },
  { variant: "formVerticalStepLabel", sample: "Application Review", usage: "Desktop sticky-sidebar step label in ProgressStep." },
  { variant: "formVerticalStepLabelMobile", sample: "Application Review", usage: "Mobile accordion-stepper step label in ProgressStep." },
  { variant: "formProgressStepNumber", sample: "3", usage: "The numeral inside a progress-step badge." },
  { variant: "formProgressStepLabel", sample: "Step label", usage: "Secondary label text paired with formProgressStepNumber." },
  { variant: "formProgressPercent", sample: "60%", usage: "Small percent-complete readout." },
  { variant: "productNameLabel", sample: "Term Life Insurance", usage: "Product name inside ProductCard / EstimatorProductCard." },
];

function readVariantStyle(theme: Theme, variant: TypographyVariant) {
  const style = (theme.typography as unknown as Record<string, React.CSSProperties>)[variant];
  return {
    fontSize: style?.fontSize ?? "—",
    fontWeight: style?.fontWeight ?? "—",
    lineHeight: style?.lineHeight ?? "(theme default)",
    letterSpacing: style?.letterSpacing ?? "normal",
  };
}

function readMappedElement(theme: Theme, variant: TypographyVariant) {
  const mapping = (
    theme.components?.MuiTypography?.defaultProps as
      | { variantMapping?: Record<string, string> }
      | undefined
  )?.variantMapping;
  return mapping?.[variant];
}

export const Typography = () => {
  const theme = useTheme();

  return (
    <DocsPage
      eyebrow="Foundations"
      title="Typography"
      intro={
        <>
          Font family: <code>{theme.typography.fontFamily}</code>. Every
          value in the tables below is read live from{" "}
          <code>theme.typography</code>, and font-weight is applied at
          800 for every heading level (h1–h6) — this app has no lighter
          heading weight.
        </>
      }
    >
      <DocsSection title="Standard variants" description="MUI's built-in variants, restyled by theme.ts. Element mapping is MUI's own default (unchanged by this app).">
        <Stack spacing={2}>
          {STANDARD_VARIANTS.map(({ variant, sample, element }) => {
            const style = readVariantStyle(theme, variant);
            return (
              <Stack key={variant} direction={{ xs: "column", md: "row" }} spacing={2} alignItems={{ md: "baseline" }}>
                <Stack sx={{ width: { md: 220 }, flexShrink: 0 }} spacing={0.25}>
                  <MuiTypography variant="subtitle2">{variant}</MuiTypography>
                  <MuiTypography variant="caption" color="text.secondary" sx={{ fontFamily: "monospace" }}>
                    {style.fontSize} · weight {style.fontWeight} · line {style.lineHeight} · &lt;{element}&gt;
                  </MuiTypography>
                </Stack>
                <MuiTypography variant={variant}>{sample}</MuiTypography>
              </Stack>
            );
          })}
        </Stack>
        <SourceNote>src/app/theme.ts — typography.h1…h6, body1/2, subtitle1/2, overline, button</SourceNote>
      </DocsSection>

      <Divider />

      <DocsSection
        title="Custom form-specific variants"
        description="Declared via MUI's TypographyVariants module augmentation and mapped to non-heading HTML elements (mostly span/p) via MuiTypography.defaultProps.variantMapping, so using one of these never accidentally creates a second page heading."
      >
        <DocsTable columns={["Variant", "Rendered example", "Size / weight / line height", "Element", "Usage"]}>
          {CUSTOM_VARIANTS.map(({ variant, sample, usage }) => {
            const style = readVariantStyle(theme, variant);
            const element = readMappedElement(theme, variant) ?? "—";
            return (
              <TableRow key={variant}>
                <TableCell sx={{ fontWeight: 700, whiteSpace: "nowrap" }}>{variant}</TableCell>
                <TableCell>
                  <MuiTypography variant={variant}>{sample}</MuiTypography>
                </TableCell>
                <TableCell sx={{ whiteSpace: "nowrap", fontFamily: "monospace", fontSize: "0.75rem" }}>
                  {style.fontSize} / {style.fontWeight} / {style.lineHeight}
                </TableCell>
                <TableCell sx={{ fontFamily: "monospace" }}>&lt;{element}&gt;</TableCell>
                <TableCell>{usage}</TableCell>
              </TableRow>
            );
          })}
        </DocsTable>
        <SourceNote>
          src/app/theme.ts — typography.form* / productNameLabel;
          components.MuiTypography.defaultProps.variantMapping
        </SourceNote>
      </DocsSection>
    </DocsPage>
  );
};
