import type { ReactNode } from "react";
import {
  Box,
  Chip,
  Divider,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import Card from "@mui/material/Card";

/**
 * Shared presentational building blocks for Storybook Docs-style story
 * files under src/docs/**. These intentionally mirror the heading and table
 * conventions used by internal documentation, so a reader moving between it and
 * Storybook sees the same visual language. This file has no default export
 * and matches no `*.stories.*` glob, so Storybook does not treat it as a story.
 */

export function DocsPage({
  eyebrow,
  title,
  intro,
  children,
  maxWidth = 1100,
}: {
  eyebrow?: string;
  title: string;
  intro?: ReactNode;
  children: ReactNode;
  maxWidth?: number;
}) {
  return (
    <Box sx={{ maxWidth }}>
      {eyebrow && (
        <Typography
          variant="overline"
          color="primary"
          sx={{ display: "block", mb: 0.5 }}
        >
          {eyebrow}
        </Typography>
      )}
      <Typography variant="h4" gutterBottom>
        {title}
      </Typography>
      {intro && (
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3, maxWidth: 760 }}>
          {intro}
        </Typography>
      )}
      <Stack spacing={4}>{children}</Stack>
    </Box>
  );
}

export function DocsSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: ReactNode;
  children: ReactNode;
}) {
  return (
    <Box>
      <Typography variant="h6" gutterBottom sx={{ fontWeight: 800 }}>
        {title}
      </Typography>
      {description && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2, maxWidth: 720 }}>
          {description}
        </Typography>
      )}
      {children}
    </Box>
  );
}

export function SourceNote({ children }: { children: ReactNode }) {
  return (
    <Typography
      variant="caption"
      color="text.secondary"
      sx={{ display: "block", fontFamily: "monospace", mt: 1 }}
    >
      {children}
    </Typography>
  );
}

export function StatusChip({
  status,
}: {
  status: "Implemented" | "Partial" | "Requires production testing";
}) {
  const color =
    status === "Implemented"
      ? "success"
      : status === "Partial"
        ? "warning"
        : "default";
  return <Chip label={status} size="small" color={color} variant="outlined" />;
}

export type Swatch = { label: string; value: string; note?: string };

export function ColorSwatch({ swatch }: { swatch: Swatch }) {
  return (
    <Stack spacing={0.75} sx={{ width: 180 }}>
      <Box
        sx={{
          height: 64,
          borderRadius: 3,
          border: "1px solid rgba(0,0,0,0.08)",
          backgroundColor: swatch.value,
        }}
      />
      <Typography variant="caption" sx={{ fontWeight: 700 }}>
        {swatch.label}
      </Typography>
      <Typography variant="caption" color="text.secondary" sx={{ fontFamily: "monospace" }}>
        {swatch.value}
      </Typography>
      {swatch.note && (
        <Typography variant="caption" color="text.secondary" sx={{ fontStyle: "italic" }}>
          {swatch.note}
        </Typography>
      )}
    </Stack>
  );
}

export function SwatchRow({ swatches }: { swatches: Swatch[] }) {
  return (
    <Stack direction="row" flexWrap="wrap" gap={2}>
      {swatches.map((s) => (
        <ColorSwatch key={s.label} swatch={s} />
      ))}
    </Stack>
  );
}

export function DocsTable({
  columns,
  children,
}: {
  columns: string[];
  children: ReactNode;
}) {
  return (
    <TableContainer component={Card} variant="outlined" sx={{ overflowX: "auto" }}>
      <Table size="small">
        <TableHead>
          <TableRow>
            {columns.map((c) => (
              <TableCell key={c} sx={{ fontWeight: 700, whiteSpace: "nowrap" }}>
                {c}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>{children}</TableBody>
      </Table>
    </TableContainer>
  );
}

export { TableRow, TableCell, Divider };
