import application from '../../../../requirements/global/application.json';
import { flowDefinition } from '../../../domain/flowDefinitions.mjs';
import type { FlowId } from './types';

export function globalFlow(id: FlowId) {
  return flowDefinition(application.records, `global:*.${id}`);
}
