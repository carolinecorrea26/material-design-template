import type { ConditionDefinition } from "./types";

export const conditionDefinitions: ConditionDefinition[] = [
  {
    id: "condition-spouse-selected",
    conditions: [{ fieldId: "dependents", operator: "includes", value: "spouse" }],
    match: "all",
  },
  {
    id: "condition-child-selected",
    conditions: [{ fieldId: "dependents", operator: "includes", value: "child" }],
    match: "all",
  },
  {
    id: "condition-member-smoker",
    conditions: [{ fieldId: "smoker", operator: "equals", value: "yes" }],
    match: "all",
  },
  {
    id: "condition-spouse-smoker",
    conditions: [
      { fieldId: "dependents", operator: "includes", value: "spouse" },
      { fieldId: "spouse-smoker", operator: "equals", value: "yes" },
    ],
    match: "all",
  },
  {
    id: "condition-member-has-drivers-license",
    conditions: [{ fieldId: "has-drivers-license", operator: "equals", value: "yes" }],
    match: "all",
  },
  {
    id: "condition-member-lives-outside-us",
    conditions: [{ fieldId: "intend-live-outside-us", operator: "equals", value: "yes" }],
    match: "all",
  },
  {
    id: "condition-member-travels-outside-us",
    conditions: [{ fieldId: "travel-outside-us-six-months", operator: "equals", value: "yes" }],
    match: "all",
  },
  {
    id: "condition-spouse-has-drivers-license",
    conditions: [
      { fieldId: "dependents", operator: "includes", value: "spouse" },
      { fieldId: "spouse-has-drivers-license", operator: "equals", value: "yes" },
    ],
    match: "all",
  },
  {
    id: "condition-spouse-lives-outside-us",
    conditions: [
      { fieldId: "dependents", operator: "includes", value: "spouse" },
      { fieldId: "spouse-intend-live-outside-us", operator: "equals", value: "yes" },
    ],
    match: "all",
  },
  {
    id: "condition-spouse-travels-outside-us",
    conditions: [
      { fieldId: "dependents", operator: "includes", value: "spouse" },
      { fieldId: "spouse-travel-outside-us-six-months", operator: "equals", value: "yes" },
    ],
    match: "all",
  },
  {
    id: "condition-advisor-new-application",
    conditions: [{ fieldId: "advisor-flow-type", operator: "equals", value: "new" }],
    match: "all",
  },
  {
    id: "condition-advisor-saved-application",
    conditions: [{ fieldId: "advisor-flow-type", operator: "equals", value: "saved" }],
    match: "all",
  },
  {
    id: "condition-membership-ama-spouse",
    conditions: [{ fieldId: "membership", operator: "equals", value: "spouse" }],
    match: "all",
  },
  {
    id: "condition-membership-waepa-new",
    conditions: [{ fieldId: "membership", operator: "equals", value: "new" }],
    match: "all",
  },
  {
    id: "condition-waepa-federal-active",
    conditions: [
      { fieldId: "membership", operator: "equals", value: "new" },
      { fieldId: "waepa-attestation", operator: "equals", value: "federal-active" },
    ],
    match: "all",
  },
  {
    id: "condition-waepa-federal-annuitant",
    conditions: [
      { fieldId: "membership", operator: "equals", value: "new" },
      { fieldId: "waepa-attestation", operator: "equals", value: "federal-annuitant" },
    ],
    match: "all",
  },
  {
    id: "condition-waepa-associated-member",
    conditions: [
      { fieldId: "waepa-attestation", operator: "equals", value: "spouse-associate" },
      { fieldId: "waepa-attestation", operator: "equals", value: "child-associate" },
    ],
    match: "any",
  },
];
