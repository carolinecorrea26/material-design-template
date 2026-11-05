import type { Meta, StoryObj } from "@storybook/react-vite";
import DynamicList from "./DynamicList";
import Example from '../../../.storybook/CompanyRecordExample';

const meta = {
  id: "forms-dynamiclist",
  title: "Components/Forms/Repeated records/Record list",
  component: DynamicList,
  parameters: {
    standalone: true,
    layout: "padded",
    review: {
      scope: "shared-component",
      focus: "Shared repeated-record editor using the actual Profile disability-company fields. The Beneficiary page owns a separate editor and allocation workflow.",
      references: [{ label: "Actual beneficiary editor", storyId: "pages-beneficiary-whole-page--empty" }],
    },
    docs: { description: { component: "Shared add/edit/remove dialog, demonstrated with the Profile disability-company mapping. Beneficiary uses its own page editor; review that in Pages → Beneficiary → Whole page." } },
  },
} satisfies Meta<typeof DynamicList>;
export default meta;


export const Empty: StoryObj = { render: () => <Example /> };
export const Populated: StoryObj = { render: () => <Example populated /> };
export const MaxItemsReached: StoryObj = {
  name: "Maximum items reached",
  render: () => <Example populated maxItems={2} />,
};
// Retain the existing story ID for links; the shared dialog stacks its fields.
export const WithGridFields: StoryObj = {
  name: "Legacy field ordering — stacked layout",
  render: () => <Example legacyOrdering />,
};
