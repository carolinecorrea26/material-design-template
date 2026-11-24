
type ComponentNode = { type: string; partOf?: string; mapping?: string; components?: ComponentNode[] };
type Page = { page: string; consumerKey?: string; components?: ComponentNode[] };
type Mapping = { component: string; pages?: string[]; rules?: string[]; workflows?: string[] };
type Behavior = import("./ruleTemplates.mjs").RuleTemplateScope & { id: string; name: string; status: string; statement: string; source: string; uses?: string[]; appliesTo?: 'all-pages' };
const documents = <T,>(modules: Record<string, unknown>) => Object.entries(modules).map(([path, module]) => ({
  path: path.replace(/^.*\/requirements\//, "requirements/"),
  document: ((module as { default?: T }).default ?? module) as T,
}));

/** Page documentation includes explicitly placed shared components, even when rendered by a page template. */
export function declaredPageComponents(pageKey: string) {
  const pages = documents<Page>(import.meta.glob('../../requirements/parked/*.json', { eager: true }));
  const shared = documents<{ components: Array<{ id: string; implementation: string }> }>(import.meta.glob('../../requirements/global/shared-components.json', { eager: true }))[0].document.components;
  const names = new Set<string>();
  const visit = (nodes: ComponentNode[]) => nodes.forEach(node => {
    names.add(shared.find(component => component.id === (node.mapping ?? node.type))?.implementation ?? node.partOf ?? node.type);
    visit(node.components ?? []);
  });
  visit(pages.find(({ document }) => document.page === pageKey || document.consumerKey === pageKey)?.document.components ?? []);
  return names;
}

/** Library documentation of confirmed requirements; this does not execute rules or integrations. */
export function confirmedRequirementBehaviors(pageKeys?: string[]) {
  const pages = documents<Page>(import.meta.glob("../../requirements/parked/*.json", { eager: true }));
  const mappings = documents<Mapping>(import.meta.glob("../../requirements/mappings/requirements/*.json", { eager: true }));
  const definitions = [
    ...documents<{ rules: Behavior[] }>(import.meta.glob("../../requirements/global/rules/*.json", { eager: true })).flatMap(({ path, document }) => document.rules.map(record => ({ ...record, kind: "rule", path }))),
    ...documents<{ workflows: Behavior[] }>(import.meta.glob("../../requirements/global/workflows/*.json", { eager: true })).flatMap(({ path, document }) => document.workflows.map(record => ({ ...record, kind: "workflow", path }))),
  ];
  const result = new Map<string, typeof definitions[number] & { pages: string[] }>();
  const selected = (pageKeys ?? pages.map(({ document }) => document.page)).filter(page => pages.some(({ document }) => document.page === page));
  // Template-wide contracts apply to current and future pages without copied mappings.
  if (selected.length) for (const record of definitions.filter(record => record.appliesTo === 'all-pages' && record.status === 'confirmed')) {
    result.set(record.id, { ...record, pages: [...new Set(selected)] });
  }
  for (const pageKey of selected.filter(page => pages.some(({ document }) => document.page === page))) {
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
