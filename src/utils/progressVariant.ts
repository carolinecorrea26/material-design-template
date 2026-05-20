import type { ProgressVariant } from "../types/progress";

export const PROGRESS_VARIANT_STORAGE_KEY = "devtools:progressVariant";

function getUrlProgressVariant(): ProgressVariant | null {
  const urlParams = new URLSearchParams(window.location.search);
  const urlProgress = urlParams.get("progress");

  if (urlProgress === "hstep") return "stepper";
  if (urlProgress === "vstep") return "vertical-stepper";
  if (urlProgress === "bar") return "bar";

  return null;
}

function getStoredProgressVariant(): ProgressVariant | null {
  const stored = window.sessionStorage.getItem(PROGRESS_VARIANT_STORAGE_KEY);

  if (stored === "bar") return "bar";
  if (stored === "stepper") return "stepper";
  if (stored === "vertical-stepper") return "vertical-stepper";

  return null;
}

export function readProgressVariant(): ProgressVariant {
  const urlVariant = getUrlProgressVariant();

  if (urlVariant) {
    window.sessionStorage.setItem(PROGRESS_VARIANT_STORAGE_KEY, urlVariant);
    return urlVariant;
  }

  return getStoredProgressVariant() ?? "vertical-stepper";
}

export function writeProgressVariant(variant: ProgressVariant) {
  window.sessionStorage.setItem(PROGRESS_VARIANT_STORAGE_KEY, variant);

  window.dispatchEvent(
    new CustomEvent<ProgressVariant>("devtools:progressvariantchange", {
      detail: variant,
    }),
  );
}
