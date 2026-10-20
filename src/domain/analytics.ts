export type AnalyticsEvent = "view" | "activate" | "change" | "submit" | "validation-failed" | "open" | "close";
export type AnalyticsElementKind = "page" | "field" | "button" | "link" | "drawer" | "modal" | "navigation" | "tool" | "toggle";
export type AnalyticsTag = {
  id: string; pageId: string; elementKey: string; label: string; kind: AnalyticsElementKind;
  events: AnalyticsEvent[]; trigger: string; sites: string[];
  /** A local hook is not evidence of a deployed or verified vendor tag. */
  status: "local-hook" | "proposed"; permittedProperties: readonly string[];
  description: string;
  source: "prototype-definition" | "proposed-interaction" | "shared-component" | "component-definition";
  sourceFile: string; condition: string;
  adobe: { mapping: string | null; status: "not-configured" };
  contentsquare: { mapping: string | null; status: "not-configured" };
};
/** Semantic IDs never use labels, DOM order, random values or applicant IDs. */
export const analyticsTagId = (pageId: string, kind: AnalyticsElementKind, key: string) => `portal.v1/${encodeURIComponent(pageId)}/${kind}/${encodeURIComponent(key)}`;
export const analyticsProperties = ["siteKey", "template", "revision"] as const;
export type AnalyticsPayload = { schemaVersion: 1; tagId: string; event: AnalyticsEvent; properties: { siteKey: string; template: "single" | "multi"; revision: string } };
/** Strict reconstruction prevents form values, URLs, labels, policy identifiers,
 * health answers, timestamps, session IDs and arbitrary properties entering payloads. */
export function createAnalyticsPayload(tag: AnalyticsTag, event: AnalyticsEvent, context: Record<string, unknown>): AnalyticsPayload | null {
  if (!tag.events.includes(event) || typeof context.siteKey !== "string" || !tag.sites.includes(context.siteKey) || !["single", "multi"].includes(String(context.template)) || typeof context.revision !== "string" || !/^(prototype(?::[a-f0-9]{64})?|draft:[a-z0-9-]+|(?:local|postgres):v1:sha256:[a-f0-9]{64})$/.test(context.revision)) return null;
  return { schemaVersion: 1, tagId: tag.id, event, properties: { siteKey: context.siteKey, template: context.template as "single" | "multi", revision: context.revision } };
}
