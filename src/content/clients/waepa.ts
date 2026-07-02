import type { DeepPartial } from "../types-util";
import type { SiteContent } from "../types";

/**
 * WAEPA-specific content overrides.
 * Only properties that differ from defaults need to be specified.
 */
export const waepaContentOverrides: DeepPartial<SiteContent> = {
  pages: {
    membership: {
      infoNote:
        "If you are not currently a WAEPA member, applying for coverage will make you a member.",
      sectionNotes: {
        membershipInformation:
          "Please provide the following information to complete your membership.",
      },
    },
  },
};
