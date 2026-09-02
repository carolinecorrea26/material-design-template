import { type ReactNode, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  InputAdornment,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import FieldRenderer from "../components/forms/FieldRenderer";
import DynamicList from "../components/forms/DynamicList";
import AppHeader from "../components/layout/AppHeader";
import AppMenu from "../components/layout/AppMenu";
import { getActiveClient } from "../config/client/getActiveClient";
import { formatUSD } from "../utils/formatUSD";
import DocsSidebarNav from "../components/docs/DocsSidebarNav";
import type { FieldDefinition } from "../config/fields/types";

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

import {
  CARD_RADIUS,
  FIELD_BORDER_COLOR,
  LABEL_COLOR,
  TEXT_PRIMARY,
} from "../app/theme";

// ---------------------------------------------------------------------------
// Reusable UI pieces (kept local — mirrors InformationArchitecture.tsx)
// ---------------------------------------------------------------------------

function SearchField({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <TextField
      size="small"
      placeholder={placeholder ?? "Filter…"}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      slotProps={{
        input: {
          startAdornment: (
            <InputAdornment position="start">
              <SearchRoundedIcon fontSize="small" />
            </InputAdornment>
          ),
        },
      }}
      sx={{ minWidth: 220, maxWidth: 360 }}
    />
  );
}

function ResponsiveTableContainer({ children }: { children: ReactNode }) {
  return (
    <TableContainer
      component={Card}
      variant="outlined"
      sx={{
        overflowX: "auto",
        width: "100%",
        "& td, & th": { fontSize: { xs: "0.75rem", md: "0.8125rem" } },
        "& td": { whiteSpace: "normal" },
        "& th": { whiteSpace: "nowrap", fontWeight: 700 },
      }}
    >
      {children}
    </TableContainer>
  );
}

function SectionAccordion({
  id,
  title,
  description,
  count,
  children,
}: {
  id: string;
  title: string;
  description?: string;
  count?: number;
  children: ReactNode;
}) {
  return (
    <Accordion
      id={id}
      defaultExpanded
      disableGutters
      sx={{
        border: "1px solid",
        borderColor: "divider",
        borderRadius: "24px !important",
        boxShadow: "0 12px 28px rgba(15, 23, 42, 0.06)",
        overflow: "hidden",
        "&:before": { display: "none" },
      }}
    >
      <AccordionSummary
        expandIcon={<ExpandMoreRoundedIcon />}
        sx={{
          px: { xs: 2, md: 3 },
          py: 1,
          backgroundColor: "background.subtle",
          borderBottom: "1px solid",
          borderColor: "divider",
        }}
      >
        <Box>
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography variant="h5" component="h2" sx={{ fontWeight: 800 }}>
              {title}
            </Typography>
            {count != null && <Chip label={count} size="small" />}
          </Stack>
          {description && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {description}
            </Typography>
          )}
        </Box>
      </AccordionSummary>
      <AccordionDetails sx={{ p: { xs: 2, md: 3 } }}>
        {children}
      </AccordionDetails>
    </Accordion>
  );
}

// ---------------------------------------------------------------------------
// Color data (source: src/app/theme.ts)
// ---------------------------------------------------------------------------

type Swatch = { label: string; value: string; note?: string };

const semanticSwatches: Swatch[] = [
  { label: "primary.main", value: "#0668ff", note: "Default brand color" },
  { label: "primary.light", value: "#5c94ff" },
  { label: "primary.dark", value: "#034cba" },
  { label: "success.main", value: "#009465", note: "Reserved — confirmations only" },
  { label: "error.main", value: "#ed0a0a", note: "Reserved — errors only" },
];

const neutralSwatches: Swatch[] = [
  { label: "text.primary", value: TEXT_PRIMARY },
  { label: "text.secondary", value: "#49596f" },
  { label: "text.tertiary", value: "#5b7090" },
  { label: "text.disabled", value: "#99a4b5" },
  { label: "background.default", value: "#f9fafc" },
  { label: "background.paper", value: "#ffffff" },
  { label: "background.subtle", value: "#f5f8fd" },
  { label: "background.surface", value: "#eef1f4" },
  { label: "background.iconBadge", value: "#c9d6eb" },
  { label: "divider", value: "rgba(52, 59, 72, 0.12)" },
];

const containerSwatches: Swatch[] = [
  { label: "panel.main", value: "#f5f8fd", note: "border rgba(0,22,57,0.08)" },
  { label: "notice.main", value: "#fffcf0", note: "border #e9e3cb" },
  { label: "support.main", value: "#ecf3ff", note: "border #c8d5ea" },
];

type ThemePreset = {
  name: string;
  main: string;
  light: string;
  dark: string;
};

const themePresets: ThemePreset[] = [
  { name: "default", main: "#0668ff", light: "#5c94ff", dark: "#034cba" },
  { name: "teal", main: "#0882a1", light: "#39a4bf", dark: "#005b70" },
  { name: "purple", main: "#3f51b5", light: "#7986cb", dark: "#283593" },
  { name: "dark-blue", main: "#045aab", light: "#316493", dark: "#002f5b" },
];

function ColorSwatch({ swatch }: { swatch: Swatch }) {
  const isCssColor =
    swatch.value.startsWith("#") || swatch.value.startsWith("rgba");
  return (
    <Stack spacing={0.75} sx={{ width: 176 }}>
      <Box
        sx={{
          height: 64,
          borderRadius: 3,
          border: "1px solid rgba(0,0,0,0.08)",
          backgroundColor: isCssColor ? swatch.value : "transparent",
          backgroundImage:
            swatch.value === "transparent"
              ? "repeating-conic-gradient(#e5e9ef 0% 25%, #ffffff 0% 50%) 50% / 12px 12px"
              : undefined,
        }}
      />
      <Typography variant="caption" sx={{ fontWeight: 700 }}>
        {swatch.label}
      </Typography>
      <Typography variant="caption" color="text.secondary">
        {swatch.value}
      </Typography>
      {swatch.note && (
        <Typography variant="caption" color="text.secondary" sx={{ fontStyle: "italic" }}>
          {swatch.note}
        </Typography>
      )}
    </Stack>
  );
}

