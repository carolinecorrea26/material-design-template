import React from "react";
import {
  Stack,
  Typography,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  IconButton,
  Box,
  Alert,
  FormHelperText,
  Button,
  Card,
  CardContent,
  Chip,
  Collapse,
  Divider,
  Switch,
  alpha,
} from "@mui/material";
import {
  BlockOutlined,
  People,
  Person,
  ChildFriendly,
  Close as CloseIcon,
  OfflineBoltRounded,
  PolicyOutlined,
  ExpandLess,
  ExpandMore,
  PublishedWithChangesRounded,
  AccessTimeFilledRounded,
} from "@mui/icons-material";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";
import { useAppData } from "../state/AppDataContext";
import { useStepper } from "../state/StepperContext";
import { getClientFeatures } from "../config/clients";
import { COVERAGE_CARDS } from "../constants/getStartedProducts";
import { EligibilityForm, GetStartedFormValues } from "../types/app";
import { EligibilitySchema } from "../validation/eligibility";
import { buildSelectionSummary } from "../utils/coverage";
import { getApplicantChipStyles } from "../utils/applicantChips";
import { formatProductHighlight } from "../utils/previewFormatting";
import {
  APPLICANT_OPTIONS,
  APPLICANT_ERROR_MESSAGE,
} from "../constants/formOptions";
import { ApplicantType, CoverageProductConfig } from "../types/app";
import PageNavigation from "../components/common/PageNavigation";
import PageHeader from "../components/layout/PageHeader";

const SECTION_LABEL_STYLES = {
  display: "block",
  fontWeight: 700,
  fontSize: "0.75rem",
  color: "text.secondary",
  letterSpacing: 1,
} as const;

