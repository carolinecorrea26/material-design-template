import type { Preview } from "@storybook/react-vite";
import { CssBaseline, ThemeProvider } from "@mui/material";
import { MemoryRouter } from "react-router-dom";
import { createAppTheme } from "../src/app/theme";
import type { ThemeColorId } from "../src/config/clients/types";

/**
 * Shared app chrome for every story: router context (many shared components
 * read route/location), the real MUI theme (never a second hand-authored
 * token set), and CssBaseline. Individual stories should not re-wrap this —
 * add story-specific providers via that story's own decorators only.
 *
 * The theme is built live from `createAppTheme` using the toolbar's "Theme"
 * global, so switching client presets in the toolbar re-themes every story
 * with the exact theme the app would use for that client.
 */
const preview: Preview = {
  decorators: [
    (Story, context) => (
      <MemoryRouter>
        <ThemeProvider
          theme={createAppTheme(context.globals.themeColor as ThemeColorId)}
        >
          <CssBaseline />
          <Story />
        </ThemeProvider>
      </MemoryRouter>
    ),
  ],
  parameters: {
    controls: {
      expanded: true,
    },
    layout: "centered",
    // Non-blocking by default (`test: "todo"`): violations surface in the
    // Accessibility panel and as a status dot on the story, without failing
    // `storybook test`/CI. Flip a specific story to "error" once its a11y
    // behavior is verified, so a regression there does fail the build.
    a11y: {
      test: "todo",
    },
    options: {
      storySort: {
        order: [
          "Overview",
          "Foundations",
          ["Overview", "Colors", "Typography", "Spacing", "Shape", "Elevation", "Breakpoints & Responsive Design", "MUI Theme Overrides", "Branding", "Icons"],
          "Guidelines",
          ["Accessibility", "Form Validation & Errors", "Responsive UI", "Dynamic Feedback & Status"],
          "Forms",
          "Layout",
          "Navigation",
          "Content",
          "Feedback",
          "Overlays",
          "Coverage & Commerce",
          "Application Patterns",
          ["Application Page Template", "Page Coverage Audit", "DetailsTable", "YesNoDetailList"],
          "Project",
        ],
      },
    },
  },
  globalTypes: {
    themeColor: {
      description: "Client theme color preset (createAppTheme colorId)",
      toolbar: {
        title: "Theme",
        icon: "paintbrush",
        items: [
          { value: "default", title: "Default (blue)" },
          { value: "teal", title: "Teal" },
          { value: "purple", title: "Purple" },
          { value: "dark-blue", title: "Dark blue" },
        ],
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: {
    themeColor: "default",
  },
};

export default preview;
