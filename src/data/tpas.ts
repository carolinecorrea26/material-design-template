import type { ClientConfig } from "../config/clients/types";
import type { Tpa, TpaId } from "./model";

/**
 * Current source data does not identify a shared TPA for any unrelated Clients.
 * Keep each Client under a deterministic compatibility TPA until authoritative
 * TPA identity, support, and branding are supplied. Client values are not copied
 * into the TPA record merely because the current deployment is often 1:1.
 */
export function compatibilityTpaId(clientId: string): TpaId {
  return `tpa-${clientId}`;
}

export function toCompatibilityTpa(config: ClientConfig): Tpa {
  return {
    id: compatibilityTpaId(config.clientGroupId ?? config.id),
    name: `Compatibility TPA for ${config.clientGroupId ?? config.id}`,
    provisional: true,
  };
}
