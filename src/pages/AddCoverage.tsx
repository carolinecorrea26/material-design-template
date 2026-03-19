import * as React from "react";
import {
  Box,
  Stack,
  Typography,
  Chip,
  Card,
  CardContent,
  Checkbox,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from "@mui/material";
import {
  ExpandMore,
  PersonOutline,
  FavoriteBorder,
  ChildCare,
  AutoAwesomeRounded,
} from "@mui/icons-material";
import PageHeader from "../components/layout/PageHeader";
import ScrollChipRow from "../components/layout/ScrollChipRow";
import FormPageLayout from "../components/layout/FormPageLayout";
import FormStepTransition from "../components/layout/FormStepTransition";
import PageNavigation from "../components/layout/PageNavigation";
import FormBottomDrawer from "../components/common/FormBottomDrawer";
import { useAppData } from "../state/AppDataContext";
import { useStepper } from "../state/StepperContext";
import { getProducts } from "../api/client";
import { commonStyles } from "../theme/commonStyles";
import {
  getClientBranding,
  getClientCoverageCategories,
  getClientProductAmounts,
  getClientProductCoverageRanges,
  getClientProductDescriptions,
} from "../config/clients";
import { COVERAGE_CATEGORY_LABELS } from "../constants/coverage";
import { COVERAGE_CARDS } from "../constants/getStartedProducts";
import CoverageIcon from "../utils/coverageIcons";
import { CoverageDetailsContent } from "../components/modals/CoverageDetailsModal";
import type { Product, CoverageCategory, Applicant } from "../types/app";

const applicantLabels: Record<Applicant, string> = {
  self: "Self",
  spouse: "Spouse",
  child: "Child",
};

const applicantIcons: Record<Applicant, React.ElementType> = {
  self: PersonOutline,
  spouse: FavoriteBorder,
  child: ChildCare,
};

type GroupedProducts = Record<CoverageCategory, Product[]>;

type CoverageDetailsProduct = {
  id: string;
  name: string;
  applicants: string[];
  href: string;
};

type CoverageDetailsCategory = {
  id: CoverageCategory;
  description: string;
  products: CoverageDetailsProduct[];
};

function CategoryLabel({ category }: { category: CoverageCategory }) {
  return (
    <Stack direction="row" spacing={1} alignItems="center">
      <Box
        sx={{
          width: 32,
          height: 32,
          borderRadius: "50%",
          bgcolor: "#d6e6ff",
          color: "primary.main",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          "& svg": {
            width: "0.875em",
            height: "0.875em",
          },
        }}
      >
        <CoverageIcon category={category} color="currentColor" />
      </Box>
      <Typography sx={commonStyles.sidebarText}>
        {COVERAGE_CATEGORY_LABELS[category]}
      </Typography>
    </Stack>
  );
}

type ProductSelectionCardProps = {
  checked: boolean;
  name: string;
  description: string;
  badge?: string;
  applicants?: Applicant[];
  minAmount?: number;
  maxAmount?: number;
  onToggle: () => void;
};

function ProductSelectionCard({
  checked,
  name,
  description,
  badge,
  applicants,
  minAmount,
  maxAmount,
  onToggle,
}: ProductSelectionCardProps) {
  const formatAmount = (amount: number) => {
    if (amount >= 1_000_000) {
      return `$${(amount / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
    }
    if (amount >= 1_000) {
      return `$${(amount / 1_000).toFixed(0)}K`;
    }
    return amount.toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    });
  };
  const coverageText =
    minAmount && maxAmount
      ? `${formatAmount(minAmount)}–${formatAmount(maxAmount)}`
      : maxAmount
        ? `Up to ${formatAmount(maxAmount)}`
        : "Coverage options available";
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === " " || event.key === "Enter") {
      event.preventDefault();
      onToggle();
    }
  };

  return (
    <Card
      variant="outlined"
      role="checkbox"
      aria-checked={checked}
      tabIndex={0}
      onClick={onToggle}
      onKeyDown={handleKeyDown}
      sx={(theme) => ({
        cursor: "pointer",
        borderColor: theme.palette.divider,
        bgcolor: theme.palette.background.paper,
        transition:
          "border-color 0.2s ease, background-color 0.2s ease, box-shadow 0.2s ease",
        "&:hover": {
          boxShadow: theme.shadows[1],
        },
        "&:focus-visible": {
          outline: `2px solid ${theme.palette.primary.main}`,
          outlineOffset: 2,
        },
      })}
    >
      <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
        <Stack direction="row" spacing={2} alignItems="flex-start">
          <Checkbox
            checked={checked}
            onChange={onToggle}
            onClick={(event) => event.stopPropagation()}
            inputProps={{ "aria-label": `${name} selection` }}
            sx={{ mt: 0.25 }}
          />
          <Stack spacing={1} sx={{ flex: 1 }}>
            <Stack
              direction="row"
              spacing={1}
              alignItems="center"
              flexWrap="wrap"
            >
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {name}
              </Typography>
              {badge ? (
                <Chip
                  label={badge}
                  size="small"
                  color="primary"
                  icon={<AutoAwesomeRounded />}
                />
              ) : null}
            </Stack>
            <Typography variant="body2" color="text.secondary">
              {description}
            </Typography>
            <Stack
              direction="row"
              alignItems="flex-start"
              sx={{
                columnGap: "32px",
                rowGap: 1,
                flexWrap: "wrap",
                justifyContent: { xs: "space-between", md: "flex-start" },
              }}
            >
              <Stack spacing={0.5}>
                <Typography
                  component="p"
                  sx={{ fontSize: "0.75rem", m: 0, color: "text.secondary" }}
                >
                  Coverage:
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ color: "success.main", fontWeight: 600 }}
                >
                  {coverageText}
                </Typography>
              </Stack>
              {applicants?.length ? (
                <Stack spacing={0.5}>
                  <Typography
                    component="p"
                    sx={{ fontSize: "0.75rem", m: 0, color: "text.secondary" }}
                  >
                    Available for:
                  </Typography>
                  <Stack direction="row" spacing={1.5} flexWrap="wrap">
                    {applicants?.map((applicant) => {
                      const Icon = applicantIcons[applicant];
                      return (
                        <Stack
                          key={applicant}
                          direction="row"
                          spacing={0.5}
                          alignItems="center"
                          sx={{
                            fontWeight: 500,
                            color: "primary.main",
                          }}
                        >
                          <Icon sx={{ fontSize: 16, color: "primary.main" }} />
                          <Typography
                            variant="caption"
                            sx={{ color: "inherit" }}
                          >
                            {applicantLabels[applicant]}
                          </Typography>
                        </Stack>
                      );
                    })}
                  </Stack>
                </Stack>
              ) : null}
            </Stack>
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
}

export default function AddCoverage() {
  const { data, setEligibility } = useAppData();
  const { next, markComplete } = useStepper();
  const hasHydratedSelections = React.useRef(false);
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [products, setProducts] = React.useState<Product[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [selectedById, setSelectedById] = React.useState<
    Record<string, boolean>
  >({});
  const branding = getClientBranding();
  const productAmounts = React.useMemo(() => getClientProductAmounts(), []);
  const categoryAmounts = React.useMemo(
    () => ({
      LI: "$100K–$1M",
      AD: "$25K–$500K",
      DI: "$2K–$20K/mo",
      OO: "$2K–$20K/mo",
      SH: "$10K–$50K",
    }),
    [],
  );

  const clientCoverageCategories = React.useMemo(
    () => getClientCoverageCategories(),
    [],
  );

  React.useEffect(() => {
    let mounted = true;
    getProducts()
      .then((fetched) => {
        if (!mounted) return;
        setProducts(fetched);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const groupedProducts = React.useMemo<GroupedProducts>(() => {
    const grouped: GroupedProducts = {
      LI: [],
      AD: [],
      DI: [],
      OO: [],
      SH: [],
    };

    products.forEach((product) => {
      if (grouped[product.category]) {
        grouped[product.category].push(product);
      }
    });

    return grouped;
  }, [products]);

  const orderedCategories = React.useMemo(
    () => clientCoverageCategories,
    [clientCoverageCategories],
  );
  const productDescriptions = React.useMemo(
    () => getClientProductDescriptions(),
    [],
  );
  const productCoverageRanges = React.useMemo(
    () => getClientProductCoverageRanges(),
    [],
  );
  const selectedApplicants = React.useMemo(
    () => ({
      self: true,
      spouse: data.eligibility?.applicants?.spouse ?? false,
      child: data.eligibility?.applicants?.child ?? false,
    }),
    [data.eligibility?.applicants],
  );

  const brochurePrefix = React.useMemo(
    () => branding.acronym?.toLowerCase() ?? "abe",
    [branding.acronym],
  );
  const getBrochureUrl = React.useCallback(
    (category: CoverageCategory) =>
      `https://d160mojjx9yhiu.cloudfront.net/pdfs/4591/${brochurePrefix}-${category.toLowerCase()}-overview.pdf`,
    [brochurePrefix],
  );
  const coverageCards = React.useMemo<CoverageDetailsCategory[]>(() => {
    const grouped: GroupedProducts = {
      LI: [],
      AD: [],
      DI: [],
      OO: [],
      SH: [],
    };

    products.forEach((product) => {
      if (grouped[product.category]) {
        grouped[product.category].push(product);
      }
    });

    const cards = (Object.keys(grouped) as CoverageCategory[])
      .map((category) => {
        const categoryProducts = grouped[category];
        if (categoryProducts.length === 0) return null;
        const meta = COVERAGE_CARDS.find((card) => card.id === category);
        return {
          id: category,
          description: meta?.description ?? "",
          products: categoryProducts.map((product) => ({
            id: product.id,
            name: product.name,
            applicants: product.eligibleApplicants.map(
              (applicant) => applicantLabels[applicant],
            ),
            href: getBrochureUrl(category),
          })),
        };
      })
      .filter((card): card is CoverageDetailsCategory => card !== null);

    if (cards.length > 0) {
      return cards;
    }

    return COVERAGE_CARDS.map((card) => ({
      id: card.id as CoverageCategory,
      description: card.description,
      products: card.products.map((product) => ({
        id: product.id,
        name: product.name,
        applicants: product.applicants,
        href: getBrochureUrl(card.id as CoverageCategory),
      })),
    }));
  }, [getBrochureUrl, products]);

  const selectedProductIds = React.useMemo(() => {
    const selected = Object.entries(selectedById)
      .filter(([, isSelected]) => isSelected)
      .map(([productId]) => productId);
    return selected.sort();
  }, [selectedById]);

  React.useEffect(() => {
    const saved = data.eligibility?.coverageProductSelections ?? [];
    if (saved.length === 0 || hasHydratedSelections.current) return;
    setSelectedById((prev) => {
      const next = { ...prev };
      saved.forEach((productId) => {
        next[productId] = true;
      });
      return next;
    });
    hasHydratedSelections.current = true;
  }, [data.eligibility?.coverageProductSelections]);

  React.useEffect(() => {
    if (!data.eligibility) return;

    const saved = data.eligibility?.coverageProductSelections ?? [];
    if (saved.length > 0 && !hasHydratedSelections.current) return;
    const savedSorted = [...saved].sort();
    const isSameSelection =
      savedSorted.length === selectedProductIds.length &&
      savedSorted.every((id, index) => id === selectedProductIds[index]);
    if (isSameSelection) return;
    setEligibility({
      ...data.eligibility,
      coverageProductSelections: selectedProductIds,
    });
  }, [data.eligibility, selectedProductIds, setEligibility]);

  React.useEffect(() => {
    const handleFillForm = () => {
      if (products.length === 0) return;
      const nextSelected: Record<string, boolean> = {};
      products.forEach((product) => {
        const hasEligibleApplicant = product.eligibleApplicants.some(
          (applicant) => selectedApplicants[applicant],
        );
        if (hasEligibleApplicant) {
          nextSelected[product.id] = true;
        }
      });
      setSelectedById(nextSelected);
    };

    window.addEventListener("devtools:fillform", handleFillForm);
    return () =>
      window.removeEventListener("devtools:fillform", handleFillForm);
  }, [products, selectedApplicants]);

  const handleToggle = (productId: string) => {
    setSelectedById((prev) => ({ ...prev, [productId]: !prev[productId] }));
  };

  const handleContinue = () => {
    if (!data.eligibility) return;

    setEligibility({
      ...data.eligibility,
      coverageProductSelections: selectedProductIds,
    });
    markComplete();
    next();
  };

  return (
    <FormPageLayout
      header={
        <PageHeader
          title="Add the coverage you want to apply for."
          notes={
            <ScrollChipRow
              items={[
                {
                  label: "What coverage options are available?",
                  onClick: () => setDrawerOpen(true),
                },
              ]}
            />
          }
        />
      }
      navigation={<PageNavigation onContinue={handleContinue} />}
    >
      <FormStepTransition>
        <Stack spacing={1}>
          {loading ? (
            <Typography variant="body2" color="text.secondary">
              Loading coverage options...
            </Typography>
          ) : (
            orderedCategories
              .filter(
                (category) => (groupedProducts[category] || []).length > 0,
              )
              .map((category, index, visibleCategories) => {
                const categoryProducts = groupedProducts[category] || [];
                const isLastCategory = index === visibleCategories.length - 1;

                const popularProductId = categoryProducts.find(
                  (product) => product.quickDecision,
                )?.id;

                return (
                  <React.Fragment key={category}>
                    <Accordion
                      defaultExpanded={index === 0}
                      disableGutters
                      elevation={0}
                      square
                      sx={{
                        bgcolor: "transparent",
                        boxShadow: "none",
                        "&::before": { display: "none" },
                      }}
                    >
                      <AccordionSummary
                        expandIcon={<ExpandMore />}
                        sx={{ px: 0, minHeight: "auto" }}
                      >
                        <CategoryLabel category={category} />
                      </AccordionSummary>
                      <AccordionDetails sx={{ px: 0, pt: 0 }}>
                        <Stack spacing={2}>
                          {categoryProducts.map((product) => {
                            const description =
                              productDescriptions[product.id] ??
                              `Coverage details for ${product.name}.`;
                            const badge =
                              popularProductId &&
                              product.id === popularProductId
                                ? "Featured"
                                : undefined;
                            const coverageRange =
                              productCoverageRanges[product.id] ??
                              (product.amounts?.length
                                ? {
                                    min: Math.min(...product.amounts),
                                    max: Math.max(...product.amounts),
                                  }
                                : undefined);
                            const eligibleApplicants =
                              product.eligibleApplicants.filter(
                                (applicant) => selectedApplicants[applicant],
                              );

                            return (
                              <ProductSelectionCard
                                key={product.id}
                                checked={!!selectedById[product.id]}
                                name={product.name}
                                description={description}
                                badge={badge}
                                applicants={eligibleApplicants}
                                minAmount={coverageRange?.min}
                                maxAmount={coverageRange?.max}
                                onToggle={() => handleToggle(product.id)}
                              />
                            );
                          })}
                        </Stack>
                      </AccordionDetails>
                    </Accordion>
                    {!isLastCategory && (
                      <Box
                        sx={{
                          borderBottom: "1px solid",
                          borderColor: "divider",
                          my: 2,
                        }}
                      />
                    )}
                  </React.Fragment>
                );
              })
          )}
        </Stack>
      </FormStepTransition>

      <FormBottomDrawer
        open={drawerOpen}
        title="What coverage options are available?"
        onClose={() => setDrawerOpen(false)}
        onOpen={() => setDrawerOpen(true)}
      >
        <CoverageDetailsContent
          coverageInfoCards={coverageCards}
          productAmounts={productAmounts}
          categoryAmounts={categoryAmounts}
        />
      </FormBottomDrawer>
    </FormPageLayout>
  );
}
