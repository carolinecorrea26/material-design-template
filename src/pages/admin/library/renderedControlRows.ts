import { componentInteractions, quoteInteractions, type ComponentInteraction } from "../../../analytics/componentInteractions";
import { analyticsProperties, analyticsTagId, type AnalyticsTag } from "../../../domain/analytics";
import { resolvePrototypeLibrary } from "../../../domain/prototypeLibrary";
import { getSiteDetailsPageLabel } from "../../../config/resolvers/resolveClientPages";
import { getFlowGateDefinition, coverageUnlocksPage } from "../../../config/flowGates";
import type { LibraryCatalog } from "../../../services/libraryCatalogService";
import type { FieldSurfaceRow } from "./fieldSurfaceRows";
import type { PageId } from "../../../types";
import { resolveRatePresentation } from "../../../domain/ratePresentation";
import { coverageCategories } from "../../../config/coverageCategories";

const areas: Record<string, string> = {
  "src/components/layout/AppMenu.tsx": "Application menu",
  "src/components/layout/AppHeader.tsx": "Header · navigation buttons",
  "src/components/layout/AppFooter.tsx": "Footer · legal links",
  "src/components/layout/AppShell.tsx": "Top of page · skip link",
  "src/components/layout/CookieDialog.tsx": "Cookie notice",
  "src/components/layout/ClientHelpBanner.tsx": "Header · help banner",
  "src/components/ui/CoverageOptionsPanel.tsx": "About Coverage drawer · category tabs",
  "src/components/ui/CoverageCart.tsx": "Coverage summary · selected coverage",
  "src/components/ui/MemberVerification.tsx": "Member verification modal",
  "src/components/forms/DynamicList.tsx": "Repeatable list · item controls / editor",
};

/** Concrete source-reviewed controls, annotated with saved tracking specs.
 * Speculative action summaries are not elements. New real controls remain
 * proposed until their instrumentation is supplied and verified. */
