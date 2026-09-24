import { describe, expect, it } from "vitest";
import { cmsEntries } from "./cmsEntries";

describe("cmsEntries", () => {
  it("represents each legal document as a single CMS item", () => {
    const legalDocuments = cmsEntries.filter(
      (entry) => entry.componentType === "Legal document" && entry.page === "Global",
    );

    expect(legalDocuments).toHaveLength(2);
    expect(legalDocuments.map((entry) => entry.component)).toEqual([
      "Terms of Use Document",
      "Privacy Notice Document",
    ]);
    expect(legalDocuments[0].globalValue).toContain("System Requirements");
    expect(legalDocuments[1].globalValue).toContain("Our Information Practices");
  });

  it("keeps experience pages and excludes every internal documentation page", () => {
    const internalPageIds = [
      "mock-email-preview",
      "site-features",
      "site-details",
      "design-system",
      "portal-admin",
      "cms",
      "portal-template-project",
      "portal-requirements-project",
    ];

    expect(cmsEntries.some((entry) => entry.page === "Advisor Portal")).toBe(true);
    for (const pageId of internalPageIds) {
      expect(cmsEntries.some((entry) => entry.id.startsWith(`managed-pages-${pageId}-`))).toBe(
        false,
      );
    }
  });

  it("excludes page registry metadata that is not rendered in the experience", () => {
    const excludedIds = [
      "managed-pages-home-title",
      "managed-pages-home-navtitle",
      "managed-pages-coverage-navtitle",
      "managed-pages-docusign-navtitle",
      "managed-pages-health-li-navtitle",
      "managed-pages-receipt-subhead",
      "managed-pages-receipt-navtitle",
      "managed-pages-resume-method-subhead",
      "managed-pages-resume-code-subhead",
      "managed-pages-advisor-login-navtitle",
    ];

    for (const id of excludedIds) {
      expect(cmsEntries.some((entry) => entry.id === id)).toBe(false);
    }

    expect(cmsEntries.some((entry) => entry.id === "managed-pages-membership-navtitle")).toBe(true);
    expect(cmsEntries.some((entry) => entry.id === "managed-pages-advisor-login-title")).toBe(true);
  });

  it("groups component copy without adding field-name prefixes", () => {
    const applicationReviewDrawer = cmsEntries.filter(
      (entry) => entry.component === "Application Review Drawer",
    );
    const membershipTransition = cmsEntries.filter(
      (entry) => entry.component === "Membership Page Transition Messages",
    );

    expect(applicationReviewDrawer).toHaveLength(1);
    expect(applicationReviewDrawer[0].globalValue).toContain("What to expect");
    expect(applicationReviewDrawer[0].globalValue).not.toMatch(/(^|\n)(Title|Content):/);
    expect(membershipTransition).toHaveLength(1);
    expect(membershipTransition[0].globalValue).toContain("Saving your membership information");
    expect(membershipTransition[0].globalValue).not.toContain("1:");
  });

  it("keeps independent controls as separate, clearly named rows", () => {
    const homeButtons = cmsEntries.filter(
      (entry) => entry.page === "Home" && entry.componentType === "Button",
    );

    expect(homeButtons.map((entry) => entry.globalValue)).toEqual([
      "Begin application",
      "Learn more",
      "Continue here",
      "Learn more about the review process.",
    ]);
    expect(homeButtons.map((entry) => entry.component)).toEqual([
      "Primary Hero Button",
      "Secondary Hero Button",
      "Resume Application Link",
      "Review Process Link",
    ]);
  });

  it("uses only rendered asset values for conditional client content", () => {
    const heroImage = cmsEntries.find((entry) => entry.id === "home-hero-image");

    expect(heroImage?.globalValue).toBe("—");
    expect(heroImage?.effectiveValue("demo")).toBe("/client/demo/hero.png");
    expect(heroImage?.effectiveValue("isitrust")).toBe("—");
    expect(cmsEntries.some((entry) => entry.globalValue.includes("enabled per client"))).toBe(false);
  });
});
