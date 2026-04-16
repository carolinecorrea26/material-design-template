import { pageGroupIds } from "../config/pageGroupIds";
import { pageGroups } from "../config/pageGroups";

export type PageGroupId = (typeof pageGroupIds)[number];
export type PageGroup = (typeof pageGroups)[number];
