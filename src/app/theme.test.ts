// @vitest-environment node
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Badge, Breadcrumbs, Button, Chip, FormHelperText, FormLabel, Link, TextField, ThemeProvider, ToggleButton, Typography } from "@mui/material";
import { describe, expect, it, vi } from "vitest";
import { createTheme } from "@mui/material/styles";
import { createAppTheme } from "./theme";
import type { ThemeColorId } from "../config/clients/types";
import SectionDivider from "../components/layout/SectionDivider";
import FormShell from "../components/layout/FormShell";
import PageTitle from "../components/layout/PageTitle";

const presetPrimaryColors: Record<
  ThemeColorId,
  { main: string; light: string; dark: string }
> = {
  default: { main: "#0668ff", light: "#5c94ff", dark: "#034cba" },
  teal: { main: "#0882a1", light: "#39a4bf", dark: "#005b70" },
  purple: { main: "#3f51b5", light: "#7986cb", dark: "#283593" },
  "dark-blue": { main: "#045aab", light: "#316493", dark: "#002f5b" },
};

describe("createAppTheme", () => {
  it("keeps shared page titles at 1.5rem and the text scale at or above 0.875rem", () => {
    const theme = createAppTheme();
    expect(theme.typography.h3.fontSize).toBe("1.5rem");
    expect(Object.keys(theme.typography.h3).some(key => key.startsWith('@media'))).toBe(false);
    expect(createAppTheme('default', { forceMobileLayout: true }).typography.h3.fontSize).toBe('1.5rem');
    for (const variant of ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'body1', 'body2', 'subtitle1', 'subtitle2', 'caption', 'overline', 'button'] as const) {
      expect(parseFloat(String(theme.typography[variant].fontSize)), variant).toBeGreaterThanOrEqual(0.875);
    }
    const html = renderToStaticMarkup(createElement(ThemeProvider, { theme },
      createElement(PageTitle, { title: 'Your application' }),
      createElement(FormHelperText, null, 'Required information'),
      createElement(TextField, { label: 'Name', defaultValue: 'Jordan' }),
      createElement(Button, { size: 'small' }, 'Continue'),
      createElement(ToggleButton, { size: 'small', value: 'view' }, 'View'),
      createElement(Chip, { label: 'Coverage', size: 'small' }),
      createElement(Badge, { badgeContent: 2 }, 'Products'),
      createElement(SectionDivider, { label: 'Additional information', variant: 'subsection' }),
    ));
    expect(html).toMatch(/<h2 class="[^"]*MuiTypography-h3/);
    expect(html).toContain('font-size:0.875rem');
    expect(html).toContain('font-size:calc(0.875rem / 0.75)');
    // Emotion can retain MUI's earlier declarations; the final declaration wins.
    const controlRules = [...html.matchAll(/\.css-[^{} >:]+-Mui(?:Button-root|Chip-root|Badge-badge|ToggleButton-root|FormHelperText-root)\{([^}]+)\}/g)];
    expect(controlRules.length).toBeGreaterThanOrEqual(5);
    const finalSizes = controlRules.map(([, declarations]) => [...declarations.matchAll(/font-size:([^;]+);/g)].at(-1)?.[1]).filter(Boolean);
    expect(finalSizes.length).toBeGreaterThanOrEqual(5);
    expect(new Set(finalSizes)).toEqual(new Set(['0.875rem']));
  });
  it("owns active and completed breadcrumb emphasis separately from normal link weight", () => {
    const html = renderToStaticMarkup(createElement(ThemeProvider, { theme: createAppTheme() },
      createElement(Breadcrumbs, null,
        createElement(Link, { href: '#', variant: 'inherit', 'data-completed': 'true' }, 'Membership'),
        createElement(Typography, { variant: 'inherit', 'aria-current': 'page' }, 'Eligibility'),
        createElement(Typography, { variant: 'inherit' }, 'Coverage'),
      ),
    ));
    expect(html).toMatch(/\[aria-current="page"\][^{]*\[data-completed="true"\]\{font-weight:500;\}/);
    expect(html).toContain('font-size:0.875rem');
    expect(html).toContain('font-weight:600');
  });
  it.each(["default", "teal"] as const)("styles field groups with uppercase labels, a light %s surface and white inputs", preset => {
    const theme = createAppTheme(preset);
    const html = renderToStaticMarkup(createElement(ThemeProvider, { theme },
      createElement(SectionDivider, { label: "Personal information", variant: "subsection" },
        createElement(TextField, { label: "Weight", defaultValue: "150" })),
    ));
    expect(html).toMatch(/<section\b[^>]*aria-label="Personal information"/);
    expect(html).toContain("text-transform:uppercase");
    expect(html).toContain("letter-spacing:0.06em");
    expect(html).not.toContain("MuiChip-root");
    expect(html).toContain("FieldGroup-root");
    expect(html).toContain("border-radius:16px");
    expect(html).toContain("margin-bottom:32px");
    expect(html).toContain(`background-color:${theme.palette.background.default}`);
    expect(html).toContain("background-color:#fff");
  });
  it("uses compact responsive padding and rounded corners on the shared form shell", () => {
    const html = renderToStaticMarkup(createElement(ThemeProvider, { theme: createAppTheme() },
      createElement(FormShell, null, "Form content"),
    ));
    expect(html).toContain("border-radius:16px");
    expect(html).toContain("padding:16px");
    expect(html).toContain("padding:24px");
    expect(html).not.toContain("padding:48px");
  });
  it("uses the reviewed shared field and link styling and disables loading buttons", () => {
    const theme = createAppTheme();
    const html = renderToStaticMarkup(createElement(ThemeProvider, { theme },
      createElement(FormHelperText, null, "Help"),
      createElement(FormLabel, null, "Label"),
      createElement(Link, { href: "#" }, "Link"),
      createElement(Button, { loading: true }, "Saving"),
    ));
    expect(html).toContain("line-height:1.2");
    expect(html).not.toContain("margin-bottom:14px");
    expect(html).toContain("font-weight:500");
    expect(html).toContain("font-weight:600");
    expect(html).toContain("text-decoration:none");
    expect(html).toMatch(/<button[^>]*disabled=""/);
  });
  it.each(["contained", "outlined", "text"] as const)("renders %s buttons as pills by default, including disabled and loading states", variant => {
    const theme = createAppTheme();
    for (const state of [{}, { disabled: true }, { loading: true }]) {
      const markup = renderToStaticMarkup(createElement(ThemeProvider, { theme }, createElement(Button, { variant, ...state }, "Continue")));
      expect(markup).toContain("border-radius:9999px");
    }
  });
  it("inherits the pill default for custom palettes and honors an explicit standard shape", () => {
    const button = (buttonShape?: "standard" | "pill") => renderToStaticMarkup(createElement(ThemeProvider,
      { theme: createAppTheme({ type: "custom", primary: "#001F5F", buttonShape }) }, createElement(Button, { variant: "contained" }, "Continue")));
    expect(button()).toContain("border-radius:9999px");
    expect(button("standard")).not.toContain("border-radius:9999px");
  });

  it.each(Object.keys(presetPrimaryColors) as ThemeColorId[])("inherits %s for buttons and supporting accents without an override", preset => {
    const theme = createAppTheme(preset);
    expect(theme.palette.secondary.main).toBe(theme.palette.primary.main);
    const markup = renderToStaticMarkup(createElement(ThemeProvider, { theme }, createElement(Button, { variant: "contained" }, "Continue")));
    expect(markup).toContain(`--variant-containedBg:${theme.palette.primary.main}`);
    expect(markup).not.toContain("background-color:#00729f");
  });
  it("keeps a button override separate from links and other controls", () => {
    const theme = createAppTheme({ type: "custom", primary: "#002c85", primaryAction: { main: "#f1b435", tone: "light" } });
    expect(theme.palette.primary.main).toBe("#002c85");
    expect(theme.palette.secondary.main).toBe("#002c85");
    const markup = renderToStaticMarkup(createElement(ThemeProvider, { theme }, createElement(Button, { variant: "contained" }, "Continue")));
    expect(markup).toContain("background-color:#f1b435");
    expect(markup).toContain(`color:${theme.palette.text.primary}`);
    expect(() => createAppTheme({ type: "preset", preset: "default", primaryAction: { main: "#invalid", tone: "dark" } })).toThrow("Invalid button override color");
  });
  it.each(Object.entries(presetPrimaryColors))(
    "preserves the %s preset palette",
    (preset, expected) => {
      const theme = createAppTheme({
        type: "preset",
        preset: preset as ThemeColorId,
      });

      expect(theme.palette.primary).toMatchObject(expected);
    },
  );

  it("derives a complete primary palette from one custom color", () => {
    const theme = createAppTheme({ type: "custom", primary: "#6750a4" });

    expect(theme.palette.primary.main).toBe("#6750a4");
    expect(theme.palette.primary.light).not.toBe("#6750a4");
    expect(theme.palette.primary.dark).not.toBe("#6750a4");
    expect(theme.palette.primary.contrastText).toBeTruthy();
    expect(theme.palette.error.main).toBe("#ed0a0a");
    expect(theme.palette.success.main).toBe("#009465");
  });

  it("rejects an invalid custom color at runtime", () => {
    expect(() =>
      createAppTheme({ type: "custom", primary: "#not-a-color" }),
    ).toThrow("Invalid custom theme primary color");
  });
});


