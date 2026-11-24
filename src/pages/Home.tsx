import AppModal from "../components/layout/AppModal";
import { Fragment, useState, type ReactNode, type MouseEvent } from "react";
import { keyframes } from "@mui/material/styles";
import VerifiedUserRoundedIcon from "@mui/icons-material/VerifiedUserRounded";
import {
  Box,
  Button,
  Chip,
  Link,
  Stack,
  Typography,
} from "@mui/material";
import { Link as RouterLink, useSearchParams, useNavigate } from "react-router-dom";
import QuoteCalculator from "../app/workflows/QuoteCalculator";
import type { QuoteCalculatorInitialValues } from "../app/workflows/QuoteCalculator";
import AppDrawer from "../components/layout/AppDrawer";
import HomeHero from "../app/sections/ConfiguredHomeHero";
import HomeCoverageSection from "../app/sections/ConfiguredHomeCoverageSection";
import AssociationIntroduction from "../components/home/AssociationIntroduction";
import UnderwriterCredentials from "../components/home/UnderwriterCredentials";
import { getApplyingWorksPresentation, showSinglePageArtwork, resolveHomePresentation, resolveHomePageSections } from "../config/homepagePresentation";
import HowApplyingWorksPanel from "../components/home/HowApplyingWorksPanel";
import QuickDecisionDrawerContent, {
  QuickDecisionMark,
} from "../components/content/QuickDecisionExplainer";
import { ApplicationReviewDrawerContent } from "../content/helpContent";
import { buildContentForClientAlias, getContent, resolveBrandingTemplate } from "../content";
import { getActiveClient } from "../config/client/getActiveClient";
import { getPagePath } from "../config/pages";
import type { ClientConfig, HomePageVariant } from "../config/clients/types";
import { getFormTemplate, DEFAULT_TEMPLATE } from "../config/template/resolveTemplate";
import SinglePageApplication from "../app/SinglePageApplication";
import HeroClouds from "../components/home/HeroClouds";
import type { PageId } from "../types";
import { useApplicationForm } from "../app/ApplicationFormContext";
import { useStartApplication } from "../app/useStartApplication";
import { getActiveSite, resolveEffectiveBranding } from "../data";

import { requirementText } from "../domain/requirementContent";
import homePresentation from "../../requirements/global/configurations/presentation.json";
import { getPrototypeLibrary } from "../domain/prototypeLibrary";
import type { RatePresentationPolicy } from "../domain/ratePresentation";
import { homeQuoteSurfaceSx } from "../components/home/homeQuoteSurfaceSx";
import { requirementUrlValues } from '../domain/requirementUrlParameters';

type DrawerId = "application-review" | "quick-decision" | null;
const PAGE_MAX_WIDTH = 1200;
const QUOTE_FIRST_MAX_WIDTH = 1040;
const SINGLE_TEMPLATE_FORM_MAX_WIDTH = 800;

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



const HOME_VARIANTS = homePresentation.configurations.find(configuration => configuration.id === "home-variant")!;
const VALID_VARIANTS = requirementUrlValues('variant');
const DEFAULT_VARIANT = HOME_VARIANTS.default as HomePageVariant;

