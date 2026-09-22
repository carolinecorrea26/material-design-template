import { Chip, Stack, Typography } from "@mui/material";
import { CLIENT_HIGHLIGHT_BG, CLIENT_HIGHLIGHT_BORDER } from "./ClientNote";

type HeaderVariant = "h6" | "subtitle1" | "subtitle2";

/**
 * Shared non-collapsible subsection header — title + optional count chip +
 * optional override-count chip. Centralizes a Stack/Typography/Chip block
 * that used to be hand-duplicated at every subsection that isn't its own
 * SectionAccordion, so headers read consistently and no caller re-renders a
 * title a nested list/table component already owns (or vice versa).
 */
export default function SubsectionHeader({
  title,
  variant = "h6",
  count,
  overrideCount,
  sx,
}: {
  title: string;
  variant?: HeaderVariant;
  count?: number;
  /** Number of items in this subsection that differ for the active client — rendered as a yellow chip. */
  overrideCount?: number;
  sx?: object;
}) {
  return (
    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5, ...sx }}>
      <Typography variant={variant} sx={{ fontWeight: variant === "h6" ? 800 : 700 }}>
        {title}
      </Typography>
      {count != null && <Chip label={count} size="small" />}
      {overrideCount != null && overrideCount > 0 && (
        <Chip
          label={`${overrideCount} client override${overrideCount === 1 ? "" : "s"}`}
          size="small"
          sx={{
            bgcolor: CLIENT_HIGHLIGHT_BG,
            borderColor: CLIENT_HIGHLIGHT_BORDER,
            color: "#5c4a00",
            border: "1px solid",
            fontWeight: 600,
          }}
        />
      )}
    </Stack>
  );
}
