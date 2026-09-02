import { getActiveClient } from "../client/getActiveClient";

export type FormTemplate = "single" | "multi";

const TEMPLATE_QUERY_PARAM = "template";
const TEMPLATE_STORAGE_KEY = "activeFormTemplate";
const DEFAULT_TEMPLATE: FormTemplate = "multi";

function isTemplate(v: string | null): v is FormTemplate {
  return v === "single" || v === "multi";
}

export function resolveFormTemplate(): FormTemplate {
  const params = new URLSearchParams(window.location.search);
  const urlVal = params.get(TEMPLATE_QUERY_PARAM);
  if (isTemplate(urlVal)) {
    window.sessionStorage.setItem(TEMPLATE_STORAGE_KEY, urlVal);
    return urlVal;
  }
  const stored = window.sessionStorage.getItem(TEMPLATE_STORAGE_KEY);
  if (isTemplate(stored)) return stored;
  const clientDefault = getActiveClient().features?.defaultTemplate;
  if (clientDefault) return clientDefault;
  return DEFAULT_TEMPLATE;
}

export function getFormTemplate(): FormTemplate {
  return resolveFormTemplate();
}
