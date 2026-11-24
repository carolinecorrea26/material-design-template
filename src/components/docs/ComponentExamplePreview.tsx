import { useState } from 'react';
import { Box, Link, Stack } from '@mui/material';
import type { ComponentRow } from '../../persistence/types/library';
import { componentDisplayName } from '../../domain/componentDisplayNames';
import { getStorybookPreviewUrl, getStorybookStoryUrl } from '../../config/storybook';

type Example = { label: string; storyId: string };
/** Library surfaces embed the registered component example; nothing is reimplemented here. */
export default function ComponentExamplePreview({ component, example }: { component: ComponentRow; example?: Example }) {
  const [expanded, setExpanded] = useState(false);
  const label = example?.label ?? componentDisplayName(component.definition);
  const storyId = example?.storyId ?? component.definition.storyId;
  return <Box component="details" onToggle={event => setExpanded(event.currentTarget.open)} sx={{ minWidth: 0 }}>
    <Box component="summary" sx={{ cursor: 'pointer', color: 'primary.main', fontWeight: 600 }}>Preview {label}</Box>
    {expanded && <Stack spacing={1} sx={{ mt: 1 }}>
      <Link href={getStorybookStoryUrl(storyId)} target="_blank" rel="noopener noreferrer">Open example in Storybook</Link>
      <iframe src={getStorybookPreviewUrl(storyId)} title={`${label} component preview`} loading="lazy" style={{ width: '100%', minWidth: 360, height: 620, border: '1px solid #ddd', background: 'white' }} />
    </Stack>}
  </Box>;
}
