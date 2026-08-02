import { Box, Divider, Stack, Typography } from "@mui/material";
import type { EstimatedRateFrequency } from "../../config/clients/types";
import { formatUSD } from "../../utils/formatUSD";
import { getDisplayedPremium } from "../../app/useCoverageState";

export type ProductEstimatedCostBreakdownItem = {
  label: string;
  amount: number;
};

type ProductEstimatedCostBreakdownProps = {
  premiumCost: number;
  riderItems: ProductEstimatedCostBreakdownItem[];
  policyFee?: ProductEstimatedCostBreakdownItem;
  rateFrequency: EstimatedRateFrequency;
};

function BreakdownRow({
  label,
  amount,
  rateFrequency,
}: ProductEstimatedCostBreakdownItem & {
  rateFrequency: EstimatedRateFrequency;
}) {
  return (
    <Stack direction="row" justifyContent="space-between" spacing={2}>
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="body2" sx={{ fontWeight: 600 }}>
        {formatUSD(getDisplayedPremium(amount, rateFrequency))}
      </Typography>
    </Stack>
  );
}

export default function ProductEstimatedCostBreakdown({
  premiumCost,
  riderItems,
  policyFee,
  rateFrequency,
}: ProductEstimatedCostBreakdownProps) {
  const total =
    premiumCost +
    riderItems.reduce((sum, item) => sum + item.amount, 0) +
    (policyFee?.amount ?? 0);
  const rateSuffix = rateFrequency === "annual" ? "/yr" : "/mo";

  return (
    <Box
      sx={{
        mt: 2,
        pt: 2,
        borderTop: "1px solid",
        borderColor: "divider",
      }}
    >
      <Typography variant="subtitle2" sx={{ mb: 1.25, fontWeight: 700 }}>
        Estimated Cost Breakdown
      </Typography>

      <Stack spacing={0.75}>
        <BreakdownRow
          label="Premium Cost"
          amount={premiumCost}
          rateFrequency={rateFrequency}
        />
        {riderItems.map((item) => (
          <BreakdownRow
            key={item.label}
            label={item.label}
            amount={item.amount}
            rateFrequency={rateFrequency}
          />
        ))}
        {policyFee && (
          <BreakdownRow
            label={policyFee.label}
            amount={policyFee.amount}
            rateFrequency={rateFrequency}
          />
        )}
      </Stack>

      <Divider sx={{ my: 1.25 }} />

      <Stack direction="row" justifyContent="space-between" spacing={2}>
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          Total
        </Typography>
        <Typography
          variant="h6"
          sx={{ fontWeight: 700, color: "primary.main" }}
        >
          {formatUSD(getDisplayedPremium(total, rateFrequency))}
          <Typography
            component="span"
            variant="body2"
            sx={{ ml: 0.4, color: "text.secondary" }}
          >
            {rateSuffix}
          </Typography>
        </Typography>
      </Stack>
    </Box>
  );
}
