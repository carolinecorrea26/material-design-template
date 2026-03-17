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
  BoltRounded,
  ExpandMore,
  PersonOutline,
  FavoriteBorder,
  ChildCare,
} from "@mui/icons-material";
import PageHeader from "../components/layout/PageHeader";
import FormPageLayout from "../components/layout/FormPageLayout";
import FormStepTransition from "../components/layout/FormStepTransition";
import PageNavigation from "../components/layout/PageNavigation";
import { useAppData } from "../state/AppDataContext";
import { getProducts } from "../api/client";
import {
  getClientCoverageCategories,
  getClientProductCoverageRanges,
  getClientProductDescriptions,
} from "../config/clients";
import { COVERAGE_CATEGORY_LABELS } from "../constants/coverage";
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
                <Chip label={badge} size="small" color="primary" />
              ) : null}
            </Stack>
            <Typography variant="body2" color="text.secondary">
              {description}
            </Typography>
            <Stack
              direction="row"
              alignItems="center"
              flexWrap="wrap"
              spacing={1}
            >
              <Typography
                variant="body2"
                sx={{ color: "success.main", fontWeight: 600 }}
              >
                {coverageText}
              </Typography>
              <Stack
                direction="row"
                spacing={0.5}
                flexWrap="wrap"
                justifyContent="flex-end"
                sx={{ ml: "auto" }}
              >
                {applicants?.map((applicant) => {
                  const Icon = applicantIcons[applicant];
                  return (
                    <Chip
                      key={applicant}
                      size="small"
                      variant="outlined"
                      icon={<Icon sx={{ color: "primary.main" }} />}
                      label={applicantLabels[applicant]}
                      sx={{
                        "& .MuiChip-icon": {
                          color: "primary.main",
                        },
                      }}
                    />
                  );
                })}
              </Stack>
            </Stack>
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
}

export default function CoverageBuilder() {
  const { data, setEligibility } = useAppData();
  const [products, setProducts] = React.useState<Product[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [selectedById, setSelectedById] = React.useState<
    Record<string, boolean>
  >({});

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

  const handleToggle = (productId: string) => {
    setSelectedById((prev) => ({ ...prev, [productId]: !prev[productId] }));
  };

  const handleContinue = () => {
    const selectedProductIds = Object.entries(selectedById)
      .filter(([, selected]) => selected)
      .map(([productId]) => productId);

    setEligibility({
      ...data.eligibility,
      coverageProductSelections: selectedProductIds,
    });
  };

  return (
    <FormPageLayout
      header={
        <PageHeader title="Select the coverage you want to apply for below." />
      }
      navigation={<PageNavigation onContinue={handleContinue} />}
    >
      <FormStepTransition>
        <Stack spacing={3}>
          {loading ? (
            <Typography variant="body2" color="text.secondary">
              Loading coverage options...
            </Typography>
          ) : (
            orderedCategories.map((category, index) => {
              const categoryProducts = groupedProducts[category] || [];
              if (categoryProducts.length === 0) return null;

              const showQuickDecisionBadge =
                category === "LI" || category === "DI";
              const popularProductId = categoryProducts.find(
                (product) => product.quickDecision,
              )?.id;

              return (
                <Accordion
                  key={category}
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
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 700,
                          color: "#5c6a7f",
                          fontSize: "1rem",
                        }}
                      >
                        {COVERAGE_CATEGORY_LABELS[category]}
                      </Typography>
                      {showQuickDecisionBadge ? (
                        <Chip
                          label="QuickDecisionTM"
                          size="small"
                          variant="outlined"
                          icon={<BoltRounded />}
                          sx={{
                            color: "success.main",
                            borderColor: "success.main",
                            "& .MuiChip-icon": {
                              color: "success.main",
                            },
                          }}
                        />
                      ) : null}
                    </Stack>
                  </AccordionSummary>
                  <AccordionDetails sx={{ px: 0, pt: 0 }}>
                    <Stack spacing={2}>
                      {categoryProducts.map((product) => {
                        const description =
                          productDescriptions[product.id] ??
                          `Coverage details for ${product.name}.`;
                        const badge =
                          popularProductId && product.id === popularProductId
                            ? "Popular"
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
              );
            })
          )}
        </Stack>
      </FormStepTransition>
    </FormPageLayout>
  );
}
