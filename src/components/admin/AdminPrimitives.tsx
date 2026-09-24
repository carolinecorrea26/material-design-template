import type { ReactNode } from "react";
import { Box, Chip, Paper, Stack, Typography } from "@mui/material";

export function Workspace({ children }: { children: ReactNode }) {
  return <Stack spacing={2.5} sx={{ p: { xs: 2, md: 3 }, maxWidth: 1500, mx: "auto" }}>{children}</Stack>;
}

export function WorkspaceHeader({ title, description, actions }: { title: string; description: string; actions?: ReactNode }) {
  return (
    <Stack direction={{ xs: "column", sm: "row" }} gap={2} justifyContent="space-between" alignItems={{ sm: "flex-start" }}>
      <Box>
        <Typography component="h1" variant="h5" sx={{ fontWeight: 800 }}>{title}</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>{description}</Typography>
      </Box>
      {actions}
    </Stack>
  );
}

export function Section({ title, description, action, children }: { title: string; description?: string; action?: ReactNode; children: ReactNode }) {
  return (
    <Box component="section">
      <Stack direction="row" alignItems="flex-end" justifyContent="space-between" gap={2} sx={{ mb: 1 }}>
        <Box>
          <Typography component="h2" variant="subtitle1" sx={{ fontWeight: 800 }}>{title}</Typography>
          {description && <Typography variant="caption" color="text.secondary">{description}</Typography>}
        </Box>
        {action}
      </Stack>
      {children}
    </Box>
  );
}

const statusColors: Record<string, "default" | "primary" | "secondary" | "success" | "warning" | "info"> = {
  Active: "success", Released: "success", Completed: "success", Approved: "success",
  QA: "warning", Review: "warning", "Pending TPA Review": "warning", Scheduled: "info",
  Development: "primary", "In Progress": "primary", Underwriting: "primary",
  Planning: "secondary", Draft: "default", Requested: "info", "Waiting for Advisor": "warning",
};

export function StatusChip({ label }: { label: string }) {
  return <Chip label={label} size="small" color={statusColors[label] ?? "default"} variant="outlined" sx={{ fontWeight: 700 }} />;
}

export function PlaceholderPanel({ children }: { children: ReactNode }) {
  return <Paper variant="outlined" sx={{ p: 2.5, borderStyle: "dashed", bgcolor: "background.paper" }}>{children}</Paper>;
}
