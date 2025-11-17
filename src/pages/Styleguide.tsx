import * as React from "react";
import {
  Typography, Box, Stack, useTheme, Card, CardContent,
  Button, TextField, Checkbox, FormControlLabel, Chip, Alert
} from "@mui/material";
import PageHeader from "../components/layout/PageHeader";

export default function Styleguide() {
  const theme = useTheme();

  return (
    <Stack spacing={4}>
      <PageHeader title="Styleguide (Dev-only)" />

      <Stack spacing={4}>
        <Typography variant="h3" sx={{ borderBottom: 2, borderColor: 'divider', pb: 1, fontWeight: 600 }}>
          Design System
        </Typography>

        <Stack spacing={3}>
          <Typography variant="h5" sx={{ color: 'primary.main' }}>
            🎨 Theme
          </Typography>

          <Stack spacing={2}>
            <Typography variant="h6">Color Swatches</Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2 }}>
              {[
                ["primary.main", theme.palette.primary.main],
                ["secondary.main", theme.palette.secondary.main],
                ["success.main", theme.palette.success.main],
                ["error.main", theme.palette.error.main]
              ].map(([label, color]) => (
                <Card key={label}>
                  <CardContent>
                    <Box
                      sx={{
                        width: '100%',
                        height: 80,
                        backgroundColor: color,
                        borderRadius: 1,
                        mb: 1
                      }}
                    />
                    <Typography variant="caption" sx={{ fontWeight: 600 }}>
                      {label}
                    </Typography>
                    <Typography variant="caption" display="block" color="text.secondary">
                      {color}
                    </Typography>
                  </CardContent>
                </Card>
              ))}
            </Box>
          </Stack>
        </Stack>

        <Stack spacing={3}>
          <Typography variant="h5" sx={{ color: 'primary.main' }}>
            📝 Typography
          </Typography>
          <Stack spacing={1}>
            <Typography variant="h1">H1 Heading</Typography>
            <Typography variant="h2">H2 Heading</Typography>
            <Typography variant="h3">H3 Heading</Typography>
            <Typography variant="h4">H4 Heading</Typography>
            <Typography variant="h5">H5 Heading</Typography>
            <Typography variant="h6">H6 Heading</Typography>
            <Typography variant="body1">Body 1 text</Typography>
            <Typography variant="body2">Body 2 text</Typography>
            <Typography variant="caption">Caption text</Typography>
          </Stack>
        </Stack>

        <Stack spacing={3}>
          <Typography variant="h5" sx={{ color: 'primary.main' }}>
            🧩 Components
          </Typography>
          
          <Stack spacing={2}>
            <Typography variant="h6">Buttons</Typography>
            <Stack direction="row" spacing={2}>
              <Button variant="contained">Contained</Button>
              <Button variant="outlined">Outlined</Button>
              <Button variant="text">Text</Button>
            </Stack>
          </Stack>

          <Stack spacing={2}>
            <Typography variant="h6">Form Fields</Typography>
            <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 2 }}>
              <TextField fullWidth label="First Name" placeholder="Enter first name" />
              <TextField fullWidth label="Last Name" placeholder="Enter last name" />
            </Box>
          </Stack>

          <Stack spacing={2}>
            <Typography variant="h6">Checkboxes</Typography>
            <Stack spacing={1}>
              <FormControlLabel control={<Checkbox />} label="Option 1" />
              <FormControlLabel control={<Checkbox checked />} label="Option 2 (checked)" />
            </Stack>
          </Stack>

          <Stack spacing={2}>
            <Typography variant="h6">Alerts</Typography>
            <Alert severity="success">Success alert</Alert>
            <Alert severity="error">Error alert</Alert>
            <Alert severity="warning">Warning alert</Alert>
            <Alert severity="info">Info alert</Alert>
          </Stack>

          <Stack spacing={2}>
            <Typography variant="h6">Chips</Typography>
            <Stack direction="row" spacing={1}>
              <Chip label="QuickDecision" color="success" size="small" />
              <Chip label="LI" size="small" />
              <Chip label="DI" size="small" />
            </Stack>
          </Stack>
        </Stack>
      </Stack>
    </Stack>
  );
}
