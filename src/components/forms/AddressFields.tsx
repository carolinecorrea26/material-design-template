import type { ComponentProps } from 'react';
import FieldRenderer from './FieldRenderer';
import FieldGrid from '../layout/FieldGrid';

export const addressFieldNames = ['street-address', 'apt-suite', 'city', 'state', 'zip-code'] as const;
export type AddressFieldMapping = Record<typeof addressFieldNames[number], string>;

export type AddressFieldsProps = Pick<ComponentProps<typeof FieldRenderer>, 'control' | 'errors'> & {
  fields: ComponentProps<typeof FieldRenderer>['field'][];
  prefix?: string;
  /** Actual answer IDs for address groups whose names do not share one prefix. */
  fieldIds?: Partial<AddressFieldMapping>;
};
/** Shared responsive street/apartment and city/state/ZIP rows. */
export default function AddressFields({ fields, prefix = '', fieldIds = {}, control, errors }: AddressFieldsProps) {
  const row = (ids: (keyof AddressFieldMapping)[]) => fields.filter(field => ids.some(id => field.id === (fieldIds[id] ?? `${prefix}${id}`)))
    .map(field => <FieldRenderer key={field.id} field={field} control={control} errors={errors} />);
  return <>
    <FieldGrid columns="wide-narrow">{row(['street-address', 'apt-suite'])}</FieldGrid>
    <FieldGrid columns="wide-two-narrow">{row(['city', 'state', 'zip-code'])}</FieldGrid>
  </>;
}
