import type { UseFormSetValue } from "react-hook-form";
export type MembershipSetValue = UseFormSetValue<Record<string, string | boolean | string[]>>;

export const waepaConditionalFieldIds = [
  "waepa-employer",
  "waepa-start-date",
  "waepa-retired-employer",
  "waepa-retirement-date",
  "waepa-member-first-name",
  "waepa-member-middle-initial",
  "waepa-member-last-name",
  "waepa-member-id",
];

const clearFieldOptions = {
  shouldDirty: true,
  shouldTouch: false,
  shouldValidate: false,
};

export function clearFields(setValue: MembershipSetValue, fieldIds: string[]) {
  fieldIds.forEach((fieldId) => {
    setValue(fieldId, "", clearFieldOptions);
  });
}

export function clearWAEPAFields(setValue: MembershipSetValue) {
  setValue("waepa-declaration", false, clearFieldOptions);
  clearFields(setValue, ["waepa-attestation", ...waepaConditionalFieldIds]);
}

