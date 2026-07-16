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

const cseaExtraFields = [
  fieldCatalog["csea-performing-duties"],
  fieldCatalog["csea-occupation-group"],
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
  csea: {
    showTitleField: false,
    overrides: {
      membership: {
        label: "Are you a member of the CSEA?",
      },
    },
    extraFields: cseaExtraFields,
  },
  isitrust: {
    showTitleField: false,
    overrides: {
      membership: {
        label: "I am a member of:",
        inputType: "searchable-select",
        labelVariant: "standard",
        placeholder: "Search or select association",
        options: [
          { label: "Akron Bar Association", value: "akron-bar-association" },
          { label: "Alabama State Bar", value: "alabama-state-bar" },
          {
            label: "American Mountain Guides Association",
            value: "american-mountain-guides-association",
          },
          {
            label: "American Osteopathic Association",
            value: "american-osteopathic-association",
          },
          {
            label: "American Society of Acupuncturists",
            value: "american-society-of-acupuncturists",
          },
          {
            label: "Atlanta Bar Association",
            value: "atlanta-bar-association",
          },
          {
            label: "Bar Association of Metropolitan St. Louis",
            value: "bar-association-of-metropolitan-st-louis",
          },
          {
            label: "DeKalb Bar Association",
            value: "dekalb-bar-association",
          },
          {
            label: "GA Trial Lawyers Association",
            value: "ga-trial-lawyers-association",
          },
          {
            label: "Indianapolis Bar Association",
            value: "indianapolis-bar-association",
          },
          {
            label: "Kansas Bar Association",
            value: "kansas-bar-association",
          },
          {
            label: "Los Angeles County Bar Association",
            value: "los-angeles-county-bar-association",
          },
          {
            label: "Louisiana Dental Association",
            value: "louisiana-dental-association",
          },
          {
            label: "MA Nurses Association",
            value: "ma-nurses-association",
          },
          {
            label: "MS Association for Justice",
            value: "ms-association-for-justice",
          },
          {
            label: "MS Dental Association",
            value: "ms-dental-association",
          },
          { label: "MS Society of CPAs", value: "ms-society-of-cpas" },
          {
            label: "Maricopa County Bar Association",
            value: "maricopa-county-bar-association",
          },
          {
            label: "Missouri Society of CPAs",
            value: "missouri-society-of-cpas",
          },
          { label: "National Press Club", value: "national-press-club" },
          {
            label: "New Haven County Bar Association",
            value: "new-haven-county-bar-association",
          },
          {
            label: "Orange County Bar Association of CA",
            value: "orange-county-bar-association-of-ca",
          },
          {
            label: "Student Osteopathic Medical Association",
            value: "student-osteopathic-medical-association",
          },
          {
            label: "US Equestrian Federation",
            value: "us-equestrian-federation",
          },
          { label: "USA Fencing", value: "usa-fencing" },
        ],
      },
    },
    extraFields: [],
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