export function renderedControlRows(catalog: LibraryCatalog, siteKey: string, fields: FieldSurfaceRow[]) {
  const stored = new Map(catalog.analyticsTags.map(tag => [tag.id, tag]));
  const tags: AnalyticsTag[] = [];
  const metadata = new Map<string, ComponentInteraction>();
  const sites = siteKey === "all" ? catalog.data.sites.map(site => site.key) : [siteKey];
  for (const site of sites) {
    const library = resolvePrototypeLibrary(catalog.data, site, catalog.revision);
    const enabledPages = new Set(library.site.configuration.pages.filter(page => page.requirement !== "none" && (!getFlowGateDefinition(page.key as PageId) || library.products.some(product => coverageUnlocksPage(page.key as PageId, product)))).map(page => page.key));
    const quoteEnabled = library.products.some(product => resolveRatePresentation(library.site, product.id).quoteToolEnabled);
    const referenceTables = library.products.flatMap(product => {
      const table = resolveRatePresentation(library.site, product.id).referenceTable;
      return table ? [{ product, table }] : [];
    });
    const quotePages = new Set(fields.filter(field => quoteEnabled && field.surface.startsWith("Quote calculator")).flatMap(field => field.pages));
    const definitions = [...componentInteractions, ...[...quotePages].flatMap(quoteInteractions)].flatMap(definition => {
      if (["add-product", "remove-product"].includes(definition.key)) return library.products.map(product => ({ ...definition, key: `${definition.key}:${product.id}`, label: definition.key === "remove-product" ? `Remove ${product.name}` : "Add coverage", surface: `Product card · ${product.name}` }));
      if (definition.key === "category-selection") {
        const categories = coverageCategories.filter(category => library.products.some(product => product.categoryId === category.id));
        return categories.length > 1 ? categories.map(category => ({ ...definition, key: `${definition.key}:${category.id}`, label: category.label, surface: "Coverage categories" })) : [];
      }
      if (definition.key === "share-preset") return [25, 50, 75, 100].map(percent => ({ ...definition, key: `share-preset:${percent}`, label: `${percent}%`, surface: "Add / Edit Beneficiary modal · percentage shortcuts" }));
      if (definition.key === "reference-rate-table") return referenceTables.map(({ product, table }) => ({ ...definition, key: `${definition.key}:${product.id}`, label: definition.kind === "drawer" ? table.title : "View rate table", surface: definition.kind === "drawer" ? `${table.title} drawer` : `Product card · ${product.name} · rate information` }));
      if (definition.key === "rate-reference-source") return referenceTables.filter(({ table }) => ["pdf", "link", "xml"].includes(table.kind)).map(({ product, table }) => ({ ...definition, key: `rate-reference-source:${product.id}`, label: table.kind === "pdf" ? "Open PDF" : "Open reference source", condition: "Reference table drawer open", surface: `${table.title} drawer · reference link` }));
      if (definition.key === "help-drawer-estimate-cost") return [];
      return [definition];
    });
    for (const product of library.products.filter(product => product.brochureUrl)) definitions.push({ page: "coverage", kind: "link", key: `product-brochure:${product.id}`, label: product.name, events: ["activate"], sourceFile: "src/components/forms/ProductCatalog.tsx", condition: "Product card displayed; brochure URL configured", surface: `Product card · ${product.name} · title link` });
    // These overlays use AppDrawer's titled header or AppModal's close icon.
    // The cart owns its close control because its enclosing AppDrawer has no title.
    for (const overlay of [...definitions]) {
      if (overlay.kind !== "drawer" && overlay.kind !== "modal") continue;
      if (overlay.key === "schedule-support") continue;
      const cart = ["cart", "coverage-summary"].includes(overlay.key);
      const file = cart ? "src/components/ui/CoverageCart.tsx" : overlay.kind === "drawer" ? "src/components/layout/AppDrawer.tsx" : overlay.key === "member-verification" ? "src/components/ui/MemberVerification.tsx" : "src/components/layout/AppModal.tsx";
      definitions.push({ page: overlay.page, kind: "button", key: `dismiss-${overlay.key}`, label: cart ? "Close coverage requested" : overlay.kind === "drawer" ? "Close drawer" : "Close", events: ["activate"], sourceFile: file, condition: `${overlay.label} open`, surface: `${overlay.surface ?? `${overlay.label} ${overlay.kind}`} · close icon` });
    }
    for (const definition of definitions) {
      if (definition.page !== "app-shell" && !enabledPages.has(definition.page)) continue;
      const control = { ...definition };
      if (control.key === "schedule-support") control.label = "Schedule a Call";
      if (control.key === "dependent-coverage") control.label = library.content.dialogs.confirmation.dependentCoverage.title;
      if (control.key === "apply-to-others") control.label = library.content.dialogs.beneficiary.applyToOthersTitle;
      if (control.key === "beneficiary-editor") control.label = `${library.content.dialogs.beneficiary.addTitle} / ${library.content.dialogs.beneficiary.editTitle}`;
      if (control.key === "remove-coverage") control.label = "Remove coverage";
      if (control.key === "portfolio") control.label = library.content.help.coveragePortfolio.title;
      if (["cart", "coverage-summary"].includes(control.key)) control.label = "Your requested coverage";
      if (control.key === "header-home") control.label = library.client.branding.logoAlt || library.client.branding.name;
      if (control.key === "quote-continue" && (control.page !== "home" || library.client.features?.homePageVariant !== "quoteFirst")) continue;
      if (control.page === "home" && ["quote-calculator", "dismiss-quote-calculator", "quote-get-estimates", "quote-apply"].includes(control.key) && library.client.features?.homePageVariant === "quoteFirst") continue;
      if (control.page === "home" && ["start-application", "new-application", "how-applying-works-scroll", "resume-application"].includes(control.key) && library.client.features?.defaultTemplate === "single") continue;
      if (control.page === "beneficiary" && ["save-beneficiary", "cancel-beneficiary"].includes(control.key)) control.surface = "Add / Edit Beneficiary modal · actions";
      if (control.page === "beneficiary" && ["confirm-apply-to-others", "cancel-apply-to-others"].includes(control.key)) control.surface = "Apply to other coverages modal · actions";
      if (control.key.startsWith("child-")) control.surface = control.kind === "modal" || ["child-save", "child-cancel", "child-confirm-remove", "child-cancel-remove"].includes(control.key) ? "Child list · editor / removal confirmation" : "Child eligibility section · list actions";
      if (control.key.startsWith("company-")) control.surface = control.kind === "modal" || ["company-save", "company-cancel", "company-confirm-remove", "company-cancel-remove"].includes(control.key) ? "Existing disability insurance · company editor / removal confirmation" : "Existing disability insurance · company list actions";
      if (control.kind === "modal" && !["member-verification", "schedule-support"].includes(control.key)) control.componentSource = control.key === "dependent-coverage" ? "src/components/layout/ConfirmationDialog.tsx" : "src/components/layout/AppModal.tsx";
      const support = control.key.match(/^(menu|footer)-support-(website|email|phone)$/);
      if (support) {
        const channel = support[2] as "website" | "email" | "phone";
        const label = channel === "phone" ? library.client.support.phoneDisplay ?? library.client.support.phone : library.client.support[channel];
        if (!label) continue;
        control.label = label;
        control.surface = support[1] === "menu" ? "Application menu · Contact Us" : "Footer · contact information";
      }
      if (control.key.startsWith("help-banner-")) {
        const client = library.client;
        if (!client.support.phone) continue;
        const channel = control.key.slice("help-banner-".length);
        if (channel === "phone") control.label = `Call for help ${client.support.phoneDisplay || client.support.phone}`;
        if (channel === "chat") { if (!client.features?.chat) continue; control.label = "Chat now"; }
        if (channel === "schedule") { if (!client.features?.scheduleUrl) continue; control.label = "Schedule a call"; }
        if (channel === "support-link") { if (!client.features?.linkUrl) continue; control.label = client.features.linkLabel || `${client.branding.acronym} help`; }
      }
      if (["schedule-support", "dismiss-schedule-support"].includes(control.key) && (!library.client.support.phone || !library.client.features?.scheduleUrl)) continue;
      if (control.page === "receipt" && control.key.startsWith("support-")) {
        const label = control.key === "support-phone" ? library.client.support.phoneDisplay || library.client.support.phone : library.client.support.email;
        if (!label) continue;
        control.label = label; control.surface = "Receipt · support panel";
      }
      if (control.key === "cookie-policy") control.label = library.content.shared.cookieBanner.learnMoreLabel;
      if (control.key === "terms-of-use" && control.kind === "link") control.label = library.content.footer.links.termsOfUse;
      if (control.key === "privacy-notice" && control.kind === "link") control.label = library.content.footer.links.privacyNotice;
      if (control.page === "receipt" && control.key === "download-application") control.label = library.content.receipt.documentDownloadLabels.application;
      if (control.page === "receipt" && control.key === "download-payment") control.label = library.content.receipt.documentDownloadLabels.payment;
      if (control.page === "home" && control.key === "start-application") control.label = library.client.features?.homePageVariant === "welcome-back" ? "Continue Application" : library.content.home.hero.ctaLabel;
      if (control.page === "home" && control.key === "new-application" && library.client.features?.homePageVariant !== "welcome-back") continue;
      if (control.page === "home" && control.key === "how-applying-works-scroll") control.label = library.content.home.hero.secondaryCtaLabel;
      if (control.page === "home" && control.key === "resume-application") control.label = library.content.home.hero.resumeLinkLabel;
      const area = control.surface ?? areas[control.sourceFile];
      control.surface = control.page === "app-shell" ? area : `${getSiteDetailsPageLabel(control.page as PageId)} page${area ? ` · ${area}` : ""}`;
      if (!control.surface) continue;
      const id = analyticsTagId(control.page, control.kind, control.key);
      const saved = stored.get(id);
      const specification = saved?.sites.includes(site) ? saved : undefined;
      const tag: AnalyticsTag = {
        id, pageId: control.page, kind: control.kind, elementKey: control.key, label: control.label,
        events: specification?.events ?? control.events, trigger: specification?.trigger ?? control.events.join(" / "),
        sites: [site], status: specification?.status ?? "proposed", permittedProperties: specification?.permittedProperties ?? analyticsProperties,
        description: specification?.description ?? `Rendered ${control.kind}: ${control.label}.`,
        source: "component-definition", sourceFile: control.sourceFile, condition: control.condition,
        adobe: specification?.adobe ?? { mapping: null, status: "not-configured" },
        contentsquare: specification?.contentsquare ?? { mapping: null, status: "not-configured" },
      };
      metadata.set(id, control);
      const existing = tags.find(existing => existing.id === id && existing.label === tag.label);
      if (existing) existing.sites.push(site); else tags.push(tag);
    }
  }
  return { tags, metadata };
}
