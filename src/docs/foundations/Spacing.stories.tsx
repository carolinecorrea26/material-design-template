import type { Meta } from "@storybook/react-vite";
import { useTheme } from "@mui/material/styles";
import { Box, Stack, Typography } from "@mui/material";
import { DocsPage, DocsSection, SourceNote } from "../shared/DocsBlocks";

const meta = {
  title: "Foundations/Spacing",
  parameters: { layout: "padded" },
} satisfies Meta;

export default meta;

const MULTIPLIERS = [0.5, 1, 1.5, 2, 3, 4, 6, 8];

export const Spacing = () => {
  const theme = useTheme();

  return (
    <DocsPage
      eyebrow="Foundations"
      title="Spacing"
      intro={
        <>
          Base spacing unit: <code>{String(theme.spacing(1))}</code> per{" "}
          <code>theme.spacing(1)</code>. Every <code>sx</code> spacing value
          in the app (<code>p</code>, <code>m</code>, <code>gap</code>,{" "}
          <code>spacing</code> on <code>Stack</code>, etc.) is a multiple of
          this unit — there is no separate spacing scale to memorize.
        </>
      }
    >
      <DocsSection title="Multiplier reference">
        <Stack spacing={1.5}>
          {MULTIPLIERS.map((m) => (
            <Stack key={m} direction="row" spacing={2} alignItems="center">
              <Typography variant="caption" sx={{ width: 90, fontFamily: "monospace" }}>
                theme.spacing({m})
              </Typography>
              <Box
                sx={{
                  height: 20,
                  width: theme.spacing(m),
                  bgcolor: "primary.main",
                  borderRadius: 0.5,
                  flexShrink: 0,
                }}
              />
              <Typography variant="caption" color="text.secondary">
                {theme.spacing(m)}
              </Typography>
            </Stack>
          ))}
        </Stack>
        <SourceNote>src/app/theme.ts — createTheme({"{"} spacing: 8 {"}"})</SourceNote>
      </DocsSection>

      <DocsSection
        title="Common usage in this app"
        description="Representative, not exhaustive — do not catalog every sx spacing value in the codebase here."
      >
        <Stack spacing={1}>
          <Typography variant="body2"><code>spacing={"{2}"}</code> / <code>{"{3}"}</code> — the most common gap between stacked fields and between a card's internal sections.</Typography>
          <Typography variant="body2"><code>px: {"{ xs: 2, sm: 3, md: 4 }"}</code> — AppBody's responsive page-content padding.</Typography>
          <Typography variant="body2"><code>py: {"{ xs: 4, sm: 6 }"}</code> — outer vertical padding on standalone pages outside the main form shell (Resume, ResumeCode, ResumeMethod).</Typography>
        </Stack>
      </DocsSection>
    </DocsPage>
  );
};
