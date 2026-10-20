import { analyticsTagId, createAnalyticsPayload, type AnalyticsEvent, type AnalyticsPayload, type AnalyticsTag } from "../domain/analytics";

export type AnalyticsSink = (payload: AnalyticsPayload) => void;
let sink: AnalyticsSink | null = null;
/** No network destination is guessed. The configured sink only receives sanitized events. */
export function setAnalyticsSink(next: AnalyticsSink | null) { sink = next; }
export function emitAnalytics(tag: AnalyticsTag, event: AnalyticsEvent, context: Record<string, unknown>) {
  const payload = createAnalyticsPayload(tag, event, context);
  if (payload) { try { sink?.(payload); } catch { /* Analytics must not interrupt an application. */ } }
  return payload;
}
export function attachPageAnalytics(root: HTMLElement, pageId: string, context: Record<string, unknown>, tags: AnalyticsTag[]) {
  const indexed = new Map(tags.map(tag => [tag.id, tag]));
  const emit = (kind: "page" | "field" | "navigation", key: string, event: AnalyticsEvent) => {
    const tag = indexed.get(analyticsTagId(pageId, kind, key)); if (tag) emitAnalytics(tag, event, context);
  };
  emit("page", "page", "view");
  const change = (event: Event) => {
    if (!(event.target instanceof Element)) return;
    const field = event.target.closest("[data-analytics-field]");
    if (field && root.contains(field)) emit("field", field.getAttribute("data-analytics-field")!, "change");
  };
  const click = (event: Event) => {
    if (!(event.target instanceof Element)) return;
    const target = event.target.closest("[data-analytics-navigation]");
    if (target && root.contains(target)) emit("navigation", target.getAttribute("data-analytics-navigation")!, "activate");
  };
  root.addEventListener("change", change); root.addEventListener("click", click);
  return () => { root.removeEventListener("change", change); root.removeEventListener("click", click); };
}

export function emitPageAnalytics(pageId: string, event: AnalyticsEvent, context: Record<string, unknown>, tags: AnalyticsTag[]) {
  const tag = tags.find(tag => tag.id === analyticsTagId(pageId, "page", "page"));
  return tag ? emitAnalytics(tag, event, context) : null;
}
