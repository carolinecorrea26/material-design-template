import type { ReactNode } from "react";
import { Box } from "@mui/material";

export type FieldGridColumns =
  | "equal"
  | "wide-narrow"
  | "wide-two-narrow";

const columnTemplates: Record<FieldGridColumns, string> = {
  equal: "1fr 1fr",
  "wide-narrow": "2fr 1fr",
  "wide-two-narrow": "2fr 1fr 1fr",
};

type FieldGridProps = {
  children: ReactNode;
  columns?: FieldGridColumns | string;
  gap?: number | { xs: number; sm: number };
};

/** Responsive form row that collapses to one column below the sm breakpoint. */
export default function FieldGrid({
  children,
  columns = "equal",
  gap = { xs: 0, sm: 2 },
}: FieldGridProps) {
  const smColumns =
    columns in columnTemplates
      ? columnTemplates[columns as FieldGridColumns]
      : columns;
  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: { xs: "1fr", sm: smColumns },
        gap,
      }}
    >
      {children}
    </Box>
  );
}
