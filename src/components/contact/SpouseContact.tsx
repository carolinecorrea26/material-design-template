import FieldRenderer from '../forms/FieldRenderer';
import type { AddressFieldsProps } from '../forms/AddressFields';
/** Independent contact bindings supplied by the caller. */
export default function SpouseContact({ fields, control, errors }: Omit<AddressFieldsProps, 'prefix'>) {
  return <>{fields.map(field => <FieldRenderer key={field.id} field={field} control={control} errors={errors} />)}</>;
}
