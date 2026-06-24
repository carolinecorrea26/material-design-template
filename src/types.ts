import { pages } from "./config/pages";
import { coverages } from "./config/coverages";
import { pageGroupIds } from "./config/pageGroupIds";
import { pageGroups } from "./config/pageGroups";

// Page types
export type Page = (typeof pages)[number];
export type PageId = Page["id"];
export type PageType = Page["type"];

// Client types
export type ClientId = "demo" | "abe" | "ama" | "waepa";

export type ClientConfig = {
  id: ClientId;
  name: string;
  acronym: string;
  logo: string;
  logoAlt: string;
  support: {
    phone?: string;
    email?: string;
    website?: string;
    address?: string;
  };
};

// Coverage types
export type Coverage = (typeof coverages)[number];
export type CoverageId = Coverage["id"];

// Page group types
export type PageGroupId = (typeof pageGroupIds)[number];
export type PageGroup = (typeof pageGroups)[number];
