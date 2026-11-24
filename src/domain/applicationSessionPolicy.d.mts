export function applicationSessionPolicy(document: { configurations: Array<{ id: string; default?: unknown; globalOnly?: boolean }> }): { inactivityMinutes: number; warningMinutes: number };
