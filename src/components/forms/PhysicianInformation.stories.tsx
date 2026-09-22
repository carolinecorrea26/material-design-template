import { useForm } from "react-hook-form";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Box } from "@mui/material";
import PhysicianInformation from "./PhysicianInformation";
import { getPageSections } from "../../config/pageSections";
import { getClientPageFields } from "../../config/clientFields/getClientPageFields";

/**
 * PhysicianInformation is a pure layout helper — it arranges physician
 * name/street/city-state-zip fields into responsive rows and delegates
 * every field to FieldRenderer, with no validation or state of its own.
 * Real Profile-page config (getPageSections("profile")'s
 * profilePersonalSelfPhysician section) drives which fields render, so this
 * story uses that config directly rather than a hand-built field list.
 */
const meta = {
  title: "Coverage & Commerce/PhysicianInformation",
  component: PhysicianInformation,
  parameters: { layout: "padded" },
} satisfies Meta<typeof PhysicianInformation>;

export default meta;

const section = getPageSections("profile").find(
  (s) => s.id === "profilePersonalSelfPhysician",
)!;
const allFields = getClientPageFields("profile", {});

const nameRow = new Set(["physician-first-name", "physician-last-name"]);
const streetRow = new Set([
  "medical-facility-street-address",
  "medical-facility-apt-suite",
]);
const cityStateZipRow = new Set(["medical-city", "medical-state", "medical-zip-code"]);

function PhysicianInformationDemo() {
  const { control, formState } = useForm({ mode: "onChange" });
  return (
    <Box sx={{ maxWidth: 640 }}>
      <PhysicianInformation
        fieldIds={section.fieldIds}
        allFields={allFields}
        control={control}
        errors={formState.errors}
        nameRow={nameRow}
        streetRow={streetRow}
        cityStateZipRow={cityStateZipRow}
      />
    </Box>
  );
}

export const Default: StoryObj = {
  render: () => <PhysicianInformationDemo />,
  parameters: {
    docs: {
      description: {
        story:
          "The real physician field set from Profile.tsx (self applicant): name row (2-col), phone, facility name, street row (2-col), then a city/state/zip row (3-col) — all responsive to 1 column below sm.",
      },
    },
  },
};
