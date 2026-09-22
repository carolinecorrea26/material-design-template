import { Chip } from "@mui/material";

// ---------------------------------------------------------------------------
// Active client highlight colors — used to flag content that differs for the
// active client (drives all "client-specific" highlighting in the docs).
// ---------------------------------------------------------------------------
export const CLIENT_HIGHLIGHT_BG = "#fff9c4";
export const CLIENT_HIGHLIGHT_BORDER = "#e4c400";

export default function ClientNote({ label }: { label: string }) {
  return (
    <Chip
      label={label}
      size="small"
      sx={{
        bgcolor: CLIENT_HIGHLIGHT_BG,
        borderColor: CLIENT_HIGHLIGHT_BORDER,
        color: "#5c4a00",
        fontWeight: 600,
        border: "1px solid",
        height: "auto",
        "& .MuiChip-label": {
          whiteSpace: "normal",
          display: "block",
          py: 0.5,
        },
      }}
    />
  );
}
