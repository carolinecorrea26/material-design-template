import { useEffect, useState, type ReactNode } from "react";
import {
  Box,
  Divider,
  Link,
  Stack,
  Tab,
  Tabs,
  Typography,
} from "@mui/material";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import CalculateOutlinedIcon from "@mui/icons-material/CalculateOutlined";
import TuneRoundedIcon from "@mui/icons-material/TuneRounded";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import CreditCardOffOutlinedIcon from "@mui/icons-material/CreditCardOffOutlined";
import LoopRoundedIcon from "@mui/icons-material/LoopRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import CoverageNeedsCalculator from "../components/overlays/CoverageCalculator";
import FormHelpDrawer from "../components/overlays/HelpDrawer";
import type { FormPageHelpItem } from "../components/content/HelpPanel";
import QuickDecisionDrawerContent from "../components/content/QuickDecisionExplainer";
import { QuickDecisionMark } from "../components/content/QuickDecisionExplainer";
import QuickDecisionIndicator from "../components/common/QuickDecisionIndicator";
import { getActiveClientCoverages } from "../config/client/getActiveClientCoverages";
import { coverageCategories } from "../config/coverageCategories";
import { getContent, resolveTemplate } from "./index";
import type {
  CoverageApplicantId,
  CoverageCategoryId,
  CoverageDefinition,
} from "../config/coverages/types";

type CoverageProductGroup = {
  category: (typeof coverageCategories)[number];
  products: CoverageDefinition[];
};

