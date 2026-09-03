import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Divider,
  Link,
  Stack,
  Tab,
  Tabs,
  Typography,
} from "@mui/material";
import QuickDecisionIndicator from "./QuickDecisionIndicator";
import QuickDecisionInfoBox from "../content/QuickDecisionInfoBox";
import { getContent } from "../../content";
import { getActiveClient } from "../../config/client/getActiveClient";
import { getActiveClientCoverages } from "../../config/client/getActiveClientCoverages";
import {
  coverageCategories,
  getCoverageCategorySectionLabel,
} from "../../config/coverageCategories";
import type {
  CoverageApplicantId,
  CoverageCategoryId,
  CoverageDefinition,
} from "../../config/coverages/types";
import { formatUSD } from "../../utils/formatUSD";
import { SURFACE_SX } from "../../config/constants";

const content = getContent();

const PAGE_GRADIENT =
  "linear-gradient(135deg, #f4f8ff 0%, #ffffff 52%, #f7fbff 100%)";

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

export type CoverageOptionsPanelProps = {
  variant: "page" | "drawer";
  initialCategory?: CoverageCategoryId;
};

export default function CoverageOptionsPanel({
  variant,
  initialCategory,
}: CoverageOptionsPanelProps) {
  const client = getActiveClient();
  const coverages = useMemo(() => getActiveClientCoverages(), []);

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

    const fallback = coverageGroups.some(
      (group) => group.category.id === "LI",
    )
      ? "LI"
      : coverageGroups[0].category.id;
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
      <QuickDecisionInfoBox />

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
                        md: "background.subtle",
                      },
                    }
                  : {
                      width: 56,
                      flexShrink: 0,
                      backgroundColor: "background.subtle",
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
                      aria-label={
                        variant === "drawer" ? category.label : undefined
                      }
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
                        client.coverages.categorySectionLabels,
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
                          <Typography variant="body2" color="text.secondary">
                            {product.description ?? product.definition}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {formatCoverageRange(product)} ·{" "}
                            {content.home.availableForLabel}{" "}
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
  );
}
