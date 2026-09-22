import type { Meta } from "@storybook/react-vite";
import { useTheme } from "@mui/material/styles";
import { Alert, Box, Button, Card, CardContent, Chip, Stack, Typography } from "@mui/material";
import { CARD_RADIUS } from "../../app/theme";
import { DocsPage, DocsSection, SourceNote } from "../shared/DocsBlocks";

const meta = {
  title: "Foundations/Shape",
  parameters: { layout: "padded" },
} satisfies Meta;

export default meta;

export const Shape = () => {
  const theme = useTheme();

  return (
    <DocsPage
      eyebrow="Foundations"
      title="Shape"
      intro={
        <>
          Two radius conventions cover the whole app: a shared card radius
          for surfaces, and a fully pill-shaped radius for buttons and
          toggle groups. There is no third, smaller "chip" radius — chips
          use MUI's own default.
        </>
      }
    >
      <DocsSection
        title="Card radius — CARD_RADIUS"
        description={`Exported once (${CARD_RADIUS}) and reused by Card, CardContent's parent, Alert, OutlinedInput, ToggleButton/ToggleButtonGroup — every stacked surface shares this radius so they read as one consistent system.`}
      >
        <Stack direction="row" spacing={2} flexWrap="wrap">
          <Card variant="outlined" sx={{ width: 160, height: 90 }}>
            <CardContent>
              <Typography variant="caption">Card</Typography>
            </CardContent>
          </Card>
          <Alert severity="info" sx={{ width: 220, alignItems: "center" }}>
            Alert
          </Alert>
          <Box
            sx={{
              width: 160,
              height: 90,
              border: "1px solid rgba(52,59,72,0.23)",
              borderRadius: CARD_RADIUS,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              bgcolor: "background.paper",
            }}
          >
            <Typography variant="caption" color="text.secondary">OutlinedInput</Typography>
          </Box>
        </Stack>
        <SourceNote>src/app/theme.ts — export const CARD_RADIUS = "{CARD_RADIUS}"</SourceNote>
      </DocsSection>

      <DocsSection
        title="Pill radius — buttons & toggle groups"
        description="MuiButton and MuiToggleButton both use borderRadius: 9999, i.e. always fully rounded regardless of height."
      >
        <Stack direction="row" spacing={2} alignItems="center">
          <Button variant="contained">Contained</Button>
          <Button variant="outlined">Outlined</Button>
          <Chip label="Chip — MUI default radius, not CARD_RADIUS" variant="outlined" />
        </Stack>
      </DocsSection>

      <DocsSection
        title="Base shape unit"
        description="MUI's own shape.borderRadius, used only where no override above applies (Chip, and any unstyled MUI component)."
      >
        <Typography variant="body2" color="text.secondary">
          theme.shape.borderRadius = <code>{theme.shape.borderRadius}</code>
        </Typography>
        <SourceNote>src/app/theme.ts — createTheme({"{"} shape: {"{"} borderRadius: 8 {"}"} {"}"})</SourceNote>
      </DocsSection>
    </DocsPage>
  );
};
