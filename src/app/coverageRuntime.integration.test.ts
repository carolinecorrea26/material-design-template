import { resolveVisibleFields } from "../config/conditions/resolveVisibility";
import { fieldCatalog } from "../config/fields";
import { amaClient } from "../config/clients/ama";
import { getPageCollectionDefaults } from "./RoutePage";
import { isTpaMemberMatch } from "../components/verification/MemberVerification";
import { describe, expect, it, vi, afterEach } from "vitest";
import dayjs from "dayjs";
import { createElement, act, useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { asceClient } from "../config/clients/asce";
import { getClientCoverages } from "../config/client/getActiveClientCoverages";
import { resolveApplicationCoverage, applicationUnderwriting, validateApplicationCoverages } from "../domain/coverageRuntime";
import { resolveFlowGate } from "../config/flowGates";
import { buildSelectedCoverageEntries } from "../utils/coverageDecisions";
import { coverageFactFieldIds, eligibilityFactFieldIds } from "../config/fields/coverageFactFields";
import { ApplicationFormContext, type ApplicationFormValues } from "./ApplicationFormContext";
import { useCoverageState } from "./useCoverageState";
import { readFileSync } from "node:fs";

vi.mock("../config/client/getActiveClient", async importOriginal => ({ ...await importOriginal<object>(), getActiveClient: () => asceClient }));
const products = getClientCoverages(asceClient);
const di = products.find(p => p.id === "di-ltd")!;
const life = products.find(p => p.id === "li-10yr")!;
const dob = (age: number) => dayjs().subtract(age, "year").format("YYYY-MM-DD");
const facts = (age = 35): ApplicationFormValues => ({ "birth-date": dob(age), "hours-worked-per-week": "30", "average-monthly-income": "$20,000", "is-self-employed": "no" });
const selected = (id: string, age: number, amount: number): ApplicationFormValues => ({ ...facts(age), coverageSelections: [id], productApplicants: { [id]: ["member"] }, coverageAmounts: { [`${id}:member`]: amount } });
afterEach(() => vi.useRealTimers());

describe("application facts through live Coverage and routing", () => {
  it.each([[16,false],[17,true],[69,true],[70,false]])("member DI age %s selectable %s", (age, allowed) => expect(resolveApplicationCoverage(di,"member",facts(Number(age)),products).selectable).toBe(allowed));
  it.each([[16,false],[17,true],[59,true],[60,false]])("spouse DI age %s selectable %s", (age, allowed) => expect(resolveApplicationCoverage(di,"spouse",{"spouse-birth-date":dob(Number(age))},products).selectable).toBe(allowed));
  it("blocks insufficient and missing hours", () => {
    expect(resolveApplicationCoverage(di,"member",{...facts(),"hours-worked-per-week":"29"},products).selectable).toBe(false);
    expect(resolveApplicationCoverage(di,"member",{...facts(),"hours-worked-per-week":""},products).eligibilityStatus).toBe("needs-information");
  });
  it.each([[22,"no","yes",true],[23,"no","yes",false],[24,"yes","yes",true],[25,"yes","yes",false],[22,"yes","no",false]])("child age %s student %s unmarried %s", (age,student,unmarried,allowed) => {
    const values = { "child-birth-date": dob(Number(age)), "child-full-time-student": student, "child-unmarried": unmarried, productApplicants: {"li-term":["member"]} };
    expect(resolveApplicationCoverage(life,"child",values,products).selectable).toBe(allowed);
  });
  it("enforces infant boundary, dependencies and one child plan", () => {
    const values = {"child-birth-date":dayjs().subtract(14,"day").format("YYYY-MM-DD"),"child-unmarried":"yes", productApplicants:{"li-term":["member"]}};
    expect(resolveApplicationCoverage(life,"child",values,products).selectable).toBe(true);
    expect(resolveApplicationCoverage(life,"child",{...values,"child-birth-date":dayjs().subtract(13,"day").format("YYYY-MM-DD")},products).selectable).toBe(false);
    expect(resolveApplicationCoverage(life,"child",{...values,productApplicants:{}},products).selectable).toBe(false);
    expect(resolveApplicationCoverage(life,"child",{...values,productApplicants:{"li-term":["member","child"]}},products).selectable).toBe(false);
  });
  it.each([[35,20000,"no",0,8550],[65,20000,"no",0,4200],[35,20000,"yes",0.5,1050],[35,1100,"no",0,600]])("limits generated amount choices", (age,income,self,years,max) => {
    const result = resolveApplicationCoverage(di,"member",{...facts(Number(age)),"average-monthly-income":income,"is-self-employed":self,"years-self-employed":years},products);
    expect(result.amounts.at(-1)).toBe(max);
    expect(result.amounts.every(amount => amount % 150 === 0)).toBe(true);
  });
  it("resolves mandatory and fixed spouse options", () => {
    const result = resolveApplicationCoverage(di,"member",{...facts(),"is-self-employed":"yes","years-self-employed":"0.5"},products);
    expect(result.waitingPeriod.requiredValue).toBe("90");
    expect(result.benefitPeriod.requiredValue).toBe("five-year");
    const spouse = resolveApplicationCoverage(di,"spouse",{"spouse-birth-date":dob(40)},products);
    expect(spouse.amounts).toEqual([500]);
    expect(spouse.waitingPeriod.requiredValue).toBe("30");
    expect(spouse.benefitPeriod.requiredValue).toBe("spouse-two-years");
  });
  it.each([["li-10yr",60,510000,"QD"],["li-10yr",61,510000,"FUW"],["li-20yr",54,510000,"QD"]])("routes %s at age %s amount %s through %s", (id,age,amount,type) => {
    const values = selected(String(id),Number(age),Number(amount));
    const product = products.find(p => p.id === id)!;
    expect(applicationUnderwriting(product,"member",values)).toEqual({status:"resolved",underwritingType:type});
    expect(resolveFlowGate("health-qd",values,products)).toBe(type === "QD");
    expect(buildSelectedCoverageEntries(values,products)[0].coverage.underwritingType).toBe(type);
  });
  it("never falls back to QD for unresolved bands or missing facts", () => {
    const values = selected("li-10yr",65,500000);
    expect(applicationUnderwriting(life,"member",values).status).toBe("unresolved");
    expect(resolveFlowGate("health-qd",values,products)).toBe(false);
    expect(validateApplicationCoverages(products,values)).toContain("unresolved");
    expect(applicationUnderwriting(life,"member",{}).status).toBe("needs-information");
    expect(applicationUnderwriting(di,"member",{}).status).toBe("no-rule");
  });
  it("collects only contextual normalized requirement fields", () => {
    expect(coverageFactFieldIds([di],facts())).toEqual(["is-self-employed"]);
    expect(coverageFactFieldIds([di],{...facts(),"is-self-employed":"yes"})).toContain("years-self-employed");
    expect(eligibilityFactFieldIds([life])).toContain("child-unmarried");
  });
  it("live hook allows adding ineligible DI, blocks continuation, and repairs restored required amounts/options", async () => {
    Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
    let state!: ReturnType<typeof useCoverageState>;
    let update!: (values: ApplicationFormValues) => void;
    function Probe() {
      const [values,setValues] = useState<ApplicationFormValues>({...facts(),"hours-worked-per-week":"29"});
      const setPageValues = (patch: ApplicationFormValues) => setValues(current => ({...current,...patch}));
      useEffect(() => { update = setPageValues; });
      return createElement(ApplicationFormContext.Provider,{value:{values,setPageValues,resetValues:()=>{}}},createElement(Consumer));
    }
    function Consumer() { const current = useCoverageState(); useEffect(() => { state = current; }); return null; }
    const node = document.createElement("div"); const root = createRoot(node);
    await act(async () => root.render(createElement(Probe)));
    await act(async () => state.toggleApplicantForProduct(di.id,"member"));
    expect(state.productApplicants[di.id]).toEqual(["member"]);
    expect(state.validate(state.values)).toBeDefined();
    await act(async () => update({...selected(di.id,35,8550),"is-self-employed":"yes","years-self-employed":"0.5",coverageWaitingPeriods:{"di-ltd:member":"30"},coverageMaxBenefitPeriods:{"di-ltd:member":"career"}}));
    expect(state.generateAmountChoices(di,"member").at(-1)).toBe(1050);
    expect(state.storedAmounts["di-ltd:member"]).toBeLessThanOrEqual(1050);
    expect(state.storedWaitingPeriods["di-ltd:member"]).toBe("90");
    expect(state.storedMaxBenefitPeriods["di-ltd:member"]).toBe("five-year");
    expect(state.validate(state.values)).toBeUndefined();
    await act(async () => root.unmount());
  });
  it("revalidates edits to Profile facts and ignores zero-amount dependencies", () => {
    const original = selected(di.id,35,8550);
    expect(validateApplicationCoverages(products, original)).toBeUndefined();
    expect(validateApplicationCoverages(products, {...original, "is-self-employed":"yes", "years-self-employed":"0.5"})).toContain("available benefit amount");
    expect(resolveApplicationCoverage(life,"child",{
      "child-birth-date":dob(20),"child-unmarried":"yes",
      coverageSelections:["li-term"],productApplicants:{"li-term":["member"]},coverageAmounts:{"li-term:member":0},
    },products).selectable).toBe(false);
  });
  it("uses all existing children instead of an independent child birth date", () => {
    const values = {productApplicants:{"li-term":["member"]}, "child-birth-date":dob(20), "child-unmarried":"yes", children:[{birthDate:dob(22),unmarried:"yes"},{birthDate:dob(24),unmarried:"yes",fullTimeStudent:"yes"}]};
    expect(resolveApplicationCoverage(life,"child",values,products).selectable).toBe(true);
    expect(resolveApplicationCoverage(life,"child",{...values,children:[...values.children,{birthDate:dob(25),unmarried:"yes",fullTimeStudent:"yes"}]},products).selectable).toBe(false);
    expect(resolveApplicationCoverage(life,"child",{...values,children:[{birthDate:dob(20)}]},products).eligibility).toBe("needs-information");
  });
  it("restores persisted child collections and resolves fact-based verification", () => {
    const children = [{birthDate:dob(20),unmarried:"yes",fullTimeStudent:"no"}];
    expect(getPageCollectionDefaults("eligibility",{children})).toEqual({children});
    expect(isTpaMemberMatch(undefined,{"first-name":"Caroline"})).toBe(false);
    expect(isTpaMemberMatch({"first-name":"Caroline"},{"first-name":" caroline "})).toBe(true);
  });
  it("retains configured dependent option exclusions without client checks", () => {
    const field = { ...fieldCatalog.dependents, ...amaClient.fields.eligibility?.overrides?.dependents };
    expect(resolveVisibleFields([field],{membership:"spouse"})[0].options?.some(option => option.value === "spouse")).toBe(false);
    expect(resolveVisibleFields([field],{membership:"member"})[0].options?.some(option => option.value === "spouse")).toBe(true);
  });
  it("generic runtime modules contain no known client identifiers", () => {
    for (const file of ["src/domain/coverageRuntime.ts","src/domain/coverageRequirements.ts","src/utils/applicantFacts.ts","src/app/useCoverageState.ts","src/pages/Coverage.tsx","src/config/flowGates.ts","src/components/coverage/ProductCatalog.tsx","src/config/fields/coverageFactFields.ts","src/app/workflows/QuoteCalculator.tsx","src/components/coverage/CoverageCart.tsx","src/pages/Review.tsx","src/pages/Eligibility.tsx","src/components/verification/MemberVerification.tsx"]) {
      expect(readFileSync(file,"utf8"),file).not.toMatch(/\b(asce|ama|waepa|abe)\b/i);
    }
  });
});
