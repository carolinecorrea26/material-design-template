import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { Button, Link } from "@mui/material";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import ThemeConfigurationPreview from "./ThemeConfigurationPreview";
import { waepaClient } from "../../config/clients/waepa";
import { demoClient } from "../../config/clients/demo";
import { amaClient } from "../../config/clients/ama";

vi.mock("../../pages/Home", () => ({ default: () => <>
  <Button variant="contained">Primary action</Button>
  <Button variant="contained" color="secondary">Secondary action</Button>
  <Button variant="contained" color="error">Delete</Button>
  <Button variant="contained" disabled>Disabled action</Button>
  <Link href="#">Example link</Link>
</> }));

let root: Root;
let container: HTMLDivElement;
beforeEach(() => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
});
afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
  vi.unstubAllGlobals();
});
const button = (label: string) => [...container.querySelectorAll("button")].find(node => node.textContent === label)!;
const input = (label: string) => [...container.querySelectorAll("label")].find(node => node.textContent?.trim() === label)!.querySelector<HTMLInputElement>("input")!;

it("previews WAEPA's button override while keeping other controls on its theme color", async () => {
  await act(async () => root.render(<ThemeConfigurationPreview client={waepaClient} />));
  const primary = button("Primary action");
  const secondary = button("Secondary action");
  expect(getComputedStyle(primary).backgroundColor).toBe("rgb(241, 180, 53)");
  expect(getComputedStyle(primary).color).toBe("rgb(53, 59, 72)");
  expect(getComputedStyle(secondary).getPropertyValue("--variant-containedBg")).toBe("#002c85");
  expect(getComputedStyle(button("Disabled action")).backgroundColor).not.toBe("rgb(241, 180, 53)");
  expect(getComputedStyle(button("Delete")).getPropertyValue("--variant-containedBg")).toBe("#ed0a0a");
  expect(getComputedStyle(container.querySelector("a")!).color).toBe("rgb(0, 44, 133)");
  expect(getComputedStyle(primary).borderRadius).toBe("8px");

  await act(async () => input("Pill").click());
  expect(getComputedStyle(primary).borderRadius).toBe("9999px");
  expect(getComputedStyle(secondary).borderRadius).toBe("9999px");
  await act(async () => input("Override button color").click());
  expect(getComputedStyle(primary).backgroundColor).not.toBe("rgb(241, 180, 53)");
  expect(getComputedStyle(primary).getPropertyValue("--variant-containedBg")).toBe("#002c85");
  expect(container.textContent).not.toContain("Secondary color tone");
  expect(container.textContent).not.toContain("Advanced colors");
});

it("starts AMA with pill buttons and lets standard shape inherit the shared radius", async () => {
  await act(async () => root.render(<ThemeConfigurationPreview client={amaClient} />));
  expect(input("Pill").checked).toBe(true);
  expect(getComputedStyle(button("Primary action")).borderRadius).toBe("9999px");
  await act(async () => input("Standard").click());
  expect(getComputedStyle(button("Primary action")).borderRadius).toBe("8px");
});

it("uses the blue theme for buttons unless an override is enabled", async () => {
  await act(async () => root.render(<ThemeConfigurationPreview client={demoClient} />));
  expect(input("Override button color").checked).toBe(false);
  expect(getComputedStyle(button("Primary action")).getPropertyValue("--variant-containedBg")).toBe("#0668ff");
  expect(getComputedStyle(container.querySelector("a")!).color).toBe("rgb(6, 104, 255)");
});
