import { Box, Stack, Link, Typography } from "@mui/material";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import CalculateOutlinedIcon from "@mui/icons-material/CalculateOutlined";
import TuneRoundedIcon from "@mui/icons-material/TuneRounded";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import CreditCardOffOutlinedIcon from "@mui/icons-material/CreditCardOffOutlined";
import LoopRoundedIcon from "@mui/icons-material/LoopRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import CoverageNeedsCalculator from "../components/forms/CoverageNeedsCalculator";
import type { FormPageHelpItem } from "../components/content/HelpChips";
import { InlineDrawerLink, QuickDecisionMark } from "../components/content/QuickDecisionExplainer";
import CoverageOptionsPanel from "../components/ui/CoverageOptionsPanel";
import HowApplyingWorksPanel from "../components/ui/HowApplyingWorksPanel";
import { getContent, resolveTemplate } from "./index";
import type { coverageCategories } from "../config/coverageCategories";
import type {
  CoverageCategoryId,
  CoverageDefinition,
} from "../config/coverages/types";

type CoverageProductGroup = {
  category: (typeof coverageCategories)[number];
  products: CoverageDefinition[];
};

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
  return (
    <CoverageOptionsPanel variant="drawer" initialCategory={initialCategory} />
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
  content: <HowApplyingWorksPanel variant="drawer" />,
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
