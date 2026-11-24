import type { CoverageContent } from '../types';
import { requirementContentSection } from '../../domain/requirementContent';

/** Standalone coverage wording uses the canonical global bindings. */
export const coverageDefaults = requirementContentSection<CoverageContent>('coverage');
