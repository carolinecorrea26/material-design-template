import type { DeepPartial } from "../types-util";
import type { SiteContent } from "../types";

/**
 * ABE-specific content overrides.
 * Only properties that differ from defaults need to be specified.
 */
export const abeContentOverrides: DeepPartial<SiteContent> = {
  home: {
    hero: {
      title: "High quality insurance and exclusive rates for members",
    },
  },
};
