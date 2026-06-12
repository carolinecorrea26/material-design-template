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
import HomeQuoteCard from "../components/common/HomeQuoteCard";
import FormHelpDrawer from "../components/form/FormHelpDrawer";
import QuickDecisionIndicator from "../components/common/QuickDecisionIndicator";
import QuickDecisionDrawerContent from "../components/common/QuickDecisionDrawerContent";
import { ApplicationReviewDrawerContent } from "../content/helpContent";
import { getActiveClient } from "../client/getActiveClient";
import { getActiveClientCoverages } from "../client/getActiveClientCoverages";
import { coverageCategories } from "../config/coverageCategories";
import type {
  CoverageApplicantId,
  CoverageCategoryId,
  CoverageDefinition,
} from "../config/coverages/types";
import { getPagePath } from "../config/pages";
import { formatUSD } from "../utils/formatUSD";

type DrawerId = "application-review" | "quick-decision" | null;

type AboutCardContent = {
  title: string;
  subtitle?: string;
  paragraphs: ReactNode[];
};

const SHOW_QUOTE_TOOL = true;
const PAGE_MAX_WIDTH = 1180;

const SURFACE_SX = {
  border: "1px solid rgba(52, 59, 72, 0.10)",
  borderRadius: 4,
  backgroundColor: "#ffffff",
  boxShadow: "0 18px 40px rgba(52, 59, 72, 0.06)",
};

