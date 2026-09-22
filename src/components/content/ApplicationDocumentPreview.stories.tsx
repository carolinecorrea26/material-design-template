import type { Meta, StoryObj } from "@storybook/react-vite";
import { Box } from "@mui/material";
import ApplicationDocumentPreview from "./ApplicationDocumentPreview";
import { generateFormDataUpToPage } from "../../dev/utils/generateFormData";

/**
 * ApplicationDocumentPreview is the Review page's full paginated
 * print-style application readout — heavy formatting/section-building
 * logic (914 lines), tightly coupled to the application's real field/page
 * config, so it's documented as a page-specific pattern rather than a
 * general-purpose component per the Phase 1 audit. Real dummy data comes
 * from the app's own generateFormDataUpToPage() autofill helper (the same
 * one every other stateful story in this instance uses), not hand-typed
 * placeholder values.
 */
const meta = {
  title: "Content/ApplicationDocumentPreview",
  component: ApplicationDocumentPreview,
  parameters: { layout: "padded" },
} satisfies Meta<typeof ApplicationDocumentPreview>;

export default meta;

const values = generateFormDataUpToPage("review");

export const Default: StoryObj = {
  render: () => (
    <Box sx={{ maxWidth: 800 }}>
      <ApplicationDocumentPreview
        values={values}
        signatureName="Jordan Rivera"
        signedDate="2026-09-14"
        currentDate="2026-09-14"
      />
    </Box>
  ),
};

export const HiddenSignature: StoryObj = {
  name: "hideSignature=true",
  render: () => (
    <Box sx={{ maxWidth: 800 }}>
      <ApplicationDocumentPreview
        values={values}
        signatureName="Jordan Rivera"
        signedDate="2026-09-14"
        currentDate="2026-09-14"
        hideSignature
      />
    </Box>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "Used for the advisor-facing edit-review flow, where the e-sign block hasn't happened yet and shouldn't be implied.",
      },
    },
  },
};

export const WithEditButtons: StoryObj = {
  name: "onEditSection (per-section edit buttons)",
  render: () => (
    <Box sx={{ maxWidth: 800 }}>
      <ApplicationDocumentPreview
        values={values}
        signatureName="Jordan Rivera"
        signedDate="2026-09-14"
        currentDate="2026-09-14"
        onEditSection={(pageId) => {
          console.log("Edit section:", pageId);
        }}
      />
    </Box>
  ),
};
