import FieldRenderer from '../forms/FieldRenderer';
import AddressFields, { addressFieldNames, type AddressFieldsProps } from '../forms/AddressFields';

/** Residential address and any supplied correspondence control. */
export default function ResidentialAddress(props: Omit<AddressFieldsProps, 'prefix'>) {
  return <>
    <AddressFields {...props} />
    {props.fields.filter(field => !addressFieldNames.some(id => id === field.id)).map(field =>
      <FieldRenderer key={field.id} field={field} control={props.control} errors={props.errors} />)}
  </>;
}
