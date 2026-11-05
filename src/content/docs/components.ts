import saved from '../../../public/catalog/components/components.json';
import type { ComponentRow } from '../../persistence/types/library';

/** Storybook, migration and Library share the same saved component definitions. */
export const componentCatalog = (saved.components as ComponentRow[]).map(row => ({
  id: row.key, ...row.definition,
}));
