import { useState, type MouseEvent } from "react";
import { Box, Button, Chip, CircularProgress, Stack, Typography } from "@mui/material";
import VerifiedUserRoundedIcon from "@mui/icons-material/VerifiedUserRounded";
import { Link as RouterLink } from "react-router-dom";
import EligibilityFields, { validateEligibility, type EligibilityPresentation } from "../forms/EligibilityFields";
import type { QuoteCalculatorInitialValues } from "../../app/workflows/QuoteCalculator";
import type { SiteContent } from "../../content/types";
import type { ClientConfig, HomePageVariant } from "../../config/clients/types";
import type { AssociationId } from "../../data/model";
import { homeQuoteSurfaceSx } from "./homeQuoteSurfaceSx";

const SINGLE_TEMPLATE_FORM_MAX_WIDTH = 800;
type HomeContent = SiteContent;
type Branding = ClientConfig["branding"];

// ── Home page quote card ───────────────────────────────────────────────────
// Collects DOB/ZIP/State, then opens the QuoteCalculator drawer pre-filled.
type HomeQuoteSectionProps = {
  onOpenQuote: (eligibility: QuoteCalculatorInitialValues) => void;
  eligibilityPresentation?: EligibilityPresentation;
  content: HomeContent;
};

function HomeQuoteSection({ onOpenQuote, content, eligibilityPresentation }: HomeQuoteSectionProps) {
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
    const { ageError: newAgeError, isValid } =
      validateEligibility(eligibilityValues, eligibilityPresentation);
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
      sx={homeQuoteSurfaceSx}
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

        <EligibilityFields {...eligibilityPresentation}
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

type HomeHeroProps = {
  paths?: { membership: string; resume: string };
  description?: string;
  eligibilityPresentation?: EligibilityPresentation;
  content: HomeContent;
  client: ClientConfig;
  effectiveBranding: Branding;
  variant: HomePageVariant;
  isSingleTemplate: boolean;
  previewClient?: ClientConfig;
  activeAssociationId?: AssociationId | null;
  animationSx?: { opacity: number; animation: string };
  onApply: (event: MouseEvent<HTMLElement>) => void;
  onOpenQuote: (eligibility: QuoteCalculatorInitialValues) => void;
};

// The hero owns its existing pieces; they do not need separate component APIs.
export default function HomeHero({ content, client, effectiveBranding, variant, isSingleTemplate,
  previewClient, animationSx, onApply, onOpenQuote, eligibilityPresentation, paths = { membership: "/membership", resume: "/resume" }, description }: HomeHeroProps) {
  const showQuoteTool = !isSingleTemplate && variant === "default";
  const showHeroImage = !isSingleTemplate && (variant === "hero-image" || variant === "welcome-back");
  return (
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns:
                showQuoteTool || showHeroImage
                  ? { xs: "1fr", md: "minmax(0, 450px) minmax(0, 500px)" }
                  : "1fr",
              gap: { xs: 2.5, md: 3.5 },
              alignItems: "start",
              width: "100%",
              maxWidth: isSingleTemplate
                ? SINGLE_TEMPLATE_FORM_MAX_WIDTH
                : undefined,
              mx: isSingleTemplate ? "auto" : undefined,
              ...animationSx,
            }}
          >
            <Stack
              spacing={2}
              sx={{
                alignSelf: "flex-start",
                width: isSingleTemplate ? "100%" : undefined,
                maxWidth: isSingleTemplate ? "100%" : showQuoteTool || showHeroImage ? 800 : 760,
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
                px: isSingleTemplate ? 0 : { xs: 1.5, sm: 3, md: 0 },
                pb: 2,
              }}
            >
              <Chip
                icon={
                  <VerifiedUserRoundedIcon
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
                  sx={
                    isSingleTemplate
                      ? { fontSize: "2.5rem", lineHeight: 1.15 }
                      : undefined
                  }
                >
                  {isSingleTemplate
                    ? `Coverage designed for ${effectiveBranding.acronym} members.`
                    : variant === "welcome-back"
                    ? content.home.hero.welcomeBackTitle
                    : content.home.hero.title}
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  {isSingleTemplate
                    ? `Underwritten by New York Life Insurance Company and tailored exclusively for ${effectiveBranding.name} members. Get started below!`
                    : variant === "welcome-back"
                    ? content.home.hero.welcomeBackDescription
                    : previewClient
                      ? content.home.hero.description
                          .replace(
                            /\{\{clientName\}\}/g,
                            previewClient.branding.name,
                          )
                          .replace(
                            /\{\{clientAcronym\}\}/g,
                            previewClient.branding.acronym,
                          )
                          .replace(
                            /\{\{associationName\}\}/g,
                            previewClient.branding.name,
                          )
                      : description ?? content.home.hero.description.replace(/\{\{(?:clientName|associationName)\}\}/g, client.branding.name).replace(/\{\{clientAcronym\}\}/g, client.branding.acronym ?? client.branding.name)}
                </Typography>
              </Stack>

              {!isSingleTemplate && (
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
                    to={paths[variant === "welcome-back" ? "resume" : "membership"]}
                    onClick={variant === "welcome-back" ? undefined : onApply}
                    variant="contained"
                    size="large"
                    // endIcon={<ArrowRightAltRoundedIcon />}
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
                      ? "Continue application"
                      : content.home.hero.ctaLabel}
                  </Button>

                  {variant === "welcome-back" ? (
                    <Button
                      component={RouterLink}
                      to={paths.membership}
                      onClick={onApply}
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
                      {content.home.hero.ctaLabel}
                    </Button>
                  ) : (
                    <Button
                      component={RouterLink}
                      to={paths.resume}
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
                      {content.home.hero.secondaryCtaLabel}
                    </Button>
                  )}
                </Stack>
              )}

            </Stack>

            {showQuoteTool && (
              <HomeQuoteSection content={content} eligibilityPresentation={eligibilityPresentation}
                onOpenQuote={onOpenQuote}
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
  );
}