function getApplicantLabel(applicant: CoverageApplicantId): string {
  return getContent().shared.applicantLabels[applicant];
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

const helpSteps = getContent().help.howApplyingWorks.steps;

export function ApplicationReviewDrawerContent({
  onOpenQuickDecision,
}: {
  onOpenQuickDecision: () => void;
}) {
  const reviewHelp = getContent().help.applicationReview;
  return (
    <Stack spacing={2}>
      <Typography variant="body2" color="text.secondary">
        {reviewHelp.intro}
      </Typography>

      <Box>
        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
          {reviewHelp.whatToExpectTitle}
        </Typography>
        <Stack component="ul" spacing={1} sx={{ m: 0, pl: 2.5 }}>
          {reviewHelp.whatToExpectItems.map((item, i) => (
            <Typography
              key={i}
              component="li"
              variant="body2"
              color="text.secondary"
            >
              {item}
            </Typography>
          ))}
        </Stack>
      </Box>

      <Typography variant="body2" color="text.secondary">
        {reviewHelp.closingNote.split("QuickDecision")[0]}
        <InlineDrawerLink onClick={onOpenQuickDecision}>
          <QuickDecisionMark />
        </InlineDrawerLink>
        {reviewHelp.closingNote
          .split("QuickDecision")
          .slice(1)
          .join("QuickDecision")}
      </Typography>
    </Stack>
  );
}

export function HowApplyingWorksDrawerContent() {
  type SubDrawerId = "application-review" | "quick-decision" | null;
  const [subDrawer, setSubDrawer] = useState<SubDrawerId>(null);
  const helpContent = getContent().help.howApplyingWorks;

  return (
    <>
      <Stack spacing={3}>
        <Typography variant="body2" color="text.secondary">
          {helpContent.intro}
        </Typography>

        {helpSteps.map((step, index) => (
          <Stack
            key={index}
            direction="row"
            spacing={2}
            alignItems="flex-start"
          >
            <Box sx={{ flex: 1 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
                {step.title}
              </Typography>
              {index === 1 ? (
                <Typography variant="body2" color="text.secondary">
                  {step.body}{" "}
                  <InlineDrawerLink
                    onClick={() => setSubDrawer("application-review")}
                  >
                    Learn more about the application review process.
                  </InlineDrawerLink>
                </Typography>
              ) : index === 2 ? (
                <Typography variant="body2" color="text.secondary">
                  {step.body} When{" "}
                  <InlineDrawerLink
                    onClick={() => setSubDrawer("quick-decision")}
                  >
                    <QuickDecisionMark />
                  </InlineDrawerLink>{" "}
                  is available, you can get a faster decision on your
                  application, typically with no medical exam.
                </Typography>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  {step.body}
                </Typography>
              )}
            </Box>
          </Stack>
        ))}
      </Stack>

      <FormHelpDrawer
        open={subDrawer !== null}
        title={
          subDrawer === "application-review"
            ? "Application review process"
            : "QuickDecision"
        }
        onClose={() => setSubDrawer(null)}
      >
        {subDrawer === "application-review" ? (
          <ApplicationReviewDrawerContent
            onOpenQuickDecision={() => setSubDrawer("quick-decision")}
          />
        ) : (
          <QuickDecisionDrawerContent />
        )}
      </FormHelpDrawer>
    </>
  );
}

export function GroupInsuranceDrawerContent({
  associationName: _associationName,
}: {
  associationName: string;
}) {
  const groupHelp = getContent().help.groupInsurance;
  return (
    <Stack spacing={2}>
      <Typography variant="body2" color="text.secondary">
        {resolveTemplate(groupHelp.intro)}
      </Typography>

      <Box>
        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
          {groupHelp.exploreTitle}
        </Typography>

        <Stack component="ul" spacing={1} sx={{ m: 0, pl: 2.5 }}>
          {groupHelp.exploreItems.map((item, i) => (
            <Typography
              key={i}
              component="li"
              variant="body2"
              color="text.secondary"
            >
              {item}
            </Typography>
          ))}
        </Stack>
      </Box>
    </Stack>
  );
}

export function CoverageProductsDrawerContent({
  productsByCategory,
}: {
  productsByCategory: CoverageProductGroup[];
}) {
  return (
    <Stack spacing={2.25}>
      <Typography variant="body2" color="text.secondary">
        These products are available through this group. You can review and
        select coverage options later in the application.
      </Typography>

      <Stack spacing={2}>
        {productsByCategory.map(({ category, products }) => (
          <Box key={category.id}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.75 }}>
              {category.label}
            </Typography>

            <Stack spacing={0.75}>
              {products.map((product) => (
                <Link
                  key={product.id}
                  href="#"
                  underline="hover"
                  onClick={(event) => event.preventDefault()}
                  sx={{
                    width: "fit-content",
                    color: "primary.main",
                    fontSize: "0.875rem",
                    fontWeight: 600,
                    lineHeight: 1.35,
                    textUnderlineOffset: "0.15em",
                  }}
                >
                  {product.name}
                </Link>
              ))}
            </Stack>
          </Box>
        ))}
      </Stack>
    </Stack>
  );
}

export function CoverageOptionsDrawerContent({
  initialCategory,
}: { initialCategory?: CoverageCategoryId } = {}) {
  const coverages = getActiveClientCoverages();
  const coverageGroups = coverageCategories
    .map((category) => ({
      category,
      products: coverages.filter((c) => c.categoryId === category.id),
    }))
    .filter((group) => group.products.length > 0);

  const [activeCategory, setActiveCategory] = useState<CoverageCategoryId>(
    initialCategory ?? coverageGroups[0]?.category.id ?? "LI",
  );

  useEffect(() => {
    if (initialCategory) {
      setActiveCategory(initialCategory);
    }
  }, [initialCategory]);

  const activeGroup = coverageGroups.find(
    (g) => g.category.id === activeCategory,
  );

  if (coverageGroups.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary">
        No coverage categories are currently available.
      </Typography>
    );
  }

  return (
    <Stack spacing={0}>
      {/* <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Review the coverage categories available and the products offered within
        each category.
      </Typography> */}

      <Box
        sx={{
          border: "1px solid",
          borderColor: "divider",
          borderRadius: 2,
          overflow: "hidden",
        }}
      >
        <Stack
          direction="row"
          divider={<Divider flexItem orientation="vertical" />}
        >
          <Box
            sx={{
              width: 56,
              flexShrink: 0,
              backgroundColor: "#fbfcff",
            }}
          >
            <Tabs
              value={activeCategory}
              onChange={(_, value: CoverageCategoryId) =>
                setActiveCategory(value)
              }
              orientation="vertical"
              variant="standard"
              sx={{
                py: 1,
                minHeight: "100%",
                "& .MuiTabs-indicator": {
                  backgroundColor: "primary.main",
                },
                "& .MuiTab-root": {
                  alignItems: "center",
                  justifyContent: "center",
                  textTransform: "none",
                  fontWeight: 700,
                  minHeight: 52,
                  minWidth: 56,
                  px: 0,
                },
                "& .Mui-selected": {
                  background: "rgb(213 229 255 / 47%)",
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
                    aria-label={category.label}
                  />
                );
              })}
            </Tabs>
          </Box>

          <Box sx={{ flex: 1, p: 2, bgcolor: "#fff" }}>
            {activeGroup ? (
              <Stack spacing={2}>
                <Stack spacing={0.5}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                    {activeGroup.category.label}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {
                      getContent().coverage.categoryDescriptions[
                        activeGroup.category.id
                      ]
                    }
                  </Typography>
                </Stack>

                <Divider />

                <Stack spacing={1.5}>
                  {activeGroup.products.map((product) => (
                    <Box key={product.id}>
                      <Stack spacing={0.25}>
                        <Typography
                          // variant="body2"
                          sx={{
                            fontWeight: 700,
                            color: "primary.main",
                            fontSize: "14px !important",
                            letterSpacing: "-0.25px",
                          }}
                        >
                          {product.name}
                          {product.underwritingType === "QD" && (
                            <QuickDecisionIndicator />
                          )}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {product.description ?? product.definition}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Available for:{" "}
                          {product.applicants.map(getApplicantLabel).join(", ")}
                        </Typography>
                      </Stack>
                    </Box>
                  ))}
                </Stack>
              </Stack>
            ) : null}
          </Box>
        </Stack>
      </Box>
    </Stack>
  );
}

