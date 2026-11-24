import type { BeneficiaryContent } from '../types';
import { requirementContentSection } from '../../domain/requirementContent';

/** Read-only defaults projected from the canonical content bindings. */
export const beneficiaryDefaults = requirementContentSection<BeneficiaryContent>('beneficiary');
