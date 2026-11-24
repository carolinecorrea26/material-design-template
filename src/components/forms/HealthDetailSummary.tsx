import { Stack, Typography } from '@mui/material';
import { requirementText } from '../../domain/requirementContent';

/** Summary of a saved detail record, after the caller maps its stored fields. */
export default function HealthDetailSummary({ values, kind = 'condition' }: {
  values: Record<string, string>; kind?: 'condition' | 'general' | 'assistance' | 'fall';
}) {
  const detail = <Typography component="span" variant="body2" sx={{ wordBreak: 'break-word' }}>{(kind === 'general' ? values.details : values.conditionsDetails) || requirementText('application.ui.no-details-provided')}</Typography>;
  if (kind === 'general') return detail;
  const type = kind === 'assistance' ? values.assistanceType : kind === 'fall' ? values.fallType : undefined;
  return <Stack spacing={0.25}>
    {type && <Typography component="span" variant="caption" color="text.secondary">{type}</Typography>}
    {values.onset && <Typography component="span" variant="caption" color="text.secondary">{requirementText('application.ui.onset')}{values.onset}</Typography>}
    {detail}
  </Stack>;
}
