import { Box, Typography } from '@mui/material';
export default function TutorialScreenPlaceholder({ description }: { description: string }) {
  return <Box role="note" aria-label="Screen placeholder" sx={{ border: '2px dashed', borderColor: 'divider', borderRadius: 2, p: { xs: 3, md: 5 }, bgcolor: 'action.hover', textAlign: 'center' }}><Typography variant="h6" gutterBottom>Screen placeholder</Typography><Typography color="text.secondary">{description}</Typography></Box>;
}
