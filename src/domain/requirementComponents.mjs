import authored from '../../requirements/global/components.json' with { type: 'json' };
import { libraryMetadata } from './provenance.ts';
import { componentRoles, validateComponentStructure } from './componentCatalog.ts';

export const requirementComponentDefinitions = () => Object.values(authored).flat();
export const requirementComponentKey = name => `component-${name.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()}`;

/** Component names identify real canonical owners; named parts stay inside those owners. */
export function validateRequirementComponentParts(nodes, definitions = requirementComponentDefinitions()) {
  const owners = new Map(definitions.map(definition => [definition.name, definition]));
  const visit = nodes => {
    for (const node of nodes ?? []) {
      if (node.partOf !== undefined) {
        if (typeof node.partOf !== 'string' || !owners.get(node.partOf)?.parts?.some(part => part.name === node.type)) throw new Error(`Invalid fresh-start component part: ${node.partOf}/${node.type}`);
      } else if (/^[A-Z]/.test(node.type ?? '') && !owners.has(node.type)) throw new Error(`Unknown fresh-start component owner: ${node.type}`);
      visit(node.components);
    }
  };
  visit(nodes);
}

/** Reconstruct canonical identities and metadata from global authoring. Only generated
 * source-usage/example annotations are carried forward; they do not supply definitions. */
export function compileRequirementComponents(existing = [], definitions) {
  if (!Array.isArray(definitions) || !definitions.length) throw new Error('Missing fresh-start component definitions');
  const names = new Set(definitions.map(definition => definition.name));
  if (names.size !== definitions.length) throw new Error('Duplicate fresh-start component name');
  const previous = new Map(existing.map(record => [record.key, record]));
  const records = definitions.map((definition, position) => {
    const { name, displayName, description, registration, contains, parts = [] } = definition;
    if (![name, displayName, description].every(value => typeof value === 'string' && value.trim())
      || !registration || !componentRoles.includes(registration.role)
      || typeof registration.source !== 'string' || !/^(?:src\/.*\.tsx?|@mui\/material\/[A-Z]\w*)$/.test(registration.source)
      || typeof registration.storyId !== 'string' || !/^[a-z0-9-]+--[a-z0-9-]+$/.test(registration.storyId)
      || typeof registration.section !== 'string' || !/^Components(?: \/ |$)/.test(registration.section)
      || !Array.isArray(contains) || contains.some(name => !names.has(name))) throw new Error(`Invalid fresh-start component registration: ${name}`);
    const packageImport = registration.packageImport;
    if (packageImport !== undefined && (!packageImport || packageImport.module !== '@mui/material' || registration.source !== `${packageImport.module}/${packageImport.symbol}`)) throw new Error(`Invalid fresh-start native component: ${name}`);
    const authoredExamples = registration.examples ?? [];
    if (!Array.isArray(authoredExamples) || new Set(authoredExamples.map(example => example.key)).size !== authoredExamples.length || authoredExamples.some(example => !example.key?.trim() || !example.label?.trim() || !/^[a-z0-9-]+--[a-z0-9-]+$/.test(example.storyId))) throw new Error(`Invalid component examples: ${name}`);
    const key = requirementComponentKey(name), prior = previous.get(key);
    return {
      id: key, key, position, ...libraryMetadata('components', key, registration.source),
      definition: {
        name, section: registration.section, description, displayName, storyId: registration.storyId, source: registration.source,
        ...(packageImport ? { packageImport } : {}), role: registration.role,
        contains: contains.map(requirementComponentKey).sort(), parts: structuredClone(parts),
        usages: prior?.definition.usages ?? [], examples: [...(prior?.definition.examples ?? []).filter(example => !authoredExamples.some(authored => authored.storyId === example.storyId)), ...authoredExamples.map(example => ({ ...example, section: registration.section }))],
        storybookPath: `?path=/story/${registration.storyId}`,
      },
    };
  });
  validateComponentStructure(records);
  return records;
}
