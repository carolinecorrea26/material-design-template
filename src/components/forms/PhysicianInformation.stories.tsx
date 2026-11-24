import { useForm } from "react-hook-form";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Box } from "@mui/material";
import PhysicianInformation from "./PhysicianInformation";
import ComponentFixture from '../../../.storybook/fixtures/ComponentFixture';
import type { FieldDefinition } from '../../domain/fields';

const meta = {
  id: "coverage-commerce-physicianinformation",
  title: "Components/Pages/Profile/Sections/Physician information",
  component: PhysicianInformation,
  parameters: { standalone: true,
    review: { scope: 'shared-component', focus: 'Review physician name/address rows and local field interactions once. Member and spouse use separate supplied definitions.', references: [{ label: 'Review Profile composition', storyId: 'pages-profile-whole-page--member-and-spouse' }] },
    docs: { description: { component: "Shared physician name, phone and facility fields for member and spouse Profile sections. The caller supplies independent field definitions and explicit address mappings; AddressFields owns the shared address layout." } }, layout: "padded" },
} satisfies Meta<typeof PhysicianInformation>;

export default meta;

const nameRow = new Set(["physician-first-name", "physician-last-name"]);
const addressFieldIds = {
  'street-address': 'medical-facility-street-address', 'apt-suite': 'medical-facility-apt-suite',
  city: 'medical-city', state: 'medical-state', 'zip-code': 'medical-zip-code',
};

function PhysicianInformationDemo({ fields, fieldIds }: { fields: FieldDefinition[]; fieldIds: string[] }) {
  const { control, formState } = useForm({ mode: "onChange" });
  return (
    <Box sx={{ maxWidth: 640 }}>
      <PhysicianInformation
        fieldIds={fieldIds}
        allFields={fields}
        control={control}
        errors={formState.errors}
        nameRow={nameRow}
        addressFieldIds={addressFieldIds}
      />
    </Box>
  );
}

export const Default: StoryObj = {
  render: () => <ComponentFixture>{fixture => <PhysicianInformationDemo fields={fixture.fields} fieldIds={fixture.site.configuration.pages.find(page => page.key === 'profile')!.sections.find(section => section.definition.value.id === 'profilePersonalSelfPhysician')!.definition.value.fieldIds} />}</ComponentFixture>,
  parameters: { standalone: true,
    docs: {
      description: {
        story:
          "The real physician field set from Profile.tsx (self applicant): name row (2-col), phone, facility name, street row (2-col), then a city/state/zip row (3-col) — all responsive to 1 column below sm.",
      },
    },
  },
};
