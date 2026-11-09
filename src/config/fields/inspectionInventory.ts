import { requirementAnswerKey } from "../../domain/requirementFields";
import { getPhoneTypeFieldId } from "../../domain/phoneFields";
import { resolveMappedFields, siteUsesRequirementFields } from "../../domain/requirementFields";
import type { ResolvedFieldSurface } from "../../domain/fieldSurfaces";
/** Inspection-only inventory: never feeds page rendering, validation, or persistence.
 * Includes conditional and repeated inputs in addition to the flat runtime registry.
 */
import { fieldCatalog } from ".";
import { getQuoteQuestionFieldIds, homeQuoteFieldIds } from "./homeQuoteFields";
import { needsCalculatorFields } from "./needsCalculatorFields";
import { getPageCategory } from "../resolvers/resolveClientPages";
import { childMapping } from "./eligibilityListFields";
import { SECURITY_QUESTIONS } from "./verificationFields";
import { resolveCoverageQuestionSections } from "../resolvers/resolveCoverageQuestionSections";
import { coverageFactFieldIds } from "./coverageFactFields";
import { pageFieldOrder } from "./pageFieldOrder";
import { getResolvedFieldResolutionsForSite } from "./resolvedFieldRegistry";
import { pages } from "../pages";
import { pageSections as defaultPageSections } from "../pageSections/pageSections";
import type { PrototypeLibrary } from "../../domain/prototypeLibrary";
import { siteEntities, getEffectiveSiteConfig } from "../../data/registry";
import { getClientCoverages } from "../client/getActiveClientCoverages";
import { getClientPageRequirement } from "../client/getClientPageRequirement";
import { coverageUnlocksPage, getFlowGateDefinition } from "../flowGates";
import { createAnswerFields as siAnswers, detailsFields as siDetails } from "./healthSiFields";
import { createQuestionFields as liAnswers, detailsFields as liDetails } from "./healthLiFields";
import { createAnswerFields as diAnswers, QUESTIONS as diQuestions } from "./healthDiFields";
import { disabilityCompanyMapping } from "./profileListFields";
import { BENEFICIARY_INDIVIDUAL_FIELDS, BENEFICIARY_TRUST_FIELDS, beneficiaryInfoOptInField } from "./beneficiaryFields";
import { paymentMethodOptions, paymentFrequencyOptions, paymentInfoOptInField } from "./paymentFields";
import type { FieldDefinition } from "./types";
import type { PageId } from "../../types";
import { quoteRiders } from "../../domain/pricing";

