import type { Meta, StoryObj } from "@storybook/react-vite";
import { Stack, Typography } from "@mui/material";
import EstimatedRate from "./EstimatedRate";
import TotalCostSummary from "./TotalCostSummary";

const meta = {
  id: "components-estimated-rate",
  title: "Components/Coverage and pricing/Estimated rate",
  component: EstimatedRate,
  args: { appearance: "product", label: <>Est. cost<sup>1</sup>:</> },
  decorators: [(Story) => <Stack direction="row" justifyContent="flex-end" alignItems="center" sx={{ width: "min(360px, 90vw)", minHeight: 21 }}><Story /></Stack>],
  parameters: { standalone: true, docs: { description: { component: "Shared rate display: available price, loading, technical failure, rate-table link, missing information, separately provided pricing and hidden-by-configuration states." } } },
} satisfies Meta<typeof EstimatedRate>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Available: Story = { args: { amount: 262.5, suffix: "/mo" } };
export const Calculating: Story = { args: { amount: 262.5, suffix: '/mo', isCalculating: true }, parameters: { docs: { description: { story: 'Only the amount is replaced. The hidden price text reserves its exact dimensions and baseline, and the spinner inherits the price font size.' } } } };
export const Unavailable: Story = { name: "Unavailable (technical failure)", args: { display: { status: "unavailable", reason: "technical" } } };
export const CostSummaries: Story = {
  args: { amount: NaN },
  render: () => <Stack spacing={3} sx={{ width: "min(560px, 90vw)" }}>
    <TotalCostSummary title="Estimated monthly cost" items={[{ id: "self", name: "Self", amount: 262.5 }]} total={262.5} />
    <TotalCostSummary title="Estimated monthly cost" items={[{ id: "self", name: "Self", amount: NaN, display: { status: "unavailable", reason: "technical" } }]} total={NaN} />
    <Stack direction="row" spacing={1} alignItems="center"><Typography variant="body2" color="text.secondary">Est. cost:</Typography><EstimatedRate display={{ status: "unavailable", reason: "technical" }} /></Stack>
  </Stack>,
};

export const RateTable: Story = { args: { display: { status: 'reference-table', table: { version: 1, kind: 'html-table', title: 'Example monthly rates', columns: ['Coverage', 'Monthly cost'], rows: [['$100,000', '$10.00'], ['$200,000', '$20.00']], notes: ['Synthetic demonstration rates.'] } } } };
export const NeedsInformation: Story = { args: { display: { status: 'needs-information' } } };
export const ProvidedSeparately: Story = { args: { display: { status: 'provided-separately' } } };
export const HiddenByConfiguration: Story = { args: { display: { status: 'hidden' } } };
