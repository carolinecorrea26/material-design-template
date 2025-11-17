import type { Meta, StoryObj } from '@storybook/react';
import { Box, Typography, Link } from '@mui/material';
import { commonStyles } from '../theme/commonStyles';

const meta: Meta = {
  title: 'Design System/Common Styles',
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const PrimaryLink: Story = {
  render: () => (
    <Box>
      <Typography variant="h6" gutterBottom>Primary Link Style</Typography>
      <Typography>
        This is a <Link href="#" sx={commonStyles.primaryLink}>primary link</Link> with bold styling and hover effects.
      </Typography>
    </Box>
  ),
};

export const CheckboxOption: Story = {
  render: () => (
    <Box>
      <Typography variant="h6" gutterBottom>Checkbox Option Styles</Typography>

      <Box sx={{
        border: 1,
        borderColor: 'divider',
        borderRadius: 1,
        p: 2,
        bgcolor: 'background.paper',
        mb: 2,
        '&:hover': { borderColor: 'primary.main' }
      }}>
        <Typography variant="body1" sx={{ fontWeight: 500 }}>Default State</Typography>
        <Typography variant="caption" color="text.secondary">
          Hover over this box to see the border color change.
        </Typography>
      </Box>

      <Box sx={{
        border: 1,
        borderColor: 'primary.main',
        borderRadius: 1,
        p: 2,
        bgcolor: 'rgba(25, 118, 210, 0.08)',
        transition: 'all 0.2s ease-in-out'
      }}>
        <Typography variant="body1" sx={{ fontWeight: 500 }}>Selected State</Typography>
        <Typography variant="caption" color="text.secondary">
          This shows the selected checkbox option styling.
        </Typography>
      </Box>
    </Box>
  ),
};

export const ProcessNumbers: Story = {
  render: () => (
    <Box>
      <Typography variant="h6" gutterBottom>Process Step Numbers</Typography>
      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
        {[1, 2, 3].map((num) => (
          <Box
            key={num}
            sx={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              bgcolor: 'primary.main',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1rem',
              fontWeight: 700
            }}
          >
            {num}
          </Box>
        ))}
      </Box>
      <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
        36×36px circular numbers used in process sections
      </Typography>
    </Box>
  ),
};