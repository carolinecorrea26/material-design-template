import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import ArrowRightAltRoundedIcon from "@mui/icons-material/ArrowRightAltRounded";
import { keyframes } from "@mui/material/styles";
import VerifiedUserOutlinedIcon from "@mui/icons-material/VerifiedUserOutlined";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  FormControl,
  FormHelperText,
  InputLabel,
  Link,
  MenuItem,
  Select,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import { Link as RouterLink, useSearchParams } from "react-router-dom";
import QuoteCalculator from "../components/forms/QuoteCalculator";
import type { QuoteCalculatorInitialValues } from "../components/forms/QuoteCalculator";
import AppDrawer from "../components/ui/AppDrawer";
import QuickDecisionIndicator from "../components/ui/QuickDecisionIndicator";
import QuickDecisionDrawerContent from "../components/content/QuickDecisionExplainer";
import QuickDecisionInfoBox from "../components/content/QuickDecisionInfoBox";
import { ApplicationReviewDrawerContent } from "../content/helpContent";
import { getContent, resolveTemplate } from "../content";
import { getActiveClient } from "../config/client/getActiveClient";
import { getActiveClientCoverages } from "../config/client/getActiveClientCoverages";
import {
  coverageCategories,
  getCoverageCategorySectionLabel,
} from "../config/coverageCategories";
import type {
  CoverageApplicantId,
  CoverageCategoryId,
  CoverageDefinition,
} from "../config/coverages/types";
import { getPagePath } from "../config/pages";
import { formatUSD } from "../utils/formatUSD";
import type { HomePageVariant } from "../config/clients/types";
import {
  deriveStateProvinceFromZipOrPostalCode,
  formatZipOrPostalCode,
} from "../utils/zipToStateProvince";
import {
  parseStoredDate,
  formatDateForStorage,
  formatDateDisplay,
} from "../utils/dateFormatting";
import { fieldCatalog } from "../config/fields";
import { calculateAge } from "../utils/calculateAge";
import { SURFACE_SX } from "../config/constants";

type DrawerId = "application-review" | "quick-decision" | null;
const PAGE_MAX_WIDTH = 1200;

