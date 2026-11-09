type PageContentMapping = { page?: string; content?: Record<string, string>; help?: Array<{ id: string; chip: string }> };
const unwrap = <T,>(module: unknown) => ((module as { default?: T }).default ?? module) as T;
const authoredContent = Object.assign({}, ...Object.values(import.meta.glob("../../requirements/global/content/*.json", { eager: true })).map(module => unwrap<Record<string, unknown>>(module))) as Record<string, unknown>;
const pages = Object.values(import.meta.glob("../../requirements/parked/*.json", { eager: true })).map(module => unwrap<PageContentMapping>(module));
const interpolate = (value: string, variables: Record<string, string>) => value.replace(/\{\{([^}]+)\}\}/g, (placeholder, name: string) => variables[name] ?? placeholder);

/** Shared applicant wording. Templates remain intact until their owning surface supplies values. */
export function requirementText(key: string, variables: Record<string, string> = {}, source = authoredContent): string {
  const value = source[key];
  if (typeof value !== "string") throw new Error(`Missing requirements text: ${key}`);
  return interpolate(value, variables);
}

/** Ordered messages/labels remain one authored unit rather than numbered keys. */
export function requirementTextList(key: string, variables: Record<string, string> = {}, source = authoredContent): string[] {
  const value = source[key];
  if (!Array.isArray(value) || !value.length || !value.every(item => typeof item === 'string' && item.trim())) throw new Error(`Missing requirements text list: ${key}`);
  return value.map(item => interpolate(item, variables));
}

export function requirementHelpChips(pageKey: string) {
  return (pages.find(page => page.page === pageKey)?.help ?? []).map(item => ({ id: item.id, label: requirementText(item.chip) }));
}

