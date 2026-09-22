import { useMemo, useState } from "react";
import AutoStoriesRoundedIcon from "@mui/icons-material/AutoStoriesRounded";
import LaunchRoundedIcon from "@mui/icons-material/LaunchRounded";
import {
  Box,
  Card,
  CardActionArea,
  CardContent,
  FormControlLabel,
  Radio,
  RadioGroup,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import { ThemeProvider } from "@mui/material/styles";
import { createAppTheme } from "../app/theme";
import { demoClient } from "../config/clients/demo";
import {
  themeColorLabels,
  type ClientThemeConfig,
  type ThemeColorId,
} from "../config/clients/types";
import Home from "./Home";
import { getStorybookUrl } from "../config/storybook";

const PRESET_IDS: ThemeColorId[] = ["default", "teal", "purple", "dark-blue"];
const HEX_COLOR_PATTERN = /^#[\da-f]{3}([\da-f]{3})?$/i;

type DesignSystemTab = "storybook" | "theme";
type ThemeSelection = ThemeColorId | "custom";

const presetOptions = PRESET_IDS.map((id) => ({
  id,
  label: themeColorLabels[id],
  color: createAppTheme({ type: "preset", preset: id }).palette.primary.main,
}));

export default function DesignSystem() {
  const [activeTab, setActiveTab] = useState<DesignSystemTab>("storybook");
  const [themeSelection, setThemeSelection] =
    useState<ThemeSelection>("default");
  const [customColor, setCustomColor] = useState("");

  const customColorIsValid = HEX_COLOR_PATTERN.test(customColor);
  const previewTheme = useMemo(
    () => {
      const config: ClientThemeConfig =
        themeSelection === "custom" && customColorIsValid
          ? { type: "custom", primary: customColor as `#${string}` }
          : {
              type: "preset",
              preset: themeSelection === "custom" ? "default" : themeSelection,
            };
      return createAppTheme(config);
    },
    [customColor, customColorIsValid, themeSelection],
  );

  return (
    <Box
      sx={{
        py: { xs: 3, md: 5 },
        px: { xs: 2, md: 4 },
        width: "100vw",
        maxWidth: "100vw",
        ml: "calc(-50vw + 50%)",
        boxSizing: "border-box",
      }}
    >
      <Stack spacing={3} sx={{ maxWidth: 1600, mx: "auto" }}>
        <Box>
          <Typography variant="h3" component="h1" sx={{ fontWeight: 800 }}>
            Design System
          </Typography>
          <Typography
            variant="body1"
            color="text.secondary"
            sx={{ mt: 1, maxWidth: 900 }}
          >
            Open the visual component documentation in Storybook or preview
            the approved and custom client theme colors against the demo
            landing page.
          </Typography>
        </Box>

        <Tabs
          value={activeTab}
          onChange={(_, value: DesignSystemTab) => setActiveTab(value)}
          aria-label="Design system sections"
          sx={{ borderBottom: "1px solid", borderColor: "divider" }}
        >
          <Tab value="storybook" label="Storybook" />
          <Tab value="theme" label="Theme Configuration" />
        </Tabs>

        {activeTab === "storybook" ? (
          <Card variant="outlined" sx={{ maxWidth: 900 }}>
            <CardActionArea
              component="a"
              href={getStorybookUrl()}
              target="_blank"
              rel="noopener noreferrer"
              sx={{ p: { xs: 3, md: 5 } }}
            >
              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={3}
                alignItems={{ sm: "center" }}
              >
                <Box
                  sx={{
                    width: 88,
                    height: 88,
                    borderRadius: 4,
                    bgcolor: "background.subtle",
                    color: "primary.main",
                    display: "grid",
                    placeItems: "center",
                    flexShrink: 0,
                  }}
                >
                  <AutoStoriesRoundedIcon sx={{ fontSize: 46 }} />
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="h4" component="h2">
                    Explore the design system in Storybook
                  </Typography>
                  <Typography
                    variant="body1"
                    color="text.secondary"
                    sx={{ mt: 1, maxWidth: 680 }}
                  >
                    Storybook is the source of truth for visual foundations,
                    brand guidelines, components, component states, responsive
                    behavior, accessibility, and MUI theme implementation.
                  </Typography>
                  <Typography
                    variant="subtitle2"
                    color="primary"
                    sx={{ mt: 2, display: "flex", alignItems: "center", gap: 0.75 }}
                  >
                    Open Storybook <LaunchRoundedIcon fontSize="small" />
                  </Typography>
                </Box>
              </Stack>
            </CardActionArea>
          </Card>
        ) : (
          <Stack spacing={2.5}>
            <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 900 }}>
              Choose one of the approved theme colors or enter a custom primary
              hex color. This preview is temporary and does not change any
              client configuration.
            </Typography>

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "minmax(0, 1fr)", lg: "minmax(0, 1fr) 340px" },
                gap: 3,
                alignItems: "start",
              }}
            >
              <Card variant="outlined" sx={{ minWidth: 0, overflow: "hidden" }}>
                <ThemeProvider theme={previewTheme}>
                  <Box
                    sx={{
                      height: { xs: 620, md: 760 },
                      overflow: "auto",
                      bgcolor: "background.default",
                    }}
                  >
                    <Home previewClient={demoClient} />
                  </Box>
                </ThemeProvider>
              </Card>

              <Card
                variant="outlined"
                sx={{ position: { lg: "sticky" }, top: { lg: 24 } }}
              >
                <CardContent>
                  <Typography variant="h6" component="h2">
                    Preview theme color
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, mb: 2 }}>
                    Select a preset or enter a custom primary color.
                  </Typography>

                  <RadioGroup
                    value={themeSelection}
                    onChange={(event) =>
                      setThemeSelection(event.target.value as ThemeSelection)
                    }
                    aria-label="Theme color"
                  >
                    <Stack spacing={1}>
                      {presetOptions.map((option) => (
                        <Box
                          key={option.id}
                          sx={{
                            border: "1px solid",
                            borderColor:
                              themeSelection === option.id ? "primary.main" : "divider",
                            borderRadius: 2,
                            px: 1,
                          }}
                        >
                          <FormControlLabel
                            value={option.id}
                            control={<Radio />}
                            sx={{ width: "100%", minHeight: 54 }}
                            label={
                              <Stack direction="row" spacing={1.25} alignItems="center">
                                <Box
                                  aria-hidden="true"
                                  sx={{
                                    width: 26,
                                    height: 26,
                                    borderRadius: "50%",
                                    bgcolor: option.color,
                                    border: "1px solid rgba(0,0,0,0.15)",
                                    flexShrink: 0,
                                  }}
                                />
                                <Box>
                                  <Typography variant="body2" sx={{ fontWeight: 700 }}>
                                    {option.label}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary" sx={{ fontFamily: "monospace" }}>
                                    {option.color}
                                  </Typography>
                                </Box>
                              </Stack>
                            }
                          />
                        </Box>
                      ))}

                      <Box
                        sx={{
                          border: "1px solid",
                          borderColor:
                            themeSelection === "custom" ? "primary.main" : "divider",
                          borderRadius: 2,
                          p: 1,
                        }}
                      >
                        <FormControlLabel
                          value="custom"
                          control={<Radio />}
                          label="Custom"
                          sx={{ minHeight: 38 }}
                        />
                        <TextField
                          fullWidth
                          size="small"
                          label="Custom primary hex"
                          placeholder="#6750a4"
                          value={customColor}
                          onFocus={() => setThemeSelection("custom")}
                          onChange={(event) => {
                            setThemeSelection("custom");
                            setCustomColor(event.target.value.trim());
                          }}
                          error={
                            themeSelection === "custom" &&
                            customColor.length > 0 &&
                            !customColorIsValid
                          }
                          helperText={
                            themeSelection === "custom" &&
                            customColor.length > 0 &&
                            !customColorIsValid
                              ? "Enter a valid 3- or 6-digit hex color."
                              : "Example: #6750a4"
                          }
                          slotProps={{
                            input: {
                              startAdornment: (
                                <Box
                                  aria-hidden="true"
                                  sx={{
                                    width: 22,
                                    height: 22,
                                    mr: 1,
                                    borderRadius: "50%",
                                    bgcolor: customColorIsValid ? customColor : "background.surface",
                                    border: "1px solid",
                                    borderColor: "divider",
                                  }}
                                />
                              ),
                            },
                          }}
                        />
                      </Box>
                    </Stack>
                  </RadioGroup>
                </CardContent>
              </Card>
            </Box>
          </Stack>
        )}
      </Stack>
    </Box>
  );
}
