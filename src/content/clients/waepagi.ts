import type { DeepPartial } from "../types-util";
import type { SiteContent } from "../types";

/**
 * WAEPAGI-specific content overrides.
 * Only properties that differ from defaults need to be specified.
 */
export const waepagiContentOverrides: DeepPartial<SiteContent> = {
  pages: {
    membership: {
      infoNote:
        "Applying for coverage will make you a new member if you are not currently a WAEPA member.",
    },
  },
};
