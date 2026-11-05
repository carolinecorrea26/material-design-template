import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { useForm, useWatch } from "react-hook-form";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { sharedPaymentState } from "../../domain/sharedPaymentChoices";
import { paymentControlField } from "../../config/fields/storedSurfaces";
import SharedPaymentControls from "./SharedPaymentControls";

let root: Root;
let container: HTMLDivElement;
beforeEach(() => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  container = document.createElement("div"); document.body.appendChild(container); root = createRoot(container);
});
afterEach(async () => { await act(async () => root.unmount()); container.remove(); vi.unstubAllGlobals(); });

it("updates all product inputs when the applicant changes the single shared method", async () => {
  const products = ["life", "disability"].map(productKey => ({ productKey, methods: [{ value: "bank-account", label: "Bank account" }, { value: "bill-me", label: "Bill me" }], frequenciesByMethod: { "bank-account": [{ value: "monthly", label: "Monthly" }, { value: "annually", label: "Annually" }], "bill-me": [{ value: "monthly", label: "Monthly" }] } }));
  function Form() {
    const { control, setValue, formState: { errors } } = useForm<Record<string, string | boolean | string[]>>({ defaultValues: { "payment-method:all": "bank-account", "payment-frequency:all": "annually" } });
    const values = useWatch({ control });
    const state = sharedPaymentState(products, values, { allowSharedMethod: true, allowSharedFrequency: true });
    return <><SharedPaymentControls methodField={paymentControlField("payment-shared-method", "payment-method:all", state.methodOptions)} frequencyField={paymentControlField("payment-shared-frequency", "payment-frequency:all", state.frequencyOptions)} control={control} errors={errors} setValue={setValue} state={sharedPaymentState(products, values, { allowSharedMethod: true, allowSharedFrequency: true })} /><output>{JSON.stringify(values)}</output></>;
  }
  await act(async () => root.render(<Form />));
  const read = () => JSON.parse(container.querySelector("output")!.textContent!);
  expect(read()).toMatchObject({ "payment-method:life": "bank-account", "payment-method:disability": "bank-account", "payment-frequency:life": "annually", "payment-frequency:disability": "annually" });
  expect(container.querySelectorAll('input[type="radio"]')).toHaveLength(2);
  const billMe = [...container.querySelectorAll<HTMLElement>('label.SelectionGroup-root')].find(option => option.textContent === "Bill me")!;
  await act(async () => billMe.click());
  expect(read()).toMatchObject({ "payment-method:life": "bill-me", "payment-method:disability": "bill-me", "payment-frequency:all": "", "payment-frequency:life": "", "payment-frequency:disability": "" });
});
