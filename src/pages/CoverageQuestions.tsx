import React from "react";
import {
  Stack,
  Typography,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Checkbox,
} from "@mui/material";
import PageHeader from "../components/layout/PageHeader";
import FormPageLayout from "../components/layout/FormPageLayout";
import FormStepTransition from "../components/layout/FormStepTransition";
import PageNavigation from "../components/layout/PageNavigation";
import { FormProvider, useForm, Controller, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import RHFRadioGroup from "../components/form/RHFRadioGroup";
import RHFTextField from "../components/form/RHFTextField";
import DateField from "../components/form/DateField";
import { useAppData } from "../state/AppDataContext";
import { useStepper } from "../state/StepperContext";
import { useScrollToFirstError } from "../hooks/useScrollToFirstError";
import { getProducts } from "../api/client";
import { TOBACCO_PRODUCTS } from "../constants/eligibility";
import { commonStyles } from "../theme/commonStyles";
import {
  buildCoverageQuestionsSchema,
  type CoverageQuestionsForm,
} from "../validation/coverageQuestions";
import type { Applicant, CoverageCategory, Product } from "../types/app";

const CATEGORY_LIFE: CoverageCategory = "LI";
const CATEGORY_DI: CoverageCategory = "DI";
const CATEGORY_OO: CoverageCategory = "OO";
const CATEGORY_SH: CoverageCategory = "SH";

export default function CoverageQuestions() {
  const { data, setEligibility } = useAppData();
  const { next, markComplete } = useStepper();
  const [products, setProducts] = React.useState<Product[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let mounted = true;
    getProducts()
      .then((fetched) => {
        if (!mounted) return;
        if (Array.isArray(fetched)) {
          setProducts(fetched);
        }
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const selectedProductIds = React.useMemo(
    () => data.eligibility?.coverageProductSelections ?? [],
    [data.eligibility?.coverageProductSelections],
  );
  const selectedProducts = React.useMemo(
    () => products.filter((product) => selectedProductIds.includes(product.id)),
    [products, selectedProductIds],
  );

  const hasCategoryForApplicant = React.useCallback(
    (category: CoverageCategory, applicant: Applicant) =>
      selectedProducts.some(
        (product) =>
          product.category === category &&
          product.eligibleApplicants.includes(applicant),
      ),
    [selectedProducts],
  );

  const applyingSpouse = data.eligibility?.applicants?.spouse ?? false;

  const hasSelfLife = hasCategoryForApplicant(CATEGORY_LIFE, "self");
  const hasSelfDi = hasCategoryForApplicant(CATEGORY_DI, "self");
  const hasSelfOo = hasCategoryForApplicant(CATEGORY_OO, "self");
  const hasSelfSh = hasCategoryForApplicant(CATEGORY_SH, "self");

  const hasSpouseLife =
    applyingSpouse && hasCategoryForApplicant(CATEGORY_LIFE, "spouse");
  const hasSpouseDi =
    applyingSpouse && hasCategoryForApplicant(CATEGORY_DI, "spouse");
  const hasSpouseSh =
    applyingSpouse && hasCategoryForApplicant(CATEGORY_SH, "spouse");

  const needsSelfGender = hasSelfLife || hasSelfDi;
  const needsSelfSmoker = hasSelfLife || hasSelfSh;
  const needsSelfDi = hasSelfDi;
  const needsSelfOo = hasSelfOo;
  const needsSelfHours = needsSelfDi || needsSelfOo;

  const needsSpouseGender = hasSpouseLife || hasSpouseDi;
  const needsSpouseSmoker = hasSpouseLife || hasSpouseSh;
  const needsSpouseDi = hasSpouseDi;
  const needsSpouseHours = needsSpouseDi;

  const showSelfSection =
    needsSelfGender || needsSelfSmoker || needsSelfDi || needsSelfOo;
  const showSpouseSection =
    applyingSpouse && (needsSpouseGender || needsSpouseSmoker || needsSpouseDi);

  const schema = React.useMemo(
    () =>
      buildCoverageQuestionsSchema({
        needsSelfGender,
        needsSpouseGender,
        needsSelfSmoker,
        needsSpouseSmoker,
        needsSelfDI: needsSelfDi,
        needsSpouseDI: needsSpouseDi,
        needsSelfOO: needsSelfOo,
        needsSelfHours,
        needsSpouseHours,
      }),
    [
      needsSelfGender,
      needsSpouseGender,
      needsSelfSmoker,
      needsSpouseSmoker,
      needsSelfDi,
      needsSpouseDi,
      needsSelfOo,
      needsSelfHours,
      needsSpouseHours,
    ],
  );

  const methods = useForm<CoverageQuestionsForm>({
    resolver: zodResolver(schema),
    mode: "onSubmit",
    reValidateMode: "onChange",
    defaultValues: {
      gender: data.eligibility?.gender,
      spouseGender: data.eligibility?.spouseGender,
      smokerSelf: data.eligibility?.smokerSelf,
      smokerSpouse: data.eligibility?.smokerSpouse,
      selfTobaccoLastUsed: data.eligibility?.selfTobaccoLastUsed ?? "",
      selfTobaccoProducts: data.eligibility?.selfTobaccoProducts ?? [],
      spouseTobaccoLastUsed: data.eligibility?.spouseTobaccoLastUsed ?? "",
      spouseTobaccoProducts: data.eligibility?.spouseTobaccoProducts ?? [],
      selfAvgIncome: data.eligibility?.selfAvgIncome ?? "",
      selfHoursPerWeek: data.eligibility?.selfHoursPerWeek ?? "",
      selfMonthlyExpenses: data.eligibility?.selfMonthlyExpenses ?? "",
      selfRespPct: data.eligibility?.selfRespPct ?? "",
      spouseAvgIncome: data.eligibility?.spouseAvgIncome ?? "",
      spouseHoursPerWeek: data.eligibility?.spouseHoursPerWeek ?? "",
    },
  });
  useScrollToFirstError(methods);

  const selfSmoker = useWatch({ control: methods.control, name: "smokerSelf" });
  const spouseSmoker = useWatch({
    control: methods.control,
    name: "smokerSpouse",
  });

  const onSubmit = (values: CoverageQuestionsForm) => {
    setEligibility({
      ...data.eligibility,
      ...values,
    });
    markComplete();
    next();
  };

  const showEmptyState = !showSelfSection && !showSpouseSection;

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit)} noValidate>
        <FormPageLayout
          header={
            <Stack spacing={2}>
              <PageHeader title="We need some more information based on your selections." />
              {Object.keys(methods.formState.errors).length > 0 && (
                <Alert severity="error">
                  Please complete the required fields below.
                </Alert>
              )}
            </Stack>
          }
          navigation={<PageNavigation />}
        >
          <FormStepTransition>
            <Stack spacing={4}>
              {loading ? (
                <Typography variant="body2" color="text.secondary">
                  Loading coverage questions...
                </Typography>
              ) : showEmptyState ? (
                <Alert severity="info">
                  No additional questions are required based on your current
                  selections.
                </Alert>
              ) : (
                <>
                  {showSelfSection && (
                    <Stack spacing={0}>
                      <Typography sx={{ ...commonStyles.sidebarText, mb: 2 }}>
                        Coverage Questions
                      </Typography>
                      <Stack spacing={3}>
                        {needsSelfGender && (
                          <RHFRadioGroup
                            name="gender"
                            label="Gender"
                            options={[
                              { label: "Male", value: "male" },
                              { label: "Female", value: "female" },
                            ]}
                            required
                          />
                        )}

                        {needsSelfSmoker && (
                          <Stack spacing={2}>
                            <RHFRadioGroup
                              name="smokerSelf"
                              label="Have you used tobacco or any nicotine substitute in any form (including nicotine patches and nicotine chewing gum)?"
                              options={[
                                { label: "Yes", value: "yes" },
                                { label: "No", value: "no" },
                              ]}
                              required
                            />

                            {selfSmoker === "yes" && (
                              <>
                                <DateField
                                  name="selfTobaccoLastUsed"
                                  label="Last Used"
                                  required
                                />

                                <Controller
                                  name="selfTobaccoProducts"
                                  control={methods.control}
                                  render={({ field, fieldState }) => (
                                    <FormControl
                                      fullWidth
                                      error={!!fieldState.error}
                                      required
                                    >
                                      <InputLabel id="self-tobacco-products-label">
                                        Product(s) Used
                                      </InputLabel>
                                      <Select
                                        {...field}
                                        labelId="self-tobacco-products-label"
                                        label="Product(s) Used"
                                        multiple
                                        value={field.value || []}
                                        renderValue={(selected) =>
                                          (selected as string[]).join(", ")
                                        }
                                      >
                                        {TOBACCO_PRODUCTS.map((product) => (
                                          <MenuItem
                                            key={product}
                                            value={product}
                                          >
                                            <Checkbox
                                              checked={
                                                field.value?.includes(
                                                  product,
                                                ) || false
                                              }
                                            />
                                            {product}
                                          </MenuItem>
                                        ))}
                                      </Select>
                                      {fieldState.error && (
                                        <FormHelperText>
                                          {fieldState.error.message}
                                        </FormHelperText>
                                      )}
                                    </FormControl>
                                  )}
                                />
                              </>
                            )}
                          </Stack>
                        )}

                        {needsSelfDi && (
                          <Stack spacing={2}>
                            <Controller
                              name="selfAvgIncome"
                              control={methods.control}
                              render={({ field, fieldState }) => (
                                <RHFTextField
                                  name={field.name}
                                  label="Average Monthly Income"
                                  required
                                  value={field.value}
                                  onChange={(e) => {
                                    const value = e.target.value.replace(
                                      /[^0-9]/g,
                                      "",
                                    );
                                    const formatted = value
                                      ? `$${parseInt(value).toLocaleString()}`
                                      : "";
                                    field.onChange(formatted);
                                  }}
                                  error={!!fieldState.error}
                                  helperText={
                                    fieldState.error?.message ||
                                    "Monthly income is asked to help determine the amount of disability coverage you may qualify for."
                                  }
                                />
                              )}
                            />
                            <RHFTextField
                              name="selfHoursPerWeek"
                              label="# Hours You Work/Week"
                              required
                            />
                          </Stack>
                        )}

                        {needsSelfOo && (
                          <Stack spacing={2}>
                            {!needsSelfDi && (
                              <RHFTextField
                                name="selfHoursPerWeek"
                                label="# Hours You Work/Week"
                                required
                              />
                            )}
                            <Controller
                              name="selfMonthlyExpenses"
                              control={methods.control}
                              render={({ field, fieldState }) => (
                                <RHFTextField
                                  name={field.name}
                                  label="Monthly Business Expenses"
                                  required
                                  value={field.value}
                                  onChange={(e) => {
                                    const value = e.target.value.replace(
                                      /[^0-9]/g,
                                      "",
                                    );
                                    const formatted = value
                                      ? `$${parseInt(value).toLocaleString()}`
                                      : "";
                                    field.onChange(formatted);
                                  }}
                                  error={!!fieldState.error}
                                  helperText={
                                    fieldState.error?.message ||
                                    "Please refer to the brochure for definition"
                                  }
                                />
                              )}
                            />
                            <Controller
                              name="selfRespPct"
                              control={methods.control}
                              render={({ field, fieldState }) => (
                                <RHFTextField
                                  name={field.name}
                                  label="% You Are Responsible For"
                                  required
                                  value={field.value}
                                  onChange={(e) => {
                                    const value = e.target.value.replace(
                                      /[^0-9]/g,
                                      "",
                                    );
                                    if (value) {
                                      let numValue = parseInt(value);
                                      if (numValue > 100) numValue = 100;
                                      field.onChange(numValue.toString());
                                    } else {
                                      field.onChange("");
                                    }
                                  }}
                                  error={!!fieldState.error}
                                  helperText={
                                    fieldState.error?.message ||
                                    'If you are incorporated, a partner or a joint tenant, include only your personal share of covered overhead. "Personal share" is defined as (a) your percentage of ownership of the business, or (b) your share of the office space if a joint tenant'
                                  }
                                />
                              )}
                            />
                          </Stack>
                        )}
                      </Stack>
                    </Stack>
                  )}

                  {showSpouseSection && (
                    <Stack spacing={0}>
                      <Typography sx={{ ...commonStyles.sidebarText, mb: 2 }}>
                        Spouse Coverage Questions
                      </Typography>
                      <Stack spacing={3}>
                        {needsSpouseGender && (
                          <RHFRadioGroup
                            name="spouseGender"
                            label="Gender"
                            options={[
                              { label: "Male", value: "male" },
                              { label: "Female", value: "female" },
                            ]}
                            required
                          />
                        )}

                        {needsSpouseSmoker && (
                          <Stack spacing={2}>
                            <RHFRadioGroup
                              name="smokerSpouse"
                              label="Have you used tobacco or any nicotine substitute in any form (including nicotine patches and nicotine chewing gum)?"
                              options={[
                                { label: "Yes", value: "yes" },
                                { label: "No", value: "no" },
                              ]}
                              required
                            />

                            {spouseSmoker === "yes" && (
                              <>
                                <DateField
                                  name="spouseTobaccoLastUsed"
                                  label="Last Used"
                                  required
                                />

                                <Controller
                                  name="spouseTobaccoProducts"
                                  control={methods.control}
                                  render={({ field, fieldState }) => (
                                    <FormControl
                                      fullWidth
                                      error={!!fieldState.error}
                                      required
                                    >
                                      <InputLabel id="spouse-tobacco-products-label">
                                        Product(s) Used
                                      </InputLabel>
                                      <Select
                                        {...field}
                                        labelId="spouse-tobacco-products-label"
                                        label="Product(s) Used"
                                        multiple
                                        value={field.value || []}
                                        renderValue={(selected) =>
                                          (selected as string[]).join(", ")
                                        }
                                      >
                                        {TOBACCO_PRODUCTS.map((product) => (
                                          <MenuItem
                                            key={product}
                                            value={product}
                                          >
                                            <Checkbox
                                              checked={
                                                field.value?.includes(
                                                  product,
                                                ) || false
                                              }
                                            />
                                            {product}
                                          </MenuItem>
                                        ))}
                                      </Select>
                                      {fieldState.error && (
                                        <FormHelperText>
                                          {fieldState.error.message}
                                        </FormHelperText>
                                      )}
                                    </FormControl>
                                  )}
                                />
                              </>
                            )}
                          </Stack>
                        )}

                        {needsSpouseDi && (
                          <Stack spacing={2}>
                            <Controller
                              name="spouseAvgIncome"
                              control={methods.control}
                              render={({ field, fieldState }) => (
                                <RHFTextField
                                  name={field.name}
                                  label="Average Monthly Income"
                                  required
                                  value={field.value}
                                  onChange={(e) => {
                                    const value = e.target.value.replace(
                                      /[^0-9]/g,
                                      "",
                                    );
                                    const formatted = value
                                      ? `$${parseInt(value).toLocaleString()}`
                                      : "";
                                    field.onChange(formatted);
                                  }}
                                  error={!!fieldState.error}
                                  helperText={
                                    fieldState.error?.message ||
                                    "Monthly income is asked to help determine the amount of disability coverage you may qualify for."
                                  }
                                />
                              )}
                            />
                            <RHFTextField
                              name="spouseHoursPerWeek"
                              label="# Hours You Work/Week"
                              required
                            />
                          </Stack>
                        )}
                      </Stack>
                    </Stack>
                  )}
                </>
              )}
            </Stack>
          </FormStepTransition>
        </FormPageLayout>
      </form>
    </FormProvider>
  );
}
