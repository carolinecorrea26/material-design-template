import FieldRenderer from '../forms/FieldRenderer';
import type { AddressFieldsProps } from '../forms/AddressFields';
import { FieldGroup } from '../layout/SectionDivider';
/** Independent contact bindings supplied by the caller. */
export default function SpouseContact({ fields, control, errors }: Omit<AddressFieldsProps, 'prefix'>) {
  return <FieldGroup className="FieldGroup-root" sx={{ mb: 4 }}>{fields.map(field => <FieldRenderer key={field.id} field={field} control={control} errors={errors} />)}</FieldGroup>;
}
