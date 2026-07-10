import type { ClientPageFieldConfig } from "../fields/types";
import { fieldCatalog } from "../fields";
import type { ClientId } from "../../types";

export type MembershipClientFieldConfig = ClientPageFieldConfig & {
  showTitleField?: boolean;
};

const waepaExtraFields = [
  fieldCatalog["waepa-declaration"],
  fieldCatalog["waepa-attestation"],
  fieldCatalog["waepa-employer"],
  fieldCatalog["waepa-start-date"],
  fieldCatalog["waepa-retired-employer"],
  fieldCatalog["waepa-retirement-date"],
  fieldCatalog["waepa-member-first-name"],
  fieldCatalog["waepa-member-last-name"],
  fieldCatalog["waepa-member-id"],
];

const avmaExtraFields = [
  fieldCatalog["avma-vet-college"],
  fieldCatalog["avma-graduation-year"],
  fieldCatalog["avma-occupation"],
];

const amaExtraFields = [
  fieldCatalog["ama-physician-type"],
  fieldCatalog["ama-physician-title"],
  fieldCatalog["ama-physician-first-name"],
  fieldCatalog["ama-physician-last-name"],
  fieldCatalog["ama-physician-birth-date"],
  fieldCatalog["ama-physician-email"],
];

export const membershipClientFields: Partial<
  Record<ClientId, MembershipClientFieldConfig>
> = {
  demo: {
    showTitleField: false,
    overrides: {
      membership: {
        label: "Are you an active member of Demo Insurance?",
      },
    },
    extraFields: [],
  },
  abe: {
    showTitleField: false,
    overrides: {
      membership: {
        label:
          "Are you an active member of a State, Local, or Specialty Bar Association?",
      },
    },
    extraFields: [],
  },
  ama: {
    showTitleField: true,
    overrides: {
      membership: {
        label: "I am a (select one)",
        inputType: "dropdown",
        labelVariant: "standard",
        placeholder: "Select one",
        options: [
          { label: "Physician", value: "physician" },
          { label: "Resident", value: "resident" },
          { label: "Student", value: "student" },
          { label: "Retired Physician", value: "retired" },
          { label: "Spouse of Physician", value: "spouse" },
        ],
      },
    },
    extraFields: amaExtraFields,
  },
  avma: {
    showTitleField: false,
    overrides: {
      membership: {
        label:
          "Are you a member of the American Veterinary Medical Association?",
      },
    },
    extraFields: avmaExtraFields,
  },
  nso: {
    showTitleField: false,
    overrides: {
      membership: {
        label: "Are you a nurse?",
      },
    },
    extraFields: [],
  },
  waepa: {
    showTitleField: false,
    overrides: {
      membership: {
        label:
          "Are you a current WAEPA member, or are you becoming a new member?",
        inputType: "radio",

        options: [
          { label: "Current Member", value: "current" },
          { label: "New Member", value: "new" },
        ],
      },
    },
    extraFields: waepaExtraFields,
  },
};
