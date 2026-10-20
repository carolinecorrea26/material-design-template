import type { Meta, StoryObj } from "@storybook/react-vite";
import { Stack, Typography } from "@mui/material";
import EstimatedRate from "./EstimatedRate";
import TotalCostSummary from "./TotalCostSummary";

const meta = { title: "Components/Estimated Rate", component: EstimatedRate } satisfies Meta<typeof EstimatedRate>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Available: Story = { args: { amount: 262.5, suffix: "/mo" } };
export const Unavailable: Story = { args: { amount: NaN, suffix: "/mo" } };
export const CostSummaries: Story = {
  args: { amount: NaN },
  render: () => <Stack spacing={3} sx={{ width: "min(560px, 90vw)" }}>
    <TotalCostSummary title="Estimated monthly cost" items={[{ id: "self", name: "Self", amount: 262.5 }]} total={262.5} />
    <TotalCostSummary title="Estimated monthly cost" items={[{ id: "self", name: "Self", amount: NaN }]} total={NaN} />
    <Stack direction="row" spacing={1} alignItems="center"><Typography variant="body2" color="text.secondary">Est. cost:</Typography><EstimatedRate amount={NaN} suffix="/mo" /></Stack>
  </Stack>,
};