// ---------------------------------------------------------------------------
// Component override data (source: src/app/theme.ts `components`)
// ---------------------------------------------------------------------------

type OverrideRow = { component: string; summary: string };

const overrideRows: OverrideRow[] = [
  {
    component: "MuiButton",
    summary:
      "Pill shape (radius 9999), bold label, no uppercase transform, subtle lift + shadow on hover for contained buttons.",
  },
  {
    component: "MuiOutlinedInput",
    summary: `Radius ${CARD_RADIUS}, border color ${FIELD_BORDER_COLOR}, darkens on hover, primary on focus, error on validation failure. Entered text renders bold; placeholder stays regular weight.`,
  },
  {
    component: "MuiInputLabel / MuiFormLabel",
    summary: `Label color ${LABEL_COLOR}, medium weight, switches to primary when focused. Required asterisk renders in error color.`,
  },
  {
    component: "MuiToggleButton / MuiToggleButtonGroup",
    summary: `Used as the radio/segmented-control shell. Radius ${CARD_RADIUS}, bordered, selected state tints background with primary at 10% opacity and bumps label weight to 900.`,
  },
  {
    component: "MuiFormControlLabel",
    summary:
      "Full-width row, label bolds to weight 900 automatically when its checkbox/radio is checked.",
  },
  {
    component: "MuiCard / MuiAlert",
    summary: `Shared radius ${CARD_RADIUS} across cards and alerts for one consistent surface language.`,
  },
  {
    component: "MuiChip",
    summary: "Icon spacing tightened; default filled variant uses surface gray background.",
  },
  {
    component: "MuiLink",
    summary: "Primary color, bold weight, underline only on hover (not by default).",
  },
  {
    component: "MuiStepIcon / MuiStepConnector",
    summary: "Neutral gray (#8fa1b9) by default; active and completed steps switch to primary.",
  },
  {
    component: "MuiAppBar",
    summary: "White background, bottom divider border, no drop shadow — flat header style.",
  },
];

// ---------------------------------------------------------------------------
// Icon inventory (grouped by purpose, not by page)
// ---------------------------------------------------------------------------

type IconEntry = { Icon: typeof CheckIcon; label: string; usedIn: string };
type IconGroup = { id: string; title: string; icons: IconEntry[] };

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
      { Icon: InfoOutlinedIcon, label: "Info", usedIn: "AlertBanner info, CartDrawer" },
      { Icon: ReportRoundedIcon, label: "Report", usedIn: "Review page alerts" },
      { Icon: TaskAltIcon, label: "Task complete", usedIn: "CartDrawer" },
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
      { Icon: ShoppingCartOutlinedIcon, label: "Cart (outline)", usedIn: "TotalCostCart, CartDrawer" },
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

// ---------------------------------------------------------------------------
// Alert usage matrix (source: severity usage across pages/components)
// ---------------------------------------------------------------------------

type AlertRule = {
  severity: "error" | "warning" | "info" | "success";
  meaning: string;
  usedFor: string;
};

const alertRules: AlertRule[] = [
  {
    severity: "error",
    meaning: "Blocking problem the user must resolve before continuing.",
    usedFor:
      "Expired/invalid resume links, failed code validation, membership/eligibility failures, quote errors.",
  },
  {
    severity: "warning",
    meaning: "Caution — not blocking, but needs the user's attention.",
    usedFor:
      "Incomplete required info (Membership, Payment), cart total not yet confirmed, Review consent reminders.",
  },
  {
    severity: "info",
    meaning: "Contextual, non-urgent detail or status update.",
    usedFor:
      "TPA integration notices, autosave confirmations, applicant-section notes, Receipt next steps.",
  },
  {
    severity: "success",
    meaning: "Confirms a completed action.",
    usedFor:
      "Eligibility confirmation, advisor send confirmation, progress-saved snackbar.",
  },
];

const toc = [
  { id: "colors-section", label: "Colors" },
  { id: "typography-section", label: "Typography" },
  { id: "overrides-section", label: "Component overrides" },
  { id: "field-examples-section", label: "Form field examples" },
  { id: "field-errors-section", label: "Field errors" },
  { id: "components-section", label: "Component examples" },
  { id: "icons-section", label: "Icons" },
  { id: "branding-section", label: "Branding guidelines" },
  { id: "rules-section", label: "Design rules" },
];

// ---------------------------------------------------------------------------
// FieldRenderer examples — one instance of every input pattern FieldRenderer
// supports (source: src/components/forms/FieldRenderer.tsx)
// ---------------------------------------------------------------------------

type FieldExample = {
  title: string;
  note: string;
  field: FieldDefinition;
};

