import { getPrototypeLibrary } from '../domain/prototypeLibrary';
import { componentInteractions, quoteInteractions } from "./componentInteractions";
import { pages } from "../config/pages";
import { getSiteFieldInventory, getFieldPlacements } from "../config/fields/inspectionInventory";
import { resolveSitePages } from "../data/resolvers";
import { getFlowGateDefinition, coverageUnlocksPage } from "../config/flowGates";
import { getClientCoverages } from "../config/client/getActiveClientCoverages";
import { getEffectiveSiteConfig } from "../data/registry";
import { siteEntities } from "../data/registry";
import { analyticsProperties, analyticsTagId, type AnalyticsElementKind, type AnalyticsEvent, type AnalyticsTag } from "../domain/analytics";

const elements: Array<[string, AnalyticsElementKind, string, string, AnalyticsEvent[]]> = [
  ["home", "tool", "quote", "Quote calculator", ["open", "close", "submit"]],
  ["home", "drawer", "coverage-needs", "Coverage needs calculator", ["open", "close"]],
  ["coverage", "link", "reference-rate-table", "View rate table", ["activate"]],
  ["coverage", "drawer", "reference-rate-table", "Reference rate table", ["open", "close"]],
  ["coverage", "button", "add-product", "Add coverage", ["activate"]],
  ["coverage", "button", "remove-product", "Remove coverage", ["activate"]],
  ["coverage", "drawer", "cart", "Coverage cart", ["open", "close"]],
  ["review", "button", "submit-application", "Submit application", ["activate"]],
  ["review", "link", "edit-section", "Edit section", ["activate"]],
];
let cache: AnalyticsTag[] | undefined;
export function getAnalyticsInventory(siteKey = "all"): AnalyticsTag[] {
  if (!cache) {
    const rows = new Map<string, AnalyticsTag>();
    const add = (site: string, pageId: string, kind: AnalyticsElementKind, key: string, label: string, events: AnalyticsEvent[], hasLocalHook: boolean, source: AnalyticsTag["source"] = "prototype-definition", sourceFile = "src/config/pages.ts", condition = "Page availability and applicant visibility rules apply") => {
      const id = analyticsTagId(pageId, kind, key), previous = rows.get(id);
      if (previous) { if (!previous.sites.includes(site)) previous.sites.push(site); return; }
      const triggers: Record<AnalyticsEvent, string> = { view: "Element becomes visible", activate: "User activates control", change: "Selection or input changes; values excluded", submit: "Successful submission / continuation", "validation-failed": "Validation prevents continuation", open: "Overlay / tool opens", close: "Overlay / tool closes" };
      rows.set(id, { id, pageId, elementKey: key, label, kind, events, trigger: events.map(event => triggers[event]).join("; "), sites: [site], status: hasLocalHook ? "local-hook" : "proposed", permittedProperties: analyticsProperties,
        description: kind === "page" ? `Track the ${label} page${events.includes("submit") ? " and its completion or validation outcome" : " view"}.` : kind === "field" ? `Track interaction with ${label}; never collect the entered value.` : `Track ${label.toLowerCase()} interactions. Confirm placement and Site applicability before implementation.`,
        source, sourceFile, condition, adobe: { mapping: null, status: "not-configured" }, contentsquare: { mapping: null, status: "not-configured" } });
    };
    for (const site of siteEntities) {
      const fields = getSiteFieldInventory(site.id);
      const products = getClientCoverages(getEffectiveSiteConfig(site.id));
      const enabledPages = new Set(resolveSitePages(site.id).filter(p => p.effective.included && (!getFlowGateDefinition(p.id) || products.some(product => coverageUnlocksPage(p.id, product)))).map(p => p.id));
      for (const page of pages.filter(p => p.type !== "internal" && enabledPages.has(p.id))) {
        // Page availability is documented independently of transient applicant visibility.
        add(site.id, page.id, "page", "page", page.id, page.type === "form" ? ["view", "submit", "validation-failed"] : ["view"], page.type === "form");
        if (page.type === "form") {
          add(site.id, page.id, "navigation", "next", "Next / submit", ["activate"], true, "prototype-definition", "src/components/navigation/PageNav.tsx", "Forward action displayed; enabled when validation and loading rules allow");
          add(site.id, page.id, "navigation", "back", "Back", ["activate"], false, "prototype-definition", "src/components/layout/PageTitle.tsx", "Page header displayed; previous step available and before review");
        }
      }
      for (const row of fields) for (const placement of getFieldPlacements(row)) {
        if (!enabledPages.has(placement.pageId as typeof pages[number]["id"])) continue;
        add(site.id, placement.pageId, row.field.id.endsWith("rate-frequency") ? "toggle" : "field", row.field.id, row.field.id.endsWith("rate-frequency") ? "Toggle monthly / annual rates" : row.field.label ?? row.field.id, ["change"], ["page-defined", "global", "inherited", "overridden", "client-specific"].includes(row.status), "prototype-definition", "src/config/fields/inspectionInventory.ts", [placement.condition, row.condition].filter(Boolean).join("; "));
      }
      const quotePages = new Set(fields.filter(row => row.group?.id === "quote-calculator").flatMap(row => getFieldPlacements(row).map(p => p.pageId)));
      for (const item of [...componentInteractions, ...[...quotePages].flatMap(quoteInteractions)]) {
        if (item.page === "app-shell" || enabledPages.has(item.page as typeof pages[number]["id"])) {
          add(site.id, item.page, item.kind, item.key, item.label, item.events, false, "component-definition", item.sourceFile, item.condition);
        }
      }
      for (const [page, kind, key, label, events] of elements) if (enabledPages.has(page as typeof pages[number]["id"])) add(site.id, page, kind, key, label, events, false, "proposed-interaction");
    }
    // Shared UI is one specification, rather than fabricated duplicates on every page.
    for (const site of siteEntities) {
      add(site.id, "app-shell", "link", "privacy-notice", "Privacy notice", ["activate"], false, "shared-component");
      add(site.id, "app-shell", "modal", "privacy-notice", "Privacy notice modal", ["open", "close"], false, "shared-component");
      add(site.id, "app-shell", "navigation", "menu", "Application menu", ["open", "close", "activate"], false, "shared-component");
    }
    cache = [...rows.values()].sort((a, b) => a.id.localeCompare(b.id));
  }
  const active = getPrototypeLibrary(siteKey);
  if (active && !siteEntities.some(s => s.id === siteKey)) {
    const source = siteEntities.find(s => s.id === active.sourceSiteKey);
    return structuredClone(cache.filter(tag => source && tag.sites.includes(source.id)).map(tag => ({ ...tag, sites: [...tag.sites, siteKey] })));
  }
  return structuredClone(siteKey === "all" ? cache : cache.filter(tag => tag.sites.includes(siteKey)));
}
