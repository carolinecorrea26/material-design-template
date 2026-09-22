import type { Meta, StoryObj } from "@storybook/react-vite";
import { Box } from "@mui/material";
import LegalDocList from "./LegalDocList";
import { getContent } from "../../content";

/**
 * LegalDocList is a generic renderer for structured legal-document bodies
 * (heading/paragraph/list/address/note section types) — used by AppFooter
 * for both the Terms of Use and Privacy Notice modals. Every story below
 * renders the real client content, not placeholder text, since the whole
 * point of documenting a content renderer is to see real section-type
 * variety.
 */
const meta = {
  title: "Content/LegalDocList",
  component: LegalDocList,
  parameters: { layout: "padded" },
} satisfies Meta<typeof LegalDocList>;

export default meta;

const footerContent = getContent().footer;

export const TermsOfUse: StoryObj = {
  render: () => (
    <Box sx={{ maxWidth: 640 }}>
      <LegalDocList doc={footerContent.termsOfUseContent} />
    </Box>
  ),
};

export const PrivacyNotice: StoryObj = {
  render: () => (
    <Box sx={{ maxWidth: 640 }}>
      <LegalDocList doc={footerContent.privacyNoticeContent} />
    </Box>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "Demonstrates the address section type (component=\"address\", semantic HTML) alongside headings/paragraphs/lists, if the real Privacy Notice content includes one.",
      },
    },
  },
};
