import { Box, Divider, Link, Stack, Typography } from "@mui/material";
import type { EstimatedRateFrequency } from "../../config/clients/types";
import EstimatedRate from "./EstimatedRate";
import { getDisplayedPremium } from "../../app/useCoverageState";

export type ProductCostBreakdownItem = {
  label: string;
  amount: number;
};

type ProductEstimatedCostBreakdownProps = {
  premiumCost: number;
  riderItems: ProductCostBreakdownItem[];
  policyFee?: ProductCostBreakdownItem;
  rateFrequency: EstimatedRateFrequency;
  helpPhone?: { phone: string; phoneDisplay: string };
};

function BreakdownRow({
  label,
  amount,
  rateFrequency,
}: ProductCostBreakdownItem & {
  rateFrequency: EstimatedRateFrequency;
}) {
  return (
    <Stack direction="row" justifyContent="space-between" spacing={2}>
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
      <EstimatedRate amount={getDisplayedPremium(amount, rateFrequency)} variant="body2" fontWeight={600} />
    </Stack>
  );
}

export default function ProductCostBreakdown({
  premiumCost,
  riderItems,
  policyFee,
  rateFrequency,
  helpPhone,
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
        Estimated Cost Breakdown<sup>1</sup>
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
        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
          Total<sup>1</sup>
        </Typography>
        <EstimatedRate amount={getDisplayedPremium(total, rateFrequency)} suffix={rateSuffix} variant="subtitle2" sx={{ fontWeight: 700, color: "primary.main" }} />
      </Stack>
      {helpPhone && <Typography variant="body2" sx={{ mt: 1 }}>Questions? Call <Link href={`tel:${helpPhone.phone}`}>{helpPhone.phoneDisplay}</Link></Typography>}
    </Box>
  );
}
