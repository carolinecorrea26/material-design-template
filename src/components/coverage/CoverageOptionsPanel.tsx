import { getCoverageOfferingRanges, orderCoveragePresentation } from "../../domain/coveragePresentation";
import { formatCoverageRange } from '../../utils/formatCoverageRange';
import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Divider,
  Stack,
  Tab,
  Tabs,
  Typography,
} from "@mui/material";
import QuickDecisionIndicator from "./QuickDecisionIndicator";
import QuickDecisionInfoBox from "../content/QuickDecisionInfoBox";
import {
  getCoverageCategories,
  getCoverageCategorySectionLabel,
} from "../../config/coverageCategories";
import type {
  CoverageApplicantId,
  CoverageCategoryId,
  CoverageDefinition,
} from "../../config/coverages/types";
import { SURFACE_SX } from "../../config/constants";


const PAGE_GRADIENT =
  "linear-gradient(135deg, #f4f8ff 0%, #ffffff 52%, #f7fbff 100%)";

export type CoverageOptionsPanelProps = {
  animateQuickDecision?: boolean;
  variant: "page" | "drawer";
  content: import("../../content/types").SiteContent;
  coverages: CoverageDefinition[];
  coverageConfig: import("../../config/clients/types").ClientCoverages;
  firstCategory?: string | null;
  featuredProduct?: string | null;
  initialCategory?: CoverageCategoryId;
};