const fieldExamples: FieldExample[] = [
  {
    title: "Text — floating label",
    note: "Default label mode: label floats inside the input border.",
    field: {
      id: "ds-text-floating",
      label: "First name",
      inputType: "text",
      required: true,
      autoComplete: "given-name",
    },
  },
  {
    title: "Text — standard label",
    note: "labelVariant: 'standard' — label sits above the input as a FormLabel.",
    field: {
      id: "ds-text-standard",
      label: "Last name",
      inputType: "text",
      labelVariant: "standard",
      required: true,
      autoComplete: "family-name",
    },
  },
  {
    title: "Email",
    note: "format: 'email' — validated on blur, mobile email keyboard.",
    field: {
      id: "ds-email",
      label: "Email address",
      inputType: "text",
      format: "email",
      required: true,
      autoComplete: "email",
    },
  },
  {
    title: "Phone — with type dropdown",
    note: "format: 'phone' — auto-formats digits, inline Mobile/Home/Business selector as an end adornment.",
    field: {
      id: "ds-phone",
      label: "Phone number",
      inputType: "text",
      format: "phone",
      required: true,
    },
  },
  {
    title: "Phone — plain",
    note: "showPhoneTypeSelector: false — formatted phone input with no type selector.",
    field: {
      id: "ds-phone-plain",
      label: "Business phone",
      inputType: "text",
      format: "phone",
      showPhoneTypeSelector: false,
    },
  },
  {
    title: "Number",
    note: "inputType: 'number' — digit-only, numeric mobile keyboard.",
    field: {
      id: "ds-number",
      label: "Years self-employed",
      inputType: "number",
    },
  },
  {
    title: "Currency",
    note: "format: 'currency' — auto-formats to $ with thousands separators.",
    field: {
      id: "ds-currency",
      label: "Average monthly income",
      inputType: "text",
      format: "currency",
    },
  },
  {
    title: "Percent",
    note: "format: 'percent' — strips to a max of 3 digits, no symbol.",
    field: {
      id: "ds-percent",
      label: "Ownership share",
      inputType: "text",
      format: "percent",
    },
  },
  {
    title: "SSN — input with icon",
    note: "format: 'ssn' — lock icon start adornment; digits mask to bullets, last digit shown briefly.",
    field: {
      id: "ds-ssn",
      label: "Social Security Number",
      inputType: "text",
      format: "ssn",
      required: true,
    },
  },
  {
    title: "Date",
    note: "inputType: 'date' — MM/DD/YYYY display, stored as YYYY-MM-DD.",
    field: {
      id: "ds-date",
      label: "Date of birth",
      inputType: "date",
      required: true,
      autoComplete: "bday",
    },
  },
  {
    title: "Month / year",
    note: "format: 'month-year' — MM/YYYY display, e.g. coverage start date.",
    field: {
      id: "ds-month-year",
      label: "Coverage start",
      inputType: "text",
      format: "month-year",
    },
  },
  {
    title: "Textarea",
    note: "multiline: true — free-form multi-line text.",
    field: {
      id: "ds-textarea",
      label: "Additional details",
      inputType: "text",
      multiline: true,
      minRows: 3,
      placeholder: "Add any additional context here…",
    },
  },
  {
    title: "Dropdown — floating label",
    note: "inputType: 'dropdown' — MUI Select with a floating InputLabel.",
    field: {
      id: "ds-dropdown-floating",
      label: "State",
      inputType: "dropdown",
      required: true,
      options: [
        { value: "ny", label: "New York" },
        { value: "ca", label: "California" },
        { value: "tx", label: "Texas" },
      ],
    },
  },
  {
    title: "Dropdown — standard label",
    note: "inputType: 'dropdown' + labelVariant: 'standard' — external FormLabel.",
    field: {
      id: "ds-dropdown-standard",
      label: "Business type",
      inputType: "dropdown",
      labelVariant: "standard",
      options: [
        { value: "sole-prop", label: "Sole Proprietor" },
        { value: "corp", label: "Professional Corporation" },
        { value: "llc", label: "LLC" },
      ],
    },
  },
  {
    title: "Searchable select",
    note: "inputType: 'searchable-select' — MUI Autocomplete with type-ahead filtering.",
    field: {
      id: "ds-searchable-select",
      label: "AVMA graduation year",
      inputType: "searchable-select",
      options: Array.from({ length: 6 }, (_, i) => {
        const year = String(2024 - i);
        return { value: year, label: year };
      }),
    },
  },
  {
    title: "Multi-select",
    note: "inputType: 'multi-select' — Select multiple, checkboxes inside a dropdown.",
    field: {
      id: "ds-multi-select",
      label: "Tobacco products used",
      inputType: "multi-select",
      options: [
        { value: "cigarettes", label: "Cigarettes" },
        { value: "cigars", label: "Cigars" },
        { value: "vaping", label: "Vaping / e-cigarettes" },
        { value: "chewing", label: "Chewing tobacco" },
      ],
    },
  },
  {
    title: "Radio",
    note: "inputType: 'radio' — full-width SelectionGroup rows, one tap target per option.",
    field: {
      id: "ds-radio",
      label: "Do you use tobacco products?",
      inputType: "radio",
      required: true,
      options: [
        { value: "yes", label: "Yes" },
        { value: "no", label: "No" },
      ],
    },
  },
  {
    title: "Checkbox — single",
    note: "inputType: 'checkbox' — single boolean toggle in a SelectionGroup row.",
    field: {
      id: "ds-checkbox",
      label: "I authorize this bank account for premium payments.",
      inputType: "checkbox",
      required: true,
    },
  },
  {
    title: "Checkbox group",
    note: "inputType: 'checkbox-group' — multiple independent checkboxes, stores an array.",
    field: {
      id: "ds-checkbox-group",
      label: "Which of these apply to you?",
      inputType: "checkbox-group",
      options: [
        { value: "self-employed", label: "Self-employed" },
        { value: "work-from-home", label: "Work from home" },
        { value: "travel-often", label: "Travel outside the US often" },
      ],
    },
  },
];

type DemoFormValues = Record<string, string | boolean | string[]>;

