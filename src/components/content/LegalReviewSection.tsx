import type { ReactNode } from "react";
import { Box, Button, Typography } from "@mui/material";
import PrintRoundedIcon from "@mui/icons-material/PrintRounded";

/** Shared disclosure heading, bordered content surface and print action. Copy and print behavior are supplied. */
export default function LegalReviewSection({ id, title, maxHeight, onPrint, children }: {
  id: string; title: string; maxHeight?: number; onPrint: () => void; children: ReactNode;
}) {
  return <Box data-legal-review-section={id}>
    <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1, textAlign: "center" }}>{title}</Typography>
    <Box sx={{ maxHeight, overflowY: "auto", border: "1px solid", borderColor: "divider", borderRadius: 1, p: 1.5, backgroundColor: "action.hover" }}>{children}</Box>
    <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 1 }}>
      <Button startIcon={<PrintRoundedIcon />} onClick={onPrint}>Print</Button>
    </Box>
  </Box>;
}