export type FieldPlacement = {
  pageId: PageId;
  accessPath: string;
  presentation: "inline" | "drawer";
  condition: string;
};
export type FieldGroup = { id: string; label: string };
export type InspectedField = {
  field: FieldDefinition;
  /** Saved definition reused by a generated product/applicant control. */
  definitionKey?: string;
  pageId: PageId | null;
  group?: FieldGroup;
  placements?: FieldPlacement[];
  area: string;
  condition: string;
  storage: string;
  status: string;
  notes: string[];
  sites: string[];
};
const catalog = fieldCatalog as Record<string, FieldDefinition>;
const cache = new Map<string, InspectedField[]>();
export function getSiteFieldInventory(siteId: string, library?: PrototypeLibrary): InspectedField[] {
  const cached = !library ? cache.get(siteId) : undefined; if (cached) return cached;
  const client = library?.client ?? getEffectiveSiteConfig(siteId);
  const products = library?.products ?? getClientCoverages(client);
  const pageSections = library ? Object.fromEntries(library.site.configuration.pages.map(page => [page.key, page.sections.map(section => section.definition.value)])) as typeof defaultPageSections : defaultPageSections;
  const requirement = (page: PageId) => library ? library.site.configuration.pages.find(row => row.key === page)?.requirement ?? "none" : getClientPageRequirement(page, client);
  const result: InspectedField[] = [];
  const definitions = library ? Object.fromEntries(library.fields.map(field => [field.id, field])) : catalog;
  const surfaceFields = (name: string, fallback: FieldDefinition[]) => library ? library.fieldSurfaces[name].mapping.fields : fallback;
  const surface = (name: string): ResolvedFieldSurface | undefined => library?.fieldSurfaces[name];
  const coverageFields = new Set<string>([
    ...resolveCoverageQuestionSections({sections:pageSections.coverage ?? [],selectedCategories:products.map(p=>p.categoryId),coverageQuestions:client.coverageQuestions}).flatMap(s=>s.fieldIds),
    ...coverageFactFieldIds(products),
  ]);
  // Saved assignments include conditional portfolio routes as well as simple
  // product gates. Inventory all possible inputs without evaluating a journey.
  const enabled = (page: PageId) => requirement(page) !== "none" && (!!library || !getFlowGateDefinition(page) || products.some(p => coverageUnlocksPage(page, p)));
  const add = (pageId: PageId, field: FieldDefinition, area: string, condition: string, storage = field.id, status = "page-defined", notes: string[] = [], definitionKey?: string) => {
    if (enabled(pageId)) result.push({ field, definitionKey, pageId, area, condition, storage, status, notes, sites: [siteId] });
  };
  for (const page of library ? library.pages.map(row => row.definition) : pages) {
    if (page.type === "internal" || !enabled(page.id)) continue;
    const resolutions = library ? (library.site.configuration.pages.find(row => row.key === page.id)?.fields ?? []).map(field => ({ fieldId: field.key, field: field.definition, included: field.included, status: "site-configured", notes: [] })) : getResolvedFieldResolutionsForSite(page.id, siteId);
    for (const row of resolutions) {
      if (!row.included) continue;
      if (page.id === "coverage" && !coverageFields.has(row.fieldId)) continue;
      const section = pageSections[page.id]?.find(s => s.fieldIds.some(id => id === row.fieldId));
      if (page.id === "profile" && section?.id.startsWith("profileFinancial")) {
        const applicant = section.applicant === "spouse" ? "spouse" : "member";
        const category = section.id === "profileFinancialQuestionnaireSelf" || row.field.id.includes("disability") ? "DI" : "LI";
        if (!products.some(p=>p.categoryId===category && p.applicants.includes(applicant))) continue;
      }
      add(page.id, row.field, section?.id ?? "Page", [section?.visibilityConditionId, row.field.visibilityConditionId].filter(Boolean).join("; ") || "Page and field visibility rules apply", row.field.id, row.status, row.notes);
      if (row.field.format === "phone" && row.field.showPhoneTypeSelector !== false) {
        const id = getPhoneTypeFieldId(row.field);
        const companion = definitions[id];
        if (!companion) throw new Error(`Missing configured phone type field: ${id}`);
        add(page.id, companion, section?.id ?? "Page", `Shown with ${row.field.id}`, id, "component-defined");
      }
    }
  }
  const childKeys: Record<string,string> = {...childMapping.fieldToKey,"child-full-time-student":requirementAnswerKey("full-time-student", "child"),"child-honorably-discharged-service-member":requirementAnswerKey("honorably-discharged-service-member", "child")};
  if (library) for (const field of library.fieldCollections.children.mapping.fields) {
    const key = library.fieldCollections.children.mapping.fieldToKey[field.id];
    const registered = result.find(row => row.pageId === "eligibility" && row.field.id === field.id);
    if (registered) Object.assign(registered, { field, area: "childSection", storage: `children[].${key}`, condition: "Child selected; repeated for each child" });
    else add("eligibility", field, "childSection", "Child selected; repeated for each child", `children[].${key}`);
  }
  else for (const [id,key] of Object.entries(childKeys)) {
    const registered = result.find(r => r.pageId === "eligibility" && r.field.id === id);
    if (id === "child-full-time-student" || id === "child-honorably-discharged-service-member") {
      if (registered) Object.assign(registered, {area:"childSection",storage:`children[].${key}`,condition:"Child selected; repeated for each child"});
    } else add("eligibility", catalog[id], "childSection", "Child selected; repeated for each child", `children[].${key}`);
  }
  for (const applicant of ["self", "spouse"] as const) {
    const applicantType = applicant === "self" ? "member" : "spouse";
    for (const page of ["health-si","health-li","health-di"] as const) {
      if (!products.some(p => p.applicants.includes(applicantType) && (page === "health-si" || coverageUnlocksPage(page,p)))) continue;
      const answers = library ? (library.site.configuration.pages.find(row => row.key === page)?.fields ?? []).filter(row => row.included && row.key.startsWith(`${page}-q`) && row.key.endsWith("-spouse") === (applicant === "spouse")).map(row => row.definition) : page === "health-si" ? siAnswers(applicant) : page === "health-li" ? liAnswers(applicant) : diAnswers(applicant);
      answers.forEach((field,index) => {
        add(page, field, applicant, "Applicant participating in this health page");
        const name = page === "health-si" ? "healthSiDetails" : page === "health-li" ? "healthLiDetails" : `healthDi${field.id.replace('health-di-', '').replace('-spouse', '')}Details`;
        const details = surfaceFields(name, page === "health-si" ? siDetails : page === "health-li" ? liDetails : diQuestions[index].mapping.fields);
        for (const detail of details) {
          const storage = `${field.id}-details[].${surface(name)?.mapping.fieldToKey[detail.id] ?? detail.id}`;
          add(page, library ? detail : {...detail, id: storage}, `${applicant} / ${field.id} details`, `${field.id} = yes; repeated detail records`, storage);
        }
      });
    }
    const companyMapping = library?.fieldCollections[`${applicant}DisabilityCompanies`].mapping ?? disabilityCompanyMapping;
    for (const field of products.some(p=>p.categoryId === "DI" && p.applicants.includes(applicantType)) ? companyMapping.fields : []) {
      const key = companyMapping.fieldToKey[field.id as keyof typeof companyMapping.fieldToKey];
      const storage = `${applicant}DisabilityCompanies[].${key}`;
      add("profile", {...field,id:`${applicant}-${field.id}`}, `${applicant} / existing disability insurance`, "Applicant has existing disability insurance and applicable coverage", storage, "page-defined", [], field.id);
    }
    add("review", definitions[`review-${applicant}-consent`], applicant, applicant === "self" ? "Review page" : "Spouse applying");
  }
  if (requirement("beneficiary") === "optional") for (const field of surfaceFields("beneficiaryControls", [beneficiaryInfoOptInField]).filter(field => field.id === beneficiaryInfoOptInField.id)) add("beneficiary", field, "Page", "Optional beneficiary page");
  for (const name of ["beneficiaryIndividual", "beneficiaryTrust", "beneficiaryControls"]) {
    const fallback = name === "beneficiaryIndividual" ? BENEFICIARY_INDIVIDUAL_FIELDS : name === "beneficiaryTrust" ? BENEFICIARY_TRUST_FIELDS : [{id:"beneficiaryType",label:"Beneficiary Type",inputType:"radio" as const,options:[{value:"individual",label:"Individual"},{value:"trust",label:"Trust"}]}];
    for (const field of surfaceFields(name, fallback).filter(field => field.id !== beneficiaryInfoOptInField.id)) add("beneficiary", library ? field : {...field, id: `beneficiary-${field.id}`}, "Beneficiary / per product and applicant", "Individual or trust; primary or contingent; selected LI/AD coverage", `beneficiaries[product:applicant][].${surface(name)?.mapping.fieldToKey[field.id] ?? field.id}`);
  }
  if (requirement("payment") === "optional") for (const field of surfaceFields("paymentControls", [paymentInfoOptInField]).filter(field => field.id === paymentInfoOptInField.id)) add("payment", field, "Page", "Optional payment page");
  for (const product of products) {
    for (const [kind,label,inputType,options] of [["method","Payment Method","radio",paymentMethodOptions],["frequency","Payment Frequency","dropdown",paymentFrequencyOptions]] as const) {
      const stored = surface("paymentControls")?.mapping.fields.find(field => field.id === `payment-${kind}`);
      if (library && !stored) continue;
      add("payment", {...(stored ?? {label,inputType,options:options.map(o=>({value:o.value,label:o.label}))}), id:`payment-${kind}:${product.id}`},product.name,"Selected product with nonzero amount; payment information enabled", undefined, "page-defined", [], stored?.id);
    }
    for (const applicant of product.applicants) {
      const key = `${product.id}:${applicant}`;
      const area = `${product.name} / ${applicant}`;
      const control = (id:string,label:string,inputType:FieldDefinition["inputType"], storage:string, options?:FieldDefinition["options"]) => add("coverage",{id,label,inputType,options},area,"Product/applicant selected; eligibility and amount rules apply",storage,"component-defined");
      control(`coverage-applicant:${key}`,"Applicant selection","checkbox",`productApplicants[${product.id}]`);
      control(`coverage-amount:${key}`,"Coverage Amount","dropdown",`coverageAmounts[${key}]`);
      const waiting = product.waitingPeriodOptionsByApplicant?.[applicant] ?? product.waitingPeriodOptions;
      const benefit = product.maxBenefitPeriodOptionsByApplicant?.[applicant] ?? product.maxBenefitPeriodOptions;
      if (["DI","OO"].includes(product.categoryId)) {
        if (waiting) control(`coverage-waiting:${key}`,"Waiting Period","dropdown",`coverageWaitingPeriods[${key}]`,waiting);
        if (benefit) control(`coverage-benefit:${key}`,product.categoryId === "DI" ? "Benefit Option" : "Maximum Benefit Period","dropdown",`coverageMaxBenefitPeriods[${key}]`,benefit);
      }
      for (const rider of product.riders ?? []) if (!rider.applicants || rider.applicants.includes(applicant)) {
        const riderKey=`${product.id}:${rider.id}:${applicant}`;
        control(`coverage-rider:${riderKey}`,rider.name,"checkbox",`coverageRiders[${riderKey}]`);
        if (rider.hasAmount && rider.coverageAmounts) control(`coverage-rider-amount:${riderKey}`,`${rider.name} amount`,"dropdown",`coverageRiderAmounts[${riderKey}]`);
      }
    }
  }
  add("coverage",{id:"selectedCategoryChips",label:"Coverage categories",inputType:"checkbox-group"},"Coverage selection","Select coverage categories","selectedCategoryChips","component-defined");
  if (client.features?.memberVerificationMatchFacts || client.tpaIntegration?.mode === "coverage-verification") {
    if (client.tpaIntegration?.requireAddressBeforeVerification) {
      const addressIds = new Set(["street-address", "apt-suite", "city", "state", "zip-code"]);
      const addressFields = library
        ? resolveMappedFields({ component: "verification-address" }, { siteId, page: "eligibility" })
        : Object.values(catalog);
      for (const field of addressFields.filter(field => addressIds.has(field.id))) add("eligibility", field, "Verification address", "TPA match triggers address collection before member verification", field.id, "site-configured");
    }
    for (const field of surfaceFields("verificationControls", [{id:"verification-method",label:"Verification Method",inputType:"radio",options:["text","voice","security-questions","skip"].map(value=>({value,label:value}))}])) add("eligibility", field, "Member verification", "Configured member match; verification dialog open", "Local dialog state", library ? "site-configured" : "component-defined");
    for (const field of surfaceFields("verificationQuestions", SECURITY_QUESTIONS.map(question => ({id:question.id,label:question.question,inputType:"radio",options:question.options.map(value=>({value,label:value}))})))) add("eligibility", field, "Member verification / sample security questions", "Security questions verification method selected", "Local dialog state", library ? "site-configured" : "component-defined");
  }
  for (const block of client.reviewPolicy?.blocks ?? []) for (const id of block.fields) {
    if (client.fields.review?.hidden?.includes(id)) continue;
    add("review", { ...definitions[id], ...client.fields.review?.overrides?.[id] }, block.title, block.when?.applicant ? `${block.when.applicant} applying` : "Review page", id, "site-configured", block.sourceReferences);
  }
  const quoteGroup = { id: "quote-calculator", label: surface("quoteInputs")?.inspectionLabel ?? "Quote calculator" };
  const quotePlacements: FieldPlacement[] = [];
  const homeVariant = client.features?.homePageVariant ?? "default";
  const homeQuoteEnabled = enabled("home") && client.features?.defaultTemplate !== "single" && ["default", "quoteFirst"].includes(homeVariant);
  if (homeQuoteEnabled) quotePlacements.push({
    pageId: "home", accessPath: homeVariant === "quoteFirst" ? "Inline quote calculator" : "Eligibility card → See my quote",
    presentation: homeVariant === "quoteFirst" ? "inline" : "drawer",
    condition: homeVariant === "quoteFirst" ? "Quote step shown" : "Quote drawer open",
  });
  const addTool = (group: FieldGroup, placements: FieldPlacement[], field: FieldDefinition, condition: string, storage: string, definitionKey?: string) => {
    if (placements.length) result.push({field, definitionKey, pageId: null, group, placements, area: group.label, condition, storage, status: "component-defined", notes: [], sites: [siteId]});
  };
  const quoteJsonFields = siteUsesRequirementFields(siteId) ? resolveMappedFields({ component: "quote-calculator" }, { siteId }) : [];
  // Home's default card collects eligibility before opening the tool. Other
  // inputs belong to the calculator, including its inline Home placement.
  for (let index = result.length - 1; index >= 0; index--) {
    const row = result[index];
    if (row.pageId === "home" && homeQuoteFieldIds.some(id => id === row.field.id)) {
      if (homeVariant !== "default" || !homeQuoteFieldIds.slice(0, 3).some(id => id === row.field.id)) result.splice(index, 1);
      else {
        const jsonField = quoteJsonFields.find(field => field.id === row.field.id);
        if (jsonField) Object.assign(row, { field: jsonField, status: "requirements-json" });
      }
    }
  }
  const quoteQuestions = new Set(getQuoteQuestionFieldIds(client, products.map(p => p.categoryId), library ?? null));
  for (const [index, id] of homeQuoteFieldIds.entries()) {
    if (index >= 3 && !quoteQuestions.has(id)) continue;
    const placements = index < 3 ? quotePlacements.filter(p => p.pageId !== "home" || homeVariant === "quoteFirst") : quotePlacements;
    const surfaceField = surface("quoteInputs")?.mapping.fields.find(field => field.id === id);
    const jsonField = quoteJsonFields.find(field => field.id === id);
    const field = jsonField && (surfaceField || !library || id.startsWith("tobacco-")) ? jsonField : surfaceField;
    if (library && !field) continue;
    addTool(quoteGroup, placements, field ?? catalog[id], index < 3 ? "Eligibility collected in calculator" : "Relevant coverage category selected", "Local quote state; copied to application when applying");
    if (field === jsonField && jsonField && placements.length) result[result.length - 1].status = "requirements-json";
  }
  for (const product of products.filter(p => p.applicants.includes("member"))) {
    const selectedField = surface("quoteInputs")?.mapping.fields.find(field => field.id === "quote-selection");
    const amountField = surface("quoteInputs")?.mapping.fields.find(field => field.id === (["DI", "OO"].includes(product.categoryId) ? "quote-monthly-amount" : "quote-amount"));
    if (!library || selectedField) addTool(quoteGroup, quotePlacements, {...(selectedField ?? {label:`${product.name} selection`,inputType:"checkbox" as const}), id:`quote-selection:${product.id}`}, "Quote results shown", "Local quote state", selectedField?.id);
    if (!library || amountField) addTool(quoteGroup, quotePlacements, {...(amountField ?? {label:`${product.name} amount`,inputType:"dropdown" as const}), id:`quote-amount:${product.id}`}, "Quote product selected", "Local quote state", amountField?.id);
    for (const rider of quoteRiders(product)) {
      const riderKey = `${product.id}:${rider.id}:member`;
      addTool(quoteGroup, quotePlacements, {id:`quote-rider:${riderKey}`,label:rider.name,inputType:"checkbox"}, "Quote product shown with a nonzero amount", `Local quote state; copied to coverageRiders[${riderKey}] when applying`);
      if (rider.hasAmount && rider.coverageAmounts) addTool(quoteGroup, quotePlacements, {id:`quote-rider-amount:${riderKey}`,label:`${rider.name} amount`,inputType:"dropdown"}, "Quote rider selected", `Local quote state; copied to coverageRiderAmounts[${riderKey}] when applying`);
    }
  }
  if (new Set(products.map(p => p.categoryId)).size > 1 && (!library || surface("quoteInputs")?.mapping.fields.some(field => field.id === "quote-categories"))) addTool(quoteGroup, quotePlacements, (surface("quoteInputs")?.mapping.fields.find(field => field.id === "quote-categories") ?? {id:"quote-categories",label:"Coverage categories",inputType:"checkbox-group"}), "Multiple coverage categories available", "Local quote state");
  if (client.coverages.estimatedRateDisplay?.showFrequencyToggle) {
    add("coverage",{id:"coverage-rate-frequency",label:"Rate display frequency",inputType:"radio"},"Estimated rates","Frequency toggle enabled","Local display state","component-defined");
    if (!library || surface("quoteInputs")?.mapping.fields.some(field => field.id === "quote-rate-frequency")) addTool(quoteGroup, quotePlacements, (surface("quoteInputs")?.mapping.fields.find(field => field.id === "quote-rate-frequency") ?? {id:"quote-rate-frequency",label:"Rate display frequency",inputType:"radio"}), "Quote results shown; frequency toggle enabled", "Local display state");
  }
  const needsPages = library ? library.pages.filter(page => page.enabled && page.definition.flow === "application").map(page => page.definition) : pages;
  const needsPlacements: FieldPlacement[] = needsPages
    .filter(page => (getPageCategory(page) === "application" || page.id === "home") && enabled(page.id))
    .map(page => ({pageId: page.id, accessPath: "Application menu → How much coverage do I need?", presentation: "drawer", condition: "Needs calculator drawer open"}));
  for (const field of surfaceFields("needsCalculator", needsCalculatorFields)) addTool(
    {id: "needs-calculator", label: surface("needsCalculator")?.inspectionLabel ?? "Needs calculator"}, needsPlacements,
    field, "Needs calculator drawer open", "Local calculator state (not saved)",
  );
  // Bank fields are rendered only when a product uses a bank account.
  for (const row of result) if (row.pageId === "payment" && row.field.id.startsWith("bank-")) row.condition="At least one product uses Bank account; payment information enabled";
  const unique = [...new Map(result.map(row => [JSON.stringify([row.pageId,row.field,row.area,row.storage]),row])).values()];
  if (!library) cache.set(siteId,unique); return unique;
}
let globalInventory: InspectedField[] | undefined;
export function getGlobalFieldInventory(): InspectedField[] {
  if (globalInventory) return globalInventory;
  const grouped = new Map<string,InspectedField>();
  for (const site of siteEntities) for (const row of getSiteFieldInventory(site.id)) {
    const key = JSON.stringify([row.field,row.pageId,row.area,row.storage,row.condition,row.group,row.placements]);
    const existing=grouped.get(key);
    if (existing) existing.sites.push(site.id);
    else grouped.set(key,{...row,sites:[site.id]});
  }
  // Retain baseline definitions even when all current Sites override or omit them.
  for (const field of Object.values(fieldCatalog)) {
    const placements=[...new Set([...Object.entries(pageFieldOrder).filter(([,ids])=>ids?.some(id => id === field.id)).map(([p])=>p as PageId), ...Object.entries(defaultPageSections).filter(([,sections])=>sections?.some(section=>section.fieldIds.some(id => id === field.id))).map(([p])=>p as PageId), ...[...grouped.values()].filter(r=>r.field.id===field.id && r.pageId).map(r=>r.pageId!)])];
    for (const page of placements.length ? placements : [null]) {
      if ([...grouped.values()].some(row => row.pageId === page && JSON.stringify(row.field) === JSON.stringify(field))) continue;
      grouped.set(`baseline:${page}:${field.id}`,{field,pageId:page,area:page ? "Global baseline" : "Unplaced",condition:"Default placement; visibility rules apply",storage:field.id,status:"global",notes:[],sites:[]});
    }
  }
  globalInventory=[...grouped.values()]; return globalInventory;
}
export function getFieldInventory(scope: "global" | "effective", siteId: string) { return scope === "global" ? getGlobalFieldInventory() : getSiteFieldInventory(siteId).filter(row => row.pageId === null || !["internal", "advisor"].includes(getPageCategory(pages.find(page => page.id === row.pageId)!))); }

/** Project ownership separately from access: inline tools are direct page content. */
export function getFieldPlacements(row: InspectedField): FieldPlacement[] {
  return row.placements ?? (row.pageId ? [{
    pageId: row.pageId, accessPath: row.area, presentation: "inline", condition: row.condition,
  }] : []);
}
export function selectFieldInventory(rows: InspectedField[], view: "all" | "pages" | "tools" | "unplaced", pageId?: string, includeLinkedTools = false): InspectedField[] {
  return rows.flatMap(row => {
    if (view === "all") {
      const placements = getFieldPlacements(row).filter(placement => !pageId || placement.pageId === pageId);
      return pageId && !placements.length ? [] : [{ ...row, placements }];
    }
    if (view === "unplaced") return !row.pageId && !row.group ? [row] : [];
    if (view === "tools" && !row.group) return [];
    const placements = getFieldPlacements(row).filter(placement =>
      (!pageId || placement.pageId === pageId) &&
      (view === "tools" || includeLinkedTools || placement.presentation === "inline"));
    return placements.length ? [{...row, placements}] : [];
  });
}
