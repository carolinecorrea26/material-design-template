import { Alert, Button, Stack, Typography } from '@mui/material';
import AddCircleOutlineRoundedIcon from '@mui/icons-material/AddCircleOutlineRounded';
import type { Ref } from 'react';
import ProductCard from '../layout/ProductCard';
import DynamicListItem from '../forms/DynamicListItem';
import { type BeneficiaryItem, getBeneficiaryDisplayName, getDesignationLabel, getRelationshipLabel } from './beneficiaryRecords';

/** Record presentation and actions; eligibility, capacity and persistence belong to the caller. */
export default function BeneficiaryProductRecords({ productName, quickDecision, items, note, capacityMessage, onEdit, onRemove, onAdd, onApply, canApply, addButtonRef }: {
  productName: string; quickDecision?: boolean; items: BeneficiaryItem[]; note?: string; capacityMessage?: string;
  onEdit: (item: BeneficiaryItem) => void; onRemove: (id: string) => void; onAdd: () => void; addButtonRef?: Ref<HTMLButtonElement>;
  onApply?: (item: BeneficiaryItem) => void;
  canApply?: (item: BeneficiaryItem) => boolean;
}) {
  return <ProductCard productName={productName} quickDecision={quickDecision}>
    <Stack spacing={1.5}>
      {note && <Alert severity="info" sx={{ whiteSpace: 'pre-wrap' }}>{note}</Alert>}
      {(['primary', 'contingent'] as const).map(designation => {
        const records = items.filter(item => item.designation === designation);
        return records.length ? <Stack spacing={0.75} key={designation}>
          <Typography variant="overline" color="text.secondary">{getDesignationLabel(designation)}</Typography>
          {records.map(item => <DynamicListItem key={item.id} onEdit={() => onEdit(item)} onRemove={() => onRemove(item.id)}
            itemLabel={`${getBeneficiaryDisplayName(item)}${item.beneficiaryType === 'individual' ? ` (${item.share}%)` : ''}`}>
            <Typography variant="subtitle2">{getBeneficiaryDisplayName(item)}</Typography>
            <Typography variant="caption" color="text.secondary">{getRelationshipLabel(item)}{item.beneficiaryType === 'individual' ? ` | ${item.share}%` : ''}</Typography>
            {onApply && (!canApply || canApply(item)) && <Button size="small" onClick={() => onApply(item)}>Apply to Other Coverages</Button>}
          </DynamicListItem>)}
        </Stack> : null;
      })}
      {capacityMessage ? <Alert severity="info" sx={{ mt: 1 }}>{capacityMessage}</Alert> : <Button ref={addButtonRef} variant="outlined" fullWidth startIcon={<AddCircleOutlineRoundedIcon />} onClick={onAdd}>Add Beneficiary</Button>}
    </Stack>
  </ProductCard>;
}
