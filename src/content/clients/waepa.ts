import type { DeepPartial } from "../types-util";
import type { SiteContent } from "../types";

/**
 * WAEPA-specific content overrides.
 * Only properties that differ from defaults need to be specified.
 */
export const waepaContentOverrides: DeepPartial<SiteContent> = {};
