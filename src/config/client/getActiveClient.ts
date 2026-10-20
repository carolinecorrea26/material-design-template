import { getActiveSiteConfiguration } from "../../data/activeSite";

export function getActiveClient() {
  return getActiveSiteConfiguration();
}
