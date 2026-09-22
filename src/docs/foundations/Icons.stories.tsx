import { useMemo, useState } from "react";
import type { Meta } from "@storybook/react-vite";
import { Box, InputAdornment, Stack, TextField, Typography } from "@mui/material";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";

// Navigation & actions
import ArrowBackIosRoundedIcon from "@mui/icons-material/ArrowBackIosRounded";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import ArrowRightAltRoundedIcon from "@mui/icons-material/ArrowRightAltRounded";
import ArrowRightRoundedIcon from "@mui/icons-material/ArrowRightRounded";
import MenuIcon from "@mui/icons-material/Menu";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import LoopRoundedIcon from "@mui/icons-material/LoopRounded";
import AddIcon from "@mui/icons-material/Add";
import AddCircleOutlineRoundedIcon from "@mui/icons-material/AddCircleOutlineRounded";
import CloseIcon from "@mui/icons-material/Close";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import SendRoundedIcon from "@mui/icons-material/SendRounded";
import FileDownloadRoundedIcon from "@mui/icons-material/FileDownloadRounded";
import PrintOutlinedIcon from "@mui/icons-material/PrintOutlined";

// Status & feedback
import CheckIcon from "@mui/icons-material/Check";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import CircleOutlinedIcon from "@mui/icons-material/CircleOutlined";
import RadioButtonCheckedIcon from "@mui/icons-material/RadioButtonChecked";
import HighlightOffRoundedIcon from "@mui/icons-material/HighlightOffRounded";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import ReportRoundedIcon from "@mui/icons-material/ReportRounded";
import TaskAltIcon from "@mui/icons-material/TaskAlt";
import StarsRoundedIcon from "@mui/icons-material/StarsRounded";

// Communication & support
import ChatIcon from "@mui/icons-material/Chat";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import HeadsetMicIcon from "@mui/icons-material/HeadsetMic";
import PhoneIcon from "@mui/icons-material/Phone";
import PhoneOutlinedIcon from "@mui/icons-material/PhoneOutlined";
import SupportAgentRoundedIcon from "@mui/icons-material/SupportAgentRounded";
import DraftsRoundedIcon from "@mui/icons-material/DraftsRounded";
import MailLockRoundedIcon from "@mui/icons-material/MailLockRounded";

// Security & trust
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import VerifiedUserOutlinedIcon from "@mui/icons-material/VerifiedUserOutlined";
import PrivacyTipIcon from "@mui/icons-material/PrivacyTip";
import SupervisorAccountRoundedIcon from "@mui/icons-material/SupervisorAccountRounded";
import AccessibleOutlinedIcon from "@mui/icons-material/AccessibleOutlined";

// Coverage & content
import BusinessOutlinedIcon from "@mui/icons-material/BusinessOutlined";
import CalculateOutlinedIcon from "@mui/icons-material/CalculateOutlined";
import CalculateRoundedIcon from "@mui/icons-material/CalculateRounded";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import CreditCardOffOutlinedIcon from "@mui/icons-material/CreditCardOffOutlined";
import Diversity1RoundedIcon from "@mui/icons-material/Diversity1Rounded";
import EscalatorWarningRoundedIcon from "@mui/icons-material/EscalatorWarningRounded";
import LocalHospitalOutlinedIcon from "@mui/icons-material/LocalHospitalOutlined";
import OfflineBoltIcon from "@mui/icons-material/OfflineBolt";
import PersonalInjuryOutlinedIcon from "@mui/icons-material/PersonalInjuryOutlined";
import PersonRoundedIcon from "@mui/icons-material/PersonRounded";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import ShoppingCartOutlinedIcon from "@mui/icons-material/ShoppingCartOutlined";
import TuneRoundedIcon from "@mui/icons-material/TuneRounded";
import LanguageOutlinedIcon from "@mui/icons-material/LanguageOutlined";
import AccessTimeOutlinedIcon from "@mui/icons-material/AccessTimeOutlined";

import { DocsPage, DocsSection, SourceNote } from "../shared/DocsBlocks";
import { Alert } from "@mui/material";

const meta = {
  title: "Foundations/Icons",
  parameters: { layout: "padded" },
} satisfies Meta;

export default meta;

type IconEntry = { Icon: typeof CheckIcon; label: string; usedIn: string };
type IconGroup = { id: string; title: string; icons: IconEntry[] };

