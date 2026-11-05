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

it.each(['image', 'pdf', 'link', 'xml'] as const)('opens the %s reference format using its supplied asset', async kind => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  const node = document.createElement('div'); document.body.append(node);
  const root = createRoot(node);
  const url = kind === 'xml' ? '/storybook/reference-rates.xml' : `/client/csea/di-clerical.${kind === 'image' ? 'png' : 'pdf'}`;
  try {
    await act(async () => root.render(<ReferenceRateTableLink table={{ version: 1, title: 'Reference asset', kind, url }} />));
    await act(async () => node.querySelector('button')!.click());
    if (kind === 'image') expect(document.querySelector('img[alt="Reference asset"]')?.getAttribute('src')).toBe(url);
    else if (kind === 'pdf') {
      expect(document.querySelector('iframe[title="Reference asset"]')?.getAttribute('src')).toBe(url);
      expect([...document.querySelectorAll('a')].find(link => link.textContent === 'Open PDF')?.getAttribute('href')).toBe(url);
    } else expect([...document.querySelectorAll('a')].find(link => link.textContent === 'Open reference source')?.getAttribute('href')).toBe(url);
    await act(async () => document.querySelector<HTMLButtonElement>('button[aria-label="Close drawer"]')!.click());
  } finally { await act(async () => root.unmount()); node.remove(); vi.unstubAllGlobals(); }
});
