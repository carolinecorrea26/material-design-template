import type { Meta } from "@storybook/react-vite";
import { Box, Chip, Stack, Typography } from "@mui/material";

const meta = {
  title: "Project/Overview",
  parameters: {
    layout: "padded",
  },
} satisfies Meta;

export default meta;

export const Overview = () => (
  <Box sx={{ maxWidth: 900 }}>
    <Typography variant="h4" gutterBottom>
      New Template Design Prototype
    </Typography>

    <Typography variant="body1" sx={{ mb: 3 }}>
      This Storybook documents the reusable components, page patterns, copy, and
      interaction states used in the new template design prototype. The
      prototype is intended for design and development reference, not production
      implementation.
    </Typography>

    <Stack
      direction="row"
      spacing={1}
      sx={{ mb: 3 }}
      flexWrap="wrap"
      useFlexGap
    >
      <Chip label="Material UI" />
      <Chip label="React" />
      <Chip label="Vite" />
      <Chip label="Prototype" />
      <Chip label="Dev handoff" />
    </Stack>

    <Typography variant="h6" gutterBottom>
      Storybook goals
    </Typography>

    <Typography component="div" variant="body1">
      <ul>
        <li>Document shared components and page patterns.</li>
        <li>Show component states and variants in isolation.</li>
        <li>Capture approved copy and content patterns.</li>
        <li>
          Help developers understand how the prototype should be translated into
          the production template.
        </li>
        <li>
          Reduce repeated custom styling by moving common patterns into shared
          components or theme tokens.
        </li>
      </ul>
    </Typography>

    <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
      What this Storybook is not
    </Typography>

    <Typography component="div" variant="body1">
      <ul>
        <li>It is not the production application.</li>
        <li>It is not the final source of business rules.</li>
        <li>It is not meant to document every line of prototype code.</li>
      </ul>
    </Typography>
  </Box>
);
