import { Alert, Button, Paper, Stack, Typography } from '@mui/material';
import { useForm } from 'react-hook-form';
import FieldRenderer from '../../components/forms/FieldRenderer';
import { FieldDefinitionsContext } from '../../components/forms/FieldDefinitionsContext';
import { evaluateCondition } from '../../config/conditions/evaluateConditions';
import { getPhoneTypeFieldId } from '../../domain/phoneFields';
import type { FieldDefinition } from '../../domain/fields';
import type { ConditionDefinition } from '../../domain/rules';

export default function DraftFieldPreview({ fields, conditions }: { fields: FieldDefinition[]; conditions: ConditionDefinition[] }) {
  const { control, formState, handleSubmit, watch } = useForm<Record<string, string | boolean | string[]>>({ shouldUnregister: true });
  const values = watch();
  const phoneCompanions = new Set(fields.filter(field => field.format === 'phone' && field.showPhoneTypeSelector !== false).map(getPhoneTypeFieldId));
  const visibleFields = fields.filter(field => {
    if (phoneCompanions.has(field.id)) return false;
    if (!field.visibilityConditionId) return true;
    const condition = conditions.find(row => row.id === field.visibilityConditionId);
    return condition && evaluateCondition(condition, values, fields);
  });
  return <Paper variant="outlined" sx={{ p: 2 }}>
    <Stack component="form" spacing={2} noValidate onSubmit={handleSubmit(() => {})}>
      <Typography variant="h6">Applicant field preview</Typography>
      <Typography variant="body2" color="text.secondary">Use View site to test rules that depend on earlier pages.</Typography>
      <FieldDefinitionsContext value={fields}>
        {visibleFields.map(field => <FieldRenderer key={field.id} field={field} control={control} errors={formState.errors} />)}
      </FieldDefinitionsContext>
      {formState.isSubmitSuccessful && <Alert severity="success">Visible fields passed validation.</Alert>}
      <Button type="submit" variant="outlined" disabled={!visibleFields.length}>Validate preview fields</Button>
    </Stack>
  </Paper>;
}
