import type { Meta } from "@storybook/react-vite";
import { Alert, Box, Card, CardContent, Stack, Typography } from "@mui/material";
import { DocsPage, DocsSection, SourceNote } from "../shared/DocsBlocks";

const meta = {
  title: "Foundations/Branding",
  parameters: { layout: "padded" },
} satisfies Meta;

export default meta;

export const Branding = () => (
  <DocsPage
    eyebrow="Foundations"
    title="Branding"
    intro="Presentation rules for client-provided logos, hero images, and brand colors. The CMS owns each client's actual editable assets and copy; this page owns how those values are rendered."
    maxWidth={1000}
  >
    <DocsSection
      title="Logo display"
      description="Representative content inside the same maximum display area used by the application header."
    >
      <Card variant="outlined" sx={{ maxWidth: 360 }}>
        <CardContent>
          <Box
            sx={{
              width: { xs: 200, sm: 250 },
              maxWidth: "100%",
              height: 35,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "1px dashed",
              borderColor: "divider",
              bgcolor: "background.subtle",
            }}
          >
            <Typography variant="caption" sx={{ fontWeight: 800 }}>
              CLIENT LOGO · NATURAL ASPECT RATIO
            </Typography>
          </Box>
        </CardContent>
      </Card>
      <Stack spacing={0.5} sx={{ mt: 2 }}>
        <Typography variant="body2" color="text.secondary">
          Maximum width is <strong>200px</strong> on mobile and{" "}
          <strong>250px</strong> from the small breakpoint upward. Maximum
          height is <strong>35px</strong>. Width and height remain automatic,
          so the source aspect ratio is never stretched.
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Every meaningful logo needs concise, purpose-driven alternative text.
          Do not repeat nearby copy or use a filename as the alt value.
        </Typography>
      </Stack>
      <SourceNote>
        src/components/layout/AppHeader.tsx — rendering constraints;
        ClientConfig.branding.logo / logoAlt — configured asset references
      </SourceNote>
    </DocsSection>

    <DocsSection title="Hero image display">
      <Typography variant="body2" color="text.secondary">
        Hero images render at a maximum width of <strong>500px</strong>, with
        automatic height and a <strong>32px</strong> corner radius. They are
        used only by the <code>hero-image</code> and <code>welcome-back</code>{" "}
        home-page variants. Images must retain enough contrast and whitespace
        for their surrounding text treatment and must have appropriate text
        alternatives when they convey information.
      </Typography>
      <SourceNote>
        src/pages/Home.tsx — hero rendering; CMS documentation — actual image
        and copy values
      </SourceNote>
    </DocsSection>

    <DocsSection title="Hero typography and copy fit">
      <Typography variant="body2" color="text.secondary">
        Hero titles use the theme&apos;s <code>h1</code> treatment. No hard copy
        limit is enforced; as authoring guidance, keep titles near 60
        characters and descriptions near 160 characters so each remains close
        to two desktop lines. The CMS owns the actual heading and description.
      </Typography>
    </DocsSection>

    <DocsSection title="Brand color guardrails">
      <Typography variant="body2" color="text.secondary">
        A client primary color must preserve readable contrast and remain
        visually distinct from application-controlled semantic colors. Error,
        success, warning/notice, and neutral system colors are not client brand
        settings. Review a custom primary across interactive states and both
        text and surface contexts before approval.
      </Typography>
    </DocsSection>

    <Alert severity="info" sx={{ maxWidth: 800 }}>
      Add or edit the actual logo, hero image, headings, and copy in the CMS
      documentation. Use this Storybook page to validate how those values will
      be displayed.
    </Alert>
  </DocsPage>
);
