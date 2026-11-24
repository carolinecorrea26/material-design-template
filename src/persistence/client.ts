import { MockOperationsAdapter } from "./mockOperationsAdapter";
import type { PersistenceAdapter } from "./adapter";
import { LocalStorageAdapter } from "./localAdapter";
import { createSeedDatabase } from "./seed";
import { JsonCatalogAdapter } from './jsonCatalogAdapter';
import { portalDatabaseEnabled } from '../services/portalClient';

const browserStorage = typeof window === "undefined" ? undefined : window.localStorage;
const local = new LocalStorageAdapter(createSeedDatabase(), browserStorage);
export const persistence: PersistenceAdapter = !portalDatabaseEnabled && import.meta.env.VITE_MOCK_PLATFORM_ENABLED
  ? new MockOperationsAdapter(local)
  : new JsonCatalogAdapter(local);

export const persistenceMode = persistence.kind;
