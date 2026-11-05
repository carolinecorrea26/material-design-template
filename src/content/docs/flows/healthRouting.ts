// Documentation of supported routes. Saved questionnaire and journey policies
// determine each application's participation; this table is not executable routing.
export type HealthRoutingRow = {
  condition: string;
  pageLabel: string;
  purpose: string;
  implemented: boolean;
};

export const healthRoutingRows: HealthRoutingRow[] = [
  { condition: 'An adult’s saved pathway selects the SI page', pageLabel: 'SI', purpose: 'Simplified Issue questions on health-si', implemented: true },
  { condition: 'Whole Life source-form review', pageLabel: 'WAEPAWL', purpose: 'Full and SI Storybook previews; no additional production route or assignment', implemented: false },
  { condition: 'A saved questionnaire policy assigns full Life questions', pageLabel: 'TELE SUPP / Life', purpose: 'Configured full source questions on health-li, independently of QD/FUW processing where assigned', implemented: true },
  { condition: 'An adult selects CI and its saved policy assigns CI questions', pageLabel: 'CI', purpose: 'CI-only or combined source questions on health-ci, including California wording; tobacco remains on Coverage in the application', implemented: true },
  { condition: 'The Site enables CIR questions and the adult selects the rider', pageLabel: 'CIR', purpose: 'Shared CHR questions on health-cir; ABE keeps this separate page disabled', implemented: true },
  { condition: 'The resolved health page uses externally hosted QuickDecision questions', pageLabel: 'QD LI / QD DI / QD LI+DI', purpose: 'health-qd loading screen only; the external questions were not supplied', implemented: true },
  { condition: 'External QD CIR source questionnaire', pageLabel: 'QD CIR', purpose: 'No supplied external questions or separate implemented questionnaire', implemented: false },
  { condition: 'The saved combination policy assigns supplemental DI to that adult', pageLabel: 'SUPP DI', purpose: 'Eight source questions and follow-ups on health-di; QD Life + DI or QD Life + FUW DI according to the captured Site policy', implemented: true },
];
