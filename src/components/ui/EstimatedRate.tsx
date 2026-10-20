import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import { Typography, type TypographyProps } from "@mui/material";
import { formatUSD } from "../../utils/formatUSD";

type EstimatedRateProps = Omit<TypographyProps, "children"> & { amount: number; suffix?: string };

/** Shared price and unavailable state for every estimated-rate surface. */
export default function EstimatedRate({ amount, suffix = "", sx, ...props }: EstimatedRateProps) {
  if (!Number.isFinite(amount)) return <Typography component="span" variant="body2" sx={{ display: "inline-flex", alignItems: "center", gap: 0.5, color: "text.secondary", fontWeight: 400, lineHeight: 1.5 }}>
    <InfoOutlinedIcon aria-hidden="true" sx={{ fontSize: 16, flexShrink: 0 }} />Estimate unavailable
  </Typography>;
  return <Typography component="span" {...props} sx={sx}>{formatUSD(amount)}{suffix}</Typography>;
}
