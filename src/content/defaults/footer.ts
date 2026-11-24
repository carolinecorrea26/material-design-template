import type { FooterContent } from '../types';
import { requirementContentSection } from '../../domain/requirementContent';

/** Legal disclosures and insurer wording retain their single JSON owner. */
export const footerDefaults = requirementContentSection<FooterContent>('footer');
