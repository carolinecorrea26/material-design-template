import type { ReactNode } from "react";
import { Box, type SxProps, type Theme } from "@mui/material";
import presentation from '../../../requirements/global/presentation-tokens.json';

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
  sx?: SxProps<Theme>;
};

/** Fields stack by default. Address, name and other intentionally grouped fields can opt into responsive columns. */
export default function FieldGrid({
  children,
  columns = "1fr",
  gap,
  keepColumns = false,
  sx,
}: FieldGridProps) {
  const smColumns =
    columns in columnTemplates
      ? columnTemplates[columns as FieldGridColumns]
      : columns;
  return (
    <Box
      className="FieldGrid-root"
      sx={[{
        display: "grid",
        gridTemplateColumns: keepColumns ? smColumns : { xs: "1fr", sm: smColumns },
        minWidth: 0,
        columnGap: gap ?? presentation.formFields.columnGap,
        rowGap: gap ?? presentation.formFields.rowGap,
      }, ...(sx ? Array.isArray(sx) ? sx : [sx] : [])]}
    >
      {children}
    </Box>
  );
}
