import * as React from "react";
import { Box, Stack, Typography, Chip } from "@mui/material";
import { BoltRounded } from "@mui/icons-material";
import PageHeader from "../components/layout/PageHeader";
import FormPageLayout from "../components/layout/FormPageLayout";
import FormStepTransition from "../components/layout/FormStepTransition";
import PageNavigation from "../components/layout/PageNavigation";
import CheckboxField from "../components/form/CheckboxField";
import { useAppData } from "../state/AppDataContext";
import { getProducts } from "../api/client";
import { getClientCoverageCategories } from "../config/clients";
import { COVERAGE_CATEGORY_LABELS } from "../constants/coverage";
import { PRODUCT_LOOKUP } from "../constants/getStartedProducts";
import CoverageIcon from "../utils/coverageIcons";
import type { Product, Applicant, CoverageCategory } from "../types/app";

const applicantLabels: Record<Applicant, string> = {
  self: "Member",
  spouse: "Spouse",
  child: "Child",
};

type SelectionKey = `${string}:${Applicant}`;

type GroupedProducts = Record<CoverageCategory, Product[]>;

export default function CoverageBuilder() {
  const { data, setEligibility } = useAppData();
  const [products, setProducts] = React.useState<Product[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [selectedByKey, setSelectedByKey] = React.useState<
    Record<SelectionKey, boolean>
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

  const handleToggle = (productId: string, applicant: Applicant) => {
    const key = `${productId}:${applicant}` as SelectionKey;
    setSelectedByKey((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleContinue = () => {
    const selectedProductIds = Object.entries(selectedByKey)
      .filter(([, selected]) => selected)
      .map(([key]) => key.split(":")[0]);
    const uniqueProductIds = Array.from(new Set(selectedProductIds));

    setEligibility({
      ...data.eligibility,
      coverageProductSelections: uniqueProductIds,
    });
  };

  return (
    <FormPageLayout
      header={
        <PageHeader
          title="Build your coverage"
          notes={
            <Typography color="text.secondary" sx={{ maxWidth: "80ch" }}>
              Below are the available coverage options based on your
              eligibility. Please add the coverage options you wish to apply for
              to your cart.
            </Typography>
          }
        />
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
            orderedCategories.map((category) => {
              const categoryProducts = groupedProducts[category] || [];
              if (categoryProducts.length === 0) return null;

              return (
                <Box key={category} sx={{ display: "grid", gap: 2 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Box
                      sx={{
                        width: 32,
                        height: 32,
                        borderRadius: "50%",
                        bgcolor: "rgba(0, 73, 187, 0.1)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <CoverageIcon
                        category={category}
                        fontSize="small"
                        sx={{ color: "#0049bb" }}
                      />
                    </Box>
                    <Typography
                      variant="body2"
                      sx={{ fontWeight: 700, color: "text.primary" }}
                    >
                      {COVERAGE_CATEGORY_LABELS[category]}
                    </Typography>
                  </Box>
                  <Stack spacing={2}>
                    {categoryProducts.map((product) => {
                      const productMeta = PRODUCT_LOOKUP[product.id];
                      const description =
                        productMeta?.coverageHighlight ??
                        "Coverage details available in the brochure.";

                      return (
                        <Box
                          key={product.id}
                          sx={{
                            border: 1,
                            borderColor: "divider",
                            borderRadius: 2,
                            p: 2,
                            bgcolor: "background.paper",
                          }}
                        >
                          <Stack spacing={1.5}>
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 1,
                                flexWrap: "wrap",
                              }}
                            >
                              <Typography variant="body2" fontWeight={700}>
                                {product.name}
                              </Typography>
                              {product.quickDecision ? (
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
                            </Box>
                            <Typography variant="body2" color="text.secondary">
                              {description}
                            </Typography>
                            <Stack
                              direction={{ xs: "column", sm: "row" }}
                              spacing={1}
                              flexWrap="wrap"
                              useFlexGap
                            >
                              {product.eligibleApplicants.map((applicant) => {
                                const key =
                                  `${product.id}:${applicant}` as SelectionKey;
                                return (
                                  <CheckboxField
                                    key={key}
                                    checked={!!selectedByKey[key]}
                                    onChange={() =>
                                      handleToggle(product.id, applicant)
                                    }
                                    label={`Add for ${applicantLabels[applicant]}`}
                                  />
                                );
                              })}
                            </Stack>
                          </Stack>
                        </Box>
                      );
                    })}
                  </Stack>
                </Box>
              );
            })
          )}
        </Stack>
      </FormStepTransition>
    </FormPageLayout>
  );
}
