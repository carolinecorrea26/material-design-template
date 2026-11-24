import type { NavigationContent } from '../types';
import { requirementContentSection } from '../../domain/requirementContent';

/** Default presentations use the same authored keys and bindings as the compiler. */
export const navigationDefaults = requirementContentSection<NavigationContent>('navigation');