export default function CoverageOptionsPanel({
  animateQuickDecision = false,
  variant,
  initialCategory, content, coverages, coverageConfig, featuredProduct = null, firstCategory = null,
}: CoverageOptionsPanelProps) {
  const getApplicantLabel = (applicant: CoverageApplicantId) => content.shared.applicantLabels[applicant];

  const coverageGroups = useMemo(
    () => {
      const ordered = orderCoveragePresentation(coverages, coverageConfig, featuredProduct, firstCategory);
      return ordered.categories
        .map(id => getCoverageCategories(coverageConfig.categoryNames).find(category => category.id === id)!)
        .map((category) => ({
          category,
          products: ordered.products
            .filter((coverage) => coverage.categoryId === category.id),
        }))
        .filter((group) => group.products.length > 0);
    },
    [coverages, coverageConfig, featuredProduct, firstCategory],
  );

  const [activeCategory, setActiveCategory] = useState<CoverageCategoryId>(
    initialCategory ?? coverageGroups[0]?.category.id ?? "LI",
  );

  useEffect(() => {
    if (initialCategory) {
      setActiveCategory(initialCategory);
    }
  }, [initialCategory]);

  useEffect(() => {
    if (coverageGroups.length === 0) return;

    const hasActive = coverageGroups.some(
      (group) => group.category.id === activeCategory,
    );
    if (hasActive) return;

    const fallback = coverageGroups[0].category.id;
    setActiveCategory(fallback);
  }, [activeCategory, coverageGroups]);

  if (coverageGroups.length === 0 && variant === "drawer") {
    return (
      <Typography variant="body2" color="text.secondary">
        {content.home.noCoverageCategoriesMessage}
      </Typography>
    );
  }

  const activeGroup =
    coverageGroups.find((group) => group.category.id === activeCategory) ??
    coverageGroups[0];

  const boxSx =
    variant === "page"
      ? { ...SURFACE_SX, overflow: "hidden", background: PAGE_GRADIENT }
      : {
          border: "1px solid",
          borderColor: "divider",
          borderRadius: 2,
          overflow: "hidden",
        };

  return (
    <Stack spacing={variant === "page" ? 2.5 : 0}>
      {coverages.some(product => product.underwritingType === 'QD') && <QuickDecisionInfoBox animateOnReveal={animateQuickDecision} />}

      <Box sx={boxSx}>
        {coverageGroups.length === 0 ? (
          <Box sx={{ p: { xs: 2.5, md: 3 } }}>
            <Alert severity="info">
              {content.home.noCoverageCategoriesMessage}
            </Alert>
          </Box>
        ) : (
          <Stack
            direction="row"
            divider={<Divider flexItem orientation="vertical" />}
          >
            <Box
              sx={
                variant === "page"
                  ? {
                      width: { xs: 56, md: 260 },
                      flexShrink: 0,
                      backgroundColor: {
                        xs: "transparent",
                        md: "background.default",
                      },
                    }
                  : {
                      width: 56,
                      flexShrink: 0,
                      backgroundColor: "background.default",
                    }
              }
            >
              <Tabs
                value={activeGroup?.category.id ?? false}
                onChange={(_, value: CoverageCategoryId) =>
                  setActiveCategory(value)
                }
                orientation="vertical"
                variant="standard"
                sx={
                  variant === "page"
                    ? {
                        px: 0,
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
                      }
                    : {
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
                      }
                }
              >
                {coverageGroups.map(({ category }) => {
                  const IconComponent = category.icon;
                  return (
                    <Tab
                      key={category.id}
                      value={category.id}
                      icon={<IconComponent sx={{ fontSize: "1.25rem" }} />}
                      iconPosition={variant === "page" ? "start" : undefined}
                      aria-label={category.label}
                      label={
                        variant === "page" ? (
                          <Box
                            component="span"
                            sx={{ display: { xs: "none", md: "inline" } }}
                          >
                            {category.label}
                          </Box>
                        ) : undefined
                      }
                      sx={
                        variant === "page"
                          ? {
                              gap: 1,
                              "& .MuiTab-iconWrapper": {
                                mr: { xs: 0, md: 1 },
                              },
                            }
                          : undefined
                      }
                    />
                  );
                })}
              </Tabs>
            </Box>

            <Box
              sx={
                variant === "page"
                  ? { flex: 1, p: { xs: 2.5, md: 3 } }
                  : { flex: 1, p: 2, bgcolor: "background.paper" }
              }
            >
              {activeGroup ? (
                <Stack spacing={2}>
                  <Stack spacing={variant === "page" ? 0.75 : 0.5}>
                    <Typography
                      variant={variant === "page" ? "h4" : "subtitle1"}
                      sx={variant === "drawer" ? { fontWeight: 700 } : undefined}
                    >
                      {getCoverageCategorySectionLabel(
                        activeGroup.category.id,
                        coverageConfig.categorySectionLabels,
                      )}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {
                        content.coverage.categoryDescriptions[
                          activeGroup.category.id
                        ]
                      }
                    </Typography>
                  </Stack>

                  <Divider />

                  <Stack spacing={1.5}>
                    {activeGroup.products.map((product) => (
                      <Box key={product.id} data-coverage-summary={product.id}>
                        <Stack spacing={0.4}>
                          <Typography
                            component="span"
                            sx={{
                              fontWeight: 700,
                              color: "primary.main",
                              width: "fit-content",
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
                          {product.descriptionNotice && <Typography variant="body2" color="text.secondary" component="strong" sx={{ display: 'block', fontWeight: 700 }}>{product.descriptionNotice}</Typography>}
                          <Typography variant="caption" color="text.secondary">{content.home.availableForLabel}</Typography>
                          <Box component="dl" sx={{ m: 0, display: 'grid', rowGap: 0.5 }}>
                            {getCoverageOfferingRanges(product).map(range => <Box component="div" key={range.applicant} data-coverage-applicant={range.applicant}
                              sx={{ display: 'grid', gridTemplateColumns: { xs: 'minmax(0, 1fr)', sm: 'max-content minmax(0, 1fr)' }, columnGap: 1 }}>
                              <Typography component="dt" variant="caption" color="text.secondary">{getApplicantLabel(range.applicant)}</Typography>
                              <Typography component="dd" variant="caption" color="text.secondary" sx={{ m: 0, minWidth: 0 }}>{formatCoverageRange(range)}</Typography>
                            </Box>)}
                          </Box>
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
  );
}
