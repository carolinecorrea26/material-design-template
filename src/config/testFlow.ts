export type TestFlowMode = "combined" | "expanded";

const PARAM_KEY = "testFlow";
const STORAGE_KEY = "testFlowMode";

/**
 * Returns the active test flow mode.
 * Checks URL search params first, then sessionStorage for persistence across navigation.
 * Defaults to "combined".
 */
export function getTestFlowMode(): TestFlowMode {
  // Check URL params first
  const params = new URLSearchParams(window.location.search);
  const paramValue = params.get(PARAM_KEY);

  if (paramValue === "combined" || paramValue === "expanded") {
    // Persist to sessionStorage so it survives page navigations
    try {
      sessionStorage.setItem(STORAGE_KEY, paramValue);
    } catch {
      // ignore
    }
    return paramValue;
  }

  // Fall back to sessionStorage
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (stored === "combined" || stored === "expanded") {
      return stored;
    }
  } catch {
    // ignore
  }

  return "combined";
}

export function isCombinedFlow(): boolean {
  return getTestFlowMode() === "combined";
}
