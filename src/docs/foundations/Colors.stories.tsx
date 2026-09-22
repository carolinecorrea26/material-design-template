import type { Meta } from "@storybook/react-vite";
import { useTheme } from "@mui/material/styles";
import { Alert, Box, Stack, Typography } from "@mui/material";
import { createAppTheme } from "../../app/theme";
import type { ThemeColorId } from "../../config/clients/types";
import {
  DocsPage,
  DocsSection,
  SourceNote,
  SwatchRow,
  DocsTable,
  TableRow,
  TableCell,
  type Swatch,
} from "../shared/DocsBlocks";

const meta = {
  title: "Foundations/Colors",
  parameters: { layout: "padded" },
} satisfies Meta;

export default meta;

const PRESET_IDS: ThemeColorId[] = ["default", "teal", "purple", "dark-blue"];

/**
 * Reads every value straight from `createAppTheme` at render time — there is
 * no second hand-typed color list here. Switch the "Theme" control in the
 * toolbar above and the swatches on this page (and every other story) update
 * to match, since the whole Storybook preview is themed via the same
 * `createAppTheme(context.globals.themeColor)` preset call used by the
 * Storybook toolbar.
 */
export const Colors = () => {
  const theme = useTheme();

  const semantic: Swatch[] = [
    { label: "primary.main", value: theme.palette.primary.main, note: "Active client brand color" },
    { label: "primary.light", value: theme.palette.primary.light },
    { label: "primary.dark", value: theme.palette.primary.dark },
    { label: "success.main", value: theme.palette.success.main, note: "Reserved — confirmations only" },
    { label: "error.main", value: theme.palette.error.main, note: "Reserved — errors only" },
  ];

  const neutrals: Swatch[] = [
    { label: "text.primary", value: theme.palette.text.primary },
    { label: "text.secondary", value: theme.palette.text.secondary },
    { label: "text.tertiary", value: theme.palette.text.tertiary },
    { label: "text.disabled", value: theme.palette.text.disabled },
    { label: "background.default", value: theme.palette.background.default },
    { label: "background.paper", value: theme.palette.background.paper },
    { label: "background.subtle", value: theme.palette.background.subtle },
    { label: "background.surface", value: theme.palette.background.surface },
    { label: "background.iconBadge", value: theme.palette.background.iconBadge },
    { label: "divider", value: theme.palette.divider },
  ];

  const containers: Swatch[] = [
    { label: "panel.main", value: theme.palette.panel.main, note: `border ${theme.palette.panel.border}` },
    { label: "notice.main", value: theme.palette.notice.main, note: `border ${theme.palette.notice.border}` },
    { label: "support.main", value: theme.palette.support.main, note: `border ${theme.palette.support.border}` },
  ];

  const presets = PRESET_IDS.map((id) => {
    const t = createAppTheme(id);
    return { id, main: t.palette.primary.main, light: t.palette.primary.light, dark: t.palette.primary.dark };
  });

  return (
    <DocsPage
      eyebrow="Foundations"
      title="Colors"
      intro="Palette tokens defined in src/app/theme.ts. Success and error are reserved semantic colors — see the reserved-color rule below. Values on this page are read live from the active theme, so switching the toolbar's Theme control re-renders every swatch against the real per-client palette."
    >
      <DocsSection
        title="Brand & semantic"
        description="primary is the one token every client theme preset changes. success and error never change per client."
      >
        <SwatchRow swatches={semantic} />
        <SourceNote>src/app/theme.ts — palette.primary / palette.success / palette.error</SourceNote>
      </DocsSection>

      <DocsSection title="Text & surface neutrals" description="Fixed across every client preset.">
        <SwatchRow swatches={neutrals} />
        <SourceNote>src/app/theme.ts — palette.text / palette.background / palette.divider</SourceNote>
      </DocsSection>

      <DocsSection
        title="Contextual containers"
        description="panel = neutral info panels · notice = caution/notice boxes · support = help/support callouts. Custom palette groups added via MUI's Palette module augmentation, not part of MUI's default palette shape."
      >
        <SwatchRow swatches={containers} />
        <SourceNote>src/app/theme.ts — palette.panel / palette.notice / palette.support</SourceNote>
      </DocsSection>

      <DocsSection
        title="Client brand presets (ThemeColorId)"
        description="A preset-configured client selects one approved ID. Only the primary palette changes; all global semantic and neutral tokens stay fixed."
      >
        <DocsTable columns={["Preset", "Main", "Light", "Dark"]}>
          {presets.map((preset) => (
            <TableRow key={preset.id}>
              <TableCell sx={{ fontWeight: 700 }}>{preset.id}</TableCell>
              {[preset.main, preset.light, preset.dark].map((hex) => (
                <TableCell key={hex}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Box
                      sx={{
                        width: 20,
                        height: 20,
                        borderRadius: 1,
                        backgroundColor: hex,
                        border: "1px solid rgba(0,0,0,0.08)",
                        flexShrink: 0,
                      }}
                    />
                    <Typography variant="caption" sx={{ fontFamily: "monospace" }}>{hex}</Typography>
                  </Stack>
                </TableCell>
              ))}
            </TableRow>
          ))}
        </DocsTable>
        <SourceNote>src/app/theme.ts — createAppTheme(&#123; type: "preset", preset &#125;), themeColorPalettes</SourceNote>
      </DocsSection>

      <DocsSection
        title="Custom client primary"
        description="A custom-configured client supplies one primary hex value. MUI derives light, dark, and contrastText; clients do not configure those values individually."
      >
        {(() => {
          const customTheme = createAppTheme({ type: "custom", primary: "#6750a4" });
          const custom = customTheme.palette.primary;
          return (
            <SwatchRow
              swatches={[
                { label: "primary.main (input)", value: custom.main },
                { label: "primary.light (derived)", value: custom.light },
                { label: "primary.dark (derived)", value: custom.dark },
                { label: "primary.contrastText (derived)", value: custom.contrastText },
              ]}
            />
          );
        })()}
        <SourceNote>src/app/theme.ts — resolvePrimaryPalette; ClientConfig.theme</SourceNote>
      </DocsSection>

      <DocsSection title="Reserved theme colors">
        <Alert severity="warning" sx={{ maxWidth: 760 }}>
          Approved presets are blue/teal/purple tones. Do not approve red,
          orange, green, or yellow as a custom client primary — those
          hues carry fixed meaning elsewhere in the UI (error, avoid, success,
          notice), and a matching brand color would make errors, success
          confirmations, or notices harder to distinguish from normal brand
          styling.
        </Alert>
      </DocsSection>
    </DocsPage>
  );
};
