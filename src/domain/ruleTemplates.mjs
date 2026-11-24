import presentation from '../../requirements/global/configurations/presentation.json' with { type: 'json' };

/** Layout identities come from the shared application-template definition. */
export const supportedRuleTemplates = presentation.configurations.find(row => row.id === 'form-template').options;

export function validateRuleTemplates(templates) {
  if (templates === undefined) return;
  if (!Array.isArray(templates) || !templates.length || new Set(templates).size !== templates.length || templates.some(value => !supportedRuleTemplates.includes(value))) {
    throw new Error('Rule templates must be a nonempty, distinct subset of the supported application layouts');
  }
}

export function ruleAppliesToTemplate(rule, template) {
  if (!supportedRuleTemplates.includes(template)) throw new Error(`Unknown application layout: ${template}`);
  validateRuleTemplates(rule.templates);
  return rule.templates === undefined || rule.templates.includes(template);
}

const label = template => template === 'single' ? 'Single page' : 'Multi page';
export function ruleTemplateFilterValues(rule) {
  validateRuleTemplates(rule.templates);
  return (rule.templates ?? supportedRuleTemplates).map(label);
}
export function ruleTemplateDisplay(rule) {
  const labels = ruleTemplateFilterValues(rule);
  return labels.length === supportedRuleTemplates.length ? 'All layouts' : labels.join(', ');
}
