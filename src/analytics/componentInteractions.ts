import type { AnalyticsElementKind, AnalyticsEvent } from "../domain/analytics";
import { menuTools, pageHelpChips } from "../content/interactionLabels";

/** Source-reviewed controls; these specifications do not install vendor tags.
 * Repeated controls use one semantic definition, never applicant-derived IDs. */
export type ComponentInteraction = {
  page: string; kind: AnalyticsElementKind; key: string; label: string;
  events: AnalyticsEvent[]; sourceFile: string; condition: string;
  surface?: string; componentSource?: string;
};
const interaction = (page: string, kind: AnalyticsElementKind, key: string, label: string, sourceFile: string, condition: string, events: AnalyticsEvent[] = ["activate"]): ComponentInteraction => ({ page, kind, key, label, events, sourceFile, condition });
export const componentInteractions: ComponentInteraction[] = [
  { ...interaction("app-shell", "link", "privacy-notice", "Privacy Notice", "src/components/layout/AppFooter.tsx", "Footer displayed"), surface: "Footer · legal links" },
  { ...interaction("app-shell", "modal", "privacy-notice", "Privacy Notice", "src/components/layout/AppFooter.tsx", "Privacy Notice link activated", ["open", "close"]), surface: "Privacy Notice modal", componentSource: "src/components/layout/AppModal.tsx" },
  { ...interaction("app-shell", "navigation", "menu", "Menu", "src/components/layout/AppMenu.tsx", "Header menu button activated", ["open", "close"]), surface: "Application menu" },
  { ...interaction("app-shell", "button", "dismiss-cookie-notice", "Close cookie banner", "src/components/layout/CookieDialog.tsx", "Cookie notice displayed"), surface: "Cookie notice · close icon" },
  { ...interaction("app-shell", "button", "dismiss-schedule-support", "Close schedule a call dialog", "src/components/layout/ClientHelpBanner.tsx", "Schedule appointment dialog open"), surface: "Schedule a Call dialog · close icon" },
  { ...interaction("coverage", "button", "add-product", "Add coverage", "src/components/coverage/ProductCatalog.tsx", "Product card displayed"), surface: "Product cards · coverage selection" },
  { ...interaction("coverage", "button", "remove-product", "Remove selected coverage", "src/components/coverage/CoverageCart.tsx", "Selected coverage item displayed"), surface: "Coverage summary · selected product" },
  { ...interaction("coverage", "drawer", "cart", "Coverage requested", "src/components/coverage/CoverageCart.tsx", "Coverage summary opened", ["open", "close"]), surface: "Coverage requested drawer" },
  { ...interaction("coverage", "link", "reference-rate-table", "View rate table", "src/components/coverage/ReferenceRateTableLink.tsx", "Product rate reference available"), surface: "Product card · rate information" },
  { ...interaction("coverage", "drawer", "reference-rate-table", "Rate table", "src/components/coverage/ReferenceRateTableLink.tsx", "View rate table link activated", ["open", "close"]), surface: "Rate table drawer" },
  interaction("home", "button", "start-application", "Start / continue application", "src/pages/Home.tsx", "Multi-page homepage primary CTA displayed"),
  interaction("home", "button", "new-application", "New Application", "src/pages/Home.tsx", "Welcome-back homepage displayed"),
  interaction("home", "button", "resume-application", "Continue application", "src/components/home/HomeHero.tsx", "Multi-page homepage continue action displayed"),
  ...(["home", "app-shell"] as const).map(page => interaction(page, "navigation", "coverage-category-tabs", "Coverage information category tabs", "src/components/coverage/CoverageOptionsPanel.tsx", page === "home" ? "Homepage coverage options panel displayed" : "About coverage drawer open", ["change"])),
  interaction("review", "button", "download-application", "Download application PDF", "src/pages/Review.tsx", "Application document preview displayed"),
  interaction("receipt", "button", "download-application", "Download application PDF", "src/pages/Receipt.tsx", "Receipt displayed"),
  interaction("receipt", "button", "download-payment", "Download payment PDF", "src/pages/Receipt.tsx", "Receipt displayed"),
  ...(["phone", "email"] as const).map(channel => interaction("receipt", "link", `support-${channel}`, `Receipt support ${channel}`, "src/pages/Receipt.tsx", "Receipt support panel displayed; contact configured")),
  interaction("resume-code", "button", "resend-code", "Request another code", "src/pages/ResumeCode.tsx", "Resume verification details available; mock platform enabled"),
  interaction("eligibility", "modal", "member-verification", "Member verification", "src/components/verification/MemberVerification.tsx", "Member verification requested from eligibility", ["open", "close"]),
  interaction("eligibility", "button", "verification-next", "Next", "src/components/verification/MemberVerification.tsx", "Verification method or code step displayed"),
  ...([ ["eligibility", "child", "Child eligibility list displayed"], ["profile", "company", "Existing disability coverage company list displayed"] ] as const).flatMap(([page, list, condition]) => [
    ...(["add", "edit", "remove", "save", "cancel", "confirm-remove", "cancel-remove"] as const).map(action => interaction(page, "button", `${list}-${action}`, action === "add" ? `Add ${list === "child" ? "Child" : "Company"}` : action === "edit" ? "Edit" : action === "save" ? "Save" : action.includes("cancel") ? "Cancel" : "Remove", "src/components/forms/DynamicList.tsx", `${condition}; corresponding list action available`)),
    interaction(page, "modal", `${list}-editor`, `Add / edit ${list}`, "src/components/forms/DynamicList.tsx", `${condition}; editor opened`, ["open", "close", "submit", "validation-failed"]),
    interaction(page, "modal", `${list}-remove-confirmation`, `Remove ${list} confirmation`, "src/components/forms/DynamicList.tsx", `${condition}; removal requested`, ["open", "close"]),
  ]),
  interaction("coverage", "link", "rate-reference-source", "Open rate PDF / reference source", "src/components/coverage/ReferenceRateTableLink.tsx", "Rate table drawer open; external source available"),
  interaction("app-shell", "link", "skip-to-content", "Skip to main content", "src/components/layout/AppShell.tsx", "Skip link focused"),
  interaction("app-shell", "link", "header-home", "Header home / logo", "src/components/layout/AppHeader.tsx", "Clickable header logo displayed"),
  interaction("app-shell", "button", "open-coverage-summary", "Open coverage summary", "src/components/layout/AppHeader.tsx", "Coverage summary icon displayed"),
  interaction("app-shell", "drawer", "coverage-summary", "Header coverage summary", "src/components/layout/AppHeader.tsx", "Header coverage summary opened", ["open", "close"]),
  interaction("app-shell", "button", "open-menu", "Open application navigation menu", "src/components/layout/AppHeader.tsx", "Menu icon displayed"),
  interaction("app-shell", "button", "close-menu", "Close application navigation menu", "src/components/layout/AppMenu.tsx", "Application menu open"),
  interaction("app-shell", "tool", "cookie-banner", "Cookie notice", "src/components/layout/CookieDialog.tsx", "Cookie notice visible before dismissal", ["view", "close"]),
  interaction("app-shell", "link", "cookie-policy", "Cookie policy", "src/components/layout/CookieDialog.tsx", "Cookie notice displayed"),
  ...(["phone", "chat", "support-link", "schedule"] as const).map(channel => interaction("app-shell", channel === "chat" || channel === "schedule" ? "button" : "link", `help-banner-${channel}`, `Help banner ${channel}`, "src/components/layout/ClientHelpBanner.tsx", "Help banner displayed; corresponding support feature configured")),
  interaction("app-shell", "modal", "schedule-support", "Schedule support appointment", "src/components/layout/ClientHelpBanner.tsx", "Schedule appointment action activated", ["open", "close"]),
  interaction("coverage", "button", "category-selection", "Select coverage category", "src/components/coverage/CoverageCategorySelector.tsx", "Configured coverage categories displayed"),
  interaction("coverage", "button", "see-coverage-options", "See my coverage options", "src/pages/Coverage.tsx", "Categories selected and additional questions required"),
  interaction("coverage", "button", "open-portfolio", "View coverage portfolio", "src/pages/Coverage.tsx", "Portfolio button displayed"),
  interaction("coverage", "drawer", "portfolio", "Coverage portfolio", "src/components/coverage/CoveragePortfolioDrawer.tsx", "Portfolio opened", ["open", "close"]),
  interaction("coverage", "modal", "dependent-coverage", "Dependent-only coverage confirmation", "src/pages/Coverage.tsx", "Continue with dependent-only coverage", ["open", "close"]),
  interaction("coverage", "button", "dependent-continue", "Continue", "src/pages/Coverage.tsx", "Dependent-only confirmation open"),
  interaction("coverage", "button", "dependent-cancel", "Cancel", "src/pages/Coverage.tsx", "Dependent-only confirmation open"),
  interaction("coverage", "modal", "remove-coverage", "Remove coverage confirmation", "src/components/coverage/CoverageCart.tsx", "Remove selected coverage requested", ["open", "close"]),
  interaction("coverage", "button", "confirm-remove-coverage", "Remove", "src/components/coverage/CoverageCart.tsx", "Removal confirmation open"),
  interaction("coverage", "button", "cancel-remove-coverage", "Cancel", "src/components/coverage/CoverageCart.tsx", "Removal confirmation open"),
  interaction("beneficiary", "button", "add-beneficiary", "Add Beneficiary", "src/pages/Beneficiary.tsx", "Eligible product with beneficiary slots available"),
  interaction("beneficiary", "button", "edit-beneficiary", "Edit beneficiary", "src/pages/Beneficiary.tsx", "Existing beneficiary displayed"),
  interaction("beneficiary", "button", "remove-beneficiary", "Remove beneficiary", "src/pages/Beneficiary.tsx", "Existing beneficiary displayed"),
  interaction("beneficiary", "modal", "beneficiary-editor", "Add / edit beneficiary modal", "src/pages/Beneficiary.tsx", "Add or edit selected", ["open", "close", "submit", "validation-failed"]),
  interaction("beneficiary", "button", "save-beneficiary", "Save Beneficiary", "src/pages/Beneficiary.tsx", "Beneficiary editor open"),
  interaction("beneficiary", "button", "cancel-beneficiary", "Cancel", "src/pages/Beneficiary.tsx", "Beneficiary editor open"),
  interaction("beneficiary", "button", "share-preset", "Beneficiary share shortcut", "src/pages/Beneficiary.tsx", "Individual beneficiary editor; share shortcuts enabled"),
  interaction("beneficiary", "modal", "apply-to-others", "Apply beneficiary to other coverages", "src/pages/Beneficiary.tsx", "Apply-to-other-coverages dialog open", ["open", "close"]),
  interaction("beneficiary", "button", "confirm-apply-to-others", "Apply to Selected", "src/pages/Beneficiary.tsx", "Apply-to-other-coverages dialog open"),
  interaction("beneficiary", "button", "cancel-apply-to-others", "Skip", "src/pages/Beneficiary.tsx", "Apply-to-other-coverages dialog open"),
  interaction("review", "button", "print", "Print", "src/pages/Review.tsx", "Read-and-sign or electronic-consent content displayed"),
  interaction("app-shell", "link", "terms-of-use", "Terms of use", "src/components/layout/AppFooter.tsx", "Footer displayed"),
  interaction("app-shell", "modal", "terms-of-use", "Terms of use modal", "src/components/layout/AppFooter.tsx", "Terms link activated", ["open", "close"]),
  { ...interaction("app-shell", "button", "resume-application", "Continue Application", "src/components/layout/AppMenu.tsx", "Application menu open"), surface: "Application menu · Continue Saved Application" },
  ...Object.entries(pageHelpChips).flatMap(([page, chips]) => chips.flatMap(chip => [
    { ...interaction(page, "button", `help-${chip.id}`, chip.label, "src/components/content/HelpChips.tsx", "Page help chips displayed"), surface: "Page header · help chips" },
    { ...interaction(page, "drawer", `help-drawer-${chip.id}`, chip.label, "src/components/layout/AppDrawer.tsx", `Help chip ${chip.id} activated`), events: ["open", "close"] as AnalyticsEvent[], surface: "Help drawer" },
  ])),
  ...([ ["resume", "Resume"], ["resume-method", "ResumeMethod"], ["resume-code", "ResumeCode"] ] as const).map(([page, file]) =>
    interaction(page, "button", "continue-resume", page === "resume" ? "Request resume link / Request a new link" : page === "resume-method" ? "Request verification code" : "Recover application", `src/pages/${file}.tsx`, "Resume step displayed")),
  ...(["menu", "footer"] as const).flatMap(area => (["website", "email", "phone"] as const).map(channel =>
    interaction("app-shell", "link", `${area}-support-${channel}`, `${area} support ${channel}`, area === "menu" ? "src/components/layout/AppMenu.tsx" : "src/components/layout/AppFooter.tsx", `${area} displayed; configured support contact available`))),
  ...Object.entries(menuTools).flatMap(([key, tool]) => [
    { ...interaction("app-shell", "button", `open-${key}`, tool.label, "src/components/layout/AppMenu.tsx", "Application menu open"), surface: "Application menu · Application Tools" },
    { ...interaction("app-shell", "drawer", key, tool.title, "src/components/layout/AppMenu.tsx", "Tool opened from application menu", ["open", "close"]), surface: `${tool.label} drawer`, componentSource: "src/components/layout/AppDrawer.tsx" },
  ]),
];
export function quoteInteractions(page: string): ComponentInteraction[] {
  return [
    interaction(page, "drawer", "quote-calculator", "How much does it cost?", "src/app/workflows/QuoteCalculator.tsx", "Quote presented as a drawer rather than an inline step", ["open", "close"]),
    { ...interaction(page, "button", "quote-get-estimates", "See my quote", "src/app/workflows/QuoteCalculator.tsx", "Quote input step displayed"), surface: "Quote calculator drawer · inputs" },
    { ...interaction(page, "button", "quote-apply", "Apply for coverage", "src/app/workflows/QuoteCalculator.tsx", "Quote results displayed"), surface: "Quote calculator drawer · results" },
    { ...interaction(page, "button", "quote-continue", "Continue / Apply for coverage", "src/app/workflows/QuoteCalculator.tsx", "Inline quote step displayed"), surface: "Home page · quote calculator" },
  ];
}
