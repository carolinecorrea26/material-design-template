import { requirementText } from "../../domain/requirementContent";
export type BeneficiaryDesignation = "primary" | "contingent";
export type BeneficiaryType = "individual" | "trust";

export type BeneficiaryItem = {
  id: string;
  designation: BeneficiaryDesignation;
  beneficiaryType: BeneficiaryType;
  firstName: string;
  lastName: string;
  relationship: string;
  trustName: string;
  trustDate: string;
  share: number;
};

export function getBeneficiaryDisplayName(item: BeneficiaryItem) {
  const formatDisplay = (value: string) => String(value ?? "").trim().toUpperCase();

  if (item.beneficiaryType === "trust") {
    return formatDisplay(item.trustName);
  }

  return formatDisplay(`${item.firstName} ${item.lastName}`);
}

export function getDesignationLabel(designation: BeneficiaryDesignation) {
  return requirementText(`beneficiary.designation.${designation}`);
}

export function getRelationshipLabel(item: BeneficiaryItem, options?: readonly { value: string; label: string }[]) {
  if (item.beneficiaryType === "trust") {
    return requirementText("beneficiary.trust-label");
  }

  return options?.find(option => option.value === item.relationship)?.label || item.relationship || requirementText("beneficiary.relationship-not-provided");
}

