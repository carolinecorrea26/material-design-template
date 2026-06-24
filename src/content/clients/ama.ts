import type { DeepPartial } from "../types-util";
import type { SiteContent } from "../types";

/**
 * AMA-specific content overrides.
 * Only properties that differ from defaults need to be specified.
 */
export const amaContentOverrides: DeepPartial<SiteContent> = {
  home: {
    hero: {
      description:
        "Coverage designed exclusively for American Medical Association members. Get started today!",
    },
    clientSection: {
      tagline: "Helping physicians protect what matters most",
      paragraphs: [
        "For more than 50 years, AMA-sponsored insurance has helped protect physicians and their families.",
        "As a subsidiary of the American Medical Association, AMA Insurance uses the group buying power of more than one million physicians to offer specially negotiated rates and tailored benefits from top insurance companies.",
      ],
    },
  },
};
