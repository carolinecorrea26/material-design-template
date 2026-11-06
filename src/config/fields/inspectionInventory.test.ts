import { describe, it, expect } from "vitest";
import { getGlobalFieldInventory, getSiteFieldInventory, getFieldPlacements, selectFieldInventory } from "./inspectionInventory";
import { siteEntities, getEffectiveSiteConfig } from "../../data/registry";
import { getClientCoverages } from "../client/getActiveClientCoverages";
import { getClientPageRequirement } from "../client/getClientPageRequirement";
import { coverageUnlocksPage } from "../flowGates";
import { fieldCatalog } from ".";
import { createQuestionFields } from "./healthLiFields";
import { createAnswerFields as siAnswers } from "./healthSiFields";
import { createAnswerFields as diAnswers, QUESTIONS } from "./healthDiFields";
import { pageFieldOrder } from "./pageFieldOrder";
import { writeFileSync } from "node:fs";

describe("implemented field inventory", () => {
  const global = getGlobalFieldInventory();
  it("retains every canonical field and every effective Site placement globally", () => {
    for (const id of Object.keys(fieldCatalog)) expect(global.some(r=>r.field.id===id),id).toBe(true);
    for (const site of siteEntities) for (const row of getSiteFieldInventory(site.id)) {
      expect(global.some(g=>g.pageId===row.pageId && g.area===row.area && JSON.stringify(g.field)===JSON.stringify(row.field) && JSON.stringify(g.placements)===JSON.stringify(row.placements) && g.sites.includes(site.id)),`${site.id}: ${row.pageId}/${row.field.id}`).toBe(true);
    }
  });
  it("keeps default placements independently of current client overrides and supports All fields", () => {
    for (const [pageId, ids] of Object.entries(pageFieldOrder)) for (const id of ids ?? []) {
      const field = fieldCatalog[id];
      if (field) expect(global.some(row => row.pageId === pageId && JSON.stringify(row.field) === JSON.stringify(field)), `${pageId}/${id}`).toBe(true);
    }
    expect(selectFieldInventory(global, "all")).toHaveLength(global.length);
    expect(selectFieldInventory(global, "all", "membership").every(row => getFieldPlacements(row).every(placement => placement.pageId === "membership"))).toBe(true);
  });
  it.each(siteEntities.map(s=>s.id))("audits repeated and conditional inputs for %s", siteId => {
    const rows=getSiteFieldInventory(siteId);
    const client=getEffectiveSiteConfig(siteId);
    const products=getClientCoverages(client);
    for (const [id,key] of [["child-first-name","firstName"],["child-last-name","lastName"],["child-birth-date","birthDate"],["child-gender","gender"]]) {
      expect(rows.find(r=>r.pageId==="eligibility" && r.field.id===id)?.storage).toBe(`children[].${key}`);
    }
    for (const page of ["health-si","health-li","health-di"] as const) {
      const available=products.some(p=>coverageUnlocksPage(page,p));
      const answers=rows.filter(r=>r.pageId===page && r.area==="self");
      expect(answers.length,`${siteId} ${page}`).toBe(available ? (page==="health-si" ? siAnswers("self") : page==="health-li" ? createQuestionFields("self") : diAnswers("self")).length : 0);
      if (available && page==="health-di") for (const question of QUESTIONS) for (const field of question.mapping.fields) expect(rows.some(r=>r.storage===`health-di-${question.key}-details[].${field.id}`)).toBe(true);
    }
    for (const page of ["payment","beneficiary"] as const) {
      const requirement=getClientPageRequirement(page,client);
      expect(rows.some(r=>r.field.id===`${page}-information-opt-in`)).toBe(requirement==="optional" && (page==="payment" || products.some(p=>coverageUnlocksPage(page,p))));
      if (requirement==="none") expect(rows.filter(r=>r.pageId===page)).toHaveLength(0);
    }
    for (const product of products) if (getClientPageRequirement("payment",client)!=="none") expect(rows.some(r=>r.field.id===`payment-method:${product.id}`)).toBe(true);
    for (const row of rows) {
      expect(row.field, `${siteId} ${row.pageId}`).toBeDefined();
      expect(row.field.label).toBeTruthy();
      expect(row.storage).toBeTruthy();
      expect(row.sites).toEqual([siteId]);
    }
    expect(new Set(rows.map(r=>JSON.stringify([r.pageId,r.field,r.area,r.storage]))).size).toBe(rows.length);
  });
  it.each(siteEntities.map(site => site.id))("separates shared ownership from page access for %s", siteId => {
    const rows = getSiteFieldInventory(siteId);
    const calculator = rows.filter(row => row.group?.id === "needs-calculator");
    expect(calculator).toHaveLength(4);
    expect(calculator.every(row => row.pageId === null)).toBe(true);
    const direct = selectFieldInventory(rows, "pages", "eligibility");
    expect(direct.some(row => row.field.id === "child-first-name")).toBe(true);
    expect(direct.some(row => row.group?.id === "needs-calculator")).toBe(false);
    const withTools = selectFieldInventory(rows, "pages", "eligibility", true);
    expect(withTools.filter(row => row.group?.id === "needs-calculator")).toHaveLength(4);
    expect(withTools.every(row => getFieldPlacements(row).every(p => p.pageId === "eligibility"))).toBe(true);
    expect(withTools.some(row => row.group?.id === "quote-calculator")).toBe(false);
  });
  it("lists ASCE quote riders with their Coverage carry-forward keys (CHG-002)", () => {
    const tools = selectFieldInventory(getSiteFieldInventory("asce"), "tools", "home").filter(row => row.group?.id === "quote-calculator");
    expect(tools.find(row => row.field.id === "quote-rider:li-term:cir:member")?.storage).toContain("coverageRiders[li-term:cir:member]");
    expect(tools.find(row => row.field.id === "quote-rider-amount:li-term:cir:member")?.storage).toContain("coverageRiderAmounts[li-term:cir:member]");
    expect(tools.some(row => row.field.id.includes(":spouse"))).toBe(false);
  });

  it.each(siteEntities.map(site => site.id))("offers the quote only from Home, never Membership, for %s", siteId => {
    const rows = getSiteFieldInventory(siteId);
    expect(selectFieldInventory(rows, "tools", "membership").some(row => row.group?.id === "quote-calculator")).toBe(false);
    expect(selectFieldInventory(rows, "pages", "membership", true).some(row => row.group?.id === "quote-calculator")).toBe(false);
    const client = getEffectiveSiteConfig(siteId);
    const variant = client.features?.homePageVariant ?? "default";
    const hasHomeQuote = client.features?.defaultTemplate !== "single" && ["default", "quoteFirst"].includes(variant);
    const homeTools = selectFieldInventory(rows, "tools", "home").filter(row => row.group?.id === "quote-calculator");
    expect(homeTools.length > 0).toBe(hasHomeQuote);
    const home = selectFieldInventory(rows, "pages", "home");
    if (hasHomeQuote && variant === "quoteFirst") {
      expect(home.some(row => row.field.id === "birth-date" && row.group?.id === "quote-calculator")).toBe(true);
    } else if (hasHomeQuote) {
      expect(home.some(row => row.field.id === "birth-date" && !row.group)).toBe(true);
      expect(home.some(row => row.group?.id === "quote-calculator")).toBe(false);
      expect(homeTools.some(row => row.field.id === "birth-date")).toBe(false);
    }
  });
  it("keeps unplaced definitions discoverable without inventing a page", () => {
    const unplaced = selectFieldInventory(global, "unplaced");
    expect(unplaced.every(row => row.pageId === null && !row.group)).toBe(true);
    expect(selectFieldInventory(global, "tools").every(row => row.group && row.placements?.length)).toBe(true);
  });
  it("does not put collection fields into the flat runtime form order", () => {
    expect(pageFieldOrder.eligibility).not.toContain("child-first-name");
    expect(global.some(r=>r.field.id==="beneficiary-firstName" && r.storage==="beneficiaries[product:applicant][].firstName")).toBe(true);
    expect(global.some(r=>r.field.id==="self-di-company-name" && r.storage==="selfDisabilityCompanies[].company")).toBe(true);
    expect(global.some(r=>r.pageId==="review" && r.field.id==="review-self-consent")).toBe(true);
    expect(global.some(r=>r.pageId==="advisor-login" && r.field.id==="advisor-email")).toBe(true);
  });
  it("does not leak another Site's product fields", () => {
    for (const site of siteEntities) {
      const ids=getClientCoverages(getEffectiveSiteConfig(site.id)).map(p=>p.id);
      for (const row of getSiteFieldInventory(site.id).filter(r=>r.field.id.startsWith("payment-method:"))) expect(ids).toContain(row.field.id.slice("payment-method:".length));
    }
  });
  it("exports the reviewed inventory when requested", () => {
    if (!process.env.FIELD_AUDIT_EXPORT) return;
    const counts=siteEntities.map(site=>{
      const rows=getSiteFieldInventory(site.id);
      return {site:site.id,client:site.clientId,placements:rows.length,fields:new Set(rows.map(r=>r.field.id)).size,pages:[...new Set(rows.map(r=>r.pageId))].length,byPage:Object.fromEntries([...new Set(rows.map(r=>r.pageId))].map(page=>[page,rows.filter(r=>r.pageId===page).length]))};
    });
    writeFileSync(process.env.FIELD_AUDIT_EXPORT, JSON.stringify({globalPlacements:global.length,globalFields:new Set(global.map(r=>r.field.id)).size,sites:counts},null,2));
  });
});
