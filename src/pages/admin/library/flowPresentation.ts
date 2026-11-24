import type { FlowNodeDef } from '../../../domain/flows';
import type { ComponentRow } from '../../../persistence/types/library';

export function flowComponentExample(node: FlowNodeDef, components: ComponentRow[]) {
  if (node.componentKey) {
    const component = components.find(row => row.key === node.componentKey);
    if (!component) throw new Error(`Missing flow component: ${node.componentKey}`);
    const example = node.componentExampleKey ? component.definition.examples?.find(example => example.key === node.componentExampleKey) : undefined;
    if (node.componentExampleKey && !example) throw new Error(`Missing flow component example: ${node.componentExampleKey}`);
    return { component, example };
  }
  if (node.pageId) {
    for (const component of components) {
      const example = component.definition.examples?.find(example => example.pageKey === node.pageId && example.section.endsWith('/ Whole page'));
      if (example) return { component, example };
    }
  }
  return null;
}
