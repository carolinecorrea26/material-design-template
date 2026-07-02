import type { DeepPartial } from "../types-util";
import type { SiteContent } from "../types";

/**
 * AVMA-specific content overrides.
 * Only properties that differ from defaults need to be specified.
 */
export const avmaContentOverrides: DeepPartial<SiteContent> = {
  pages: {
    membership: {
      infoNote:
        "SAVMA members and graduating SAVMA members should visit http://avmalife.org/Students.",
    },
  },
};
