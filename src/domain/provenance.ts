/** Extend the vocabulary by inserting a controlled tag, never by inventing owners. */
export const providedByTags = ["Client/AM", "Dev/QA", "PRASE", "UW", "Contracts", "Compliance", "Portal", "TPA", "Legal"] as const;
export interface LibraryMetadata {
  displayId: number;
  providedBy: string | null;
  sourceReference: string | null;
}

/** Stable 48-bit namespace identity; independent of sorting, filtering and seed order.
 * Persist on creation. Collisions are rejected by validation and UNIQUE constraints.
 */
export function libraryDisplayId(table: string, key: string): number {
  let hash = 0xcbf29ce484222325n;
  for (const char of `${table}:${key}`) hash = BigInt.asUintN(64, (hash ^ BigInt(char.codePointAt(0)!)) * 0x100000001b3n);
  return Number(hash & 0xffffffffffffn) || 1;
}

export function libraryMetadata(table: string, key: string, sourceReference: string | null = null): LibraryMetadata {
  return { displayId: libraryDisplayId(table, key), providedBy: null, sourceReference };
}
