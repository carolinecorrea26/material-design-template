import type { ClientId } from "../../types";
import { clients } from "./index";
import type { ClientBranding, ClientConfig } from "./types";

export type ClientGroup = {
  groupId: string;
  /** Representative branding for the group (its first site's branding). */
  branding: ClientBranding;
  sites: ClientConfig[];
};

/**
 * Groups clients/*.ts entries into logical clients for site-selection UI —
 * two ClientConfig entries sharing a clientGroupId are the same client with
 * multiple sites (e.g. WAEPA's multi-step and single-page/GI sites), not two
 * unrelated clients. A client with no clientGroupId is its own group of one.
 */
export const clientGroups: ClientGroup[] = (() => {
  const order: string[] = [];
  const byGroup = new Map<string, ClientConfig[]>();

  for (const client of Object.values(clients)) {
    const groupId = client.clientGroupId ?? client.id;
    if (!byGroup.has(groupId)) {
      order.push(groupId);
      byGroup.set(groupId, []);
    }
    byGroup.get(groupId)!.push(client);
  }

  return order.map((groupId) => {
    const sites = byGroup.get(groupId)!;
    return { groupId, branding: sites[0].branding, sites };
  });
})();

export function getClientGroupForSiteId(id: ClientId): ClientGroup {
  const groupId = clients[id].clientGroupId ?? id;
  return clientGroups.find((g) => g.groupId === groupId)!;
}
