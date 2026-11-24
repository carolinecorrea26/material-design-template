import FieldGrid from '../layout/FieldGrid';
import type { PageNote } from '../../domain/pageNotes.mjs';
import { requirementText } from "../../domain/requirementContent";
import type { ComponentType, ReactNode } from 'react';
import { Alert, Box, Divider, Stack, Typography } from '@mui/material';
import type { SvgIconProps } from '@mui/material';
import type { FormRouteRenderProps } from '../../app/RoutePage';
import type { FieldDefinition } from '../../config/fields/types';
import FieldRenderer from '../forms/FieldRenderer';
import CategoryCard from '../layout/CategoryCard';
import ProductCard from '../layout/ProductCard';
import SectionDivider from '../layout/SectionDivider';

export type PaymentCategory = {
  id: string; label: string; icon: ComponentType<SvgIconProps>;
  products: { id: string; name: string; quickDecision: boolean; methodField?: FieldDefinition; frequencyField?: FieldDefinition; costs: ReactNode; notes?: PageNote[]; onMethodChange?: (method?: string) => void }[];
};
type Props = Pick<FormRouteRenderProps, 'control' | 'errors'> & {
  pageSections: FormRouteRenderProps['pageSections'];
  showPaymentQuestions: boolean; optInField?: FieldDefinition; categories: PaymentCategory[];
  notes?: PageNote[]; bankFields: FieldDefinition[]; sharedControls?: ReactNode;
};
/** Payment content with explicit fields and display data; the page resolves policies, costs and normal form continuation. */
export default function PaymentSections({ control, errors, pageSections, showPaymentQuestions, optInField, categories, bankFields, sharedControls, notes = [] }: Props) {
  return <Stack spacing={2}>
    {pageSections.map(section => {
      if (section.id === 'paymentOptIn') return optInField ? <Box key={section.id}>
        <FieldRenderer field={optInField} control={control} errors={errors} />
        {showPaymentQuestions && <Divider sx={{ my: 2 }} />}
      </Box> : null;
      if (!showPaymentQuestions) return null;
      if (section.id === 'paymentElections') return <Stack key={section.id} spacing={2}>
      <Alert severity="info" sx={{ alignItems: 'flex-start' }}>
        <Typography variant="subtitle2" fontWeight={700}>{requirementText("application.ui.you-will-not-be-charged-yet")}</Typography>
        <Typography variant="body2" sx={{ mt: 0.5 }}>{requirementText("application.ui.your-payment-information-is-collected-as-part-of-the-application-but-you-will")}</Typography>
      </Alert>
      {notes.map(note => <Alert key={note.id} severity="info" sx={{ whiteSpace: 'pre-wrap' }}>{note.text}</Alert>)}
      {sharedControls}
      {categories.length === 0 ? <Alert severity="info">{requirementText("application.ui.no-applied-for-products-were-found-return-to-coverage-options-to-choose-covera")}</Alert> : categories.map(category => <Stack key={category.id} spacing={1.5}>
        <CategoryCard label={category.label} icon={category.icon}>
          {category.products.map(product => <ProductCard key={product.id} productName={product.name} quickDecision={product.quickDecision}>
            <FieldGrid>
              {product.notes?.map(note => <Alert key={note.id} severity="info" sx={{ whiteSpace: 'pre-wrap' }}>{note.text}</Alert>)}
              {product.methodField && <FieldRenderer onValueChange={value => product.onMethodChange?.(typeof value === "string" ? value : undefined)} field={product.methodField} control={control} errors={errors} />}
              {product.frequencyField && <FieldRenderer field={product.frequencyField} control={control} errors={errors} />}
              {product.costs}
            </FieldGrid>
          </ProductCard>)}
        </CategoryCard>
      </Stack>)}
      </Stack>;
      if (section.id !== 'paymentBanking') throw new Error(`Unsupported Payment section: ${section.id}`);
      return bankFields.length > 0 ? <Stack key={section.id} spacing={1.5} sx={{ pt: 1 }}>
        <SectionDivider label={section.title ?? requirementText("payment.bank-label")} variant="subsection">
          <FieldGrid>
            {bankFields.map(field => <FieldRenderer key={field.id} field={field} control={control} errors={errors} />)}
          </FieldGrid>
        </SectionDivider>
      </Stack> : null;
    })}
    <Box sx={{ mt: 3, color: 'text.secondary' }}>
      <Typography variant="caption" sx={{ display: 'block', lineHeight: 1.6 }}><Box component="sup" sx={{ fontSize: 'caption.fontSize', mr: 0.5 }}>1</Box>{requirementText("application.ui.quoted-cost-is-the-best-rate-available-based-on-the-information-you-provided-f")}</Typography>
    </Box>
  </Stack>;
}