export default function GetStartedOld() {
  const { data, setEligibility, setGetStarted } = useAppData();
  const { markComplete } = useStepper();
  const navigate = useNavigate();
  const features = React.useMemo(() => getClientFeatures(), []);
  const nextPathAfterGetStarted = features.showMembershipPage
    ? "/membership"
    : "/eligibility";
  const firstProductId = React.useMemo(() => {
    for (const card of COVERAGE_CARDS) {
      if (card.products.length > 0) {
        return card.products[0].id;
      }
    }
    return undefined;
  }, []);
  const firstProductRef = React.useRef<HTMLInputElement | null>(null);
  const [showIneligibleDialog, setShowIneligibleDialog] = React.useState(false);

  const savedApplicantSelections =
    data.getStarted?.productApplicantSelections ?? {};

  const methods = useForm<GetStartedFormValues>({
    resolver: zodResolver(EligibilitySchema) as any,
    mode: "onSubmit",
    reValidateMode: "onChange",
    defaultValues: data.eligibility
      ? {
          ...data.eligibility,
          productApplicantSelections: savedApplicantSelections,
        }
      : {
          isMember: undefined,
          title: "",
          firstName: "",
          middleInitial: "",
          lastName: "",
        },
  });

  const {
    watch,
    setValue,
    control,
    formState: { errors },
  } = methods;

  const coverageSelections = watch("coverageProductSelections") ?? [];
  const applicantSelections = watch("productApplicantSelections") ?? {};
  const applicantFilter = watch("applicantFilter") ?? APPLICANT_OPTIONS;
  const quickDecisionOnly = watch("quickDecisionOnly") ?? false;

  const productApplicantSelections = React.useMemo(() => {
    const selections: Record<string, ApplicantType[]> = {};
    for (const productId of coverageSelections) {
      selections[productId] = applicantSelections[productId] ?? [];
    }
    return selections;
  }, [coverageSelections, applicantSelections]);

  const productApplicantErrors = React.useMemo(() => {
    const errors: Record<string, string> = {};
    for (const productId of coverageSelections) {
      const applicants = productApplicantSelections[productId] ?? [];
      if (applicants.length === 0) {
        errors[productId] = APPLICANT_ERROR_MESSAGE;
      }
    }
    return errors;
  }, [coverageSelections, productApplicantSelections]);

  const handleToggleProduct = React.useCallback(
    (productId: string) => {
      const currentSelections = coverageSelections;
      const isSelected = currentSelections.includes(productId);
      const newSelections = isSelected
        ? currentSelections.filter((id) => id !== productId)
        : [...currentSelections, productId];

      setValue("coverageProductSelections", newSelections);

      // Clear applicant selections when product is deselected
      if (isSelected) {
        setValue(`productApplicantSelections.${productId}`, []);
      }
    },
    [coverageSelections, setValue],
  );

  const handleToggleApplicant = React.useCallback(
    (productId: string, applicant: ApplicantType) => {
      const currentApplicants = applicantSelections[productId] ?? [];
      const isSelected = currentApplicants.includes(applicant);
      const newApplicants = isSelected
        ? currentApplicants.filter((a) => a !== applicant)
        : [...currentApplicants, applicant];

      setValue(`productApplicantSelections.${productId}`, newApplicants);
    },
    [applicantSelections, setValue],
  );

  const validateProductApplicants = React.useCallback(
    (
      selectedProducts: string[],
      selections: Record<string, ApplicantType[]>,
    ) => {
      for (const productId of selectedProducts) {
        const applicants = selections[productId] ?? [];
        if (applicants.length === 0) {
          return false;
        }
      }
      return true;
    },
    [],
  );

  const handleToggleSection = React.useCallback((sectionId: string) => {
    setSectionExpanded((prev) => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }));
  }, []);

  const handleToggleApplicantFilter = React.useCallback(
    (label: ApplicantType) => {
      setApplicantFilter((prev) =>
        prev.includes(label)
          ? prev.filter((item) => item !== label)
          : [...prev, label],
      );
    },
    [],
  );

  const handleToggleQuickDecision = React.useCallback(() => {
    setQuickDecisionOnly((prev) => !prev);
  }, []);

  const productMatchesFilters = React.useCallback(
    (product: CoverageProductConfig) => {
      if (quickDecisionOnly && !product.quickDecision) {
        return false;
      }
      return product.applicants.some((applicant) =>
        applicantFilter.includes(applicant),
      );
    },
    [applicantFilter, quickDecisionOnly],
  );

  React.useEffect(() => {
    const visibleProducts = COVERAGE_CARDS.flatMap((card) =>
      card.products.filter(productMatchesFilters),
    );
    const firstVisibleProduct = visibleProducts[0];
    if (firstVisibleProduct && firstProductRef.current) {
      firstProductRef.current.focus();
    }
  }, [applicantFilter, quickDecisionOnly, productMatchesFilters]);

  // DevTools: Fill form with test data
  React.useEffect(() => {
    const handleFillForm = () => {
      // Basic self information - set membership based on client
      const membershipValue = ACTIVE_CLIENT_ID === "ama" ? "physician" : "yes";

      const filledData: EligibilityForm = {
        isMember: membershipValue,
        firstName: "John",
        middleInitial: "A",
        lastName: "Doe",
        lastNameAtBirth: "Doe",
        email: "john.doe@example.com",
        phone: "555-123-4567",
        birthday: "1980-01-01",
        gender: "male",
        title: "Dr",
        suffix: "",
        address: {
          street1: "123 Main St",
          street2: "",
          city: "Anytown",
          state: "NY",
          zip: "12345",
        },
        emergencyContact: {
          firstName: "Jane",
          lastName: "Doe",
          relationship: "spouse",
          phone: "555-987-6543",
        },
        beneficiary: {
          firstName: "Jane",
          lastName: "Doe",
          relationship: "spouse",
        },
        employment: {
          employer: "Medical Center",
          occupation: "Physician",
          yearsEmployed: 10,
        },
        spouse: {
          firstName: "Jane",
          lastName: "Doe",
          birthday: "1982-03-15",
          gender: "female",
        },
        updatedAt: new Date().toISOString(),
      };

      setEligibility(filledData);
      setGetStarted({
        coverageProductSelections: ["li-term10", "di-basic"],
        productApplicantSelections: {
          "li-term10": ["self"],
          "di-basic": ["self"],
        },
        applicantFilter: APPLICANT_OPTIONS,
        quickDecisionOnly: false,
        updatedAt: new Date().toISOString(),
      });
    };

    window.addEventListener("devtools:fillform", handleFillForm);
    return () =>
      window.removeEventListener("devtools:fillform", handleFillForm);
  }, [methods]);

  const onSubmit = (values: GetStartedFormValues) => {
    const selectedProducts = values.coverageProductSelections ?? [];
    if (selectedProducts.length === 0) {
      methods.setError("coverageProductSelections", {
        type: "manual",
        message: "Please select at least one product to continue.",
      });
      return;
    }
    methods.clearErrors("coverageProductSelections");

    const applicantSelections = values.productApplicantSelections ?? {};
    if (!validateProductApplicants(selectedProducts, applicantSelections)) {
      return;
    }

    const summary = buildSelectionSummary(
      selectedProducts,
      applicantSelections,
    );

    const { productApplicantSelections, ...eligibilityPayload } = values;
    setGetStarted(summary);
    setEligibility(eligibilityPayload as EligibilityForm);
    markComplete();
    navigate(nextPathAfterGetStarted);
  };

  const handleFormSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit(methods.getValues());
  };

  const visibleCoverageCards = React.useMemo(() => {
    return COVERAGE_CARDS.filter((card) =>
      card.products.some(productMatchesFilters),
    );
  }, [productMatchesFilters]);

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleFormSubmit} noValidate>
        <Stack spacing={2}>
          <PageHeader
            title="Start your insurance application"
            notes={
              <Stack spacing={2}>
                <Typography>
                  This is an application for group insurance offered through
                  your association.
                  <br />
                  Group insurance provides coverage at group rates and may have
                  simpler eligibility than individual policies.
                </Typography>
                <Stack direction="row" spacing={1}>
                  <Chip
                    icon={
                      <PublishedWithChangesRounded sx={{ fontSize: "1rem" }} />
                    }
                    label="Progress is saved automatically"
                    variant="outlined"
                    sx={{
                      bgcolor: "white",
                      borderColor: "grey.300",
                      "& .MuiChip-icon": { color: "primary.main" },
                    }}
                  />
                  <Chip
                    icon={<AccessTimeFilledRounded sx={{ fontSize: "1rem" }} />}
                    label="Typically takes 20–30 minutes"
                    variant="outlined"
                    sx={{
                      bgcolor: "white",
                      borderColor: "grey.300",
                      "& .MuiChip-icon": { color: "primary.main" },
                    }}
                  />
                </Stack>
                <Box>
                  <Button
                    variant="text"
                    size="small"
                    onClick={handleToggleCoverageOptions}
                    sx={{
                      textTransform: "none",
                      color: "primary.main",
                      fontSize: "0.875rem",
                      fontWeight: 500,
                      p: 0,
                      minHeight: "auto",
                      "&:hover": {
                        bgcolor: "transparent",
                        color: "primary.dark",
                      },
                    }}
                  >
                    {showCoverageOptions
                      ? "- Click to hide coverage options"
                      : "+ Click to see coverage options"}
                  </Button>
                  {showCoverageOptions && (
                    <Card elevation={1} sx={{ mt: 1 }}>
                      <CardContent sx={{ p: 2 }}>
                        <Stack spacing={1}>
                          {COVERAGE_CARDS.map((card) => {
                            const isExpanded =
                              subheaderExpanded[card.id] ?? false;
                            return (
                              <Box key={card.id}>
                                <Button
                                  fullWidth
                                  variant="text"
                                  endIcon={
                                    isExpanded ? <ExpandLess /> : <ExpandMore />
                                  }
                                  onClick={() =>
                                    handleToggleSubheaderSection(card.id)
                                  }
                                  sx={{
                                    justifyContent: "space-between",
                                    py: 1,
                                    px: 2,
                                    textTransform: "none",
                                    color: "text.primary",
                                    fontWeight: 600,
                                    borderRadius: 1,
                                    "&:hover": {
                                      bgcolor: "rgba(0, 0, 0, 0.04)",
                                    },
                                  }}
                                >
                                  <Typography
                                    variant="overline"
                                    sx={SECTION_LABEL_STYLES}
                                  >
                                    {card.title}
                                  </Typography>
                                </Button>
                                <Collapse
                                  in={isExpanded}
                                  timeout={300}
                                  unmountOnExit
                                >
                                  <Box sx={{ pl: 4, pr: 2, pb: 1 }}>
                                    <Stack spacing={0.5}>
                                      {card.products.map((product) => (
                                        <Typography
                                          key={product.id}
                                          variant="body2"
                                          color="text.secondary"
                                          sx={{ py: 0.25 }}
                                        >
                                          • {product.name}
                                        </Typography>
                                      ))}
                                    </Stack>
                                  </Box>
                                </Collapse>
                              </Box>
                            );
                          })}
                        </Stack>
                      </CardContent>
                    </Card>
                  )}
                </Box>
              </Stack>
            }
            timeEstimate={1}
          />

          <Stack
            spacing={1.5}
            direction={{ xs: "column", md: "row" }}
            alignItems={{ md: "center" }}
            justifyContent="flex-start"
            gap="12px"
          >
            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={1}
              alignItems={{ sm: "center" }}
            >
              <Typography
                variant="overline"
                sx={{
                  display: "block",
                  fontWeight: 700,
                  fontSize: "0.75rem",
                  color: "text.secondary",
                  letterSpacing: 1,
                  marginRight: "0.25rem",
                }}
              >
                FILTER BY:
              </Typography>
              <Stack direction="row" spacing={1} alignItems="center">
                <OfflineBoltRounded
                  sx={{ fontSize: 18, color: "success.main" }}
                />
                <Typography
                  variant="body2"
                  fontWeight={600}
                  color="text.primary"
                >
                  QuickDecision
                </Typography>
                <Switch
                  checked={quickDecisionOnly}
                  onChange={handleToggleQuickDecision}
                  inputProps={{ "aria-label": "QuickDecision filter" }}
                />
              </Stack>
            </Stack>
            <Divider
              flexItem
              orientation="vertical"
              sx={{ display: { xs: "none", md: "block" }, height: 32 }}
            />
            <Divider
              orientation="horizontal"
              sx={{ display: { xs: "block", md: "none" } }}
            />
            <Stack direction="row" spacing={1} flexWrap="wrap">
              {APPLICANT_OPTIONS.map((option) => {
                const selected = applicantFilter.includes(option);
                const styles = getApplicantChipStyles(option);
                return (
                  <Chip
                    key={option}
                    label={option}
                    clickable
                    variant="outlined"
                    onClick={() => handleToggleApplicantFilter(option)}
                    sx={{
                      borderColor: selected ? styles.borderColor : "divider",
                      bgcolor: selected ? styles.bgcolor : "transparent",
                      color: selected ? styles.color : "text.secondary",
                      fontWeight: selected ? 600 : 400,
                    }}
                  />
                );
              })}
            </Stack>
          </Stack>

          <Card elevation={2}>
            <CardContent sx={{ p: { xs: 2, md: 3 } }}>
              <Stack spacing={4}>
                {visibleCoverageCards.length === 0 && (
                  <Box
                    sx={{
                      border: "1px dashed",
                      borderColor: "divider",
                      borderRadius: 2,
                      p: 3,
                      textAlign: "center",
                      color: "text.secondary",
                      fontStyle: "italic",
                    }}
                  >
                    No products match the current filters.
                  </Box>
                )}
                {visibleCoverageCards.map((card, index) => {
                  const IconComponent = card.icon;
                  const isExpanded = sectionExpanded[card.id] ?? false;
                  const visibleProducts = card.products.filter(
                    productMatchesFilters,
                  );

                  return (
                    <Stack key={card.id} spacing={2.5}>
                      <Stack spacing={0.5}>
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: 2,
                          }}
                        >
                          <Typography
                            variant="h5"
                            sx={{
                              fontWeight: 600,
                              textTransform: "uppercase",
                              fontSize: "0.875rem",
                              letterSpacing: "0.5px",
                              // color: '#486499'
                            }}
                          >
                            {card.title}
                          </Typography>
                          <IconButton
                            aria-label={`Toggle ${card.title}`}
                            onClick={() => handleToggleSection(card.id)}
                            size="small"
                          >
                            {isExpanded ? <ExpandLess /> : <ExpandMore />}
                          </IconButton>
                        </Box>
                        <Typography variant="body2" color="text.secondary">
                          {card.description}
                        </Typography>
                      </Stack>

                      <Collapse in={isExpanded} timeout={400} unmountOnExit>
                        <FormGroup>
                          {visibleProducts.map((product) => {
                            const selected = (
                              coverageSelections ?? []
                            ).includes(product.id);
                            const selectedApplicants =
                              applicantSelections[product.id] ?? [];
                            return (
                              <Box
                                key={product.id}
                                sx={{
                                  mb: 1.5,
                                  border: "1px solid lightgray",
                                  borderRadius: "15px",
                                  padding: "1rem 0.5rem",
                                }}
                              >
                                <FormControlLabel
                                  control={
                                    <Checkbox
                                      checked={selected}
                                      onChange={() =>
                                        handleToggleProduct(product.id)
                                      }
                                      inputRef={
                                        product.id === firstProductId
                                          ? firstProductRef
                                          : undefined
                                      }
                                    />
                                  }
                                  sx={{
                                    alignItems: "flex-start",
                                    m: 0,
                                    py: 1,
                                  }}
                                  label={
                                    <Box>
                                      <Stack
                                        direction={{
                                          xs: "column",
                                          md: "row",
                                        }}
                                        spacing={1}
                                        alignItems={{ md: "center" }}
                                      >
                                        <Typography
                                          sx={{
                                            fontWeight: 600,
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 0.75,
                                          }}
                                        >
                                          <span>{product.name}</span>
                                          {product.quickDecision && (
                                            <OfflineBoltRounded
                                              sx={{
                                                fontSize: 18,
                                                color: "success.main",
                                              }}
                                            />
                                          )}
                                        </Typography>
                                        <Stack
                                          direction="row"
                                          spacing={1}
                                          flexWrap="wrap"
                                          mt={{ xs: 0.5, md: 0 }}
                                        >
                                          {product.applicants.map(
                                            (applicant) => {
                                              const chipStyles =
                                                getApplicantChipStyles(
                                                  applicant,
                                                );
                                              return (
                                                <Chip
                                                  key={applicant}
                                                  label={applicant}
                                                  size="small"
                                                  sx={{
                                                    bgcolor: chipStyles.bgcolor,
                                                    color: chipStyles.color,
                                                    border: "1px solid",
                                                    borderColor:
                                                      chipStyles.borderColor,
                                                  }}
                                                />
                                              );
                                            },
                                          )}
                                        </Stack>
                                      </Stack>
                                      {formatProductHighlight(
                                        product.coverageHighlight,
                                        product.monthlyEstimate,
                                      ) && (
                                        <Typography
                                          variant="caption"
                                          color="text.secondary"
                                          sx={{ mt: 0.5, display: "block" }}
                                        >
                                          {formatProductHighlight(
                                            product.coverageHighlight,
                                            product.monthlyEstimate,
                                          )}
                                        </Typography>
                                      )}
                                    </Box>
                                  }
                                />

                                <Collapse
                                  in={selected}
                                  timeout={260}
                                  unmountOnExit
                                >
                                  <Box sx={{ pl: { xs: 0, md: 5 }, pt: 1 }}>
                                    <Typography
                                      variant="overline"
                                      sx={{
                                        display: "block",
                                        fontWeight: 700,
                                        fontSize: "0.75rem",
                                        color: "text.secondary",
                                        letterSpacing: 1,
                                      }}
                                    >
                                      WHO NEEDS THIS COVERAGE?
                                    </Typography>
                                    <Stack
                                      direction={{
                                        xs: "column",
                                        sm: "row",
                                      }}
                                      spacing={1.5}
                                      flexWrap="wrap"
                                      mt={1}
                                    >
                                      {product.applicants.map((applicant) => {
                                        const IconComponent =
                                          applicantIcons[applicant];
                                        const label =
                                          applicantLabelMap[applicant];
                                        const isActive =
                                          selectedApplicants.includes(
                                            applicant,
                                          );
                                        return (
                                          <Button
                                            key={applicant}
                                            type="button"
                                            variant="outlined"
                                            onClick={() =>
                                              handleToggleApplicant(
                                                product.id,
                                                applicant,
                                              )
                                            }
                                            sx={(theme) => ({
                                              textTransform: "none",
                                              minWidth: 115,
                                              minHeight: 86,
                                              borderRadius: 2,
                                              flexDirection: "column",
                                              alignItems: "center",
                                              gap: 0.5,
                                              px: 0,
                                              py: 0,
                                              borderWidth: 1,
                                              borderColor: isActive
                                                ? theme.palette.primary.main
                                                : theme.palette.divider,
                                              backgroundColor: isActive
                                                ? alpha(
                                                    theme.palette.primary.main,
                                                    0.08,
                                                  )
                                                : "transparent",
                                              boxShadow: "none",
                                              transition:
                                                "background-color 0.2s ease, border-color 0.2s ease",
                                              "&:hover": {
                                                backgroundColor: alpha(
                                                  theme.palette.primary.main,
                                                  0.12,
                                                ),
                                                borderColor:
                                                  theme.palette.primary.main,
                                                boxShadow: "none",
                                              },
                                            })}
                                          >
                                            <IconComponent
                                              sx={{
                                                fontSize: 28,
                                                color: isActive
                                                  ? "primary.main"
                                                  : "text.secondary",
                                              }}
                                            />
                                            <Typography
                                              variant="subtitle2"
                                              fontWeight={400}
                                              textAlign="center"
                                            >
                                              {label}
                                            </Typography>
                                          </Button>
                                        );
                                      })}
                                    </Stack>
                                    {productApplicantErrors[product.id] && (
                                      <FormHelperText error sx={{ mt: 1 }}>
                                        {productApplicantErrors[product.id]}
                                      </FormHelperText>
                                    )}
                                  </Box>
                                </Collapse>
                              </Box>
                            );
                          })}
                        </FormGroup>
                      </Collapse>

                      {index < COVERAGE_CARDS.length - 1 && (
                        <Box
                          sx={{
                            width: "100%",
                            mx: "auto",
                            borderTop: "1px solid",
                            borderColor: "divider",
                            opacity: 0.6,
                          }}
                        />
                      )}
                    </Stack>
                  );
                })}
              </Stack>
            </CardContent>
          </Card>

          {methods.formState.errors.coverageProductSelections && (
            <Alert severity="error">
              {methods.formState.errors.coverageProductSelections.message}
            </Alert>
          )}

          <PageNavigation
            hasUnsavedChanges={() => {
              const formValues = methods.getValues();
              const hasData =
                formValues.firstName ||
                formValues.lastName ||
                formValues.email ||
                formValues.birthday;
              return methods.formState.isDirty || !!hasData;
            }}
          />
        </Stack>
      </form>

      <Dialog
        open={showIneligibleDialog}
        onClose={() => setShowIneligibleDialog(false)}
        aria-labelledby="ineligible-dialog-title"
      >
        <DialogTitle
          id="ineligible-dialog-title"
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            pb: 1,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <BlockOutlined color="error" />
            Ineligible for Coverage
          </Box>
          <IconButton
            edge="end"
            onClick={() => setShowIneligibleDialog(false)}
            aria-label="close"
            size="small"
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            We're sorry, but only members are eligible for coverage. If you need
            more information, please contact the Plan Administrator at the
            address below. To cancel this session, simply close this window.
          </DialogContentText>
        </DialogContent>
      </Dialog>
    </FormProvider>
  );
}
