import type { SharedContent } from '../types';
import { requirementContentSection } from '../../domain/requirementContent';

/** Read-only defaults projected from the canonical content bindings. */
export const sharedDefaults = requirementContentSection<SharedContent>('shared');
