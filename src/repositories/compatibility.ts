function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function mergeConfiguration<T>(base: T, override: Partial<T> | undefined): T {
  if (!override) return base;
  const result = { ...(base as Record<string, unknown>) };
  for (const [key, value] of Object.entries(override)) {
    if (value === undefined) continue;
    const baseValue = result[key];
    result[key] = isRecord(baseValue) && isRecord(value)
      ? mergeConfiguration(baseValue, value)
      : value;
  }
  return result as T;
}

