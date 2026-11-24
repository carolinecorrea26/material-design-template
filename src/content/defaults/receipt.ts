import type { ReceiptContent } from '../types';
import { requirementContentSection } from '../../domain/requirementContent';

/** Read-only defaults projected from the canonical content bindings. */
export const receiptDefaults = requirementContentSection<ReceiptContent>('receipt');
