import type { HomeContent } from '../types';
import { requirementContentSection } from '../../domain/requirementContent';

/** Read-only defaults projected from the canonical content bindings. */
export const homeDefaults = requirementContentSection<HomeContent>('home');