it.each(['default', 'teal', 'purple', 'dark-blue'] as const)('uses standard MUI surface roles for %s without custom palette extensions', preset => {
  const theme = createAppTheme(preset);
  const mui = createTheme();
  for (const key of ['panel', 'support', 'notice']) expect(theme.palette).not.toHaveProperty(key);
  for (const key of ['subtle', 'surface', 'iconBadge']) expect(theme.palette.background).not.toHaveProperty(key);
  expect(theme.palette.text).not.toHaveProperty('tertiary');
  expect(theme.palette.action).toEqual(mui.palette.action);
  expect(theme.palette.grey).toEqual(mui.palette.grey);
  expect(theme.palette.background.paper).toBe('#fff');
});

it('documents every active component theme override and distinguishes shared selection-row styling', async () => {
  const { MuiThemeOverrides } = await import('../docs/foundations/ThemeOverrides');
  const theme = createAppTheme();
  // FieldRenderer reads the browser-only completion-icon query parameter.
  vi.stubGlobal('window', { location: { search: '' } });
  let html: string;
  try {
    html = renderToStaticMarkup(createElement(ThemeProvider, { theme }, createElement(MuiThemeOverrides)));
  } finally { vi.unstubAllGlobals(); }
  const documented = new Set([...html.matchAll(/data-theme-components="([^"]+)"/g)].flatMap(match => match[1].split(' ')));
  expect(documented).toEqual(new Set(Object.keys(theme.components ?? {})));
  expect(html).toContain('SelectionGroup adds full-width rounded rows');
  expect(html).toContain('name="app-gender"');
  expect(html).toContain('name="app-dependents"');
  expect(html).not.toContain('Theme foundations');
  expect(html.match(/data-theme-example="mui-default"/g)).toHaveLength(18);
  expect(html.match(/data-theme-example="application-override"/g)).toHaveLength(18);
  expect(html).not.toContain('Default chip');
  expect(html).not.toContain('MuiAppBar');
});
