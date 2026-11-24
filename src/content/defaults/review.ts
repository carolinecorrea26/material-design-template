import type { ReviewContent } from '../types';
import { requirementContentSection } from '../../domain/requirementContent';

/** Read-only defaults projected from the canonical content bindings. */
export const reviewDefaults = requirementContentSection<ReviewContent>('review');
