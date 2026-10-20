import type { defaultPages } from "../config/pageCatalog";
import type { coverages } from "../config/coverages";
import type { pageGroupIds } from "../config/pageGroupIds";
import type { pageGroups } from "../config/pageGroups";

// Page types
export type Page = (typeof defaultPages)[number];
export type PageId = Page["id"];
export type PageType = Page["type"];

// Client types
export type ClientId =
  | "demo"
  | "abe"
  | "ama"
  | "asce"
  | "avma"
  | "csea"
  | "isitrust"
  | "nso"
  | "waepa"
  | "waepagi";

// Coverage types
export type Coverage = (typeof coverages)[number];
export type CoverageId = Coverage["id"];

// Page group types
export type PageGroupId = (typeof pageGroupIds)[number];
export type PageGroup = (typeof pageGroups)[number];
