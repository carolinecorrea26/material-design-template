import * as React from "react";
import { useTheme, Box, Stack, Typography, Card, CardContent, Grid } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/react";

const meta: Meta = { title: "Tokens/Theme", parameters: { layout: "fullscreen" } };
export default meta;
type Story = StoryObj;

export const Colors: Story = {
  render: () => {
    const t = useTheme();
    const swatch = (label: string, color: string) => (
      <Card key={label} sx={{ minWidth: 180 }}>
        <CardContent>
          <Box sx={{ height: 56, bgcolor: color, borderRadius: 1, mb: 1 }} />
          <Typography variant="body2" sx={{ fontWeight: 600 }}>{label}</Typography>
          <Typography variant="caption">{color}</Typography>
        </CardContent>
      </Card>
    );
    const P = t.palette;
    return (
      <Stack spacing={3}>
        <Typography variant="h4">Palette</Typography>
        <Grid container spacing={2}>
          {[["primary.main", P.primary.main],
            ["primary.light", P.primary.light],
            ["primary.dark", P.primary.dark],
            ["secondary.main", P.secondary.main],
            ["secondary.light", P.secondary.light],
            ["secondary.dark", P.secondary.dark],
            ["success.main", P.success.main],
            ["error.main", P.error.main],
            ["warning.main", P.warning.main],
            ["info.main", P.info.main]]
            .map(([label, color]) => (
              <Grid key={label} item><>{swatch(String(label), String(color))}</></Grid>
            ))}
        </Grid>
      </Stack>
    );
  }
};

export const TypographyScale: Story = {
  render: () => (
    <Stack spacing={1}>
      <Typography variant="h1">H1 Heading</Typography>
      <Typography variant="h2">H2 Heading</Typography>
      <Typography variant="h3">H3 Heading</Typography>
      <Typography variant="h4">H4 Heading</Typography>
      <Typography variant="h5">H5 Heading</Typography>
      <Typography variant="h6">H6 Heading</Typography>
      <Typography variant="body1">Body1 text…</Typography>
      <Typography variant="body2">Body2 text…</Typography>
      <Typography variant="button">Button text</Typography>
      <Typography variant="caption">Caption text</Typography>
      <Typography variant="overline">Overline text</Typography>
    </Stack>
  )
};
