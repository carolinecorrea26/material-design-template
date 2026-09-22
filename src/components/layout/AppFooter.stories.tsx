import type { Meta, StoryObj } from "@storybook/react-vite";
import AppFooter from "./AppFooter";
import { getActiveClient } from "../../config/client/getActiveClient";

/**
 * AppFooter renders support info and opens the Terms of Use / Privacy
 * Notice modals (via LegalDocList — see Content/LegalDocList for that
 * content in isolation). 3-column grid on desktop collapsing to 1 column
 * on mobile. Also listens for a global `app:open-privacy-notice` custom
 * event (dispatched elsewhere in the app, e.g. from a field's helper
 * text) to open the Privacy Notice modal on demand.
 */
const meta = {
  title: "Layout/AppFooter",
  component: AppFooter,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof AppFooter>;

export default meta;

export const Default: StoryObj = {
  render: () => <AppFooter client={getActiveClient()} />,
  parameters: {
    docs: {
      description: {
        story:
          'Click "Terms of Use" or "Privacy Notice" to open the real legal-content modals.',
      },
    },
  },
};
