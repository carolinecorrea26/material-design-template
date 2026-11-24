import { createHash } from 'node:crypto';

/** Missing or changed historical owners invalidate a receipt; they cannot
 * abort an entire audit or silently certify the replacement implementation. */
export function recordedFilesMatch(files: Record<string, string>, read: (path: string) => string | Uint8Array): boolean {
  if (!Object.keys(files).length) return false;
  try {
    return Object.entries(files).every(([path, expected]) => createHash('sha256').update(read(path)).digest('hex') === expected);
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && ['ENOENT', 'ENOTDIR'].includes(String(error.code))) return false;
    throw error;
  }
}
