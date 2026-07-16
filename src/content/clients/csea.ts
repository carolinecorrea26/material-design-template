import type { DeepPartial } from "../types-util";
import type { SiteContent } from "../types";

/**
 * CSEA-specific content overrides.
 * Only properties that differ from defaults need to be specified.
 */
export const cseaContentOverrides: DeepPartial<SiteContent> = {
  pages: {
    membership: {
      infoNote:
        "This program is available exclusively to CSEA members. c/o Pearl Insurance, 13 Airline Drive, Albany, NY 12205.",
    },
  },
};