export function groupInsuranceHelpItem(
  associationName: string,
): FormPageHelpItem {
  return {
    id: "group-insurance",
    label: "What is group insurance?",
    title: "What is group insurance?",
    content: <GroupInsuranceDrawerContent associationName={associationName} />,
  };
}

export const howApplyingWorksHelpItem: FormPageHelpItem = {
  id: "application-process",
  label: "How does applying work?",
  title: "How does applying work?",
  content: <HowApplyingWorksDrawerContent />,
};

export const coverageOptionsAvailableHelpItem: FormPageHelpItem = {
  id: "coverage-options-available",
  label: "What are my coverage options?",
  title: "What are my coverage options?",
  content: <CoverageOptionsDrawerContent />,
};

export const coverageNeedsHelpItem: FormPageHelpItem = {
  id: "coverage-needs",
  label: "How much coverage do I need?",
  title: "How much coverage do I need?",
  content: <CoverageNeedsCalculator />,
};

export const beneficiaryHelpItems: FormPageHelpItem[] = (() => {
  const { whatIs, percentageShare } = getContent().help.beneficiary;
  return [
    {
      id: "beneficiary-basics",
      label: "What is a beneficiary?",
      title: "What is a beneficiary?",
      content: (
        <Stack spacing={2}>
          {whatIs.paragraphs.map((p, i) => (
            <Typography key={i} variant="body2">
              {p}
            </Typography>
          ))}
        </Stack>
      ),
    },
    {
      id: "beneficiary-share",
      label: "What is the % share?",
      title: "What is the % share?",
      content: (
        <Stack spacing={2}>
          {percentageShare.paragraphs.map((p, i) => (
            <Typography key={i} variant="body2">
              {p}
            </Typography>
          ))}
        </Stack>
      ),
    },
  ];
})();

export const coverageQuestionsWhyAskedHelpItem: FormPageHelpItem = (() => {
  const whyAsked = getContent().help.whyAsked;
  const icons = [CalculateOutlinedIcon, TuneRoundedIcon, InfoOutlinedIcon];
  return {
    id: "why-asked",
    label: "Why is this information being asked?",
    title: "Why is this information being asked?",
    content: (
      <Stack spacing={3}>
        <Typography variant="body2" color="text.secondary">
          {whyAsked.intro}
        </Typography>

        {whyAsked.sections.map((section, i) => {
          const IconComponent = icons[i] ?? InfoOutlinedIcon;
          return (
            <Box key={i} sx={{ display: "flex", gap: 2 }}>
              <IconComponent
                sx={{
                  color: "primary.main",
                  fontSize: "2.5rem",
                  flexShrink: 0,
                }}
              />
              <Box sx={{ flex: 1 }}>
                <Typography
                  variant="subtitle1"
                  sx={{ fontWeight: 600, mb: 0.5 }}
                >
                  {section.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {section.description}
                </Typography>
              </Box>
            </Box>
          );
        })}
      </Stack>
    ),
  };
})();

export const paymentHandlingHelpItem: FormPageHelpItem = (() => {
  const payment = getContent().help.paymentHandling;
  const icons = [
    CreditCardOffOutlinedIcon,
    LockOutlinedIcon,
    LoopRoundedIcon,
    DeleteOutlineRoundedIcon,
  ];
  return {
    id: "payment-handling",
    label: "How is my payment information handled?",
    title: "How is my payment information handled?",
    content: (
      <Stack spacing={3}>
        <Typography variant="body2" color="text.secondary">
          {payment.intro}
        </Typography>

        {payment.sections.map((section, i) => {
          const IconComponent = icons[i] ?? InfoOutlinedIcon;
          return (
            <Box key={i} sx={{ display: "flex", gap: 2 }}>
              <IconComponent
                sx={{
                  color: "primary.main",
                  fontSize: "2.5rem",
                  flexShrink: 0,
                }}
              />
              <Box sx={{ flex: 1 }}>
                <Typography
                  variant="subtitle1"
                  sx={{ fontWeight: 600, mb: 0.5 }}
                >
                  {section.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {section.description}
                </Typography>
              </Box>
            </Box>
          );
        })}
      </Stack>
    ),
  };
})();
