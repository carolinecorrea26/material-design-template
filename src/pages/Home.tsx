import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import ArrowRightAltRoundedIcon from "@mui/icons-material/ArrowRightAltRounded";
import { keyframes } from "@mui/material/styles";
import VerifiedUserOutlinedIcon from "@mui/icons-material/VerifiedUserOutlined";
import {
  Alert,
  Box,
  Button,
  Chip,
  Divider,
  Link,
  Stack,
  Tab,
  Tabs,
  Typography,
} from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import HomeQuoteCard from "../components/coverage/QuoteCard";
import FormHelpDrawer from "../components/help/Drawer";
import QuickDecisionIndicator from "../components/coverage/QuickDecisionBadge";
import QuickDecisionDrawerContent from "../components/overlays/QuickDecisionInfo";
import { ApplicationReviewDrawerContent } from "../content/helpContent";
import { getContent, resolveTemplate } from "../content";
import { getActiveClient } from "../config/client/getActiveClient";
import { getActiveClientCoverages } from "../config/client/getActiveClientCoverages";
import { coverageCategories } from "../config/coverageCategories";
import type {
  CoverageApplicantId,
  CoverageCategoryId,
  CoverageDefinition,
} from "../config/coverages/types";
import { getPagePath } from "../config/pages";
import { formatUSD } from "../utils/formatUSD";
import type { HomePageVariant } from "../config/clients/types";

type DrawerId = "application-review" | "quick-decision" | null;
const PAGE_MAX_WIDTH = 1200;

const SURFACE_SX = {
  border: "1px solid rgba(52, 59, 72, 0.10)",
  borderRadius: 4,
  backgroundColor: "#ffffff",
  boxShadow: "0 18px 40px rgba(52, 59, 72, 0.06)",
};

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
      <Stack spacing={1}>
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
              direction={{ xs: "column", md: "row" }}
              spacing={{ xs: 3, md: 5 }}
              alignItems={{ xs: "flex-start", md: "center" }}
            >
              <Box
                sx={{ flexShrink: 0, alignSelf: { xs: "center", md: "auto" } }}
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
                    justifyContent={{ xs: "flex-start" }}
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

                  <Typography variant="body1" color="text.secondary">
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

export default function Home() {
  const client = getActiveClient();
  const variant: HomePageVariant =
    client.features?.homePageVariant ?? "default";
  const showQuoteTool = variant === "default";
  const showHeroImage = variant === "hero-image" || variant === "welcome-back";
  const showHowApplyingWorks = variant !== "welcome-back";
  const showCoverageOptions = variant !== "welcome-back";
  const coverages = useMemo(() => getActiveClientCoverages(), []);
  const [activeDrawer, setActiveDrawer] = useState<DrawerId>(null);
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
                ? { xs: "1fr", md: "minmax(0, 500px) minmax(0, 500px)" }
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
              maxWidth: showQuoteTool || showHeroImage ? 600 : 760,
              justifySelf:
                showQuoteTool || showHeroImage ? "stretch" : "center",
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
                bgcolor: "#f9fafc",
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
                sx={{
                  fontSize: {
                    xs: "2.5rem",
                    sm: "3rem",
                    md: "3.5rem",
                  },
                  lineHeight: 1.08,
                  fontWeight: 700,
                }}
              >
                {variant === "welcome-back"
                  ? "Welcome!"
                  : content.home.hero.title}
              </Typography>
              <Typography variant="body1" color="text.secondary">
                {variant === "welcome-back"
                  ? "Resume your saved application or begin a new application below."
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
                  ? "Resume Application"
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

          {showQuoteTool && <HomeQuoteCard />}
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
            <Stack spacing={1}>
              <Typography variant="h2">
                {content.home.coverageOptions.title}
              </Typography>
              <Typography variant="body1" color="text.secondary">
                {content.home.coverageOptions.description}
              </Typography>
            </Stack>

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
                      backgroundColor: { xs: "transparent", md: "#fbfcff" },
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
                            {activeCoverageGroup.category.label}
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

      <FormHelpDrawer
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
      </FormHelpDrawer>
    </Box>
  );
}
