import type { RuleDefinition } from '../../domain/rules';
import requirements from '../../../requirements/global/rules/recovery.json';

export const applicationRecoveryRules: RuleDefinition[] = [
  ...requirements.rules.map(rule => ({ id: `rule-${rule.id}` as const, area: 'Application recovery', rule: rule.name, behavior: rule.statement, ref: rule.source, type: 'behavioral' as const, scope: 'global' as const, documentedIn: 'rules' as const })),
];
