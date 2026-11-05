import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import MemberVerification from "./MemberVerification";

let root: Root;
let container: HTMLDivElement;
const onClose = vi.fn();
beforeEach(() => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  container = document.createElement("div"); document.body.append(container);
  root = createRoot(container); onClose.mockClear();
});
afterEach(async () => { await act(async () => root.unmount()); container.remove(); vi.unstubAllGlobals(); });
const dialog = () => document.querySelector<HTMLElement>('[role="dialog"]')!;
const button = (label: string) => [...dialog().querySelectorAll('button')].find(button => button.textContent === label)!;
async function choose(value: string) {
  const radio = [...dialog().querySelectorAll<HTMLInputElement>('input[type="radio"]')].find(input => input.value === value)!;
  expect(radio.closest('.SelectionGroup-root')).not.toBeNull();
  await act(async () => radio.click());
}

it.each([["text", true], ["voice", true], ["skip", false]] as const)("preserves the %s result with standard field controls", async (method, verified) => {
  await act(async () => root.render(<MemberVerification open onClose={onClose} />));
  expect(dialog().querySelector('[data-analytics-field="verification-method"]')).not.toBeNull();
  expect(button("Next").disabled).toBe(true);
  await choose(method);
  expect(button("Next").disabled).toBe(false);
  await act(async () => button("Next").click());
  expect(dialog().textContent).toContain(verified ? "Member verification successful" : "Member verification unsuccessful");
  await act(async () => button("Continue").click());
  expect(onClose).toHaveBeenCalledWith(verified);
});

it.each([false, true])("requires each security answer and preserves the failed=%s outcome", async failed => {
  await act(async () => root.render(<MemberVerification open onClose={onClose} />));
  await choose("security-questions");
  await act(async () => button("Next").click());
  const groups = [...dialog().querySelectorAll('[role="radiogroup"]')];
  expect(groups).toHaveLength(3);
  expect(button("Next").disabled).toBe(true);
  for (const [index, group] of groups.entries()) {
    const inputs = [...group.querySelectorAll<HTMLInputElement>('input[type="radio"]')];
    const answer = failed && index === 0 ? inputs.find(input => input.value === "None of the answers apply to me")! : inputs[0];
    await act(async () => answer.click());
    expect(answer.checked).toBe(true);
    expect(button("Next").disabled).toBe(index !== groups.length - 1);
  }
  await act(async () => button("Next").click());
  await act(async () => button("Continue").click());
  expect(onClose).toHaveBeenCalledWith(!failed);
});
