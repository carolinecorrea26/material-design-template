import type { ClientPageFieldConfig } from "../fields/types";
import type { ClientId } from "../../types/client";

export type MembershipClientFieldConfig = ClientPageFieldConfig & {
  showTitleField?: boolean;
};

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
        options: [
          { label: "Physician", value: "physician" },
          { label: "Resident", value: "resident" },
          { label: "Student", value: "student" },
          { label: "Retired Physician", value: "retired" },
          { label: "Spouse of Physician", value: "spouse" },
        ],
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
    extraFields: [
      {
        id: "waepa-attestation",
        inputType: "dropdown",
        labelVariant: "standard",
        label:
          "I hereby attest that I am a U.S. citizen and meet one of the following qualifications:",
        required: true,
        options: [
          {
            label:
              "I am a civilian federal employee of the U.S. government actively at work",
            value: "federal-active",
          },
          {
            label: "I am a retired civilian federal annuitant",
            value: "federal-annuitant",
          },
          {
            label: "I am a former federal employee",
            value: "former-federal",
          },
          {
            label:
              "I am a spouse of a WAEPA member and want to apply as an Associate member",
            value: "spouse-associate",
          },
          {
            label:
              "I am an adult child of a WAEPA member and want to apply as an Associate member",
            value: "child-associate",
          },
        ],
      },
      {
        id: "waepa-employer",
        inputType: "dropdown",
        label: "Employed By",
        required: true,
        options: [
          {
            label: "Administration for Children and Families",
            value: "Administration for Children and Families",
          },
          {
            label: "Administrative Conference of the United States",
            value: "Administrative Conference of the United States",
          },
          {
            label: "Administrative Review Board",
            value: "Administrative Review Board",
          },
          {
            label: "Agricultural Marketing Service",
            value: "Agricultural Marketing Service",
          },
          {
            label: "Federal Bureau of Investigation",
            value: "Federal Bureau of Investigation",
          },
        ],
      },
      {
        id: "waepa-start-date",
        inputType: "date",
        label: "Start Date",
        required: true,
      },
      {
        id: "waepa-declaration",
        inputType: "checkbox",
        label:
          "By submitting this application, I attest that the answers to the questions herein are true.",
        required: true,
      },
    ],
  },
};
