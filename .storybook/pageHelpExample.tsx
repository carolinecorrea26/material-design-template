import { Stack, Typography } from '@mui/material';
import { requirementPageHelp, requirementTextList } from '../src/domain/requirementContent';

/** Explicit global source content; the shared view needs no active Site. */
export const pageHelpExampleItems = requirementPageHelp('beneficiary').map((item, index) => ({
  ...item,
  content: <Stack spacing={2}>{requirementTextList(index === 0 ? 'help.beneficiary.what-is' : 'help.beneficiary.share').map((text, index) => <Typography variant="body2" key={index}>{text}</Typography>)}</Stack>,
}));