const SECTION_TITLE_SX = {
  fontSize: {
    xs: "1.5rem",
    sm: "1.5rem",
    md: "1.75rem",
    lg: "2rem",
  },
  fontWeight: 700,
  // color: "primary.dark",
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

const CATEGORY_DESCRIPTIONS: Record<CoverageCategoryId, string> = {
  LI: "Life coverage can help provide financial protection for the people who depend on you.",
  AD: "Accidental death and dismemberment coverage can help protect against covered accidental loss or injury.",
  DI: "Disability coverage can help replace income if a covered disability affects your ability to work.",
  OO: "Office overhead coverage can help keep eligible business expenses paid during a covered disability.",
  SH: "Supplemental health coverage can help with out-of-pocket costs tied to covered health events.",
};

const NYL_ABOUT_CONTENT: AboutCardContent = {
  title: "New York Life Insurance Company",
  subtitle: "A trusted name for over 180 years",
  paragraphs: [
    "At the heart of New York Life is a commitment to be there for customers when they need us, whether today or decades into the future.",
    <>
      As of today, New York Life has received the highest financial strength
      ratings
      <Box component="sup" sx={{ fontSize: "0.75em", lineHeight: 1 }}>
        1
      </Box>{" "}
      currently awarded to any U.S. life insurer. For our customers, that means
      promises kept, and peace of mind for the millions of families and
      businesses who rely on us.
    </>,
  ],
};

const ASSOCIATION_ABOUT_CONTENT: Partial<Record<string, AboutCardContent>> = {
  ama: {
    title: "AMA Insurance",
    subtitle: "Helping physicians protect what matters most",
    paragraphs: [
      "For more than 50 years, AMA-sponsored insurance has helped protect physicians and their families.",
      "As a subsidiary of the American Medical Association, AMA Insurance uses the group buying power of more than one million physicians to offer specially negotiated rates and tailored benefits from top insurance companies.",
    ],
  },
};

const APPLYING_STEPS = [
  {
    id: 0,
    // number: "1",
    title: "Apply online",
    body: "Complete our online application to apply for coverage that fits your needs. You'll be able to review your options and see your estimated cost.",
    imageSrc: "/1-apply.svg",
    imageAlt: "Apply online",
  },
  {
    id: 1,
    // number: "2",
    title: "Answer health questions",
    body: "Many types of insurance require health information to provide a decision on your application. We may ask health questions on your application or a representative of New York Life or their medical service provider may contact you to collect your health history. If needed, we will schedule a medical exam at no cost to you and at a time and place convenient to you.",
    imageSrc: "/2-medical.svg",
    imageAlt: "Answer health questions",
  },
  {
    id: 2,
    // number: "3",
    title: "Get a decision",
    body: "Decisions are made after all information is received and reviewed by New York Life. If approved, you will receive a certificate of insurance and have a 30-day no-obligation free look. Plus, when QuickDecisionSM is available, you can get a faster decision on your application, typically with no medical exam.",
    imageSrc: "/3-decision.svg",
    imageAlt: "Get a decision",
  },
] as const;

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
  if (applicant === "member") return "Member";
  if (applicant === "spouse") return "Spouse";
  return "Child";
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
  return (
    <Stack spacing={4}>
      <Stack spacing={1}>
        <Typography variant="h2" sx={SECTION_TITLE_SX}>
          What to expect when applying
        </Typography>
        <Typography variant="body1" color="text.secondary">
          This online experience is designed to help you complete your
          application quickly and easily.
        </Typography>
      </Stack>

      <Stack spacing={8}>
        {APPLYING_STEPS.map((step) => (
          <Box key={step.id} sx={{ padding: { xs: "0 1.5rem", md: "0 2rem" } }}>
            <Stack
              direction={{ xs: "column", md: "row" }}
              spacing={{ xs: 3, md: 6 }}
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
                    width: { xs: "150px", sm: "120px", md: "150px" },
                    height: { xs: "150px", sm: "120px", md: "150px" },
                    objectFit: "contain",
                  }}
                />
              </Box>

              <Box sx={{ width: "100%" }}>
                <Stack spacing={1.5}>
                  <Typography
                    variant="h4"
                    fontSize={{
                      xs: "1.25rem",
                      sm: "1.25rem",
                      md: "1.5rem",
                      lg: "1.5rem",
                    }}
                    textAlign={{ xs: "center", md: "left" }}
                  >
                    {step.title}
                  </Typography>

                  {step.id === 1 ? (
                    <Typography variant="body1" color="text.secondary">
                      Many types of insurance require health information to
                      provide a decision on your application. We may ask health
                      questions on your application or a representative of New
                      York Life or their medical service provider may contact
                      you to collect your health history. If needed, we will
                      schedule a medical exam at no cost to you and at a time
                      and place convenient to you.{" "}
                      <InlineDrawerLink onClick={onOpenApplicationReview}>
                        Learn more about the application review process.
                      </InlineDrawerLink>
                    </Typography>
                  ) : step.id === 2 ? (
                    <Typography variant="body1" color="text.secondary">
                      Decisions are made after all information is received and
                      reviewed by New York Life. If approved, you will receive a
                      certificate of insurance and have a 30-day no-obligation
                      free look. Plus, when{" "}
                      <InlineDrawerLink onClick={onOpenQuickDecision}>
                        <QuickDecisionMark />
                      </InlineDrawerLink>{" "}
                      is available, you can get a faster decision on your
                      application, typically with no medical exam.
                    </Typography>
                  ) : (
                    <Typography variant="body1" color="text.secondary">
                      {step.body}
                    </Typography>
                  )}
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

  const associationContent = ASSOCIATION_ABOUT_CONTENT[client.id] ?? null;

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
            gridTemplateColumns: SHOW_QUOTE_TOOL
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
              maxWidth: SHOW_QUOTE_TOOL ? 600 : 760,
              justifySelf: SHOW_QUOTE_TOOL ? "stretch" : "center",
              textAlign: SHOW_QUOTE_TOOL
                ? "left"
                : { xs: "left", md: "center" },
              alignItems: SHOW_QUOTE_TOOL
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
              label="Simple • Secure • Member-only rates"
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
                    xs: "2.25rem",
                    sm: "3rem",
                    md: "3.5rem",
                    lg: "4rem",
                  },
                  lineHeight: 1.08,
                  maxWidth: 500,
                  fontWeight: 700,
                }}
              >
                Protect what matters most
              </Typography>
              <Typography
                variant="body1"
                color="text.secondary"
                sx={{ maxWidth: 400 }}
                fontSize={{ xs: "1.125rem", md: "1.25rem" }}
              >
                Coverage designed exclusively for {client.branding.name}{" "}
                members.
              </Typography>
            </Stack>

            <Stack
              direction="row"
              spacing={1.5}
              alignItems="center"
              useFlexGap
              sx={{ flexWrap: "wrap" }}
            >
              <Button
                component={RouterLink}
                to={getPagePath("membership")}
                variant="contained"
                size="large"
                endIcon={<ArrowRightAltRoundedIcon />}
                sx={{
                  width: { xs: "100%", sm: "auto" },
                  px: 3.5,
                  py: 1.25,
                  fontWeight: 700,
                  whiteSpace: "nowrap",
                  flexShrink: 0,
                }}
              >
                Get started
              </Button>

              <Button
                variant="outlined"
                size="large"
                sx={{
                  width: { xs: "100%", sm: "auto" },
                  px: 3.5,
                  py: 1.25,
                  whiteSpace: "nowrap",
                  flexShrink: 0,
                }}
                onClick={() => {
                  howApplyingWorksRef.current?.scrollIntoView({
                    behavior: "smooth",
                  });
                }}
              >
                Learn more
              </Button>
            </Stack>

            <Link
              component={RouterLink}
              to={getPagePath("resume")}
              variant="body2"
              color="text.secondary"
              sx={{
                textDecoration: "underline",
                textUnderlineOffset: "0.15em",
              }}
            >
              Already have an application started? Continue here
            </Link>
          </Stack>

          {SHOW_QUOTE_TOOL ? <HomeQuoteCard /> : null}
        </Box>

        <Box ref={howApplyingWorksRef} sx={FADE_IN_SECTION_SX(0.15)}>
          <HowApplyingWorksSection
            onOpenApplicationReview={() =>
              setActiveDrawer("application-review")
            }
            onOpenQuickDecision={() => setActiveDrawer("quick-decision")}
          />
        </Box>

        <Stack spacing={2.5} sx={FADE_IN_SECTION_SX(0.3)}>
          <Stack spacing={1}>
            <Typography variant="h2" sx={SECTION_TITLE_SX}>
              About the coverages
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Review the coverage categories available on this site and the
              products offered within each category.
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
                  No coverage categories are currently available for this site.
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
                          icon={<IconComponent sx={{ fontSize: "1.25rem" }} />}
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
                            CATEGORY_DESCRIPTIONS[
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
                                {formatCoverageRange(product)} · Available for:{" "}
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

        <Stack spacing={2.5} sx={FADE_IN_SECTION_SX(0.45)}>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns:
                associationContent != null ? { xs: "1fr" } : "1fr",
              gap: { xs: 3, md: 5 },
              alignItems: "start",
            }}
          >
            {associationContent ? (
              <Stack spacing={2}>
                <Stack spacing={0.75}>
                  <Typography
                    variant="h4"
                    paddingBottom={1}
                    sx={{
                      xs: "1.5rem",
                      sm: "1.5rem",
                      md: "1.75rem",
                      lg: "2rem",
                    }}
                    fontWeight={600}
                  >
                    {associationContent.title}
                  </Typography>
                  {associationContent.subtitle ? (
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {associationContent.subtitle}
                    </Typography>
                  ) : null}
                </Stack>

                <Stack spacing={1.25}>
                  {associationContent.paragraphs.map((paragraph, index) => (
                    <Typography
                      key={index}
                      variant="body2"
                      color="text.secondary"
                    >
                      {paragraph}
                    </Typography>
                  ))}
                </Stack>
                <Box
                  component="img"
                  src={client.branding.logo}
                  alt={client.branding.logoAlt}
                  sx={{
                    display: "block",
                    height: 30,
                    width: "auto",
                    objectFit: "contain",
                    objectPosition: "left center",
                    mb: 0.5,
                  }}
                />
              </Stack>
            ) : null}
            <Stack spacing={2}>
              <Stack spacing={0.75}>
                <Typography
                  variant="h4"
                  paddingBottom={1}
                  sx={{ xs: "1.5rem", sm: "1.5rem", md: "1.75rem", lg: "2rem" }}
                  fontWeight={600}
                >
                  {NYL_ABOUT_CONTENT.title}
                </Typography>
                {NYL_ABOUT_CONTENT.subtitle ? (
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {NYL_ABOUT_CONTENT.subtitle}
                  </Typography>
                ) : null}
              </Stack>

              <Stack spacing={1.25}>
                {NYL_ABOUT_CONTENT.paragraphs.map((paragraph, index) => (
                  <Typography
                    key={index}
                    variant="body2"
                    color="text.secondary"
                  >
                    {paragraph}
                  </Typography>
                ))}
              </Stack>

              <Stack
                direction="row"
                spacing={2}
                flexWrap="wrap"
                useFlexGap
                sx={{ rowGap: 1 }}
              >
                {[
                  ["A++", "A.M. Best"],
                  ["AAA", "Fitch Ratings"],
                  ["Aa1", "Moody's Investors Service"],
                  ["AA+", "Standard & Poor's"],
                ].map(([grade, source]) => (
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
                ))}
              </Stack>

              <Typography variant="caption" color="text.secondary">
                <Box component="sup" sx={{ fontSize: "0.85em", lineHeight: 1 }}>
                  1
                </Box>
                Third Party Rating Reports as of 09/30/2025.
              </Typography>
              <Box
                component="img"
                src="/logo.svg"
                alt="New York Life Logo"
                sx={{
                  display: "block",
                  height: 40,
                  width: "auto",
                  objectFit: "contain",
                  objectPosition: "left center",
                  mb: 0.5,
                }}
              />
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
