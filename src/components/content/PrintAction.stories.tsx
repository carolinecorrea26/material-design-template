import type { Meta, StoryObj } from '@storybook/react-vite';
import { Box, Typography } from '@mui/material';
import PrintAction from './PrintAction';
import { getContent } from '../../content';
const meta = { id: 'content-print-action', title: 'Components/Content/Print action', component: PrintAction, parameters: { layout: 'padded' } } satisfies Meta<typeof PrintAction>;
export default meta;
export const Disclosure: StoryObj = { render: () => <Box>
  <Box id="print-example-disclosure" aria-label={getContent().review.electronicConsentTitle} sx={{ maxWidth: 680 }}>
    <Typography variant="h6">{getContent().review.electronicConsentTitle}</Typography>
    <Typography sx={{ whiteSpace: 'pre-wrap' }}>{getContent().review.electronicConsentContent}</Typography>
  </Box>
  <PrintAction targetId="print-example-disclosure" />
</Box> };