function FieldExampleCard({ example }: { example: FieldExample }) {
  const {
    control,
    formState: { errors },
  } = useForm<DemoFormValues>({
    defaultValues: {
      [example.field.id]: example.field.inputType === "checkbox"
        ? false
        : example.field.inputType === "checkbox-group" ||
            example.field.inputType === "multi-select"
          ? []
          : "",
      "phone-type": "mobile",
    },
  });

  return (
    <Card
      variant="outlined"
      sx={{ borderRadius: 3, height: "100%", display: "flex", flexDirection: "column" }}
    >
      <CardContent sx={{ flex: 1 }}>
        <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
          {example.title}
        </Typography>
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ display: "block", mb: 2 }}
        >
          {example.note}
        </Typography>
        <FieldRenderer field={example.field} control={control} errors={errors} />
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Field error examples — same FieldRenderer, forced into its error state via
// react-hook-form validation (real validation rules from FieldRenderer).
// ---------------------------------------------------------------------------

const errorFieldExamples: FieldExample[] = [
  {
    title: "Text — error",
    note: "Required field left empty: red outline + \"{Field label} is required.\" helper text.",
    field: {
      id: "ds-error-text",
      label: "Email address",
      inputType: "text",
      format: "email",
      required: true,
    },
  },
  {
    title: "Dropdown — error",
    note: "Required select with no value chosen.",
    field: {
      id: "ds-error-dropdown",
      label: "State",
      inputType: "dropdown",
      required: true,
      options: [
        { value: "ny", label: "New York" },
        { value: "ca", label: "California" },
      ],
    },
  },
  {
    title: "Radio — error",
    note: "Required radio group with no option selected.",
    field: {
      id: "ds-error-radio",
      label: "Do you use tobacco products?",
      inputType: "radio",
      required: true,
      options: [
        { value: "yes", label: "Yes" },
        { value: "no", label: "No" },
      ],
    },
  },
  {
    title: "Checkbox — error",
    note: "Required consent checkbox left unchecked.",
    field: {
      id: "ds-error-checkbox",
      label: "I authorize this bank account for premium payments.",
      inputType: "checkbox",
      required: true,
    },
  },
];

