import type { DatabaseSchema } from "../persistence/types";
import type { PageFlow } from "../config/pageCatalog";

type PageData = Pick<DatabaseSchema, "pages" | "sitePages">;
const flows: PageFlow[] = ["application", "resume", "advisor", "utility", "internal"];

/** Page definitions own routes and flow identity. Site relationships own order
 * and participation; disabled pages remain inspectable in the Library. */
export function resolvePageCatalog(data: PageData, siteKey?: string) {
  const definitions = new Set<string>();
  const routes = new Set<string>();
  const assignments = data.sitePages.filter(row => row.siteKey === siteKey);
  const assigned = new Set<string>();
  for (const row of assignments) {
    if (assigned.has(row.pageKey) || !data.pages.some(page => page.key === row.pageKey)) throw new Error(`Invalid Site page relationship: ${row.pageKey}`);
    if (!["required", "optional", "none"].includes(row.requirement) || !Number.isSafeInteger(row.position) || row.position < 0) throw new Error(`Invalid Site page order: ${row.pageKey}`);
    assigned.add(row.pageKey);
  }
  const result = data.pages.map(row => {
    const { definition } = row;
    if (definitions.has(row.key) || definition.id !== row.key || !flows.includes(definition.flow)
      || !["home", "form", "receipt", "resume", "error", "internal"].includes(definition.type)
      || typeof definition.path !== "string" || !/^\/(?!\/)[^?#\s]*$/.test(definition.path)
      || routes.has(definition.path) || !Number.isSafeInteger(row.position) || row.position < 0) throw new Error(`Invalid stored page definition: ${row.key}`);
    definitions.add(row.key); routes.add(definition.path);
    const assignment = assignments.find(item => item.pageKey === row.key);
    return { ...row, position: assignment?.position ?? row.position, assigned: !siteKey || !!assignment,
      enabled: !siteKey || !!assignment && assignment.requirement !== "none", requirement: assignment?.requirement };
  }).sort((a, b) => flows.indexOf(a.definition.flow) - flows.indexOf(b.definition.flow) || a.position - b.position || a.key.localeCompare(b.key));
  const positions = new Set<string>();
  for (const row of result.filter(row => row.assigned)) {
    const identity = `${row.definition.flow}:${row.position}`;
    if (positions.has(identity)) throw new Error(`Ambiguous stored page order: ${identity}`);
    positions.add(identity);
  }
  return result;
}
