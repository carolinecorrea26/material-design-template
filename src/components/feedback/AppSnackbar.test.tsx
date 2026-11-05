import { act } from "react";
import { createRoot } from "react-dom/client";
import { expect, it, vi } from "vitest";
import ProgressSavedSnackbar from "./ProgressSavedSnackbar";

it.each([false, true])("shows polite success feedback at the expected anchor for small=%s", async small => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  vi.stubGlobal("matchMedia", () => ({ matches: small, addEventListener: () => {}, removeEventListener: () => {} }));
  const container = document.createElement("div"); document.body.append(container); const root = createRoot(container);
  try {
    await act(async () => root.render(<ProgressSavedSnackbar open onClose={() => {}} />));
    expect(container.querySelector('[role="status"]')?.textContent).toContain("Progress saved");
    expect(container.querySelector(`.MuiSnackbar-anchorOrigin${small ? "Bottom" : "Top"}Center`)).not.toBeNull();
    expect(container.querySelector(".MuiAlert-filledSuccess")).not.toBeNull();
  } finally { await act(async () => root.unmount()); container.remove(); vi.unstubAllGlobals(); }
});