export default function Home({
  previewClient,
  initialFormPageId,
  previewTemplate = DEFAULT_TEMPLATE,
}: { previewClient?: ClientConfig; initialFormPageId?: PageId; previewTemplate?: "single" | "multi" } = {}) {
  const isPreview = Boolean(previewClient);
  const isSingleTemplate = (isPreview ? previewTemplate : getFormTemplate()) === "single";
  const client = previewClient ?? getActiveClient();
  const { activeAssociationId } = useApplicationForm();
  const startApplication = useStartApplication();
  const effectiveBranding = previewClient
    ? previewClient.branding
    : resolveEffectiveBranding({
        siteId: getActiveSite().id,
        associationId: activeAssociationId,
      });
  const content = previewClient
    ? buildContentForClientAlias(previewClient.id)
    : getContent();
  const [searchParams] = useSearchParams();
  const urlVariant = searchParams.get("variant") as HomePageVariant | null;
  const requestedVariant: HomePageVariant =
    !isPreview && urlVariant && VALID_VARIANTS.includes(urlVariant)
      ? urlVariant
      : (client.features?.homePageVariant ?? DEFAULT_VARIANT);
  const variant = resolveHomePresentation(requestedVariant, getPrototypeLibrary()?.site.configuration.ratePresentationPolicies[0]?.value as RatePresentationPolicy | undefined);
  const showArtwork = showSinglePageArtwork(isSingleTemplate ? "single" : "multi", client.features);
  const showQuoteFirst = !isSingleTemplate && variant === "quoteFirst";
  const homeSections = resolveHomePageSections(isSingleTemplate ? "single" : "multi", variant, isPreview ? null : getPrototypeLibrary());
  const navigate = useNavigate();
  const [landingNoticeOpen, setLandingNoticeOpen] = useState(false);
  const landingNotice = client.features?.homeLandingNotice ? content.home.landingNotice : undefined;
  function handleApplyClick(event: MouseEvent<HTMLElement>) {
    if (!landingNotice) { if (!isPreview) startApplication(); return; }
    event.preventDefault(); setLandingNoticeOpen(true);
  }
  const [activeDrawer, setActiveDrawer] = useState<DrawerId>(null);
  const [quoteDrawerOpen, setQuoteDrawerOpen] = useState(false);
  const [quoteEligibility, setQuoteEligibility] =
    useState<QuoteCalculatorInitialValues | null>(null);

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

  const sectionViews: Record<string, ReactNode> = {
    HomeHero: <>
{showQuoteFirst ? (
          <Stack
            spacing={{ xs: 3, md: 4 }}
            sx={{
              width: "100%",
              maxWidth: QUOTE_FIRST_MAX_WIDTH,
              alignSelf: "center",
              ...FADE_IN_SECTION_SX(0),
            }}
          >
            <Stack
              spacing={1.5}
              alignItems="center"
              textAlign="center"
              sx={{ maxWidth: 760, width: "100%", alignSelf: "center" }}
            >
              <Chip
                icon={
                  <VerifiedUserRoundedIcon
                    sx={{ fontSize: "1rem !important" }}
                  />
                }
                label={resolveBrandingTemplate(content.home.hero.tagline, effectiveBranding)}
                variant="outlined"
                sx={{
                  borderColor: "divider",
                  bgcolor: "background.default",
                  borderRadius: "999px",
                  "& .MuiChip-icon": { color: "primary.main" },
                }}
              />
              <Typography variant="h1">
                {requirementText("home.quote-first.title")}
              </Typography>
              <Typography variant="body1" color="text.secondary">
                {requirementText("home.quote-first.description", { clientAcronym: client.branding.acronym ?? "" })}
              </Typography>
            </Stack>

            <Box
              sx={theme => ({
                ...homeQuoteSurfaceSx(theme),
                p: { xs: 2, sm: 3.5, md: 4 },
              })}
            >
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: {
                    xs: "minmax(0, 1fr)",
                    md: "minmax(280px, 0.72fr) minmax(0, 1.28fr)",
                  },
                  gap: { xs: 0, md: 3 },
                  alignItems: "stretch",
                }}
              >
                <Box
                  aria-hidden="true"
                  sx={{
                    display: { xs: "none", md: "block" },
                    position: "relative",
                    height: 560,
                    alignSelf: "start",
                    overflow: "hidden",
                    borderRadius: 3,
                    bgcolor: "grey.100",
                  }}
                >
                  <Box
                    component="img"
                    src="/quote.jpg"
                    alt=""
                    sx={{
                      position: "absolute",
                      inset: 0,
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      objectPosition: "center",
                    }}
                  />
                </Box>

                <QuoteCalculator
                  open
                  onClose={() => undefined}
                  collectEligibility
                  displayMode="inline"
                />
              </Box>
            </Box>

            <Stack spacing={1.5} alignItems="center">
              <Button component={RouterLink} to={getPagePath("membership")} onClick={handleApplyClick} variant="contained" size="large">
                {content.home.hero.ctaLabel}
              </Button>
              <Typography variant="body2">{requirementText("home.hero.resume-prefix")}{" "}
                <Link component={RouterLink} to={getPagePath("resume")}>{content.home.hero.secondaryCtaLabel}</Link>
              </Typography>
            </Stack>
          </Stack>
        ) : (
          <HomeHero
            content={content}
            client={client}
            effectiveBranding={effectiveBranding}
            variant={variant}
            isSingleTemplate={isSingleTemplate}
            previewClient={previewClient}
            activeAssociationId={activeAssociationId}
            animationSx={FADE_IN_SECTION_SX(0)}
            onApply={handleApplyClick}
            onOpenQuote={(eligibility) => {
              setQuoteEligibility(eligibility);
              setQuoteDrawerOpen(true);
            }}
          />
        )}

        {isSingleTemplate && !isPreview && (
          <Box sx={{ ...FADE_IN_SECTION_SX(0.15), width: "100%", maxWidth: SINGLE_TEMPLATE_FORM_MAX_WIDTH, mx: "auto", alignSelf: "center" }}>
            <SinglePageApplication initialPageId={initialFormPageId} />
          </Box>
        )}
    </>,
    HowApplyingWorksPanel: (<Box sx={FADE_IN_SECTION_SX(0.15)}>
            <HowApplyingWorksPanel
              variant="page"
              presentation={getApplyingWorksPresentation(client.features)}
              onOpenApplicationReview={() =>
                setActiveDrawer("application-review")
              }
              onOpenQuickDecision={() => setActiveDrawer("quick-decision")}
            />
          </Box>),
    HomeCoverageSection: (<HomeCoverageSection content={content} sx={FADE_IN_SECTION_SX(0.3)} />),
    AssociationIntroduction: content.home.clientSection ? <AssociationIntroduction content={content} effectiveBranding={effectiveBranding} /> : null,
    UnderwriterCredentials: <UnderwriterCredentials content={content} />,
  };
  const renderSectionComponent = (component: string) => {
    if (!Object.hasOwn(sectionViews, component)) throw new Error(`Unsupported Home section component: ${component}`);
    return <Fragment key={component}>{sectionViews[component]}</Fragment>;
  };

  return (
    <Box sx={{ width: "100%", flex: 1, position: "relative", isolation: "isolate" }}>
      {showArtwork && <HeroClouds />}
      <Stack
        spacing={isSingleTemplate ? 3 : { xs: 12, md: 10 }}
        sx={{
          position: "relative",
          width: "100%",
          maxWidth: isSingleTemplate
            ? SINGLE_TEMPLATE_FORM_MAX_WIDTH
            : PAGE_MAX_WIDTH,
          mx: "auto",
          px: { xs: 2, sm: 3, md: 4 },
          pt: showArtwork ? "110px" : { xs: 1.5, md: 3 },
          pb: { xs: 4, md: 6 },
        }}
      >
        {isSingleTemplate && landingNotice && <Button variant="outlined" onClick={() => setLandingNoticeOpen(true)}>{requirementText("home.landing-notice.view", { title: landingNotice.title })}</Button>}
        {homeSections.map(section => section.components!.length === 1
          ? <Fragment key={section.id}>{renderSectionComponent(section.components![0])}</Fragment>
          : <Stack key={section.id} spacing={2.5} sx={FADE_IN_SECTION_SX(0.45)}>
              <Box sx={{ display: "grid", gridTemplateColumns: "1fr", gap: { xs: 3, md: 5 }, alignItems: "start" }}>
                {section.components!.map(renderSectionComponent)}
              </Box>
            </Stack>)}
      </Stack>

      {landingNotice && <AppModal open={landingNoticeOpen} onClose={() => setLandingNoticeOpen(false)}
        title={<Typography component="span" variant="h6">{landingNotice.title}</Typography>} titleId="landing-notice-title"
        maxWidth={900} minHeight="auto" fullScreenOnMobile={false} showCloseIcon={false}
        footerActions={<><Button onClick={() => setLandingNoticeOpen(false)}>{requirementText("home.landing-notice.cancel")}</Button><Button variant="contained" onClick={() => { setLandingNoticeOpen(false); if (!isPreview && !isSingleTemplate) { startApplication(); navigate(getPagePath("membership")); } }}>{requirementText("home.landing-notice.continue")}</Button></>}>
        <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>{landingNotice.text}</Typography>
      </AppModal>}
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
