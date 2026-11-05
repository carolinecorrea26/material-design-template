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
  const formatDisplay = (value: string) => value.trim().toUpperCase();

  if (item.beneficiaryType === "trust") {
    return formatDisplay(item.trustName);
  }

  return formatDisplay(`${item.firstName} ${item.lastName}`);
}

export function getDesignationLabel(designation: BeneficiaryDesignation) {
  return designation === "primary" ? "Primary" : "Contingent";
}

export function getRelationshipLabel(item: BeneficiaryItem) {
  if (item.beneficiaryType === "trust") {
    return "Trust";
  }

  return item.relationship || "Relationship not provided";
}