const fadeInUp = keyframes`
  from {
    opacity: 0;
    transform: translateY(24px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const FADE_IN_SECTION_SX = (delay: number) => ({
  opacity: 0,
  animation: `${fadeInUp} 0.7s ease-out ${delay}s forwards`,
});

const content = getContent();

function formatCoverageRange(coverage: CoverageDefinition) {
  if (coverage.minAmount == null && coverage.maxAmount == null) {
    return "Coverage amount varies by selection.";
  }

  if (coverage.minAmount != null && coverage.maxAmount != null) {
    return `${formatUSD(coverage.minAmount, 0)} - ${formatUSD(
      coverage.maxAmount,
      0,
    )}`;
  }

  if (coverage.minAmount != null) {
    return `Starting at ${formatUSD(coverage.minAmount, 0)}`;
  }

  return `Up to ${formatUSD(coverage.maxAmount ?? 0, 0)}`;
}

function getApplicantLabel(applicant: CoverageApplicantId): string {
  return content.shared.applicantLabels[applicant];
}

// ── Home page quote card ───────────────────────────────────────────────────
// Collects DOB/ZIP/State, then opens the QuoteCalculator drawer pre-filled.
type HomeQuoteSectionProps = {
  onOpenQuote: (eligibility: QuoteCalculatorInitialValues) => void;
};

function HomeQuoteSection({ onOpenQuote }: HomeQuoteSectionProps) {
  const stateOptions = useMemo(
    () => fieldCatalog["state-province"].options ?? [],
    [],
  );
  const [birthday, setBirthday] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [state, setState] = useState("");
  const [attempted, setAttempted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [dobFocused, setDobFocused] = useState(false);
  const [ageError, setAgeError] = useState("");

  useEffect(() => {
    const derived = deriveStateProvinceFromZipOrPostalCode(
      zipCode,
      stateOptions,
    );
    if (derived && derived !== state) setState(derived);
  }, [zipCode, stateOptions, state]);

  const validationErrors = useMemo(() => {
    const errors: Record<string, string> = {};
    if (!birthday) errors.birthday = "Date of birth is required.";
    else if (!/^\d{4}-\d{2}-\d{2}$/.test(birthday))
      errors.birthday = "Enter a complete date (MM/DD/YYYY).";
    if (!zipCode) errors.zipCode = "ZIP / postal code is required.";
    if (!state) errors.state = "State is required.";
    return errors;
  }, [birthday, zipCode, state]);

  function handleGetEstimate() {
    setAttempted(true);
    setAgeError("");
    if (Object.keys(validationErrors).length > 0) return;

    const age = calculateAge(birthday);
    if (age !== null && age >= 80) {
      setAgeError(
        "We're sorry, but coverage is not available for applicants age 80 or older.",
      );
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      onOpenQuote({ birthday, zipCode, state });
    }, 600);
  }

  return (
    <Box
      sx={{
        ...SURFACE_SX,
        width: "100%",
        borderColor: "rgba(7, 104, 255, 0.14)",
        background:
          "linear-gradient(135deg, #f4f8ff 0%, #ffffff 52%, #f7fbff 100%)",
      }}
    >
      <Stack spacing={2.25} sx={{ p: { xs: 2.5, sm: 3 } }}>
        <Box>
          <Typography variant="h2" paddingBottom={0.5}>
            Get an instant quote
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Find a premium and amount that&apos;s a good fit for you.
          </Typography>
        </Box>

        <Stack spacing={2.5}>
          <TextField
            label="Date of Birth"
            fullWidth
            required
            placeholder="MM/DD/YYYY"
            value={parseStoredDate(birthday)}
            onChange={(event) => {
              const formatted = formatDateDisplay(event.target.value);
              const digits = formatted.replace(/\D/g, "");
              if (digits.length === 8) {
                setBirthday(formatDateForStorage(formatted));
              } else {
                setBirthday(formatted);
              }
            }}
            onFocus={() => setDobFocused(true)}
            onBlur={() => setDobFocused(false)}
            inputProps={{ inputMode: "numeric" }}
            InputLabelProps={{ shrink: dobFocused || !!birthday }}
            error={attempted && !!validationErrors.birthday}
            helperText={
              attempted && validationErrors.birthday
                ? validationErrors.birthday
                : undefined
            }
          />
          <TextField
            label="ZIP / Postal Code"
            fullWidth
            required
            value={zipCode}
            onChange={(event) =>
              setZipCode(formatZipOrPostalCode(event.target.value))
            }
            inputProps={{ inputMode: "text", maxLength: 7 }}
            error={attempted && !!validationErrors.zipCode}
            helperText={
              attempted ? validationErrors.zipCode || undefined : undefined
            }
          />
          <FormControl
            fullWidth
            required
            error={attempted && !!validationErrors.state}
          >
            <InputLabel id="home-estimate-state-label">State</InputLabel>
            <Select
              labelId="home-estimate-state-label"
              label="State"
              value={state}
              onChange={(event) => setState(event.target.value)}
            >
              {stateOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
            {attempted && validationErrors.state && (
              <FormHelperText>{validationErrors.state}</FormHelperText>
            )}
          </FormControl>
        </Stack>

        <Stack spacing={1}>
          <Button
            variant="outlined"
            size="large"
            sx={{ py: "16px" }}
            onClick={handleGetEstimate}
            disabled={isLoading}
          >
            {isLoading ? (
              <CircularProgress size={20} color="inherit" />
            ) : (
              "Get an instant quote"
            )}
          </Button>
          {ageError && (
            <Alert severity="error" sx={{ mt: 0.5 }}>
              {ageError}
            </Alert>
          )}
        </Stack>
      </Stack>
    </Box>
  );
}

function InlineDrawerLink({
  children,
  onClick,
}: {
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <Typography
      component="span"
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onClick();
        }
      }}
      sx={{
        display: "inline",
        color: "primary.main",
        font: "inherit",
        lineHeight: "inherit",
        textDecoration: "underline",
        textUnderlineOffset: "0.12em",
        cursor: "pointer",
      }}
    >
      {children}
    </Typography>
  );
}

function QuickDecisionMark() {
  return (
    <>
      QuickDecision
      <Box component="sup" sx={{ fontSize: "0.6em", lineHeight: 1 }}>
        SM
      </Box>
    </>
  );
}

function HowApplyingWorksSection({
  onOpenApplicationReview,
  onOpenQuickDecision,
}: {
  onOpenApplicationReview: () => void;
  onOpenQuickDecision: () => void;
}) {
  const applyingSteps = content.home.applyingSteps;
  return (
    <Stack spacing={4}>
      <Stack spacing={1} sx={{ textAlign: { xs: "center", md: "left" } }}>
        <Typography variant="h2">
          {content.home.howApplyingWorks.title}
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {content.home.howApplyingWorks.description}
        </Typography>
      </Stack>

      <Stack spacing={6}>
        {applyingSteps.map((step, index) => (
          <Box key={index} sx={{ padding: { xs: "0 1.5rem", md: "0 2rem" } }}>
            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={{ xs: 3, sm: 5 }}
              alignItems={{ xs: "flex-start", sm: "center" }}
            >
              <Box
                sx={{ flexShrink: 0, alignSelf: { xs: "center", sm: "auto" } }}
              >
                <Box
                  component="img"
                  src={step.imageSrc}
                  alt={step.imageAlt}
                  sx={{
                    display: "block",
                    width: { xs: "120px", sm: "100px", md: "120px" },
                    height: { xs: "120px", sm: "100px", md: "120px" },
                    objectFit: "contain",
                  }}
                />
              </Box>

              <Box sx={{ width: "100%" }}>
                <Stack spacing={1}>
                  <Stack
                    direction="row"
                    spacing={1.5}
                    alignItems="center"
                    justifyContent={{ xs: "center", sm: "flex-start" }}
                  >
                    <Box
                      sx={{
                        width: 28,
                        height: 28,
                        borderRadius: "50%",
                        bgcolor: "primary.main",
                        color: "#fff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "0.85rem",
                        fontWeight: 700,
                        flexShrink: 0,
                      }}
                    >
                      {index + 1}
                    </Box>
                    <Typography variant="h4">{step.title}</Typography>
                  </Stack>

                  <Typography
                    variant="body1"
                    color="text.secondary"
                    sx={{ textAlign: { xs: "justify", sm: "left" } }}
                  >
                    {step.body}
                    {index === 1 && (
                      <>
                        {" "}
                        <InlineDrawerLink onClick={onOpenApplicationReview}>
                          Learn more about the review process.
                        </InlineDrawerLink>
                      </>
                    )}
                    {index === 2 && (
                      <>
                        {" "}
                        When{" "}
                        <InlineDrawerLink onClick={onOpenQuickDecision}>
                          <QuickDecisionMark />
                        </InlineDrawerLink>{" "}
                        is available, you may get a faster decision with no
                        medical exam.
                      </>
                    )}
                  </Typography>
                </Stack>
              </Box>
            </Stack>
          </Box>
        ))}
      </Stack>
    </Stack>
  );
}

const VALID_VARIANTS: HomePageVariant[] = [
  "default",
  "hero-image",
  "welcome-back",
];

export default function Home() {
  const client = getActiveClient();
  const [searchParams] = useSearchParams();
  const urlVariant = searchParams.get("variant") as HomePageVariant | null;
  const variant: HomePageVariant =
    urlVariant && VALID_VARIANTS.includes(urlVariant)
      ? urlVariant
      : (client.features?.homePageVariant ?? "default");
  const showQuoteTool = variant === "default";
  const showHeroImage = variant === "hero-image" || variant === "welcome-back";
  const showHowApplyingWorks = variant !== "welcome-back";
  const showCoverageOptions = variant !== "welcome-back";
  const coverages = useMemo(() => getActiveClientCoverages(), []);
  const [activeDrawer, setActiveDrawer] = useState<DrawerId>(null);
  const [quoteDrawerOpen, setQuoteDrawerOpen] = useState(false);
  const [quoteEligibility, setQuoteEligibility] =
    useState<QuoteCalculatorInitialValues | null>(null);
  const [activeCoverageCategory, setActiveCoverageCategory] =
    useState<CoverageCategoryId>("LI");
  const howApplyingWorksRef = useRef<HTMLDivElement>(null);

  const coverageGroups = useMemo(
    () =>
      coverageCategories
        .map((category) => ({
          category,
          products: coverages
            .filter((coverage) => coverage.categoryId === category.id)
            .slice()
            .sort((a, b) => {
              if (a.featured && !b.featured) return -1;
              if (!a.featured && b.featured) return 1;
              return a.name.localeCompare(b.name);
            }),
        }))
        .filter((group) => group.products.length > 0),
    [coverages],
  );

  useEffect(() => {
    if (coverageGroups.length === 0) return;

    const nextDefault = coverageGroups.some(
      (group) => group.category.id === "LI",
    )
      ? "LI"
      : coverageGroups[0].category.id;

    const hasActive = coverageGroups.some(
      (group) => group.category.id === activeCoverageCategory,
    );

    if (!hasActive) {
      setActiveCoverageCategory(nextDefault);
    }
  }, [activeCoverageCategory, coverageGroups]);

  const activeCoverageGroup =
    coverageGroups.find(
      (group) => group.category.id === activeCoverageCategory,
    ) ?? coverageGroups[0];

  const DRAWER_CONFIG: Record<Exclude<DrawerId, null>, { title: ReactNode }> = {
    "application-review": {
      title: "About the application review process",
    },
    "quick-decision": {
      title: (
        <>
          What is <QuickDecisionMark />?
        </>
      ),
    },
  };

  const drawerTitle =
    activeDrawer != null ? DRAWER_CONFIG[activeDrawer].title : "";

  return (
    <Box sx={{ width: "100%", flex: 1 }}>
      <Stack
        spacing={{ xs: 12, md: 10 }}
        sx={{
          width: "100%",
          maxWidth: PAGE_MAX_WIDTH,
          mx: "auto",
          px: { xs: 2, sm: 3, md: 4 },
          pt: { xs: 1.5, md: 3 },
          pb: { xs: 4, md: 6 },
        }}
      >
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns:
              showQuoteTool || showHeroImage
                ? { xs: "1fr", md: "minmax(0, 450px) minmax(0, 500px)" }
                : "1fr",
            gap: { xs: 2.5, md: 3.5 },
            alignItems: "start",
            ...FADE_IN_SECTION_SX(0),
          }}
        >
          <Stack
            spacing={2}
            sx={{
              alignSelf: "flex-start",
              maxWidth: showQuoteTool || showHeroImage ? 800 : 760,
              justifySelf:
                showQuoteTool || showHeroImage
                  ? { xs: "center", md: "stretch" }
                  : "center",
              textAlign:
                showQuoteTool || showHeroImage
                  ? "left"
                  : { xs: "left", md: "center" },
              alignItems:
                showQuoteTool || showHeroImage
                  ? "flex-start"
                  : { xs: "flex-start", md: "center" },
              px: { xs: 1.5, sm: 3, md: 0 },
              pb: 2,
            }}
          >
            <Chip
              icon={
                <VerifiedUserOutlinedIcon
                  sx={{ fontSize: "1rem !important" }}
                />
              }
              label={content.home.hero.tagline}
              variant="outlined"
              sx={{
                borderColor: "divider",
                bgcolor: "background.default",
                fontSize: "0.75rem",
                height: "auto",
                py: 0.5,
                borderRadius: "999px",
                "& .MuiChip-label": { px: 1.5, py: 0.25 },
                "& .MuiChip-icon": { color: "primary.main" },
              }}
            />

            <Stack spacing={1.5}>
              <Typography
                variant="h1"
                // sx={{
                //   fontSize: {
                //     xs: "2.5rem",
                //     sm: "2.5rem",
                //     md: "3rem",
                //     lg: "3rem",
                //   },
                //   lineHeight: 1.08,
                //   fontWeight: 700,
                // }}
              >
                {variant === "welcome-back"
                  ? content.home.hero.welcomeBackTitle
                  : content.home.hero.title}
              </Typography>
              <Typography variant="body1" color="text.secondary">
                {variant === "welcome-back"
                  ? content.home.hero.welcomeBackDescription
                  : resolveTemplate(content.home.hero.description)}
              </Typography>
            </Stack>

            <Stack
              direction="row"
              spacing={1.5}
              alignItems="center"
              useFlexGap
              sx={{ flexWrap: "wrap" }}
              mb={1.5}
            >
              <Button
                component={RouterLink}
                to={getPagePath(
                  variant === "welcome-back" ? "resume" : "membership",
                )}
                variant="contained"
                size="large"
                endIcon={<ArrowRightAltRoundedIcon />}
                sx={{
                  width: { xs: "100%", sm: "auto" },
                  px: 3.5,
                  py: "16px",
                  fontWeight: 700,
                  whiteSpace: "nowrap",
                  flexShrink: 0,
                }}
              >
                {variant === "welcome-back"
                  ? "Continue Application"
                  : content.home.hero.ctaLabel}
              </Button>

              {variant === "welcome-back" ? (
                <Button
                  component={RouterLink}
                  to={getPagePath("membership")}
                  variant="outlined"
                  size="large"
                  sx={{
                    width: { xs: "100%", sm: "auto" },
                    px: 3.5,
                    py: "16px",
                    whiteSpace: "nowrap",
                    flexShrink: 0,
                  }}
                >
                  New Application
                </Button>
              ) : (
                <Button
                  variant="outlined"
                  size="large"
                  sx={{
                    width: { xs: "100%", sm: "auto" },
                    px: 3.5,
                    py: "16px",
                    whiteSpace: "nowrap",
                    flexShrink: 0,
                  }}
                  onClick={() => {
                    howApplyingWorksRef.current?.scrollIntoView({
                      behavior: "smooth",
                    });
                  }}
                >
                  {content.home.hero.secondaryCtaLabel}
                </Button>
              )}
            </Stack>

            {(variant === "default" || variant === "hero-image") && (
              <Typography variant="body2" color="text.secondary">
                {content.home.hero.resumePrompt}{" "}
                <Link
                  component={RouterLink}
                  to={getPagePath("resume")}
                  variant="body2"
                  color="primary"
                  sx={{ textDecoration: "none", fontWeight: 700 }}
                >
                  {content.home.hero.resumeLinkLabel}
                </Link>
              </Typography>
            )}
          </Stack>

          {showQuoteTool && (
            <HomeQuoteSection
              onOpenQuote={(eligibility) => {
                setQuoteEligibility(eligibility);
                setQuoteDrawerOpen(true);
              }}
            />
          )}
          {showHeroImage && (
            <Box
              component="img"
              src={`/client/${client.id}/hero.png`}
              alt={`${client.branding.name} hero`}
              sx={{
                display: "block",
                width: "100%",
                maxWidth: 500,
                height: "auto",
                borderRadius: 4,
                objectFit: "cover",
                mx: { xs: "auto", md: 0 },
              }}
            />
          )}
        </Box>
        {showHowApplyingWorks && (
          <Box ref={howApplyingWorksRef} sx={FADE_IN_SECTION_SX(0.15)}>
            <HowApplyingWorksSection
              onOpenApplicationReview={() =>
                setActiveDrawer("application-review")
              }
              onOpenQuickDecision={() => setActiveDrawer("quick-decision")}
            />
          </Box>
        )}

        {showCoverageOptions && (
          <Stack spacing={2.5} sx={FADE_IN_SECTION_SX(0.3)}>
            <Stack spacing={1} sx={{ textAlign: { xs: "center", md: "left" } }}>
              <Typography variant="h2">
                {content.home.coverageOptions.title}
              </Typography>
              <Typography variant="body1" color="text.secondary">
                {content.home.coverageOptions.description}
              </Typography>
            </Stack>

            <QuickDecisionInfoBox
              onLearnMore={() => setActiveDrawer("quick-decision")}
            />

            <Box
              sx={{
                ...SURFACE_SX,
                overflow: "hidden",
                background:
                  "linear-gradient(135deg, #f4f8ff 0%, #ffffff 52%, #f7fbff 100%)",
              }}
            >
              {coverageGroups.length === 0 ? (
                <Box sx={{ p: { xs: 2.5, md: 3 } }}>
                  <Alert severity="info">
                    No coverage categories are currently available for this
                    site.
                  </Alert>
                </Box>
              ) : (
                <Stack
                  direction="row"
                  divider={<Divider flexItem orientation="vertical" />}
                >
                  <Box
                    sx={{
                      width: { xs: 56, md: 260 },
                      flexShrink: 0,
                      backgroundColor: {
                        xs: "transparent",
                        md: "background.subtle",
                      },
                    }}
                  >
                    <Tabs
                      value={activeCoverageGroup?.category.id ?? false}
                      onChange={(_, value: CoverageCategoryId) =>
                        setActiveCoverageCategory(value)
                      }
                      orientation="vertical"
                      variant="standard"
                      sx={{
                        px: { xs: 0, md: 0 },
                        py: { xs: 1, md: 2 },
                        minHeight: "100%",
                        "& .MuiTabs-indicator": {
                          backgroundColor: "primary.main",
                        },
                        "& .MuiTab-root": {
                          alignItems: "center",
                          justifyContent: { xs: "center", md: "flex-start" },
                          textAlign: "left",
                          textTransform: "none",
                          fontWeight: 600,
                          fontSize: "0.95rem",
                          minHeight: 52,
                          minWidth: { xs: 56, md: "auto" },
                          px: { xs: 0, md: 2 },
                        },
                      }}
                    >
                      {coverageGroups.map(({ category }) => {
                        const IconComponent = category.icon;
                        return (
                          <Tab
                            key={category.id}
                            value={category.id}
                            icon={
                              <IconComponent sx={{ fontSize: "1.25rem" }} />
                            }
                            iconPosition="start"
                            label={
                              <Box
                                component="span"
                                sx={{ display: { xs: "none", md: "inline" } }}
                              >
                                {category.label}
                              </Box>
                            }
                            sx={{
                              gap: 1,
                              "& .MuiTab-iconWrapper": {
                                mr: { xs: 0, md: 1 },
                              },
                            }}
                          />
                        );
                      })}
                    </Tabs>
                  </Box>

                  <Box sx={{ flex: 1, p: { xs: 2.5, md: 3 } }}>
                    {activeCoverageGroup ? (
                      <Stack spacing={2}>
                        <Stack spacing={0.75}>
                          <Typography variant="h4">
                            {getCoverageCategorySectionLabel(
                              activeCoverageGroup.category.id,
                              client.coverages.categorySectionLabels,
                            )}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {
                              content.coverage.categoryDescriptions[
                                activeCoverageGroup.category.id
                              ]
                            }
                          </Typography>
                        </Stack>

                        <Divider />

                        <Stack spacing={1.5}>
                          {activeCoverageGroup.products.map((product) => (
                            <Box key={product.id}>
                              <Stack spacing={0.4}>
                                <Link
                                  href="#"
                                  underline="hover"
                                  onClick={(event) => event.preventDefault()}
                                  sx={{
                                    fontWeight: 700,
                                    color: "primary.main",
                                    cursor: "pointer",
                                    width: "fit-content",
                                  }}
                                >
                                  {product.name}
                                  {product.underwritingType === "QD" && (
                                    <QuickDecisionIndicator />
                                  )}
                                </Link>
                                <Typography
                                  variant="body2"
                                  color="text.secondary"
                                >
                                  {product.description ?? product.definition}
                                </Typography>
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                >
                                  {formatCoverageRange(product)} · Available
                                  for:{" "}
                                  {product.applicants
                                    .map(getApplicantLabel)
                                    .join(", ")}
                                </Typography>
                              </Stack>
                            </Box>
                          ))}
                        </Stack>
                      </Stack>
                    ) : null}
                  </Box>
                </Stack>
              )}
            </Box>
          </Stack>
        )}

        <Stack spacing={2.5} sx={FADE_IN_SECTION_SX(0.45)}>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "1fr",
              gap: { xs: 3, md: 5 },
              alignItems: "start",
            }}
          >
            {content.home.clientSection && (
              <Stack spacing={2}>
                <Stack direction="column" spacing={2} alignItems="start">
                  <Box
                    component="img"
                    src={client.branding.logo}
                    alt={client.branding.logoAlt}
                    sx={{
                      display: "block",
                      height: 30,
                      width: "auto",
                      objectFit: "contain",
                      flexShrink: 0,
                    }}
                  />
                  <Typography variant="body1" color="text.secondary">
                    {content.home.clientSection.tagline}
                  </Typography>
                </Stack>

                <Stack spacing={1.25}>
                  {content.home.clientSection.paragraphs.map((paragraph, i) => (
                    <Typography key={i} variant="body2">
                      {paragraph}
                    </Typography>
                  ))}
                </Stack>
              </Stack>
            )}
            <Stack spacing={2}>
              <Stack direction="row" spacing={2} alignItems="center">
                <Box
                  component="img"
                  src="/logo.svg"
                  alt="New York Life Logo"
                  sx={{
                    display: "block",
                    height: 40,
                    width: "auto",
                    objectFit: "contain",
                    flexShrink: 0,
                  }}
                />
                <Stack spacing={0.25}>
                  <Typography variant="h5">
                    {content.home.nylCredentials.name}
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    {content.home.nylCredentials.tagline}
                  </Typography>
                </Stack>
              </Stack>

              <Stack spacing={1.25}>
                <Typography variant="body2">
                  {content.home.nylCredentials.description}
                </Typography>
              </Stack>

              <Stack
                direction="row"
                spacing={2}
                flexWrap="wrap"
                useFlexGap
                sx={{ rowGap: 1 }}
              >
                {content.home.nylCredentials.ratings.map(
                  ({ grade, source }) => (
                    <Stack
                      key={grade + source}
                      direction="row"
                      spacing={0.75}
                      alignItems="baseline"
                    >
                      <Typography
                        variant="body2"
                        sx={{ fontWeight: 700, color: "primary.main" }}
                      >
                        {grade}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {source}
                      </Typography>
                    </Stack>
                  ),
                )}
              </Stack>

              <Typography variant="caption" color="text.secondary">
                <Box component="sup" sx={{ fontSize: "0.85em", lineHeight: 1 }}>
                  1
                </Box>
                {content.home.nylCredentials.ratingsNote}
              </Typography>
            </Stack>
          </Box>
        </Stack>
      </Stack>

      <AppDrawer
        open={activeDrawer !== null}
        title={drawerTitle}
        onClose={() => setActiveDrawer(null)}
      >
        {activeDrawer === "application-review" ? (
          <ApplicationReviewDrawerContent
            onOpenQuickDecision={() => setActiveDrawer("quick-decision")}
          />
        ) : (
          <QuickDecisionDrawerContent />
        )}
      </AppDrawer>

      <QuoteCalculator
        open={quoteDrawerOpen}
        onClose={() => setQuoteDrawerOpen(false)}
        collectEligibility={false}
        initialEligibility={quoteEligibility ?? undefined}
      />
    </Box>
  );
}
