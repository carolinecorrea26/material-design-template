import { pages } from "../config/pages";

export type Page = (typeof pages)[number];
export type PageId = Page["id"];
export type PageType = Page["type"];
