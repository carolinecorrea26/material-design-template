import type { Meta, StoryObj } from "@storybook/react-vite";
import ClientHelpBanner from "./ClientHelpBanner";
import { getActiveClient } from "../../config/client/getActiveClient";

/**
 * ClientHelpBanner is the full-bleed support bar (call/chat/link/schedule)
 * shown by AppHeader whenever the active client has a support phone
 * number configured — it returns null entirely otherwise. Uses a
 * `100vw`/negative-margin trick to bleed edge-to-edge regardless of its
 * parent's max-width. Every action button is conditionally rendered based
 * on the real active client's `support`/`features` config, not props of
 * its own — this story uses the real default client rather than
 * fabricating a client object, so which buttons show is itself real
 * information.
 */
const meta = {
  title: "Layout/ClientHelpBanner",
  component: ClientHelpBanner,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof ClientHelpBanner>;

export default meta;

export const Default: StoryObj = {
  render: () => <ClientHelpBanner client={getActiveClient()} />,
  parameters: {
    docs: {
      description: {
        story:
          "Renders with the real active (\"demo\") client's support config via getActiveClient() — not props of its own. The toolbar's Theme control only swaps createAppTheme's color preset, not the active client, so it won't change which buttons appear here; that's driven by the client resolved from the URL/sessionStorage, which Storybook has no override for.",
      },
    },
  },
};
