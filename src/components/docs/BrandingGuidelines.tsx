import { Alert, Box, Card, CardContent, Stack, Typography } from "@mui/material";
import { DocsPage, DocsSection, SourceNote } from "../../docs/shared/DocsBlocks";



export const BrandingGuidelines = () => (
  <DocsPage
    eyebrow="Foundations"
    title="Branding guidelines"
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
              bgcolor: "background.default",
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

    <DocsSection title="Single-page branding">
      <Typography variant="body2" color="text.secondary">
        The single-page hero fills a 800px maximum container without a background panel;
        the form remains at 800px. The heading uses 2.5rem type and 1.15 line height.
        Effective association branding supplies the member acronym and association name.
        Hero images and the separate quote tool are omitted. The default is hero text only.
        Set <code>features.singlePageArtwork</code> to <code>clouds-cat-umbrella</code>
        to show theme-colored clouds, rain and the desktop umbrella/cat scene. The primary
        cloud occupies reserved space above the hero. Artwork is decorative, noninteractive,
        hidden from assistive technology and respects reduced motion. The umbrella/cat
        appears at viewport widths of 1200px or more. Multi-page ignores this setting.
      </Typography>
      <SourceNote>src/pages/Home.tsx; src/config/homepagePresentation.ts; src/components/home/HeroClouds.tsx; src/components/home/FormUmbrella.tsx</SourceNote>
    </DocsSection>

    <DocsSection title="Custom color themes">
      <Typography variant="body2" color="text.secondary">
        Clients can configure the full color palette, including primary, semantic, background and text colors. Review all interactive states and text/surface contrast together using the Branding &amp; Design preview.
      </Typography>
    </DocsSection>

    <Alert severity="info" sx={{ maxWidth: 800 }}>
      Add or edit the actual logo, hero image, headings, and copy in the CMS
      documentation. Use this Storybook page to validate how those values will
      be displayed.
    </Alert>
  </DocsPage>
);
