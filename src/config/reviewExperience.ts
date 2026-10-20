import { getPrototypeLibrary } from "../domain/prototypeLibrary";
import { activeReviewBlocks, resolveFraudNotice, type ReviewSelection } from "../domain/reviewPolicy";
import { reviewPolicyForSite } from "../content/reviewPolicies";
import { fieldCatalog } from "./fields";
import type { ClientConfig } from "../domain/configuration";
import type { CoverageDefinition } from "../domain/coverage";
import type { ApplicationFormValues } from "../app/ApplicationFormContext";
import { buildSelectedCoverageEntries } from "../utils/coverageDecisions";

export function resolveReviewExperience(client: ClientConfig, siteKey: string, products: CoverageDefinition[], values: Record<string, unknown>) {
  const library = getPrototypeLibrary(siteKey);
  const policy = library ? library.client.reviewPolicy! : reviewPolicyForSite(siteKey, client.reviewPolicy);
  const selections: ReviewSelection[] = buildSelectedCoverageEntries(values as ApplicationFormValues, products).map(entry => ({ productKey: entry.coverageId, category: entry.coverage.categoryId, applicants: [entry.applicant], accidentRider: Object.entries(values.coverageRiders as Record<string, boolean> ?? {}).some(([key, selected]) => selected && key.startsWith(`${entry.coverageId}:`) && /ad|accident/i.test(key)), mode: (values.coverageModes as Record<string, string> | undefined)?.[entry.coverageId] ?? "new" }));
  const blocks = activeReviewBlocks(policy, selections).map(block => ({ ...block, fields: block.fields.filter(id => !client.fields.review?.hidden?.includes(id)).map(id => ({ ...fieldCatalog[id], ...client.fields.review?.overrides?.[id], id })) }));
  const jurisdiction = String(values["state-province"] || values.state || "");
  return { blocks, fraudNotice: resolveFraudNotice(policy, jurisdiction, selections), missingResidency: selections.length > 0 && !jurisdiction };
}

/** Preserve legacy content while guaranteeing the applicable notice is rendered. */
export function composeReadAndSign(content: string, fraudNotice: string | null) {
  if (!fraudNotice) return content;
  const consent = "\n\nCONSENT:";
  return content.includes(consent) ? content.replace(consent, `\n\n${fraudNotice}${consent}`) : `${content}\n\n${fraudNotice}`;
}
