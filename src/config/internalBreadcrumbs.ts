import type { PageId } from "../types";

/** Maps each internal-docs page to its parent, for breadcrumb trails. */
export const internalPageParent: Partial<Record<PageId, PageId>> = {
  "site-features": "portal-admin",
  "site-details": "portal-admin",
  "design-system": "portal-admin",
  "portal-template-project": "portal-admin",
  "portal-requirements-project": "portal-admin",
  cms: "portal-admin",
  "mock-email-preview": "portal-admin",
};

/** Human-readable breadcrumb labels, since some internal pages don't have applicant-facing content titles. */
export const internalPageLabel: Partial<Record<PageId, string>> = {
  "portal-admin": "Portal Admin",
  "site-features": "Site Features",
  "site-details": "Site Details",
  "design-system": "Design System",
  "portal-template-project": "Portal Template Project",
  "portal-requirements-project": "Portal Requirements Project",
  cms: "CMS",
  "mock-email-preview": "Email Templates",
};

/** Builds the full breadcrumb trail (root first, current page last) for an internal page. */
export function getInternalBreadcrumbTrail(
  pageId: PageId,
): { id: PageId; label: string }[] {
  const trail: PageId[] = [pageId];
  let current: PageId | undefined = pageId;
  while (internalPageParent[current]) {
    current = internalPageParent[current];
    if (!current || trail.includes(current)) break;
    trail.unshift(current);
  }
  return trail.map((id) => ({ id, label: internalPageLabel[id] ?? id }));
}
