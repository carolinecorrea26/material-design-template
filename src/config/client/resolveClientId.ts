import type { ClientId } from "../../types";
import { getActiveSite } from "../../data/activeSite";

export function resolveClientId(): ClientId {
  return getActiveSite().legacyClientId;
}
