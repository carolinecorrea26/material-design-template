import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import ControlledFieldRenderer from "./ControlledFieldRenderer";

let root: Root, container: HTMLDivElement;
beforeEach(() => { vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true); container = document.createElement("div"); document.body.append(container); root = createRoot(container); });
afterEach(async () => { await act(async () => root.unmount()); container.remove(); vi.unstubAllGlobals(); });

it("reports checkbox edits and synchronizes externally restored values", async () => {
  const onChange = vi.fn();
  const field = { id: "selected", label: "Add coverage", inputType: "checkbox" as const };
  await act(async () => root.render(<ControlledFieldRenderer field={field} value={false} onChange={onChange} />));
  const input = container.querySelector<HTMLInputElement>('input')!;
  await act(async () => input.click()); expect(onChange).toHaveBeenCalledWith(true);
  await act(async () => root.render(<ControlledFieldRenderer field={field} value={true} onChange={onChange} />));
  await act(async () => root.render(<ControlledFieldRenderer field={field} value={false} onChange={onChange} />));
  expect(input.checked).toBe(false);
});

it.each(["radio", "checkbox", "checkbox-group"] as const)("honors disabled %s fields", async inputType => {
  const onChange = vi.fn();
  await act(async () => root.render(<ControlledFieldRenderer field={{ id: "disabled", label: "Disabled choice", inputType, disabled: true, options: [{ value: "a", label: "Option A" }] }} value={inputType === "checkbox-group" ? [] : inputType === "checkbox" ? false : ""} onChange={onChange} />));
  const input = container.querySelector<HTMLInputElement>('input')!;
  expect(input.disabled).toBe(true);
  await act(async () => input.click()); expect(onChange).not.toHaveBeenCalled();
});

it("keeps ZIP formatting and external errors in the shared renderer", async () => {
  const onChange = vi.fn();
  await act(async () => root.render(<ControlledFieldRenderer field={{ id: "zip", label: "ZIP / postal code", inputType: "text", autoComplete: "postal-code" }} value="" error="Enter a valid ZIP / Postal Code." onChange={onChange} />));
  const input = container.querySelector<HTMLInputElement>('input')!;
  await act(async () => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(input, "k1a0b1");
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
  expect(onChange).toHaveBeenCalledWith("K1A 0B1");
  expect(input.getAttribute("aria-invalid")).toBe("true");
  expect(container.textContent).toContain("Enter a valid ZIP / Postal Code.");
});

it.each(["phone", "ssn"] as const)("reports formatted %s edits to the parent", async format => {
  const onChange = vi.fn();
  await act(async () => root.render(<ControlledFieldRenderer field={{ id: format, label: format, inputType: "text", format, showPhoneTypeSelector: false }} value="" onChange={onChange} />));
  const input = container.querySelector<HTMLInputElement>('input')!;
  await act(async () => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(input, format === "phone" ? "2025550123" : "123456789");
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
  expect(onChange).toHaveBeenCalledTimes(1);
  expect(onChange).toHaveBeenCalledWith(format === "phone" ? "(202) 555-0123" : "123 45 6789");
});

it.each([
  { id: 'name', label: 'Name', inputType: 'text' as const, value: 'Jordan' },
  { id: 'date', label: 'Birth date', inputType: 'date' as const, value: '1990-01-01' },
  { id: 'month', label: 'Start month', inputType: 'text' as const, format: 'month-year' as const, value: '2020-01' },
  { id: 'state', label: 'State', inputType: 'searchable-select' as const, options: [{ value: 'NY', label: 'New York' }], value: 'NY' },
])('honors group-owned spacing without resetting the answer for $id', async ({ value, ...field }) => {
  await act(async () => root.render(<ControlledFieldRenderer field={field} value={value} onChange={() => undefined} />));
  const input = container.querySelector('input')!;
  expect(input.value).not.toBe('');
  expect(container.querySelector('.MuiFormControl-marginNormal')).toBeNull();
});