function FieldErrorExampleCard({ example }: { example: FieldExample }) {
  const {
    control,
    trigger,
    formState: { errors },
  } = useForm<DemoFormValues>({
    mode: "onChange",
    defaultValues: {
      [example.field.id]:
        example.field.inputType === "checkbox" ? false : "",
    },
  });

  // Force validation to run once on mount so the error state renders
  // immediately, without requiring the visitor to interact with the field.
  useEffect(() => {
    void trigger();
  }, [trigger]);

  return (
    <Card
      variant="outlined"
      sx={{
        borderRadius: 3,
        height: "100%",
        display: "flex",
        flexDirection: "column",
        borderColor: "error.main",
      }}
    >
      <CardContent sx={{ flex: 1 }}>
        <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
          {example.title}
        </Typography>
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ display: "block", mb: 2 }}
        >
          {example.note}
        </Typography>
        <FieldRenderer field={example.field} control={control} errors={errors} />
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Beneficiary "Add" modal example (DynamicList — self-contained, no shared
// app state; safe to mount live).
// ---------------------------------------------------------------------------

const beneficiaryModalFields: FieldDefinition[] = [
  { id: "ds-ben-first-name", label: "First Name", inputType: "text", required: true },
  { id: "ds-ben-last-name", label: "Last Name", inputType: "text", required: true },
  {
    id: "ds-ben-relationship",
    label: "Relationship",
    inputType: "dropdown",
    required: true,
    options: [
      { value: "spouse", label: "Spouse" },
      { value: "child", label: "Child" },
      { value: "parent", label: "Parent" },
      { value: "sibling", label: "Sibling" },
      { value: "other", label: "Other" },
    ],
  },
  { id: "ds-ben-share", label: "% Share", inputType: "number", required: true },
];

const beneficiaryFieldToKey = {
  "ds-ben-first-name": "firstName",
  "ds-ben-last-name": "lastName",
  "ds-ben-relationship": "relationship",
  "ds-ben-share": "share",
} as const;

function BeneficiaryModalExample() {
  const { control } = useForm<Record<string, any>>({
    defaultValues: {
      beneficiaries: [
        {
          firstName: "Jordan",
          lastName: "Lee",
          relationship: "spouse",
          share: "100",
        },
      ],
    },
  });

  return (
    <DynamicList
      control={control}
      name="beneficiaries"
      label="Beneficiary"
      mapping={{ fields: beneficiaryModalFields, fieldToKey: beneficiaryFieldToKey }}
      getItemLabel={(item) => `${item.firstName} ${item.lastName}`}
      renderItem={(item) => (
        <Typography variant="body2">
          <strong>
            {item.firstName} {item.lastName}
          </strong>{" "}
          — {item.relationship}, {item.share}% share
        </Typography>
      )}
    />
  );
}

// ---------------------------------------------------------------------------
// Coverage cart — static visual reconstruction (not wired to live app state).
// The real ECart/CartDrawer reads shared session data; a static mock keeps
// this reference deterministic and avoids touching a real in-progress
// application's saved selections.
// ---------------------------------------------------------------------------

const mockCartLines = [
  { product: "Term Life Insurance", applicant: "Primary Applicant", amount: "$250,000", monthly: 24.5 },
  { product: "Term Life Insurance", applicant: "Spouse", amount: "$100,000", monthly: 11.75 },
  { product: "Accidental Death & Dismemberment", applicant: "Primary Applicant", amount: "$50,000", monthly: 4.25 },
];

function CoverageCartPreview() {
  const total = mockCartLines.reduce((sum, line) => sum + line.monthly, 0);

  return (
    <Card variant="outlined" sx={{ borderRadius: CARD_RADIUS, maxWidth: 380 }}>
      <CardContent>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1.5 }}>
          <Typography variant="subtitle2">Your Coverage</Typography>
          <Chip label="Estimate" size="small" variant="outlined" />
        </Stack>
        <Stack spacing={1.5} divider={<Divider />}>
          {mockCartLines.map((line, i) => (
            <Stack key={i} spacing={0.25}>
              <Typography variant="body2" sx={{ fontWeight: 700 }}>
                {line.product}
              </Typography>
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="caption" color="text.secondary">
                  {line.applicant} · {line.amount}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {formatUSD(line.monthly)}/mo
                </Typography>
              </Stack>
            </Stack>
          ))}
        </Stack>
        <Divider sx={{ my: 1.5 }} />
        <Stack direction="row" justifyContent="space-between" alignItems="baseline">
          <Typography variant="subtitle2">Estimated total</Typography>
          <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
            {formatUSD(total)}/mo
          </Typography>
        </Stack>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// App menu preview — real AppMenu, opened via a local toggle so it's safe
// and deterministic to demo (no shared state, closes like the real drawer).
// ---------------------------------------------------------------------------

function AppMenuPreview() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="outlined" startIcon={<MenuIcon />} onClick={() => setOpen(true)}>
        Open menu
      </Button>
      <AppMenu open={open} onClose={() => setOpen(false)} client={getActiveClient()} />
    </>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function DesignSystem() {
  const [iconFilter, setIconFilter] = useState("");

  const filteredIconGroups = useMemo(() => {
    if (!iconFilter) return iconGroups;
    const lc = iconFilter.toLowerCase();
    return iconGroups
      .map((group) => ({
        ...group,
        icons: group.icons.filter((icon) =>
          `${icon.label} ${icon.usedIn}`.toLowerCase().includes(lc),
        ),
      }))
      .filter((group) => group.icons.length > 0);
  }, [iconFilter]);

  const totalIconCount = filteredIconGroups.reduce(
    (sum, g) => sum + g.icons.length,
    0,
  );

  return (
    <Box
      sx={{
        py: { xs: 3, md: 5 },
        px: { xs: 2, md: 4 },
        width: "100vw",
        maxWidth: "100vw",
        ml: "calc(-50vw + 50%)",
        boxSizing: "border-box",
      }}
    >
      <Stack spacing={3}>
        <Box>
          <Chip
            label="Internal prototype documentation"
            color="error"
            variant="outlined"
            sx={{ mb: 2 }}
          />
          <Typography variant="h3" component="h1" sx={{ fontWeight: 800 }}>
            Design System
          </Typography>
          <Typography
            variant="body1"
            color="text.secondary"
            sx={{ mt: 1, maxWidth: 920 }}
          >
            Visual reference for the application's theme, iconography, brand
            guidelines, and layout conventions. Derived from{" "}
            <code>src/app/theme.ts</code> and the active implementation
            (demo client).
          </Typography>
        </Box>

        <Card
          id="table-of-contents"
          sx={{
            border: "1px solid",
            borderColor: "divider",
            borderRadius: "24px",
            boxShadow: "0 12px 28px rgba(15, 23, 42, 0.06)",
            display: { xs: "block", md: "none" },
          }}
        >
          <CardContent>
            <Typography variant="h6" component="h2" sx={{ fontWeight: 800 }}>
              Table of contents
            </Typography>
            <Stack
              direction="row"
              useFlexGap
              flexWrap="wrap"
              spacing={1}
              sx={{ mt: 2 }}
            >
              {toc.map((item) => (
                <Chip
                  key={item.id}
                  component="a"
                  href={`#${item.id}`}
                  clickable
                  label={item.label}
                  variant="outlined"
                />
              ))}
            </Stack>
          </CardContent>
        </Card>

        <Box sx={{ display: "flex", gap: 4, alignItems: "flex-start" }}>
          <DocsSidebarNav items={toc} />
          <Stack spacing={3} sx={{ flex: 1, minWidth: 0 }}>
        {/* 1. COLORS */}
        <SectionAccordion
          id="colors-section"
          title="Colors"
          description="Palette tokens defined in the theme. Success and error are reserved semantic colors — see Branding guidelines below."
        >
          <Stack spacing={3}>
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1.5 }}>
                Brand & semantic
              </Typography>
              <Stack direction="row" flexWrap="wrap" gap={2}>
                {semanticSwatches.map((s) => (
                  <ColorSwatch key={s.label} swatch={s} />
                ))}
              </Stack>
            </Box>
            <Divider />
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1.5 }}>
                Text & surface neutrals
              </Typography>
              <Stack direction="row" flexWrap="wrap" gap={2}>
                {neutralSwatches.map((s) => (
                  <ColorSwatch key={s.label} swatch={s} />
                ))}
              </Stack>
            </Box>
            <Divider />
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1.5 }}>
                Contextual containers
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ mb: 1.5, display: "block" }}>
                panel = neutral info panels · notice = caution/notice boxes · support = help/support callouts
              </Typography>
              <Stack direction="row" flexWrap="wrap" gap={2}>
                {containerSwatches.map((s) => (
                  <ColorSwatch key={s.label} swatch={s} />
                ))}
              </Stack>
            </Box>
            <Divider />
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1.5 }}>
                Client brand presets (ThemeColorId)
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ mb: 1.5, display: "block" }}>
                Each client selects one preset, which replaces{" "}
                <code>primary.main / light / dark</code> only — all other
                tokens above stay fixed.
              </Typography>
              <ResponsiveTableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Preset</TableCell>
                      <TableCell>Main</TableCell>
                      <TableCell>Light</TableCell>
                      <TableCell>Dark</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {themePresets.map((preset) => (
                      <TableRow key={preset.name}>
                        <TableCell sx={{ fontWeight: 700 }}>{preset.name}</TableCell>
                        {[preset.main, preset.light, preset.dark].map((hex) => (
                          <TableCell key={hex}>
                            <Stack direction="row" spacing={1} alignItems="center">
                              <Box
                                sx={{
                                  width: 20,
                                  height: 20,
                                  borderRadius: 1,
                                  backgroundColor: hex,
                                  border: "1px solid rgba(0,0,0,0.08)",
                                  flexShrink: 0,
                                }}
                              />
                              <Typography variant="caption">{hex}</Typography>
                            </Stack>
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ResponsiveTableContainer>
            </Box>
          </Stack>
        </SectionAccordion>

        {/* 2. TYPOGRAPHY */}
        <SectionAccordion
          id="typography-section"
          title="Typography"
          description="Font family: Inter, system-ui, -apple-system, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif."
        >
          <Stack spacing={2.5}>
            {(["h1", "h2", "h3", "h4", "h5", "h6"] as const).map((variant) => (
              <Stack
                key={variant}
                direction={{ xs: "column", sm: "row" }}
                spacing={2}
                alignItems={{ sm: "baseline" }}
              >
                <Chip label={variant} size="small" sx={{ width: 48 }} />
                <Typography variant={variant} sx={{ fontWeight: 800 }}>
                  The quick brown fox
                </Typography>
              </Stack>
            ))}
            <Divider />
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems={{ sm: "baseline" }}>
              <Chip label="body1" size="small" sx={{ width: 130 }} />
              <Typography variant="body1">
                Body copy uses text.primary at regular weight.
              </Typography>
            </Stack>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems={{ sm: "baseline" }}>
              <Chip label="subtitle2" size="small" sx={{ width: 130 }} />
              <Typography variant="subtitle2">Semibold subtitle text</Typography>
            </Stack>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems={{ sm: "baseline" }}>
              <Chip label="overline" size="small" sx={{ width: 130 }} />
              <Typography variant="overline">Overline label</Typography>
            </Stack>
            <Divider />
            <Typography variant="subtitle2">Custom form variants</Typography>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems={{ sm: "baseline" }}>
              <Chip label="formPageTitle" size="small" sx={{ width: 130 }} />
              <Typography variant="formPageTitle">Application page title</Typography>
            </Stack>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems={{ sm: "baseline" }}>
              <Chip label="formSectionLabel" size="small" sx={{ width: 130 }} />
              <Typography variant="formSectionLabel">Section label</Typography>
            </Stack>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems={{ sm: "baseline" }}>
              <Chip label="formBackLink" size="small" sx={{ width: 130 }} />
              <Typography variant="formBackLink">Back link text</Typography>
            </Stack>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems={{ sm: "baseline" }}>
              <Chip label="productNameLabel" size="small" sx={{ width: 130 }} />
              <Typography variant="productNameLabel">Term Life Insurance</Typography>
            </Stack>
          </Stack>
        </SectionAccordion>

        {/* 3. COMPONENT OVERRIDES */}
        <SectionAccordion
          id="overrides-section"
          title="Component overrides"
          description={`Shared surface radius: ${CARD_RADIUS}. Base spacing unit: 8px.`}
          count={overrideRows.length}
        >
          <ResponsiveTableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>MUI component</TableCell>
                  <TableCell>Override summary</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {overrideRows.map((row) => (
                  <TableRow key={row.component}>
                    <TableCell sx={{ fontWeight: 700, whiteSpace: "nowrap" }}>
                      {row.component}
                    </TableCell>
                    <TableCell sx={{ whiteSpace: "normal" }}>{row.summary}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ResponsiveTableContainer>
        </SectionAccordion>

        {/* 4. FORM FIELD EXAMPLES */}
        <SectionAccordion
          id="field-examples-section"
          title="Form field examples"
          description="One live instance of every input pattern FieldRenderer supports, rendered with the real component."
          count={fieldExamples.length}
        >
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                sm: "repeat(2, minmax(0, 1fr))",
                lg: "repeat(3, minmax(0, 1fr))",
              },
              gap: 2,
            }}
          >
            {fieldExamples.map((example) => (
              <FieldExampleCard key={example.field.id} example={example} />
            ))}
          </Box>
        </SectionAccordion>

        {/* 5. FIELD ERRORS */}
        <SectionAccordion
          id="field-errors-section"
          title="Field errors"
          description="Real FieldRenderer validation errors, forced to render immediately for reference. Page-level error banners are covered under Design rules → Alerts."
          count={errorFieldExamples.length}
        >
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                sm: "repeat(2, minmax(0, 1fr))",
                lg: "repeat(4, minmax(0, 1fr))",
              },
              gap: 2,
            }}
          >
            {errorFieldExamples.map((example) => (
              <FieldErrorExampleCard key={example.field.id} example={example} />
            ))}
          </Box>
        </SectionAccordion>

        {/* 6. COMPONENT EXAMPLES */}
        <SectionAccordion
          id="components-section"
          title="Component examples"
          description="Live instances of larger site components, mounted directly from source. Interactive elements are safe to click — none of these write to the app's real saved-application state."
        >
          <Stack spacing={3}>
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                App header
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ mb: 1.5, display: "block" }}>
                Rendered in the <code>homepage</code> chrome variant here to
                keep this reference read-only (the <code>applicationForm</code>{" "}
                variant additionally shows a progress bar and cart icon in-app).
              </Typography>
              <Box sx={{ border: "1px solid", borderColor: "divider", borderRadius: 3, overflow: "hidden" }}>
                <AppHeader client={getActiveClient()} variant="homepage" />
              </Box>
            </Box>

            <Divider />

            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                App menu
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ mb: 1.5, display: "block" }}>
                Full-screen slide-in drawer with coverage tools and support info.
              </Typography>
              <AppMenuPreview />
            </Box>

            <Divider />

            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Coverage cart
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ mb: 1.5, display: "block" }}>
                Static visual reconstruction with mock data — the real
                component reads the shared application session, which isn't
                deterministic for a documentation page.
              </Typography>
              <CoverageCartPreview />
            </Box>

            <Divider />

            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Beneficiary "Add" modal
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ mb: 1.5, display: "block" }}>
                DynamicList: repeating field-array pattern with a modal-based
                add/edit form. Click "Add Beneficiary" to see the dialog.
              </Typography>
              <Box sx={{ maxWidth: 480 }}>
                <BeneficiaryModalExample />
              </Box>
            </Box>
          </Stack>
        </SectionAccordion>

        {/* 7. ICONS */}
        <SectionAccordion
          id="icons-section"
          title="Icons"
          description="All icons currently used across the site, grouped by purpose."
          count={totalIconCount}
        >
          <Stack spacing={3}>
            <SearchField
              value={iconFilter}
              onChange={setIconFilter}
              placeholder="Filter icons…"
            />
            {filteredIconGroups.map((group) => (
              <Box key={group.id}>
                <Typography variant="subtitle2" sx={{ mb: 1.5 }}>
                  {group.title}
                </Typography>
                <Stack direction="row" flexWrap="wrap" gap={1.5}>
                  {group.icons.map(({ Icon, label, usedIn }) => (
                    <Stack
                      key={label}
                      spacing={0.5}
                      alignItems="center"
                      sx={{
                        width: 128,
                        p: 1.5,
                        border: "1px solid",
                        borderColor: "divider",
                        borderRadius: 3,
                      }}
                      title={usedIn}
                    >
                      <Icon color="primary" />
                      <Typography
                        variant="caption"
                        sx={{ textAlign: "center", fontWeight: 600 }}
                      >
                        {label}
                      </Typography>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ textAlign: "center", fontSize: "0.65rem" }}
                      >
                        {usedIn}
                      </Typography>
                    </Stack>
                  ))}
                </Stack>
              </Box>
            ))}
          </Stack>
        </SectionAccordion>

        {/* 8. BRANDING GUIDELINES */}
        <SectionAccordion
          id="branding-section"
          title="Branding guidelines"
          description="Logo, hero image, and hero copy constraints applied per client."
        >
          <Stack spacing={2}>
            <Card variant="outlined" sx={{ borderRadius: CARD_RADIUS }}>
              <CardContent>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Logo
                </Typography>
                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  spacing={2}
                  alignItems={{ sm: "center" }}
                >
                  <Box
                    sx={{
                      maxWidth: { xs: 200, sm: 250 },
                      maxHeight: 35,
                      width: "100%",
                      height: 35,
                      borderRadius: 1,
                      border: "1px dashed",
                      borderColor: "divider",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: "background.subtle",
                      flexShrink: 0,
                    }}
                  >
                    <Typography variant="caption" color="text.secondary">
                      logo area
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    Max <strong>200px</strong> wide on mobile, <strong>250px</strong> on
                    desktop (sm+); max <strong>35px</strong> tall. Rendered at natural
                    aspect ratio (width/height: auto). Source: AppHeader.
                  </Typography>
                </Stack>
              </CardContent>
            </Card>

            <Card variant="outlined" sx={{ borderRadius: CARD_RADIUS }}>
              <CardContent>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Hero image
                </Typography>
                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  spacing={2}
                  alignItems={{ sm: "center" }}
                >
                  <Box
                    sx={{
                      maxWidth: 250,
                      width: "100%",
                      aspectRatio: "500 / 320",
                      borderRadius: 4,
                      border: "1px dashed",
                      borderColor: "divider",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: "background.subtle",
                      flexShrink: 0,
                    }}
                  >
                    <Typography variant="caption" color="text.secondary">
                      hero.png
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    Max <strong>500px</strong> wide, height auto, rounded corners
                    (radius 4 = 32px). Used only in the <code>hero-image</code> and{" "}
                    <code>welcome-back</code> Home page variants. Source path pattern:{" "}
                    <code>/client/&#123;clientId&#125;/hero.png</code>.
                  </Typography>
                </Stack>
              </CardContent>
            </Card>

            <Card variant="outlined" sx={{ borderRadius: CARD_RADIUS }}>
              <CardContent>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Hero text length
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  No hard character limit is enforced in code today. To keep
                  the hero title readable at the <code>h1</code> size (2.25rem,
                  weight 800) inside its ~800px column, keep titles to roughly{" "}
                  <strong>60 characters or fewer</strong> and descriptions to
                  roughly <strong>160 characters or fewer</strong> so both wrap
                  to no more than two lines on desktop.
                </Typography>
                <Chip
                  label="⚠️ Open question — recommend adding validation in client content config"
                  size="small"
                  color="warning"
                  variant="outlined"
                  sx={{ mt: 1.5 }}
                />
              </CardContent>
            </Card>

            <Card variant="outlined" sx={{ borderRadius: CARD_RADIUS }}>
              <CardContent>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Reserved theme colors
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                  Client brand presets (see Colors above) are all blue/teal/
                  purple tones. Do not use red, orange, green, or yellow as a
                  client's primary brand color — those hues carry fixed meaning
                  elsewhere in the UI and a matching brand color would make
                  errors, success confirmations, or notices harder to
                  distinguish.
                </Typography>
                <Stack direction="row" flexWrap="wrap" gap={1.5}>
                  {[
                    { label: "Red — error only", value: "#ed0a0a" },
                    { label: "Green — success only", value: "#009465" },
                    { label: "Yellow — notice only", value: "#fffcf0" },
                    { label: "Orange — avoid entirely", value: "#f57c00" },
                  ].map((c) => (
                    <Stack key={c.label} direction="row" spacing={1} alignItems="center">
                      <Box
                        sx={{
                          width: 16,
                          height: 16,
                          borderRadius: "50%",
                          backgroundColor: c.value,
                          border: "1px solid rgba(0,0,0,0.15)",
                        }}
                      />
                      <Typography variant="caption" color="text.secondary">
                        {c.label}
                      </Typography>
                    </Stack>
                  ))}
                </Stack>
              </CardContent>
            </Card>
          </Stack>
        </SectionAccordion>

        {/* 9. DESIGN RULES */}
        <SectionAccordion
          id="rules-section"
          title="Design rules"
          description="Layout and interaction conventions applied across form pages."
        >
          <Stack spacing={3}>
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Field stacking
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Fields stack vertically by default (single column). Fields are
                only placed side by side when they are directly related —
                e.g. street + apartment, or city + state + ZIP.
              </Typography>
              <Stack spacing={1.5}>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Unrelated fields — vertical
                  </Typography>
                  <Stack spacing={1} sx={{ mt: 0.5 }}>
                    {["Email", "Phone number"].map((label) => (
                      <Box
                        key={label}
                        sx={{
                          border: `1px solid ${FIELD_BORDER_COLOR}`,
                          borderRadius: CARD_RADIUS,
                          px: 2,
                          py: 1.5,
                        }}
                      >
                        <Typography variant="caption" color="text.secondary">
                          {label}
                        </Typography>
                      </Box>
                    ))}
                  </Stack>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Related fields — grid (e.g. Contact page address block)
                  </Typography>
                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: { xs: "1fr", sm: "2fr 1fr" },
                      gap: 1,
                      mt: 0.5,
                    }}
                  >
                    <Box sx={{ border: `1px solid ${FIELD_BORDER_COLOR}`, borderRadius: CARD_RADIUS, px: 2, py: 1.5 }}>
                      <Typography variant="caption" color="text.secondary">Street address</Typography>
                    </Box>
                    <Box sx={{ border: `1px solid ${FIELD_BORDER_COLOR}`, borderRadius: CARD_RADIUS, px: 2, py: 1.5 }}>
                      <Typography variant="caption" color="text.secondary">Apt / Unit</Typography>
                    </Box>
                  </Box>
                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: { xs: "1fr", sm: "2fr 1fr 1fr" },
                      gap: 1,
                      mt: 1,
                    }}
                  >
                    <Box sx={{ border: `1px solid ${FIELD_BORDER_COLOR}`, borderRadius: CARD_RADIUS, px: 2, py: 1.5 }}>
                      <Typography variant="caption" color="text.secondary">City</Typography>
                    </Box>
                    <Box sx={{ border: `1px solid ${FIELD_BORDER_COLOR}`, borderRadius: CARD_RADIUS, px: 2, py: 1.5 }}>
                      <Typography variant="caption" color="text.secondary">State</Typography>
                    </Box>
                    <Box sx={{ border: `1px solid ${FIELD_BORDER_COLOR}`, borderRadius: CARD_RADIUS, px: 2, py: 1.5 }}>
                      <Typography variant="caption" color="text.secondary">ZIP</Typography>
                    </Box>
                  </Box>
                </Box>
              </Stack>
            </Box>

            <Divider />

            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Form template layout
              </Typography>
              <Typography variant="body2" color="text.secondary">
                template=multi (default) uses the app's real, viewport-based
                responsive breakpoints — no width overrides. template=single
                keeps the same routes/pages/navigation but forces the whole
                app into its narrow-screen layout via createAppTheme's
                forceMobileLayout option, which pins the md/lg/xl
                breakpoints to an unreachable width regardless of the actual
                browser width (see Site Rules → Form Template). sm (600px)
                is deliberately left at its default so sm-level
                padding/spacing — e.g. FormRoutePage's FormShell, which uses{" "}
                <code>px: {"{"} xs: 2, sm: "48px" {"}"}</code> — still gets
                that breathing room on a real desktop-width browser instead
                of staying pinned to its tightest xs padding. In single
                template, Home's hero (tagline, title, description; no hero
                image) is capped at 700px and centered, while the form
                column beneath it (filled by the real Membership page) is
                capped at a wider 800px — the hero is intentionally
                narrower than the form.
              </Typography>
            </Box>

            <Divider />

            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Alerts
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                One <code>AlertBanner</code> / <code>PageAlert</code> component
                covers all four severities. Severity communicates meaning —
                don't substitute one for another for visual variety.
              </Typography>
              <Stack spacing={1.5}>
                {alertRules.map((rule) => (
                  <Alert key={rule.severity} severity={rule.severity} sx={{ alignItems: "flex-start" }}>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                      {rule.meaning}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Used for: {rule.usedFor}
                    </Typography>
                  </Alert>
                ))}
              </Stack>
            </Box>

            <Divider />

            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Shape & motion
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Buttons are always pill-shaped (radius 9999) with a small
                upward lift on hover. Cards, alerts, inputs, and toggle
                buttons share the same {CARD_RADIUS} surface radius so
                stacked surfaces read as one consistent system.
              </Typography>
            </Box>
          </Stack>
        </SectionAccordion>
          </Stack>
        </Box>
      </Stack>
    </Box>
  );
}
