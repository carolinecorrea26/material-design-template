import { Box, Divider, Stack, Typography } from "@mui/material";
import type { EstimatedRateFrequency } from "../../config/clients/types";
import EstimatedRate from "./EstimatedRate";
import { getDisplayedPremium } from "../../utils/coverageDisplay";
import { requirementText } from '../../domain/requirementContent';
import { formatUSD } from '../../utils/formatUSD';

export type ProductCostBreakdownItem = {
  key?: string;
  label: string;
  amount: number;
};

type ProductEstimatedCostBreakdownProps = {
  premiumCost: number;
  riderItems: ProductCostBreakdownItem[];
  policyFee?: ProductCostBreakdownItem;
  rateFrequency: EstimatedRateFrequency;
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
      {amount < 0 ? <Typography sx={{ fontSize: '1rem', color: 'text.primary' }}>{formatUSD(getDisplayedPremium(amount, rateFrequency))}</Typography>
        : <EstimatedRate amount={getDisplayedPremium(amount, rateFrequency)} appearance="product" />}
    </Stack>
  );
}

export default function ProductCostBreakdown({
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
        {requirementText('coverage.cost-breakdown.title')}<sup>1</sup>
      </Typography>

      <Stack spacing={0.75}>
        <BreakdownRow
          label={requirementText('coverage.cost-breakdown.premium')}
          amount={premiumCost}
          rateFrequency={rateFrequency}
        />
        {riderItems.map((item) => (
          <BreakdownRow
            key={item.key ?? item.label}
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
          {requirementText('coverage.cost-breakdown.total')}<sup>1</sup>
        </Typography>
        <EstimatedRate amount={getDisplayedPremium(total, rateFrequency)} suffix={rateSuffix} appearance="product" />
      </Stack>
    </Box>
  );
}
