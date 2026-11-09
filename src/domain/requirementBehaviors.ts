import { requirementPages } from "./requirementFields";

type ComponentNode = { type: string; mapping?: string; components?: ComponentNode[] };
type Page = { page: string; components?: ComponentNode[] };
type Mapping = { component: string; pages?: string[]; rules?: string[]; workflows?: string[] };
type Behavior = { id: string; name: string; status: string; statement: string; source: string };
const documents = <T,>(modules: Record<string, unknown>) => Object.entries(modules).map(([path, module]) => ({
  path: path.replace(/^.*\/requirements\//, "requirements/"),
  document: ((module as { default?: T }).default ?? module) as T,
}));

/** Library documentation of confirmed requirements; this does not execute rules or integrations. */
export function confirmedRequirementBehaviors(pageKeys: string[]) {
  const pages = documents<Page>(import.meta.glob("../../requirements/parked/*.json", { eager: true }));
  const mappings = documents<Mapping>(import.meta.glob("../../requirements/mappings/requirements/*.json", { eager: true }));
  const definitions = [
    ...documents<{ rules: Behavior[] }>(import.meta.glob("../../requirements/global/rules/*.json", { eager: true })).flatMap(({ path, document }) => document.rules.map(record => ({ ...record, kind: "rule", path }))),
    ...documents<{ workflows: Behavior[] }>(import.meta.glob("../../requirements/global/workflows/*.json", { eager: true })).flatMap(({ path, document }) => document.workflows.map(record => ({ ...record, kind: "workflow", path }))),
  ];
  const result = new Map<string, typeof definitions[number] & { pages: string[] }>();
  for (const pageKey of pageKeys.filter(page => Object.hasOwn(requirementPages, page))) {
    const components = new Set<string>();
    const visit = (nodes: ComponentNode[]) => nodes.forEach(node => {
      const key = node.mapping ?? (/^[a-z]/.test(node.type) ? node.type : undefined);
      if (key) components.add(key);
      visit(node.components ?? []);
    });
    visit(pages.find(({ document }) => document.page === pageKey)?.document.components ?? []);
    for (const { document: mapping } of mappings) {
      if (!components.has(mapping.component) && !mapping.pages?.includes(pageKey)) continue;
      for (const kind of ["rule", "workflow"] as const) for (const id of (kind === "rule" ? mapping.rules : mapping.workflows) ?? []) {
        const record = definitions.find(record => record.id === id && record.kind === kind);
        if (!record) throw new Error(`Missing ${kind} requirement: ${id}`);
        if (record.status !== "confirmed") continue;
        const existing = result.get(id);
        if (existing) { if (!existing.pages.includes(pageKey)) existing.pages.push(pageKey); }
        else result.set(id, { ...record, pages: [pageKey] });
      }
    }
  }
  return [...result.values()];
}
