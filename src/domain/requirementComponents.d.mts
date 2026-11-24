import type { ComponentDefinition } from './componentCatalog';
import type { DatabaseSchema } from '../persistence/types';
export type RequirementComponentDefinition = {
  name: string; displayName: string; description: string;
  registration: Pick<ComponentDefinition, 'source' | 'role' | 'section' | 'storyId' | 'packageImport'> & { examples?: Array<{ key: string; label: string; storyId: string }> };
  contains: string[]; parts?: ComponentDefinition['parts'];
};
export function requirementComponentDefinitions(): RequirementComponentDefinition[];
export function requirementComponentKey(name: string): string;
export function validateRequirementComponentParts(nodes: unknown, definitions?: RequirementComponentDefinition[]): void;
export function compileRequirementComponents(existing: DatabaseSchema['components'] | undefined, definitions: RequirementComponentDefinition[]): DatabaseSchema['components'];
