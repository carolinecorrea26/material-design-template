import { describe, expect, it } from "vitest";
import { commonPaymentChoices, sharedPaymentState } from "./sharedPaymentChoices";
import { isApplicantExperience } from "./applicantExperience";

const bank = { value: "bank-account", label: "Bank account" };
const bill = { value: "bill-me", label: "Bill me" };
const monthly = { value: "monthly", label: "Monthly" };
const annual = { value: "annually", label: "Annually" };
describe("shared payment configuration", () => {
  it("supports either option independently and rejects invalid flags", () => {
    expect(isApplicantExperience({})).toBe(true);
    expect(isApplicantExperience({ payment: { allowSharedMethod: true } })).toBe(true);
    expect(isApplicantExperience({ payment: { allowSharedFrequency: true } })).toBe(true);
    expect(isApplicantExperience({ payment: { allowSharedMethod: "yes" } })).toBe(false);
    expect(isApplicantExperience({ payment: null })).toBe(false);
  });
  it("offers only choices that every product accepts", () => {
    const products = [
      { productKey: "life", methods: [bank, bill], frequencies: [monthly, annual] },
      { productKey: "disability", methods: [bank], frequencies: [monthly] },
    ];
    expect(commonPaymentChoices(products, "methods")).toEqual([bank]);
    expect(commonPaymentChoices(products, "frequencies")).toEqual([monthly]);
    expect(commonPaymentChoices([{ ...products[0], methods: [bill] }, products[1]], "methods")).toEqual([]);
    expect(commonPaymentChoices([], "methods")).toEqual([]);
  });
  const products = ["life", "disability"].map(productKey => ({ productKey, methods: [bank, bill], frequenciesByMethod: { "bank-account": [monthly, annual], "bill-me": [monthly] } }));
  const selected = { "payment-method:life": "bank-account", "payment-method:disability": "bank-account", "payment-frequency:life": "monthly", "payment-frequency:disability": "annually" };
  it("leaves individual selections unchanged by default", () => {
    const state = sharedPaymentState(products, selected);
    expect(state.shareMethod).toBe(false);
    expect(state.shareFrequency).toBe(false);
    expect(state.updates).toEqual({});
  });
  it("shares only the method while retaining valid individual frequencies", () => {
    const state = sharedPaymentState(products, selected, { allowSharedMethod: true });
    expect(state.method).toBe("bank-account");
    expect(state.updates).toEqual({ "payment-method:all": "bank-account" });
  });
  it("applies one frequency across different individual methods", () => {
    const values = { ...selected, "payment-method:disability": "bill-me", "payment-frequency:all": "monthly" };
    const state = sharedPaymentState(products, values, { allowSharedFrequency: true });
    expect(state.frequencyOptions).toEqual([monthly]);
    expect(state.updates).toEqual({ "payment-frequency:disability": "monthly" });
  });
  it("applies both shared choices to existing and newly added products", () => {
    const values = { ...selected, "payment-method:all": "bank-account", "payment-frequency:all": "annually" };
    const state = sharedPaymentState([...products, { ...products[0], productKey: "health" }], values, { allowSharedMethod: true, allowSharedFrequency: true });
    expect(state.updates).toEqual({ "payment-frequency:life": "annually", "payment-method:health": "bank-account", "payment-frequency:health": "annually" });
  });
  it("clears frequencies invalidated by a shared method change", () => {
    const values = { ...selected, "payment-method:all": "bill-me", "payment-frequency:all": "annually" };
    expect(sharedPaymentState(products, values, { allowSharedMethod: true }).updates).toMatchObject({ "payment-method:life": "bill-me", "payment-method:disability": "bill-me", "payment-frequency:disability": "" });
    expect(sharedPaymentState(products, values, { allowSharedMethod: true, allowSharedFrequency: true }).updates).toMatchObject({ "payment-frequency:all": "", "payment-frequency:life": "", "payment-frequency:disability": "" });
  });
  it("requires a new shared choice when saved per-product selections disagree", () => {
    const values = { ...selected, "payment-method:disability": "bill-me" };
    const state = sharedPaymentState(products, values, { allowSharedMethod: true });
    expect(state.method).toBe("");
    expect(state.updates).toMatchObject({ "payment-method:life": "", "payment-method:disability": "" });
  });
});