// Manually maintained snapshot of icons actually used in the app, grouped
// by purpose rather than by page, not an exhaustive list of every icon that
// exists in @mui/icons-material.
const iconGroups: IconGroup[] = [
  {
    id: "navigation-icons",
    title: "Navigation & actions",
    icons: [
      { Icon: MenuIcon, label: "Menu", usedIn: "AppHeader" },
      { Icon: ArrowBackIosRoundedIcon, label: "Back", usedIn: "Back navigation" },
      { Icon: ArrowForwardRoundedIcon, label: "Forward", usedIn: "TOC / links" },
      { Icon: ArrowRightAltRoundedIcon, label: "Continue", usedIn: "Primary CTA buttons" },
      { Icon: ArrowRightRoundedIcon, label: "Next", usedIn: "Inline navigation" },
      { Icon: RefreshRoundedIcon, label: "Refresh", usedIn: "Retry actions" },
      { Icon: LoopRoundedIcon, label: "Loop", usedIn: "Retry / resend actions" },
      { Icon: AddIcon, label: "Add", usedIn: "DynamicList" },
      { Icon: AddCircleOutlineRoundedIcon, label: "Add (outline)", usedIn: "DynamicList" },
      { Icon: CloseIcon, label: "Close", usedIn: "Dialogs" },
      { Icon: CloseRoundedIcon, label: "Close (rounded)", usedIn: "Modals, drawers" },
      { Icon: DeleteOutlineIcon, label: "Delete", usedIn: "DynamicListItem" },
      { Icon: DeleteOutlineRoundedIcon, label: "Delete (rounded)", usedIn: "DynamicListItem" },
      { Icon: EditOutlinedIcon, label: "Edit", usedIn: "DynamicListItem" },
      { Icon: SendRoundedIcon, label: "Send", usedIn: "Resume / advisor send" },
      { Icon: FileDownloadRoundedIcon, label: "Download", usedIn: "Receipt" },
      { Icon: PrintOutlinedIcon, label: "Print", usedIn: "Review" },
      { Icon: SearchRoundedIcon, label: "Search", usedIn: "Filter fields" },
    ],
  },
  {
    id: "status-icons",
    title: "Status & feedback",
    icons: [
      { Icon: CheckIcon, label: "Check", usedIn: "Selection states" },
      { Icon: CheckCircleRoundedIcon, label: "Check circle", usedIn: "Success states" },
      { Icon: CheckRoundedIcon, label: "Check (rounded)", usedIn: "Selection states" },
      { Icon: CircleOutlinedIcon, label: "Circle outline", usedIn: "Unselected radio" },
      { Icon: RadioButtonCheckedIcon, label: "Radio checked", usedIn: "Selected radio" },
      { Icon: HighlightOffRoundedIcon, label: "Highlight off", usedIn: "Error / remove states" },
      { Icon: InfoOutlinedIcon, label: "Info", usedIn: "PageAlert info, CoverageCart" },
      { Icon: ReportRoundedIcon, label: "Report", usedIn: "Review page alerts" },
      { Icon: TaskAltIcon, label: "Task complete", usedIn: "CoverageCart" },
      { Icon: StarsRoundedIcon, label: "Featured", usedIn: "FeaturedBadge" },
    ],
  },
  {
    id: "communication-icons",
    title: "Communication & support",
    icons: [
      { Icon: ChatIcon, label: "Chat", usedIn: "AppHeader" },
      { Icon: ChatBubbleOutlineIcon, label: "Chat bubble", usedIn: "ClientHelpBanner" },
      { Icon: EmailOutlinedIcon, label: "Email", usedIn: "AppMenu, AppFooter" },
      { Icon: HeadsetMicIcon, label: "Headset", usedIn: "Receipt support section" },
      { Icon: PhoneIcon, label: "Phone", usedIn: "ClientHelpBanner" },
      { Icon: PhoneOutlinedIcon, label: "Phone (outline)", usedIn: "AppMenu, AppFooter" },
      { Icon: SupportAgentRoundedIcon, label: "Support agent", usedIn: "AdvisorLogin" },
      { Icon: DraftsRoundedIcon, label: "Drafts", usedIn: "MockEmailPreview" },
      { Icon: MailLockRoundedIcon, label: "Secure mail", usedIn: "Resume flow" },
    ],
  },
  {
    id: "trust-icons",
    title: "Security & trust",
    icons: [
      { Icon: LockOutlinedIcon, label: "Lock", usedIn: "SSN field, AdvisorLogin" },
      { Icon: VerifiedUserOutlinedIcon, label: "Verified", usedIn: "Home hero tagline" },
      { Icon: PrivacyTipIcon, label: "Privacy tip", usedIn: "Cart / quote drawers" },
      { Icon: SupervisorAccountRoundedIcon, label: "Spouse section", usedIn: "formSectionTitle" },
      { Icon: AccessibleOutlinedIcon, label: "Disability coverage", usedIn: "coverageCategories (DI)" },
    ],
  },
  {
    id: "coverage-icons",
    title: "Coverage & content",
    icons: [
      { Icon: ShoppingCartIcon, label: "Cart", usedIn: "AppHeader" },
      { Icon: ShoppingCartOutlinedIcon, label: "Cart (outline)", usedIn: "TotalCostSummary, CoverageCart" },
      { Icon: CalculateOutlinedIcon, label: "Calculate", usedIn: "helpContent" },
      { Icon: CalculateRoundedIcon, label: "Calculate (rounded)", usedIn: "Quote calculator" },
      { Icon: CalendarMonthIcon, label: "Calendar", usedIn: "ClientHelpBanner" },
      { Icon: CreditCardOffOutlinedIcon, label: "Card declined", usedIn: "helpContent" },
      { Icon: Diversity1RoundedIcon, label: "Life coverage", usedIn: "coverageCategories (LI)" },
      { Icon: BusinessOutlinedIcon, label: "Business coverage", usedIn: "coverageCategories (BOE)" },
      { Icon: EscalatorWarningRoundedIcon, label: "Child section", usedIn: "formSectionTitle" },
      { Icon: LocalHospitalOutlinedIcon, label: "Health coverage", usedIn: "coverageCategories (Health)" },
      { Icon: OfflineBoltIcon, label: "Quick Decision", usedIn: "QuickDecisionIndicator/Explainer" },
      { Icon: PersonalInjuryOutlinedIcon, label: "Disability/OO coverage", usedIn: "coverageCategories" },
      { Icon: PersonRoundedIcon, label: "Person", usedIn: "Applicant sections" },
      { Icon: TuneRoundedIcon, label: "Tune", usedIn: "helpContent" },
      { Icon: LanguageOutlinedIcon, label: "Language / website", usedIn: "AppMenu, AppFooter" },
      { Icon: AccessTimeOutlinedIcon, label: "Hours", usedIn: "AppMenu, AppFooter" },
    ],
  },
];

