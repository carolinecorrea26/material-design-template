import { useMemo, useState } from "react";
import { Box, Card, CardContent, FormControlLabel, Radio, RadioGroup, Stack, Typography } from "@mui/material";
import ThemePaletteEditor from "./ThemePaletteEditor";
import type { PaletteOptions } from "@mui/material/styles";
import { ThemeProvider } from "@mui/material/styles";
import { createAppTheme } from "../../app/theme";
import { demoClient } from "../../config/clients/demo";
import { themeColorLabels, type HomePageVariant, type ClientThemeConfig, type ThemeColorId, type ClientConfig } from "../../config/clients/types";
import { ClientIconContext } from "../ui/ClientIconContext";
import Home from "../../pages/Home";

const PRESET_IDS: ThemeColorId[] = ["default", "teal", "purple", "dark-blue"];
const HEX_COLOR_PATTERN = /^#[\da-f]{3}([\da-f]{3})?$/i;
type ThemeSelection = ThemeColorId | "custom";
const presetOptions = PRESET_IDS.map((id) => ({ id, label: themeColorLabels[id], color: createAppTheme({ type: "preset", preset: id }).palette.primary.main }));

export default function ThemeConfigurationPreview({ client = demoClient }: { client?: ClientConfig }) {
  const [themeSelection, setThemeSelection] = useState<ThemeSelection>(client.theme?.type === "custom" ? "custom" : client.theme?.preset ?? "default");
  const [template, setTemplate] = useState<"single" | "multi">(client.features?.defaultTemplate ?? "multi");
  const [singlePageArtwork, setSinglePageArtwork] = useState<"none" | "clouds-cat-umbrella">(client.features?.singlePageArtwork ?? "none");
  const [homePageVariant, setHomePageVariant] = useState<HomePageVariant>(client.features?.homePageVariant ?? "default");
  const [customColor, setCustomColor] = useState(client.theme?.type === "custom" ? client.theme.primary : createAppTheme(client.theme).palette.primary.main);
  const [palette, setPalette] = useState<PaletteOptions>(client.theme?.type === "custom" ? client.theme.palette ?? {} : {});
  const [applyingStepsPresentation, setApplyingStepsPresentation] = useState<"image" | "animated">(client.features?.applyingStepsPresentation ?? "image");
  const customColorIsValid = HEX_COLOR_PATTERN.test(customColor);
  const previewTheme = useMemo(() => {
    const config: ClientThemeConfig = themeSelection === "custom" && customColorIsValid
      ? { type: "custom", primary: customColor as `#${string}`, palette }
      : { type: "preset", preset: themeSelection === "custom" ? "default" : themeSelection };
    return createAppTheme(config);
  }, [customColor, customColorIsValid, themeSelection, palette]);

  return <Stack spacing={2.5}>
    <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 900 }}>
      Choose an approved theme color or enter a custom color palette and inspect it against the
      selected application. This preview is temporary and does not change Client configuration.
    </Typography>
    <Card variant="outlined"><CardContent><Typography variant="h6" component="h2" sx={{mb:2}}>Custom palette</Typography>
          <ThemePaletteEditor theme={previewTheme} value={palette} onChange={next => { setPalette(next); const primary = next.primary as {main?: string} | undefined; setCustomColor(primary?.main ?? previewTheme.palette.primary.main); setThemeSelection("custom"); }} />
    </CardContent></Card>
    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "minmax(0, 1fr)", lg: "minmax(0, 1fr) 340px" }, gap: 3, alignItems: "start" }}>
      <Card variant="outlined" sx={{ minWidth: 0, overflow: "hidden" }}>
        <ThemeProvider theme={previewTheme}>
          <Box sx={{ height: { xs: 620, md: 760 }, overflow: "auto", bgcolor: "background.default", color: "text.primary" }}>
            <ClientIconContext value={client.branding}><Home key={homePageVariant} previewTemplate={template} previewClient={{ ...client, features: { ...client.features, homePageVariant, applyingStepsPresentation, singlePageArtwork } }} /></ClientIconContext>
          </Box>
        </ThemeProvider>
      </Card>
      <Card variant="outlined" sx={{ position: { lg: "sticky" }, top: { lg: 24 } }}>
        <CardContent>
          <Typography variant="h6" component="h2">Preview color theme</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, mb: 2 }}>Select a preset or customize the entire color palette.</Typography>
          <RadioGroup value={themeSelection} onChange={(event) => { const selection = event.target.value as ThemeSelection; setThemeSelection(selection); if (selection !== "custom") { setPalette({}); setCustomColor(createAppTheme(selection).palette.primary.main); } }} aria-label="Theme color">
            <Stack spacing={1}>
              {presetOptions.map((option) => <Box key={option.id} sx={{ border: "1px solid", borderColor: themeSelection === option.id ? "primary.main" : "divider", borderRadius: 2, px: 1 }}>
                <FormControlLabel value={option.id} control={<Radio />} sx={{ width: "100%", minHeight: 54 }} label={<Stack direction="row" spacing={1.25} alignItems="center"><Box aria-hidden="true" sx={{ width: 26, height: 26, borderRadius: "50%", bgcolor: option.color, border: "1px solid rgba(0,0,0,0.15)", flexShrink: 0 }} /><Box><Typography variant="body2" sx={{ fontWeight: 700 }}>{option.label}</Typography><Typography variant="caption" color="text.secondary" sx={{ fontFamily: "monospace" }}>{option.color}</Typography></Box></Stack>} />
              </Box>)}
              <Box sx={{ border: "1px solid", borderColor: themeSelection === "custom" ? "primary.main" : "divider", borderRadius: 2, p: 1 }}>
                <FormControlLabel value="custom" control={<Radio />} label="Custom" sx={{ minHeight: 38 }} />
              </Box>
            </Stack>
          </RadioGroup>

          <Typography variant="h6" component="h2" sx={{ mt: 3 }}>Form template</Typography>
          <RadioGroup value={template} onChange={event => setTemplate(event.target.value as "single" | "multi")} aria-label="Form template"><FormControlLabel value="multi" control={<Radio />} label="Multi-page"/><FormControlLabel value="single" control={<Radio />} label="Single-page"/></RadioGroup>
          {template === "single" && <><Typography variant="subtitle2">Single-page artwork</Typography><RadioGroup value={singlePageArtwork} onChange={event => setSinglePageArtwork(event.target.value as "none" | "clouds-cat-umbrella")} aria-label="Single-page artwork"><FormControlLabel value="none" control={<Radio />} label="Hero text only (default)"/><FormControlLabel value="clouds-cat-umbrella" control={<Radio />} label="Clouds, cat and umbrella"/></RadioGroup><Typography variant="caption" color="text.secondary">Hero preview. Open the Site preview to inspect application sections and the desktop umbrella/cat scene.</Typography></>}
          <Typography variant="h6" component="h2" sx={{ mt: 3 }}>Preview homepage</Typography>
          <RadioGroup value={homePageVariant} onChange={(event) => setHomePageVariant(event.target.value as HomePageVariant)} aria-label="Homepage variant">
            <FormControlLabel value="default" control={<Radio />} label="Default" />
            <FormControlLabel value="quoteFirst" control={<Radio />} label="Quote first" />
            <FormControlLabel value="hero-image" control={<Radio />} label="Hero image" />
            <FormControlLabel value="welcome-back" control={<Radio />} label="Welcome back" />
          </RadioGroup>
          <Typography variant="subtitle2" sx={{mt:2}}>Applying steps</Typography>
          <RadioGroup value={applyingStepsPresentation} onChange={event => setApplyingStepsPresentation(event.target.value as "image" | "animated")} aria-label="Applying steps presentation"><FormControlLabel value="image" control={<Radio />} label="Images (default)"/><FormControlLabel value="animated" control={<Radio />} label="Animated preview"/></RadioGroup>
        </CardContent>
      </Card>
    </Box>
  </Stack>;
}
