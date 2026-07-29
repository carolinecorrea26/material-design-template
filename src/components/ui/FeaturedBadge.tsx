import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import { Chip } from "@mui/material";

/**
 * Small "Featured" badge chip used on product cards to indicate featured coverage products.
 */
export default function FeaturedBadge() {
  return (
    <Chip
      icon={<AutoAwesomeIcon />}
      label="Featured"
      size="small"
      color="primary"
      sx={{
        flexShrink: 0,
        "& .MuiChip-label": { fontSize: "0.675rem", fontWeight: 700 },
        "& .MuiChip-icon": { fontSize: "0.875rem" },
      }}
    />
  );
}