export const Icons = () => {
  const [filter, setFilter] = useState("");

  const filteredGroups = useMemo(() => {
    if (!filter) return iconGroups;
    const lc = filter.toLowerCase();
    return iconGroups
      .map((group) => ({
        ...group,
        icons: group.icons.filter((icon) => `${icon.label} ${icon.usedIn}`.toLowerCase().includes(lc)),
      }))
      .filter((group) => group.icons.length > 0);
  }, [filter]);

  return (
    <DocsPage
      eyebrow="Foundations"
      title="Icons"
      intro="Icons currently used across the site, grouped by purpose rather than by page."
      maxWidth={1200}
    >
      <TextField
        size="small"
        placeholder="Filter icons…"
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <SearchRoundedIcon fontSize="small" />
              </InputAdornment>
            ),
          },
        }}
        sx={{ minWidth: 220, maxWidth: 360, mb: 1 }}
      />

      {filteredGroups.map((group) => (
        <DocsSection key={group.id} title={group.title}>
          <Stack direction="row" flexWrap="wrap" gap={1.5}>
            {group.icons.map(({ Icon, label, usedIn }) => (
              <Stack
                key={label}
                spacing={0.5}
                alignItems="center"
                sx={{ width: 128, p: 1.5, border: "1px solid", borderColor: "divider", borderRadius: 3 }}
                title={usedIn}
              >
                <Icon color="primary" />
                <Typography variant="caption" sx={{ textAlign: "center", fontWeight: 600 }}>{label}</Typography>
                <Typography variant="caption" color="text.secondary" sx={{ textAlign: "center", fontSize: "0.65rem" }}>{usedIn}</Typography>
              </Stack>
            ))}
          </Stack>
        </DocsSection>
      ))}

      <DocsSection title="Rounded vs. non-rounded — open question">
        <Alert severity="info" sx={{ maxWidth: 760 }}>
          Rounded variants (e.g. <code>CheckRoundedIcon</code>) are the
          general preference, but 6 non-rounded icons coexist with rounded
          counterparts today (<code>CheckIcon</code>, <code>CloseIcon</code>,{" "}
          <code>AddIcon</code>, <code>PhoneIcon</code>, <code>ChatIcon</code>,{" "}
          <code>ShoppingCartIcon</code>) with no documented rule for when to
          use which. Flagged as an open design question, not presented as a
          settled convention.
        </Alert>
      </DocsSection>

      <Box sx={{ mt: 2 }}>
        <SourceNote>
          Manually maintained snapshot — will drift as icons are added/removed
          elsewhere in the app. Source: the components/pages named in "Used in".
        </SourceNote>
      </Box>
    </DocsPage>
  );
};
