import definitions from '../../requirements/global/configurations/resume.json';
import bindings from '../../requirements/global/configuration-bindings.json';
import { requirementConfigurationValue } from '../domain/requirementConfiguration';
import { resumePolicy } from '../domain/resumePolicy.mjs';
export function getResumePolicy() {
  return resumePolicy(definitions, definition => requirementConfigurationValue(definition.id as keyof typeof bindings));
}
