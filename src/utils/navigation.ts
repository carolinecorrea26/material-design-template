import type { AppPage } from "../config/pages";
import type { ClientFeatures } from "../config/clients";
import { PAGES } from "../config/pages";

const normalizePath = (path: string) => {
  if (path.length > 1 && path.endsWith("/")) {
    return path.replace(/\/+$/, "");
  }
  return path;
};

export const getApplicationPages = (features: ClientFeatures): AppPage[] =>
  PAGES.filter((page) => {
    if (page.section !== "application") return false;
    if (page.path === "/membership" && !features.showMembershipPage) {
      return false;
    }
    return true;
  });

export const findPageIndex = (pages: AppPage[], path: string) => {
  const normalized = normalizePath(path);
  return pages.findIndex((page) => normalizePath(page.path) === normalized);
};
