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
import CoverageNeedsCalculator from "../components/coverage/CoverageNeedsCalculator";
import FormHelpDrawer from "../components/form/FormHelpDrawer";
import type { FormPageHelpItem } from "../components/form/FormPageHelp";
import QuickDecisionDrawerContent from "../components/common/QuickDecisionDrawerContent";
import { QuickDecisionMark } from "../components/common/QuickDecisionDrawerContent";
import QuickDecisionIndicator from "../components/common/QuickDecisionIndicator";
import { getActiveClientCoverages } from "../client/getActiveClientCoverages";
import { coverageCategories } from "../config/coverageCategories";
import type {
  CoverageApplicantId,
  CoverageCategoryId,
  CoverageDefinition,
} from "../config/coverages/types";

type CoverageProductGroup = {
  category: (typeof coverageCategories)[number];
  products: CoverageDefinition[];
};

const CATEGORY_DESCRIPTIONS: Record<CoverageCategoryId, string> = {
  LI: "Life coverage can help provide financial protection for the people who depend on you.",
  AD: "Accidental death and dismemberment coverage can help protect against covered accidental loss or injury.",
  DI: "Disability coverage can help replace income if a covered disability affects your ability to work.",
  OO: "Office overhead coverage can help keep eligible business expenses paid during a covered disability.",
  SH: "Supplemental health coverage can help with out-of-pocket costs tied to covered health events.",
};

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

const APPLYING_STEPS = [
  {
    id: 0,
    title: "Apply online",
    body: "Complete our online application to apply for coverage that fits your needs. You'll be able to review your options and see your estimated cost.",
    imageSrc: "/1-apply.svg",
    imageAlt: "Apply online",
  },
  {
    id: 1,
    title: "Answer health questions",
    body: "Many types of insurance require health information to provide a decision on your application. We may ask health questions on your application or a representative of New York Life or their medical service provider may contact you to collect your health history. If needed, we will schedule a medical exam at no cost to you and at a time and place convenient to you.",
    imageSrc: "/2-medical.svg",
    imageAlt: "Answer health questions",
  },
  {
    id: 2,
    title: "Get a decision",
    body: "Decisions are made after all information is received and reviewed by New York Life. If approved, you will receive a certificate of insurance and have a 30-day no-obligation free look. Plus, when QuickDecision SM is available, you can get a faster decision on your application, typically with no medical exam.",
    imageSrc: "/3-decision.svg",
    imageAlt: "Get a decision",
  },
] as const;

export function ApplicationReviewDrawerContent({
  onOpenQuickDecision,
}: {
  onOpenQuickDecision: () => void;
}) {
  return (
    <Stack spacing={2}>
      <Typography variant="body2" color="text.secondary">
        During the application review process, also known as underwriting, our
        team will review your application to provide a decision on your
        application.
      </Typography>

      <Box>
        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
          What to expect
        </Typography>
        <Stack component="ul" spacing={1} sx={{ m: 0, pl: 2.5 }}>
          <Typography component="li" variant="body2" color="text.secondary">
            A medical service provider may contact you to confirm details about
            your health.
          </Typography>
          <Typography component="li" variant="body2" color="text.secondary">
            A medical exam may be scheduled if needed at no cost to you and at a
            time and place convenient to you.
          </Typography>
          <Typography component="li" variant="body2" color="text.secondary">
            We may also request additional information, such as prescription
            history, financial information, medical records from your
            physician(s), and/or medical claims history.
          </Typography>
          <Typography component="li" variant="body2" color="text.secondary">
            Any forms needing your signature will be sent securely via DocuSign.
          </Typography>
        </Stack>
      </Box>

      <Typography variant="body2" color="text.secondary">
        The review process typically takes a few business days, but with{" "}
        <InlineDrawerLink onClick={onOpenQuickDecision}>
          <QuickDecisionMark />
        </InlineDrawerLink>
        , many applications can get a real-time decision, often without
        requiring a medical exam.
      </Typography>
    </Stack>
  );
}

