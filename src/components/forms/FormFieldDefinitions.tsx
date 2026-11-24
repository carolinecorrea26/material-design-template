import { useContext, useMemo, type ReactNode } from 'react';
import type { FieldDefinition } from '../../domain/fields';
import { FieldDefinitionsContext } from './FieldDefinitionsContext';

/** Embedded controls resolve their siblings from the same effective fields as
 * the owning form. Shared definitions supply unrelated standalone components. */
export default function FormFieldDefinitions({ fields, children }: { fields: FieldDefinition[]; children: ReactNode }) {
  const inherited = useContext(FieldDefinitionsContext);
  const definitions = useMemo(() => [...new Map([...(inherited ?? []), ...fields].map(field => [field.id, field])).values()], [inherited, fields]);
  return <FieldDefinitionsContext value={definitions}>{children}</FieldDefinitionsContext>;
}
