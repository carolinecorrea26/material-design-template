import references from '../../requirements/global/content-references.json';
import contentBindings from '../../requirements/global/content-bindings.json';
import { canonicalContentKey, resolveContentReferences } from './contentReferences.mjs';
type PageContentMapping = { page?: string; content?: Record<string, string>; help?: Array<{ id: string; chip: string; title: string }> };
const unwrap = <T,>(module: unknown) => ((module as { default?: T }).default ?? module) as T;
const authoredContent = Object.assign({}, ...Object.values(import.meta.glob("../../requirements/global/content/*.json", { eager: true })).map(module => unwrap<Record<string, unknown>>(module))) as Record<string, unknown>;
const pages = Object.values(import.meta.glob("../../requirements/parked/*.json", { eager: true })).map(module => unwrap<PageContentMapping>(module));
const interpolate = (value: string, variables: Record<string, string>) => value.replace(/\{\{([^}]+)\}\}/g, (placeholder, name: string) => variables[name] ?? placeholder);

/** Shared applicant wording. Templates remain intact until their owning surface supplies values. */
export function requirementText(key: string, variables: Record<string, string> = {}, source = authoredContent): string {
  const value = source[canonicalContentKey(key, references)];
  if (typeof value !== "string") throw new Error(`Missing requirements text: ${key}`);
  return interpolate(value, variables);
}

/** Ordered messages/labels remain one authored unit rather than numbered keys. */
export function requirementTextList(key: string, variables: Record<string, string> = {}, source = authoredContent): string[] {
  const value = source[canonicalContentKey(key, references)];
  if (!Array.isArray(value) || !value.length || !value.every(item => typeof item === 'string' && item.trim())) throw new Error(`Missing requirements text list: ${key}`);
  return value.map(item => interpolate(item, variables));
}

export function requirementHelpChips(pageKey: string) {
  return (pages.find(page => page.page === pageKey)?.help ?? []).map(item => ({ id: item.id, label: requirementText(item.chip) }));
}


/** Page selections and labels have one authored owner; content renderers bind by topic ID. */
export function requirementPageHelp(pageKey: string) {
  return (pages.find(page => page.page === pageKey)?.help ?? []).map(item => ({ id: item.id, label: requirementText(item.chip), title: requirementText(item.title) }));
}
export function requirementPageHelpChips() {
  return Object.fromEntries(pages.filter(page => page.help?.length).map(page => [page.page!, requirementHelpChips(page.page!)]));
}

export function requirementContentValues() { return resolveContentReferences(authoredContent, references); }

/** Standalone defaults project the same binding contract as effective content.
 * They never carry an independently authored copy of display wording. */
export function requirementContentSection<T>(root: string, source = authoredContent): T {
  const output: Record<string, unknown> = {};
  for (const [key, targets] of Object.entries(contentBindings)) for (const target of [targets].flat()) {
    if (!target.startsWith(`${root}.`)) continue;
    const owner = canonicalContentKey(key, references);
    if (!Object.hasOwn(source, owner)) throw new Error(`Missing requirements content: ${key}`);
    const path = target.slice(root.length + 1).split('.');
    let current = output;
    for (const segment of path.slice(0, -1)) current = (current[segment] ??= {}) as Record<string, unknown>;
    current[path.at(-1)!] = structuredClone(source[owner]);
  }
  if (!Object.keys(output).length) throw new Error(`Missing requirements content section: ${root}`);
  return output as T;
}
