import { useEffect } from 'react';
import { Box } from '@mui/material';
import FieldRenderer from '../forms/FieldRenderer';
import AddressFields, { addressFieldNames, type AddressFieldsProps } from '../forms/AddressFields';
import SectionDivider from '../layout/SectionDivider';
import type { FormRouteRenderProps } from '../../app/RoutePage';

export type BusinessInformationProps = Omit<AddressFieldsProps, 'prefix'> & Pick<FormRouteRenderProps, 'watchedValues' | 'setValue'> & {
  sameAsHome: boolean;
  showEmployerDetails: boolean;
  title?: string;
};
/** Local same-as-home interaction; product eligibility/participation is decided by the caller. */
export default function BusinessInformation({ fields, control, errors, watchedValues, setValue, sameAsHome, showEmployerDetails, title = 'Business / Employer Information' }: BusinessInformationProps) {
  useEffect(() => {
    if (!sameAsHome) return;
    for (const id of addressFieldNames) {
      const value = watchedValues[id];
      if (typeof value === "string" && value !== watchedValues[`business-${id}`]) {
        setValue(`business-${id}`, value, { shouldDirty: false, shouldTouch: false, shouldValidate: false });
      }
    }
  }, [sameAsHome, watchedValues, setValue]);
  const addressIds = addressFieldNames.map(id => `business-${id}`);
  const render = (field: AddressFieldsProps['fields'][number]) => <FieldRenderer key={field.id} field={field} control={control} errors={errors} />;
  return <Box sx={{ mt: 2 }}>
    <SectionDivider label={title} variant="subsection">
    {showEmployerDetails && fields.filter(field => !addressIds.includes(field.id) && !['business-phone', 'business-address-same-as-home'].includes(field.id)).map(render)}
    {showEmployerDetails && fields.filter(field => field.id === 'business-address-same-as-home').map(render)}
    {(!sameAsHome || !showEmployerDetails) && <AddressFields fields={fields} control={control} errors={errors} prefix="business-" />}
    {showEmployerDetails && !sameAsHome && fields.filter(field => field.id === 'business-phone').map(render)}
    </SectionDivider>
  </Box>;
}
