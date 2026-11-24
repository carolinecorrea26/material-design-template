import type { DialogsContent } from '../types';
import { requirementContentSection } from '../../domain/requirementContent';

/** Read-only defaults projected from the canonical content bindings. */
export const dialogsDefaults = requirementContentSection<DialogsContent>('dialogs');
