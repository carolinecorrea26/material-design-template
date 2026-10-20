
import type { LibraryMetadata } from "../../domain/provenance";
/** Optional only for pre-migration adapter records; Phase 4 requires all metadata. */
export interface LibraryRow<T> extends Partial<LibraryMetadata> { id: string; key: string; position: number; definition: T }
export interface Scope { scope: "global" | "client" | "site"; clientKey: string | null; siteKey: string | null }
