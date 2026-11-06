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
  keepColumns?: boolean;
};

/** Fields stack by default. Address, name and other intentionally grouped fields can opt into responsive columns. */
export default function FieldGrid({
  children,
  columns = "1fr",
  gap,
  keepColumns = false,
}: FieldGridProps) {
  const smColumns =
    columns in columnTemplates
      ? columnTemplates[columns as FieldGridColumns]
      : columns;
  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: keepColumns ? smColumns : { xs: "1fr", sm: smColumns },
        columnGap: gap ?? 2,
        rowGap: gap ?? 0,
      }}
    >
      {children}
    </Box>
  );
}
