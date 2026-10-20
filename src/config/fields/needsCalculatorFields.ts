import type { FieldDefinition } from "./types";
/** Transient inputs in the application-menu calculator; never persisted to the application. */
export const needsCalculatorFields: FieldDefinition[] = [
  {id:"needs-annual-income",label:"Annual household income",inputType:"text"},
  {id:"needs-years-to-replace",label:"Years of income to replace",inputType:"text"},
  {id:"needs-outstanding-debts",label:"Outstanding debts (mortgage, loans, etc.)",inputType:"text"},
  {id:"needs-existing-coverage",label:"Existing life insurance coverage",inputType:"text"},
];
