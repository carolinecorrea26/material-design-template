import withGlobalTemplate from "./globalTemplateDecorator";
import type { Preview } from "@storybook/react-vite";
import { CssBaseline, ThemeProvider } from "@mui/material";
import { MemoryRouter } from "react-router-dom";
import { createAppTheme } from "../src/app/theme";
import type { ThemeColorId } from "../src/config/clients/types";
import { ApplicationSessionProvider } from "../src/app/ApplicationSessionContext";

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
    withGlobalTemplate,
    (Story, context) => (
      <MemoryRouter initialEntries={context.parameters.router?.initialEntries}>
          <ThemeProvider
            theme={createAppTheme(context.globals.themeColor as ThemeColorId)}
          >
            <CssBaseline />
            {context.parameters.standalone ? <Story /> : <ApplicationSessionProvider><Story /></ApplicationSessionProvider>}
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
          "Foundations", ["Typography", "Colors", "Icons", "Responsive layout"],
          "Components", [
            "Actions", ["Buttons", "Links"],
            "Forms", ["Individual fields", "Field groups", ["Name", "Phone", "Address", "Height", "Layout"], "Selection rows", "Conditional groups", "Repeated records"],
            "Navigation", "Layout", "Content and data display", "Coverage and pricing",
            "Feedback and overlays", ["Banners", "Alerts", "Notifications", "Dialogs and drawers", ["Containers", "Application dialogs"], "Loading and processing", "Empty states"],
            "Pages", [
              "Home", ["Whole page", "Sections"], "Membership", ["Whole page", "Sections"],
              "Eligibility", ["Whole page", "Sections"], "Coverage", ["Whole page", "Sections"],
              "Beneficiary", ["Whole page", "Sections"], "Contact", ["Whole page", "Sections"],
              "Profile", ["Whole page", "Sections"], "Review", ["Whole page", "Sections"],
              "Health", ["Whole page", "Sections"], "Payment", ["Whole page", "Sections"],
              "E-sign", ["Whole page"], "Receipt", ["Whole page", "Sections"],
              "Resume", ["Whole page"], "Advisor", ["Whole page"], "Error pages", ["Whole page"],
            ],
          ],
          "Reference", ["Component inventory", "Theme configuration"],
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
