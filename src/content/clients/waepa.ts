import type { DeepPartial } from "../types-util";
import type { SiteContent } from "../types";

/**
 * WAEPA-specific content overrides.
 * Only properties that differ from defaults need to be specified.
 */
export const waepaContentOverrides: DeepPartial<SiteContent> = {
  home: {
    hero: {
      title: "Safeguard your family's future.",
      description:
        "Group Term Life and Group Short Term Disability Insurance, available exclusively to Civilian Federal Employees. Start your application today.",
    },
  },
  pages: {
    membership: {
      infoNote:
        "Applying for coverage will make you a new member if you are not currently a WAEPA member.",
      //   sectionNotes: {
      //     membershipInformation:
      //       "Please provide the following information to complete your membership.",
      //   },
    },
  },
};
