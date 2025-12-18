import React from 'react';
import { Card, CardContent, Stack, Typography, Box } from '@mui/material';
import { commonStyles } from '../../theme/commonStyles';

interface CollapsibleSectionProps {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  elevation?: number;
}

export default function CollapsibleSection({
  title,
  icon,
  children,
  elevation = 2
}: CollapsibleSectionProps) {
  // const [expanded, setExpanded] = useState(defaultExpanded);

  return (
    <Card elevation={elevation} sx={{ bgcolor: 'grey.50' }}>
      <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
        <Stack spacing={3}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            {icon && (
              <Box sx={commonStyles.iconCircle}>
                {icon}
              </Box>
            )}
            <Typography variant="h6">{title}</Typography>
          </Stack>

          <Box>
            {children}
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}
