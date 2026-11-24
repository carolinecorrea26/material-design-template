import { activeCoverageApplicantRestriction } from '../config/client/coverageApplicantScope';
import { act, useEffect } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { ApplicationFormProvider, applicationStorageKey, useApplicationForm } from "./ApplicationFormContext";
import { activeCoverageCategoryRestriction } from "../config/client/coverageCategoryScope";
import { activeFeaturedProduct, activeCoverageProductRestriction, capturedCoverageEntryScope } from "../config/client/coverageProductScope";
import type { RecoveredApplication } from "../services/applicantSaveService";
let root: Root, container: HTMLDivElement, context: ReturnType<typeof useApplicationForm>;
function Probe() { const value = useApplicationForm(); useEffect(() => { context = value; }, [value]); return <output>{JSON.stringify(value.values)}</output>; }
beforeEach(() => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true); window.sessionStorage.clear();
  container = document.createElement("div"); document.body.append(container); root = createRoot(container);
});
afterEach(async () => { await act(async () => root.unmount()); container.remove(); window.sessionStorage.clear(); vi.unstubAllGlobals(); });
async function render() { await act(async () => root.render(<MemoryRouter><ApplicationFormProvider><Probe /></ApplicationFormProvider></MemoryRouter>)); }
function recovery(values: Record<string, unknown>): RecoveredApplication { return { mode: "mock", applicationId: "scope-test", siteKey: "ama", recipient: "member@example.invalid", revision: "scope-test", expiresAt: Date.now() + 100000, writeCapability: "test-capability", requiresRevalidation: false, values }; }
it('treats categories as a fresh campaign before restoring cached application context', async () => {
  window.sessionStorage.setItem(applicationStorageKey('asce'), JSON.stringify({ coverageEntryScope: { category: 'li', prods: 'G-10500-1', applicant: 'member', amt: 'G-10500-1_100000', dprods: 'G-10500-1', firstCategory: 'li', featured_prod: 'G-10500-1', preselect: 'TRUE' } }));
  window.history.replaceState(null, '', '/?site=asce&categories=di&prods=G-12601-0');
  await render();
  expect(context.values.coverageEntryScope).toEqual({ category: 'di', prods: 'G-12601-0' });
});
it("captures category/product entry and restores its own context after a different campaign", async () => {
  window.history.replaceState(null, "", "/?site=ama&category=di&prods=G-30639-0"); await render();
  expect(context.values.coverageEntryScope).toEqual({ category: "di", prods: "G-30639-0" });
  await act(async () => context.setPageValues({ membership: "physician", "first-name": "Saved applicant" }));
  const saved = structuredClone(context.values);
  window.history.replaceState(null, "", "/?site=ama&category=li"); activeCoverageCategoryRestriction("ama"); activeCoverageProductRestriction("ama");
  expect(capturedCoverageEntryScope("ama")).toEqual({ category: "li" });
  window.history.replaceState(null, "", "/resume?site=ama");
  await act(async () => context.restoreApplication!(recovery(saved)));
  expect(capturedCoverageEntryScope("ama")).toEqual({ category: "di", prods: "G-30639-0" });
  expect(context.values).toMatchObject({ "first-name": "Saved applicant", coverageEntryScope: { category: "di", prods: "G-30639-0" } });
  expect(saved["first-name"]).toBe("Saved applicant");
});
it("restores a cached application scope and preserves all saved selections and amounts", async () => {
  window.history.replaceState(null, "", "/coverage?site=ama");
  const saved = { membership: "physician", coverageSelections: ["di-step-rated", "li-term"], coverageAmounts: { "di-step-rated:member": 1000, "li-term:member": 100000 }, coverageEntryScope: { category: "di", prods: "G-30639-0" } };
  window.sessionStorage.setItem(applicationStorageKey("ama"), JSON.stringify(saved));
  window.sessionStorage.setItem("coverage-category-scope:ama", "li"); await render();
  expect(capturedCoverageEntryScope("ama")).toEqual(saved.coverageEntryScope);
  expect(context.values.coverageSelections).toEqual(saved.coverageSelections);
  expect(context.values.coverageAmounts).toEqual(saved.coverageAmounts);
});
it("does not impose another campaign on a legacy recovered application", async () => {
  window.history.replaceState(null, "", "/?site=ama&category=di&prods=G-30639-0&featured_prod=G-30641-0"); await render();
  window.history.replaceState(null, "", "/resume?site=ama");
  await act(async () => context.restoreApplication!(recovery({ membership: "physician", "first-name": "Legacy applicant" })));
  expect(capturedCoverageEntryScope("ama")).toEqual({});
  expect(context.values).not.toHaveProperty("coverageEntryScope");
  expect(context.values["first-name"]).toBe("Legacy applicant");
});

it("captures featured presentation across plain routes and restores the saved application's own override", async () => {
  window.history.replaceState(null, "", "/?site=ama&featured_prod=G-30641-0"); await render();
  expect(context.values.coverageEntryScope).toEqual({ featured_prod: "G-30641-0" });
  await act(async () => context.setPageValues({ membership: "physician", "first-name": "Saved applicant" }));
  const saved = structuredClone(context.values);
  window.history.replaceState(null, "", "/coverage?site=ama"); expect(activeFeaturedProduct("ama")).toBe("G-30641-0"); expect(activeFeaturedProduct("asce")).toBeNull();
  window.history.replaceState(null, "", "/?site=ama&category=li&featured_prod=G-29120-0"); activeFeaturedProduct("ama"); activeCoverageCategoryRestriction("ama"); activeCoverageProductRestriction("ama");
  window.history.replaceState(null, "", "/resume?site=ama");
  await act(async () => context.restoreApplication!(recovery(saved)));
  expect(capturedCoverageEntryScope("ama")).toEqual({ featured_prod: "G-30641-0" }); expect(context.values["first-name"]).toBe("Saved applicant");
});

it('captures applicant-only entry and restores that application instead of the last applicant campaign', async () => {
  window.history.replaceState(null, '', '/?site=asce&applicant=member');
  await render();
  expect(context.values.coverageEntryScope).toEqual({ applicant: 'member' });
  const saved = structuredClone(context.values);
  window.history.replaceState(null, '', '/?site=asce&applicant=member,spouse');
  expect(activeCoverageApplicantRestriction('asce')).toBe('member,spouse');
  window.history.replaceState(null, '', '/resume?site=asce');
  await act(async () => context.restoreApplication!({ ...recovery(saved), siteKey: 'asce' }));
  expect(context.values.coverageEntryScope).toEqual({ applicant: 'member' });
  expect(activeCoverageApplicantRestriction('asce')).toBe('member');
  await act(async () => context.restoreApplication!({ ...recovery({ membership: 'yes' }), siteKey: 'asce' }));
  expect(activeCoverageApplicantRestriction('asce')).toBeNull();
});
