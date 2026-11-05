import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { useForm } from "react-hook-form";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import EligibilitySections from "./EligibilitySections";
import { getClientPageFields } from "../../config/clientFields/getClientPageFields";
import { getPageSections } from "../../config/pageSections/getPageSections";
import { installPrototypeLibrary } from "../../domain/prototypeLibrary";

let root: Root;
let container: HTMLDivElement;

function Form() {
  const form = useForm<Record<string, string | boolean | string[]>>({
    defaultValues: { "zip-postal-code": "10001", "state-province": "", "birth-date": "" },
  });
  const watchedValues = form.watch();
  return <>
    <EligibilitySections
      control={form.control} errors={form.formState.errors} watchedValues={watchedValues}
      allFields={getClientPageFields("eligibility", watchedValues)}
      pageSections={getPageSections("eligibility").filter(section => section.id === "selfEligibility")}
      setValue={form.setValue} trigger={form.trigger}
    />
    <output>{String(watchedValues["state-province"])}</output>
  </>;
}

beforeEach(async () => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  installPrototypeLibrary(null);
  window.history.replaceState(null, "", "/eligibility?site=demo");
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
  await act(async () => root.render(<Form />));
});
afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
  window.sessionStorage.clear();
  vi.unstubAllGlobals();
});

async function enter(input: HTMLInputElement, value: string) {
  await act(async () => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(input, value);
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
}
async function chooseCalifornia() {
  await enter(container.querySelector<HTMLInputElement>("#state-province")!, "California");
  const option = [...document.querySelectorAll<HTMLElement>('[role="option"]')].find(option => option.textContent === "California");
  expect(option).toBeDefined();
  await act(async () => option!.click());
}
const state = () => container.querySelector("output")!.textContent;
const zip = () => container.querySelector<HTMLInputElement>('input[name="zip-postal-code"]')!;

it("preserves a manual State choice when other eligibility fields change", async () => {
  expect(state()).toBe("NY");
  await chooseCalifornia();
  expect(state()).toBe("CA");
  await act(async () => { await new Promise(resolve => setTimeout(resolve, 250)); });
  expect(container.textContent).not.toContain("Based on your ZIP / postal code");
  const dateLabel = [...container.querySelectorAll("label")].find(label => label.textContent?.includes("Date of Birth"));
  const dateInput = dateLabel ? document.getElementById(dateLabel.htmlFor) : null;
  if (!(dateInput instanceof HTMLInputElement)) throw new Error("Date of Birth input is missing");
  await enter(dateInput, "05/14/1990");
  expect(state()).toBe("CA");
});

it("derives again when ZIP changes, including after ZIP is cleared and re-entered", async () => {
  await chooseCalifornia();
  await enter(zip(), "19019");
  expect(state()).toBe("PA");
  await chooseCalifornia();
  await enter(zip(), "");
  expect(state()).toBe("CA");
  await enter(zip(), "10001");
  expect(state()).toBe("NY");
});

it("renders ZIP, State and Birthday through the same group used by quotes", () => {
  expect([...container.querySelectorAll('[data-analytics-field]')].map(field => field.getAttribute('data-analytics-field')))
    .toEqual(['zip-postal-code', 'state-province', 'birth-date']);
  expect(container.querySelectorAll('.MuiFormHelperText-root')).toHaveLength(3);
});
