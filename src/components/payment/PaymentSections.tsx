import type { ComponentType, ReactNode } from 'react';
import { Alert, Box, Divider, Stack, Typography } from '@mui/material';
import InfoRoundedIcon from '@mui/icons-material/InfoRounded';
import type { SvgIconProps } from '@mui/material';
import type { FormRouteRenderProps } from '../../app/RoutePage';
import type { FieldDefinition } from '../../config/fields/types';
import FieldRenderer from '../forms/FieldRenderer';
import CategoryCard from '../layout/CategoryCard';
import ProductCard from '../layout/ProductCard';
import SectionDivider from '../layout/SectionDivider';

export type PaymentCategory = {
  id: string; label: string; icon: ComponentType<SvgIconProps>;
  products: { id: string; name: string; quickDecision: boolean; methodField?: FieldDefinition; frequencyField?: FieldDefinition; costs: ReactNode }[];
};
type Props = Pick<FormRouteRenderProps, 'control' | 'errors'> & {
  showPaymentQuestions: boolean; optInField?: FieldDefinition; categories: PaymentCategory[];
  bankFields: FieldDefinition[]; sharedControls?: ReactNode; feedback?: ReactNode;
};
/** Payment content with explicit fields and display data; the page resolves policies, costs and submission. */
export default function PaymentSections({ control, errors, showPaymentQuestions, optInField, categories, bankFields, sharedControls, feedback }: Props) {
  return <Stack spacing={2}>
    {feedback}
    {optInField && <FieldRenderer field={optInField} control={control} errors={errors} />}
    {optInField && showPaymentQuestions && <Divider sx={{ my: 2 }} />}
    {showPaymentQuestions && <>
      <Alert severity="warning" icon={<InfoRoundedIcon fontSize="inherit" />} sx={{ alignItems: 'flex-start' }}>
        <Typography variant="subtitle2" fontWeight={700}>You will not be charged yet.</Typography>
        <Typography variant="body2" sx={{ mt: 0.5 }}>Your payment information is collected as part of the application but you will not be charged until and unless you are approved for coverage. No money leaves your account during the application process.</Typography>
      </Alert>
      {sharedControls}
      {categories.length === 0 ? <Alert severity="info">No applied-for products were found. Return to coverage options to choose coverage and continue.</Alert> : categories.map(category => <Stack key={category.id} spacing={1.5}>
        <CategoryCard label={category.label} icon={category.icon}>
          {category.products.map(product => <ProductCard key={product.id} productName={product.name} quickDecision={product.quickDecision}>
            <Stack spacing={2}>
              {product.methodField && <FieldRenderer field={product.methodField} control={control} errors={errors} />}
              {product.frequencyField && <FieldRenderer field={product.frequencyField} control={control} errors={errors} />}
              {product.costs}
            </Stack>
          </ProductCard>)}
        </CategoryCard>
      </Stack>)}
      {bankFields.length > 0 && <Stack spacing={1.5} sx={{ pt: 1 }}>
        <SectionDivider label="Banking Information" variant="subsection" />
        {bankFields.map(field => <FieldRenderer key={field.id} field={field} control={control} errors={errors} />)}
      </Stack>}
    </>}
    <Box sx={{ mt: 3, color: 'text.secondary' }}>
      <Typography variant="caption" sx={{ display: 'block', lineHeight: 1.6 }}><Box component="sup" sx={{ fontSize: '0.8em', mr: 0.5 }}>1</Box>Quoted cost is the best rate available based on the information you provided. Final cost may be based upon factors such as gender, health status, and use of tobacco/nicotine. Rates current as of 2026.</Typography>
    </Box>
  </Stack>;
}
