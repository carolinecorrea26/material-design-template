import { type ReactNode, useMemo, useState } from "react";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
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
  { id: "icons-section", label: "Icons" },
  { id: "branding-section", label: "Branding guidelines" },
  { id: "rules-section", label: "Design rules" },
];

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

        {/* 4. ICONS */}
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

        {/* 5. BRANDING GUIDELINES */}
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

        {/* 6. DESIGN RULES */}
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
  );
}
