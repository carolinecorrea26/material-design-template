import type { PersistenceAdapter } from "../persistence/adapter";
import { createPortalDataRepository, effectiveSiteSnapshotTables } from "./portalDataRepository";

/** Opt-in candidate reads through one consistent revision. No runtime installation. */
export function createEffectiveSiteRepository(adapter: PersistenceAdapter) {
  const repository = createPortalDataRepository(adapter);
  return {
    async resolve(siteKey: string) {
      const revision = await repository.open(effectiveSiteSnapshotTables);
      return revision.resolveSite(siteKey).site;
    },
    async resolveRevision(siteKey: string) {
      const revision = await repository.open(effectiveSiteSnapshotTables);
      return revision.resolveSite(siteKey);
    },
  };
}