export function HowApplyingWorksDrawerContent() {
  type SubDrawerId = "application-review" | "quick-decision" | null;
  const [subDrawer, setSubDrawer] = useState<SubDrawerId>(null);

  return (
    <>
      <Stack spacing={3}>
        <Typography variant="body2" color="text.secondary">
          This online experience is designed to help you complete your
          application quickly and easily.
        </Typography>

        {APPLYING_STEPS.map((step) => (
          <Stack
            key={step.id}
            direction="row"
            spacing={2}
            alignItems="flex-start"
          >
            <Box sx={{ flex: 1 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
                {step.title}
              </Typography>
              {step.id === 1 ? (
                <Typography variant="body2" color="text.secondary">
                  Many types of insurance require health information to provide
                  a decision on your application. We may ask health questions on
                  your application or a representative of New York Life or their
                  medical service provider may contact you to collect your
                  health history. If needed, we will schedule a medical exam at
                  no cost to you and at a time and place convenient to you.{" "}
                  <InlineDrawerLink
                    onClick={() => setSubDrawer("application-review")}
                  >
                    Learn more about the application review process.
                  </InlineDrawerLink>
                </Typography>
              ) : step.id === 2 ? (
                <Typography variant="body2" color="text.secondary">
                  Decisions are made after all information is received and
                  reviewed by New York Life. If approved, you will receive a
                  certificate of insurance and have a 30-day no-obligation free
                  look. Plus, when{" "}
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
  associationName,
}: {
  associationName: string;
}) {
  return (
    <Stack spacing={2}>
      <Typography variant="body2" color="text.secondary">
        With group insurance through {associationName}, eligible applicants can
        take advantage of specially negotiated rates made available through the
        group.
      </Typography>

      <Box>
        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
          Explore available group insurance options
        </Typography>

        <Stack component="ul" spacing={1} sx={{ m: 0, pl: 2.5 }}>
          <Typography component="li" variant="body2" color="text.secondary">
            Group rates may be available to eligible applicants through their
            association or sponsoring organization.
          </Typography>

          <Typography component="li" variant="body2" color="text.secondary">
            Because eligibility and coverage needs can vary, the application
            helps confirm which products, coverage amounts, and rates are
            available for each applicant.
          </Typography>

          <Typography component="li" variant="body2" color="text.secondary">
            Availability and rates may vary based on state, eligibility,
            underwriting requirements, coverage selected, and other application
            details.{" "}
          </Typography>
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
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Review the coverage categories available and the products offered within
        each category.
      </Typography>

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
                    {CATEGORY_DESCRIPTIONS[activeGroup.category.id]}
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
  label: "What coverage options are available?",
  title: "What coverage options are available?",
  content: <CoverageOptionsDrawerContent />,
};

export const coverageNeedsHelpItem: FormPageHelpItem = {
  id: "coverage-needs",
  label: "How much coverage do I need?",
  title: "How much coverage do I need?",
  content: <CoverageNeedsCalculator />,
};

export const beneficiaryHelpItems: FormPageHelpItem[] = [
  {
    id: "beneficiary-basics",
    label: "What is a beneficiary?",
    title: "What is a beneficiary?",
    content: (
      <Stack spacing={2}>
        <Typography variant="body2">
          A beneficiary is the person, people, or trust you choose to receive
          the money from your policy when you pass away.
        </Typography>
        <Typography variant="body2">
          This can be a family member, friend, or trust, and you can update your
          beneficiary choices if your situation changes.
        </Typography>
        <Typography variant="body2">
          A <strong>primary beneficiary</strong> is the person or entity who
          would receive the policy proceeds first.
        </Typography>
        <Typography variant="body2">
          A <strong>contingent beneficiary</strong> would receive the policy
          proceeds if the primary beneficiary is unable to receive them.
        </Typography>
        <Typography variant="body2">
          You may add up to ten primary and ten contingent beneficiaries online.
          If no beneficiary is named, proceeds will be paid according to the
          policy provisions.
        </Typography>
        <Typography variant="body2">
          For dependent child coverage, the beneficiary is the member.
        </Typography>
      </Stack>
    ),
  },
  {
    id: "beneficiary-share",
    label: "What is the % share?",
    title: "What is the % share?",
    content: (
      <Stack spacing={2}>
        <Typography variant="body2">
          The percentage share determines how much of the policy payout each
          beneficiary will receive.
        </Typography>
        <Typography variant="body2">
          You assign a percentage to each individual beneficiary, and the
          percentages for that designation must add up to 100%.
        </Typography>
        <Typography variant="body2">
          For example, if one beneficiary is assigned 60% and another is
          assigned 40%, they would receive those portions of the total benefit.
        </Typography>
        <Typography variant="body2">
          If you name a trust as beneficiary, 100% of the proceeds will be paid
          to the trust.
        </Typography>
      </Stack>
    ),
  },
];

export const coverageQuestionsWhyAskedHelpItem: FormPageHelpItem = {
  id: "why-asked",
  label: "Why is this information being asked?",
  title: "Why is this information being asked?",
  content: (
    <Stack spacing={3}>
      <Typography variant="body2" color="text.secondary">
        We understand these questions can feel personal. Here&apos;s how this
        information is used in your application.
      </Typography>

      <Box sx={{ display: "flex", gap: 2 }}>
        <CalculateOutlinedIcon
          sx={{
            color: "primary.main",
            fontSize: "2.5rem",
            flexShrink: 0,
          }}
        />
        <Box sx={{ flex: 1 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.5 }}>
            Determining your coverage options
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Your answers help us identify the coverage types and amounts
            available to you. Different products have different eligibility
            requirements, and this information ensures we show you the right
            options.
          </Typography>
        </Box>
      </Box>

      <Box sx={{ display: "flex", gap: 2 }}>
        <TuneRoundedIcon
          sx={{
            color: "primary.main",
            fontSize: "2.5rem",
            flexShrink: 0,
          }}
        />
        <Box sx={{ flex: 1 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.5 }}>
            Calculating your estimated cost
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Health and lifestyle information is used to calculate personalized
            premium estimates. The more accurate your answers, the more accurate
            your quoted rate will be.
          </Typography>
        </Box>
      </Box>

      <Box sx={{ display: "flex", gap: 2 }}>
        <InfoOutlinedIcon
          sx={{
            color: "primary.main",
            fontSize: "2.5rem",
            flexShrink: 0,
          }}
        />
        <Box sx={{ flex: 1 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.5 }}>
            Your information is protected
          </Typography>
          <Typography variant="body2" color="text.secondary">
            All information you provide is transmitted securely and used only
            for the purpose of evaluating your application. It is never sold or
            shared for marketing purposes.
          </Typography>
        </Box>
      </Box>
    </Stack>
  ),
};

export const paymentHandlingHelpItem: FormPageHelpItem = {
  id: "payment-handling",
  label: "How is my payment information handled?",
  title: "How is my payment information handled?",
  content: (
    <Stack spacing={3}>
      <Typography variant="body2" color="text.secondary">
        We take the security of your payment information seriously. Here's how
        we handle it throughout the application process.
      </Typography>

      <Box sx={{ display: "flex", gap: 2 }}>
        <CreditCardOffOutlinedIcon
          sx={{
            color: "primary.main",
            fontSize: "2.5rem",
            flexShrink: 0,
          }}
        />
        <Box sx={{ flex: 1 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.5 }}>
            Payment is not collected now
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Your payment information is collected as part of the application but
            you will not be charged until and unless you are approved for
            coverage. No money leaves your account during the application
            process.
          </Typography>
        </Box>
      </Box>

      <Box sx={{ display: "flex", gap: 2 }}>
        <LockOutlinedIcon
          sx={{
            color: "primary.main",
            fontSize: "2.5rem",
            flexShrink: 0,
          }}
        />
        <Box sx={{ flex: 1 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.5 }}>
            Stored securely
          </Typography>
          <Typography variant="body2" color="text.secondary">
            All payment data is encrypted in transit and at rest using
            industry-standard security protocols. Your information is stored in
            PCI-compliant systems and is never accessible in plain text.
          </Typography>
        </Box>
      </Box>

      <Box sx={{ display: "flex", gap: 2 }}>
        <LoopRoundedIcon
          sx={{
            color: "primary.main",
            fontSize: "2.5rem",
            flexShrink: 0,
          }}
        />
        <Box sx={{ flex: 1 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.5 }}>
            How payment is processed
          </Typography>
          <Typography variant="body2" color="text.secondary">
            If your application is approved, payment will be processed according
            to the frequency you select (monthly, quarterly, semiannually, or
            annually). You&apos;ll receive confirmation before any charge is
            made.
          </Typography>
        </Box>
      </Box>

      <Box sx={{ display: "flex", gap: 2 }}>
        <DeleteOutlineRoundedIcon
          sx={{
            color: "primary.main",
            fontSize: "2.5rem",
            flexShrink: 0,
          }}
        />
        <Box sx={{ flex: 1 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.5 }}>
            Cancellation &amp; data purge
          </Typography>
          <Typography variant="body2" color="text.secondary">
            You can cancel your application at any time before approval with no
            obligation. All payment and application information is purged from
            our systems 10 days after submission if no action is taken or the
            application is not approved.
          </Typography>
        </Box>
      </Box>
    </Stack>
  ),
};
