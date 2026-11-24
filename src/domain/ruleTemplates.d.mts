import type { FormTemplate } from '../config/template/resolveTemplate';
export type RuleTemplateScope = { templates?: FormTemplate[] };
export const supportedRuleTemplates: FormTemplate[];
export function validateRuleTemplates(templates: unknown): void;
export function ruleAppliesToTemplate(rule: RuleTemplateScope, template: FormTemplate): boolean;
export function ruleTemplateFilterValues(rule: RuleTemplateScope): string[];
export function ruleTemplateDisplay(rule: RuleTemplateScope): string;
