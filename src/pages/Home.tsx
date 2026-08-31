import { useRef, useState, type ReactNode } from "react";
import ArrowRightAltRoundedIcon from "@mui/icons-material/ArrowRightAltRounded";
import { keyframes } from "@mui/material/styles";
import VerifiedUserOutlinedIcon from "@mui/icons-material/VerifiedUserOutlined";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Link,
  Stack,
  Typography,
} from "@mui/material";
import { Link as RouterLink, useSearchParams } from "react-router-dom";
import QuoteCalculator from "../components/forms/QuoteCalculator";
import type { QuoteCalculatorInitialValues } from "../components/forms/QuoteCalculator";
import EligibilityFields, {
  validateEligibility,
} from "../components/forms/EligibilityFields";
import AppDrawer from "../components/layout/AppDrawer";
import CoverageOptionsPanel from "../components/ui/CoverageOptionsPanel";
import HowApplyingWorksPanel from "../components/ui/HowApplyingWorksPanel";
import QuickDecisionDrawerContent, {
  QuickDecisionMark,
} from "../components/content/QuickDecisionExplainer";
import { ApplicationReviewDrawerContent } from "../content/helpContent";
import { getContent, resolveTemplate } from "../content";
import { getActiveClient } from "../config/client/getActiveClient";
import { getPagePath } from "../config/pages";
import type { HomePageVariant } from "../config/clients/types";

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

// ── Home page quote card ───────────────────────────────────────────────────
// Collects DOB/ZIP/State, then opens the QuoteCalculator drawer pre-filled.
type HomeQuoteSectionProps = {
  onOpenQuote: (eligibility: QuoteCalculatorInitialValues) => void;
};

function HomeQuoteSection({ onOpenQuote }: HomeQuoteSectionProps) {
  const [eligibilityValues, setEligibilityValues] = useState({
    birthday: "",
    zipCode: "",
    state: "",
  });
  const [attempted, setAttempted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [ageError, setAgeError] = useState("");

  function handleGetEstimate() {
    setAttempted(true);
    setAgeError("");
    const { ageError: newAgeError, isValid } = validateEligibility(eligibilityValues);
    setAgeError(newAgeError);
    if (!isValid) return;

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      onOpenQuote(eligibilityValues);
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
            {content.home.quoteSection.title}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {content.home.quoteSection.description}
          </Typography>
        </Box>

        <EligibilityFields
          values={eligibilityValues}
          onChange={(next) =>
            setEligibilityValues((prev) => ({ ...prev, ...next }))
          }
          attempted={attempted}
          ageError={ageError}
          idPrefix="home"
        />

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
      </Stack>
    </Box>
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
  const [activeDrawer, setActiveDrawer] = useState<DrawerId>(null);
  const [quoteDrawerOpen, setQuoteDrawerOpen] = useState(false);
  const [quoteEligibility, setQuoteEligibility] =
    useState<QuoteCalculatorInitialValues | null>(null);
  const howApplyingWorksRef = useRef<HTMLDivElement>(null);

  const DRAWER_CONFIG: Record<Exclude<DrawerId, null>, { title: ReactNode }> = {
    "application-review": {
      title: content.help.applicationReview.title,
    },
    "quick-decision": {
      title: (
        <>
          {content.help.quickDecision.titlePrefix} <QuickDecisionMark />?
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
            <HowApplyingWorksPanel
              variant="page"
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

            <CoverageOptionsPanel
              variant="page"
              onLearnMoreQuickDecision={() => setActiveDrawer("quick-decision")}
            />
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
