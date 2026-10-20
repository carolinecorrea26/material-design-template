export const newId = (): string => globalThis.crypto?.randomUUID?.() ?? `local-${Date.now()}-${Math.random().toString(16).slice(2)}`;
export const now = (): string => new Date().toISOString();
