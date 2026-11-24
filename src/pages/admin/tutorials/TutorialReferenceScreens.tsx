import { Box, Link, Stack, Typography } from '@mui/material';
import type { TutorialDefinition } from '../../../domain/tutorials';
export default function TutorialReferenceScreens({ tutorial, screenIds = [] }: { tutorial: TutorialDefinition; screenIds?: string[] }) {
  return <Stack spacing={2}>{screenIds.map(id => {
    const screen = tutorial.referenceScreens?.[id];
    if (!screen) return null;
    const path = `${import.meta.env.BASE_URL}${screen.path}`;
    return <Box component="figure" key={id} sx={{ m: 0 }}>
      <Box sx={{ maxHeight: '70vh', overflow: 'auto', border: '1px solid', borderColor: 'divider', borderRadius: 1 }} tabIndex={0} role="region" aria-label={screen.caption}>
        <Box component="img" src={path} alt={screen.caption} sx={{ display: 'block', width: '100%', height: 'auto' }} />
      </Box>
      <Typography component="figcaption" variant="body2" sx={{ mt: 1 }} color="text.secondary">{screen.caption}</Typography>
      <Link href={path} target="_blank" rel="noopener noreferrer" aria-label={`Open full-size: ${screen.caption}`} variant="body2">Open full-size screenshot</Link>
    </Box>;
  })}</Stack>;
}
