import type { ReactNode } from "react";
import { Box, Typography } from "@mui/material";
import PrintAction from './PrintAction';

/** Shared disclosure heading, bordered content surface and print action. Copy and print behavior are supplied. */
export default function LegalReviewSection({ id, title, maxHeight, onPrint, children }: {
  id: string; title: string; maxHeight?: number; onPrint?: () => void; children: ReactNode;
}) {
  return <Box data-legal-review-section={id}>
    <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1, textAlign: "center" }}>{title}</Typography>
    <Box id={`${id}-print-content`} aria-label={title} role={maxHeight ? 'region' : undefined} tabIndex={maxHeight ? 0 : undefined} sx={{ maxHeight, overflowY: maxHeight ? 'auto' : 'visible', border: "1px solid", borderColor: "divider", borderRadius: 1, p: 1.5, backgroundColor: "action.hover", '@media print': { maxHeight: 'none', overflow: 'visible' } }}>{children}</Box>
    <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 1 }}>
      <PrintAction targetId={`${id}-print-content`} onPrint={onPrint} />
    </Box>
  </Box>;
}
