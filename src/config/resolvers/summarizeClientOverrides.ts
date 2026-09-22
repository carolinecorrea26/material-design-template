import type { ClientConfig } from "../clients/types";
import { urlParameters } from "../../content/docs/urlParameters";
import { resolveClientPages } from "./resolveClientPages";
import { resolveClientFields } from "./resolveClientFields";
import { resolveClientCoverage } from "./resolveClientCoverage";
import { resolveClientConfigurations } from "./resolveClientConfigurations";
import { resolveClientFlows } from "./resolveClientFlows";

export type OverrideSummaryItem = {
  id: string;
  label: string;
  detail: string;
};

export type OverrideSummaryDomain = {
  id: "pages" | "fields" | "coverage" | "flows" | "configurations" | "urlParameters";
  label: string;
  /** Section id in Effective Site this domain's full detail lives under. */
  anchor: string;
  totalCount: number;
  overriddenCount: number;
  items: OverrideSummaryItem[];
};

/**
 * Derives "what differs from the Global Template for this client" directly
 * from the same four resolvers Effective Site renders from (plus
 * urlParametersInUse, which has no dedicated resolver — see
 * urlParameters.ts's source-of-truth note). No comparison logic is
 * reimplemented here, so this summary can't drift from the detailed tables
 * it's a digest of.
 */
export function summarizeClientOverrides(client: ClientConfig): OverrideSummaryDomain[] {
  const pages = resolveClientPages(client);
  const overriddenPages = pages.filter((p) => p.status !== "inherited");

  const fieldPages = resolveClientFields(client);
  const allFields = fieldPages.flatMap((page) =>
    page.fields.map((field) => ({ ...field, pageTitle: page.pageTitle })),
  );
  const overriddenFields = allFields.filter((f) => f.status !== "inherited");

  const coverage = resolveClientCoverage(client);
  const overriddenCoverage = coverage.filter((c) => c.status !== "inherited");

  const flows = resolveClientFlows(client);
  const overriddenFlows = flows.filter((f) => f.status === "overridden");

  const configurations = resolveClientConfigurations(client).filter(
    (c) => c.liveValueAvailable,
  );
  const overriddenConfigurations = configurations.filter((c) => c.status === "overridden");

  const urlParamsInUse = client.urlParametersInUse ?? [];

  return [
    {
      id: "pages",
      label: "Pages",
      anchor: "effective-pages-table",
      totalCount: pages.length,
      overriddenCount: overriddenPages.length,
      items: overriddenPages.map((p) => ({
        id: p.id,
        label: p.global.title,
        detail: p.effective.visibleWhen,
      })),
    },
    {
      id: "fields",
      label: "Fields",
      anchor: "effective-fields-table",
      totalCount: allFields.length,
      overriddenCount: overriddenFields.length,
      items: overriddenFields.map((f) => ({
        id: `${f.pageId}.${f.fieldId}`,
        label: `${f.pageTitle} → ${f.row.label}`,
        detail:
          f.row.clientNote ?? (f.status === "disabled" ? "Hidden for this client" : f.status),
      })),
    },
    {
      id: "coverage",
      label: "Coverage",
      anchor: "effective-coverage-table",
      totalCount: coverage.length,
      overriddenCount: overriddenCoverage.length,
      items: overriddenCoverage.map((c) => ({
        id: c.id,
        label: c.global.name,
        detail:
          c.status === "disabled"
            ? "Not enabled for this client"
            : `Overridden: ${c.clientDiffs.join(", ")}`,
      })),
    },
    {
      id: "flows",
      label: "Flows",
      anchor: "effective-flows-section",
      totalCount: flows.length,
      overriddenCount: overriddenFlows.length,
      items: overriddenFlows.map((f) => ({
        id: f.id,
        label: f.global.title,
        detail: `Overridden: ${f.clientDiffs.join(", ")}`,
      })),
    },
    {
      id: "configurations",
      label: "Configuration",
      anchor: "effective-configuration-table",
      totalCount: configurations.length,
      overriddenCount: overriddenConfigurations.length,
      items: overriddenConfigurations.map((c) => ({
        id: c.key,
        label: c.label,
        detail: "Overridden from global default",
      })),
    },
    {
      id: "urlParameters",
      label: "URL Parameters",
      anchor: "effective-configuration-table",
      totalCount: urlParameters.length,
      overriddenCount: urlParamsInUse.length,
      items: urlParameters
        .filter((p) => urlParamsInUse.includes(p.parameter))
        .map((p) => ({
          id: p.parameter,
          label: p.parameter,
          detail: "In use for this client",
        })),
    },
  ];
}
