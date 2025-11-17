import React from 'react';
import { Card, CardContent, Stack, Typography, Box } from '@mui/material';

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
      <CardContent>
        <Stack spacing={3}>
          <Stack direction="row" spacing={1} alignItems="center">
            {icon}
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
