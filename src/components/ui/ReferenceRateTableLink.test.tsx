import { act } from "react";
import { createRoot } from "react-dom/client";
import { expect, it, vi } from "vitest";
import ReferenceRateTableLink from "./ReferenceRateTableLink";
it("opens and closes the standard drawer and renders HTML table cells as text", async () => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  vi.stubGlobal("matchMedia", () => ({ matches: true, addEventListener: () => {}, removeEventListener: () => {} }));
  const node = document.createElement("div"); document.body.append(node);
  const root = createRoot(node);
  try {
    await act(async () => root.render(<ReferenceRateTableLink table={{ version: 1, title: "Reference rates", kind: "html-table", columns: ["Age", "Monthly rate"], rows: [["<script>unsafe()</script>", "$5"]] }} />));
    expect(node.textContent).toBe("View rate table");
    await act(async () => node.querySelector("button")!.click());
    const table = document.querySelector('table[aria-label="Reference rates"]')!;
    expect(table.textContent).toContain("$5");
    expect(table.textContent).toContain("<script>unsafe()</script>");
    expect(table.querySelector("script")).toBeNull();
    await act(async () => document.querySelector<HTMLButtonElement>('button[aria-label="Close drawer"]')!.click());
    expect(document.querySelector('.MuiDrawer-root[aria-hidden="true"]') || !document.querySelector('table[aria-label="Reference rates"]')).toBeTruthy();
  } finally { await act(async () => root.unmount()); node.remove(); }
});
