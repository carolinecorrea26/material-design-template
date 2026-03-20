import * as React from "react";
import {
  Stack,
  Typography,
  Alert,
  Box,
  Card,
  CardContent,
  Button,
  FormLabel,
} from "@mui/material";
import PageHeader from "../components/layout/PageHeader";
import PageNavigation from "../components/layout/PageNavigation";
import FormStepTransition from "../components/layout/FormStepTransition";
import FormPageLayout from "../components/layout/FormPageLayout";
import { FormProvider, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import RHFTextField from "../components/form/RHFTextField";
import RHFRadioGroup from "../components/form/RHFRadioGroup";
import RHFSelect from "../components/form/RHFSelect";
import RHFCurrencyField from "../components/form/RHFCurrencyField";
import RHFCheckbox from "../components/form/RHFCheckbox";
import DateField from "../components/form/DateField";
import { ProfileSchema, type ProfileForm } from "../validation/profile";
import { useAppData } from "../state/AppDataContext";
import { useStepper } from "../state/StepperContext";
import { useNavigate } from "react-router-dom";
import { useScrollToFirstError } from "../hooks/useScrollToFirstError";
import { Person, People, FamilyRestroom, Payment } from "@mui/icons-material";
import { commonStyles } from "../theme/commonStyles";

export default function Profile() {
  const { data, setProfile } = useAppData();
  const { markComplete } = useStepper();
            
                                  </Typography>

                                  <Stack spacing={2}>
                                    <Box>
                                      <FormLabel required>
                                        How long have you been self-employed?
                                      </FormLabel>
                                      <RHFTextField
                                        name="selfEmploymentDuration"
                                        required
                                      />
                                    </Box>

                                    <RHFRadioGroup
                                      name="isWorkingFromHome"
                                      label="Are you working out of your home?"
                                      options={[
                                        { label: "Yes", value: "yes" },
                                        { label: "No", value: "no" },
                                      ]}
                                      required
                                    />

                                    {methods.watch("isWorkingFromHome") ===
                                      "yes" && (
                                      <>
                                        <RHFRadioGroup
                                          name="hasWorkOutsideHome"
                                          label='If "Yes", is any work conducted outside of the home?'
                                          options={[
                                            { label: "Yes", value: "yes" },
                                            { label: "No", value: "no" },
                                          ]}
                                          required
                                        />

                                        <Box>
                                          <FormLabel required>
                                            Please explain and/or provide
                                            details including average number of
                                            days per week clients are seen
                                          </FormLabel>
                                          <RHFTextField
                                            name="workDetailsExplanation"
                                            multiline
                                            rows={3}
                                            required
                                            fullWidth
                                          />
                                        </Box>
                                      </>
                                    )}
                                  </Stack>
                                </Box>
                              </>
                            )}
                          </Stack>
                        </Stack>
                      </CardContent>
                    </Card>
                  </Stack>
                </CardContent>
              </Card>

              {/* Main Other Coverage Card */}
              <Card sx={commonStyles.categoryCard}>
                <CardContent>
                  <Stack spacing={2}>
                    {/* Category Header */}
                    <Box sx={commonStyles.coverageCategoryHeader}>
                      <Typography
                        variant="h4"
                        sx={commonStyles.coverageCategoryTitle}
                      >
                        Other Coverage
                      </Typography>
                    </Box>

                    <Alert severity="info">
                      Please indicate if you currently hold an active insurance
                      policy with any carrier, including through your employer.
                      Other insurance you have today can impact the amount of
                      coverage you may be approved for.
                    </Alert>

                    {/* Your Other Coverage Card */}
                    <Card variant="outlined" sx={commonStyles.coverageCard}>
                      <CardContent>
                        <Stack spacing={2}>
                          {/* Section Header */}
                          <Box>
                            <Stack
                              direction="row"
                              spacing={1.5}
                              alignItems="center"
                            >
                              <Box sx={commonStyles.iconCircle}>
                                <Person color="primary" />
                              </Box>
                              <Typography variant="h6">
                                Your Other Coverage
                              </Typography>
                            </Stack>
                          </Box>

                          <Stack spacing={3}>
                            {/* Group Life Insurance Section */}
                            <Box>
                              <Typography
                                variant="h6"
                                sx={{ mb: 2, fontWeight: 600 }}
                              >
                                Group Life Insurance
                              </Typography>

                              <Stack spacing={2}>
                                <RHFRadioGroup
                                  name="hasOtherLifeInsurance"
                                  label="Do you have other life insurance in force?"
                                  options={[
                                    { label: "Yes", value: "yes" },
                                    { label: "No", value: "no" },
                                  ]}
                                  required
                                />

                                <RHFRadioGroup
                                  name="hasLifeInsurancePending"
                                  label="Do you have other life insurance applications pending?"
                                  options={[
                                    { label: "Yes", value: "yes" },
                                    { label: "No", value: "no" },
                                  ]}
                                  required
                                />

                                {/* Conditional fields - only show if has other life insurance */}
                                {methods.watch("hasOtherLifeInsurance") ===
                                  "yes" && (
                                  <>
                                    <Box>
                                      <Typography
                                        variant="body2"
                                        sx={{ mb: 1, fontWeight: 500 }}
                                      >
                                        What is the total amount in all
                                        companies?{" "}
                                        <Box
                                          component="span"
                                          sx={{ color: "error.main" }}
                                        >
                                          *
                                        </Box>
                                      </Typography>
                                      <RHFCurrencyField
                                        name="otherLifeInsuranceAmount"
                                        required
                                        fullWidth
                                      />
                                    </Box>

                                    <RHFRadioGroup
                                      name="lifeInsuranceReplacement"
                                      label="Is the life insurance applied for intended to replace, discontinue or change an existing life insurance policy or annuity contract?"
                                      options={[
                                        { label: "Yes", value: "yes" },
                                        { label: "No", value: "no" },
                                      ]}
                                      required
                                    />
                                  </>
                                )}

                                {/* Conditional fields - only show if has pending applications */}
                                {methods.watch("hasLifeInsurancePending") ===
                                  "yes" && (
                                  <Stack
                                    direction={{ xs: "column", md: "row" }}
                                    spacing={2}
                                  >
                                    <RHFCurrencyField
                                      name="pendingLifeInsuranceAmount"
                                      label="Amount"
                                      required
                                    />
                                    <RHFTextField
                                      name="pendingLifeInsuranceCompany"
                                      label="Company"
                                      placeholder="Company name"
                                      required
                                    />
                                  </Stack>
                                )}
                              </Stack>
                            </Box>

                            {/* Group Disability Insurance Section */}
                            <Box>
                              <Typography
                                variant="h6"
                                sx={{ mb: 2, fontWeight: 600 }}
                              >
                                Group Disability Insurance
                              </Typography>

                              <Stack spacing={2}>
                                <RHFRadioGroup
                                  name="hasDisabilityInsurance"
                                  label="Do you now have or are you now applying for any other insurance which provides benefits if you are unable to work because of a disability?"
                                  options={[
                                    { label: "Yes", value: "yes" },
                                    { label: "No", value: "no" },
                                  ]}
                                  required
                                />

                                {/* Conditional fields - only show if has disability insurance */}
                                {methods.watch("hasDisabilityInsurance") ===
                                  "yes" && (
                                  <>
                                    <Alert severity="info">
                                      Please indicate company name, monthly
                                      benefit amount, benefit period, and
                                      waiting period below.
                                    </Alert>

                                    {methods
                                      .watch("disabilityCompanies")
                                      ?.map((_, index) => (
                                        <Box
                                          key={index}
                                          sx={{
                                            p: 2,
                                            border: 1,
                                            borderColor: "divider",
                                            borderRadius: 1,
                                          }}
                                        >
                                          <Stack spacing={2}>
                                            <Stack
                                              direction="row"
                                              justifyContent="space-between"
                                              alignItems="center"
                                            >
                                              <Typography
                                                variant="subtitle1"
                                                sx={{ fontWeight: 600 }}
                                              >
                                                Company {index + 1}
                                              </Typography>
                                              {(methods.watch(
                                                "disabilityCompanies",
                                              )?.length || 0) > 1 && (
                                                <Button
                                                  size="small"
                                                  color="error"
                                                  onClick={() => {
                                                    const currentCompanies =
                                                      methods.getValues(
                                                        "disabilityCompanies",
                                                      ) || [];
                                                    methods.setValue(
                                                      "disabilityCompanies",
                                                      currentCompanies.filter(
                                                        (_, i) => i !== index,
                                                      ),
                                                    );
                                                  }}
                                                >
                                                  Remove
                                                </Button>
                                              )}
                                            </Stack>

                                            <RHFTextField
                                              name={`disabilityCompanies.${index}.company`}
                                              label="Company"
                                              placeholder="Company name"
                                              required
                                            />

                                            <Box>
                                              <Typography
                                                variant="body2"
                                                sx={{ mb: 1, fontWeight: 500 }}
                                              >
                                                Monthly Benefit Amount{" "}
                                                <Box
                                                  component="span"
                                                  sx={{ color: "error.main" }}
                                                >
                                                  *
                                                </Box>
                                              </Typography>
                                              <RHFCurrencyField
                                                name={`disabilityCompanies.${index}.monthlyBenefit`}
                                                required
                                                fullWidth
                                                helperText="You can find your current coverage amount in your recent statement from your carrier."
                                              />
                                            </Box>

                                            <RHFSelect
                                              name={`disabilityCompanies.${index}.benefitPeriod`}
                                              label="Benefit Period"
                                              options={[
                                                {
                                                  label: "2 Years",
                                                  value: "2years",
                                                },
                                                {
                                                  label: "5 Years",
                                                  value: "5years",
                                                },
                                                {
                                                  label: "To Age 65",
                                                  value: "age65",
                                                },
                                                {
                                                  label: "To Age 67",
                                                  value: "age67",
                                                },
                                                {
                                                  label: "Lifetime",
                                                  value: "lifetime",
                                                },
                                              ]}
                                              required
                                            />

                                            <RHFSelect
                                              name={`disabilityCompanies.${index}.waitingPeriod`}
                                              label="Waiting Period"
                                              options={[
                                                {
                                                  label: "0 Days",
                                                  value: "0days",
                                                },
                                                {
                                                  label: "30 Days",
                                                  value: "30days",
                                                },
                                                {
                                                  label: "60 Days",
                                                  value: "60days",
                                                },
                                                {
                                                  label: "90 Days",
                                                  value: "90days",
                                                },
                                                {
                                                  label: "180 Days",
                                                  value: "180days",
                                                },
                                                {
                                                  label: "365 Days",
                                                  value: "365days",
                                                },
                                              ]}
                                              required
                                            />
                                          </Stack>
                                        </Box>
                                      ))}

                                    <Button
                                      variant="outlined"
                                      onClick={() => {
                                        const currentCompanies =
                                          methods.getValues(
                                            "disabilityCompanies",
                                          ) || [];
                                        methods.setValue(
                                          "disabilityCompanies",
                                          [
                                            ...currentCompanies,
                                            {
                                              company: "",
                                              monthlyBenefit: "",
                                              benefitPeriod: "",
                                              waitingPeriod: "",
                                            },
                                          ],
                                        );
                                      }}
                                      sx={{ alignSelf: "flex-start" }}
                                    >
                                      Add Another Company
                                    </Button>

                                    <RHFRadioGroup
                                      name="disabilityReplacement"
                                      label="Will this disability coverage replace any other company's coverage?"
                                      options={[
                                        { label: "Yes", value: "yes" },
                                        { label: "No", value: "no" },
                                      ]}
                                      required
                                    />

                                    {methods.watch("disabilityReplacement") ===
                                      "yes" && (
                                      <Box>
                                        <FormLabel required>
                                          How much will be replaced?
                                        </FormLabel>
                                        <RHFCurrencyField
                                          name="disabilityReplacementAmount"
                                          required
                                          fullWidth
                                        />
                                      </Box>
                                    )}
                                  </>
                                )}
                              </Stack>
                            </Box>
                          </Stack>
                        </Stack>
                      </CardContent>
                    </Card>

                    {/* Spouse Other Coverage Card - Conditional */}
                    {spouseSelected && (
                      <Card variant="outlined" sx={commonStyles.coverageCard}>
                        <CardContent>
                          <Stack spacing={2}>
                            {/* Section Header */}
                            <Box>
                              <Stack
                                direction="row"
                                spacing={1.5}
                                alignItems="center"
                              >
                                <Box sx={commonStyles.iconCircle}>
                                  <People color="primary" />
                                </Box>
                                <Typography variant="h6">
                                  Spouse Other Coverage
                                </Typography>
                              </Stack>
                            </Box>

                            <Stack spacing={3}>
                              {/* Spouse Group Life Insurance Section */}
                              <Box>
                                <Typography
                                  variant="h6"
                                  sx={{ mb: 2, fontWeight: 600 }}
                                >
                                  Group Life Insurance
                                </Typography>

                                <Stack spacing={2}>
                                  <RHFRadioGroup
                                    name="spouseHasOtherLifeInsurance"
                                    label="Does your spouse have other life insurance in force?"
                                    options={[
                                      { label: "Yes", value: "yes" },
                                      { label: "No", value: "no" },
                                    ]}
                                  />

                                  <RHFRadioGroup
                                    name="spouseHasLifeInsurancePending"
                                    label="Does your spouse have other life insurance applications pending?"
                                    options={[
                                      { label: "Yes", value: "yes" },
                                      { label: "No", value: "no" },
                                    ]}
                                  />

                                  {/* Conditional fields - only show if spouse has other life insurance */}
                                  {methods.watch(
                                    "spouseHasOtherLifeInsurance",
                                  ) === "yes" && (
                                    <>
                                      <Box>
                                        <FormLabel required>
                                          What is the total amount in all
                                          companies?
                                        </FormLabel>
                                        <RHFCurrencyField name="spouseOtherLifeInsuranceAmount" />
                                      </Box>

                                      <RHFRadioGroup
                                        name="spouseLifeInsuranceReplacement"
                                        label="Is the life insurance applied for intended to replace, discontinue or change an existing life insurance policy or annuity contract?"
                                        options={[
                                          { label: "Yes", value: "yes" },
                                          { label: "No", value: "no" },
                                        ]}
                                      />
                                    </>
                                  )}

                                  {/* Conditional fields - only show if spouse has pending applications */}
                                  {methods.watch(
                                    "spouseHasLifeInsurancePending",
                                  ) === "yes" && (
                                    <Stack
                                      direction={{ xs: "column", md: "row" }}
                                      spacing={2}
                                    >
                                      <RHFCurrencyField
                                        name="spousePendingLifeInsuranceAmount"
                                        label="Amount"
                                      />
                                      <RHFTextField
                                        name="spousePendingLifeInsuranceCompany"
                                        label="Company"
                                        placeholder="Company name"
                                      />
                                    </Stack>
                                  )}
                                </Stack>
                              </Box>

                              {/* Spouse Group Disability Insurance Section */}
                              <Box>
                                <Typography
                                  variant="h6"
                                  sx={{ mb: 2, fontWeight: 600 }}
                                >
                                  Group Disability Insurance
                                </Typography>

                                <Stack spacing={2}>
                                  <RHFRadioGroup
                                    name="spouseHasDisabilityInsurance"
                                    label="Does your spouse now have or are they now applying for any other insurance which provides benefits if they are unable to work because of a disability?"
                                    options={[
                                      { label: "Yes", value: "yes" },
                                      { label: "No", value: "no" },
                                    ]}
                                  />

                                  {/* Conditional fields - only show if spouse has disability insurance */}
                                  {methods.watch(
                                    "spouseHasDisabilityInsurance",
                                  ) === "yes" && (
                                    <>
                                      <Alert severity="info">
                                        Please indicate company name, monthly
                                        benefit amount, benefit period, and
                                        waiting period below.
                                      </Alert>

                                      {methods
                                        .watch("spouseDisabilityCompanies")
                                        ?.map((_, index) => (
                                          <Box
                                            key={index}
                                            sx={{
                                              p: 2,
                                              border: 1,
                                              borderColor: "divider",
                                              borderRadius: 1,
                                            }}
                                          >
                                            <Stack spacing={2}>
                                              <Stack
                                                direction="row"
                                                justifyContent="space-between"
                                                alignItems="center"
                                              >
                                                <Typography
                                                  variant="subtitle1"
                                                  sx={{ fontWeight: 600 }}
                                                >
                                                  Company {index + 1}
                                                </Typography>
                                                {(methods.watch(
                                                  "spouseDisabilityCompanies",
                                                )?.length || 0) > 1 && (
                                                  <Button
                                                    size="small"
                                                    color="error"
                                                    onClick={() => {
                                                      const currentCompanies =
                                                        methods.getValues(
                                                          "spouseDisabilityCompanies",
                                                        ) || [];
                                                      methods.setValue(
                                                        "spouseDisabilityCompanies",
                                                        currentCompanies.filter(
                                                          (_, i) => i !== index,
                                                        ),
                                                      );
                                                    }}
                                                  >
                                                    Remove
                                                  </Button>
                                                )}
                                              </Stack>

                                              <RHFTextField
                                                name={`spouseDisabilityCompanies.${index}.company`}
                                                label="Company"
                                                placeholder="Company name"
                                              />

                                              <Box>
                                                <FormLabel required>
                                                  Monthly Benefit Amount
                                                </FormLabel>
                                                <RHFCurrencyField
                                                  name={`spouseDisabilityCompanies.${index}.monthlyBenefit`}
                                                  helperText="You can find your current coverage amount in your recent statement from your carrier."
                                                />
                                              </Box>

                                              <RHFSelect
                                                name={`spouseDisabilityCompanies.${index}.benefitPeriod`}
                                                label="Benefit Period"
                                                options={[
                                                  {
                                                    label: "2 Years",
                                                    value: "2years",
                                                  },
                                                  {
                                                    label: "5 Years",
                                                    value: "5years",
                                                  },
                                                  {
                                                    label: "To Age 65",
                                                    value: "age65",
                                                  },
                                                  {
                                                    label: "To Age 67",
                                                    value: "age67",
                                                  },
                                                  {
                                                    label: "Lifetime",
                                                    value: "lifetime",
                                                  },
                                                ]}
                                              />

                                              <RHFSelect
                                                name={`spouseDisabilityCompanies.${index}.waitingPeriod`}
                                                label="Waiting Period"
                                                options={[
                                                  {
                                                    label: "0 Days",
                                                    value: "0days",
                                                  },
                                                  {
                                                    label: "30 Days",
                                                    value: "30days",
                                                  },
                                                  {
                                                    label: "60 Days",
                                                    value: "60days",
                                                  },
                                                  {
                                                    label: "90 Days",
                                                    value: "90days",
                                                  },
                                                  {
                                                    label: "180 Days",
                                                    value: "180days",
                                                  },
                                                  {
                                                    label: "365 Days",
                                                    value: "365days",
                                                  },
                                                ]}
                                              />
                                            </Stack>
                                          </Box>
                                        ))}

                                      <Button
                                        variant="outlined"
                                        onClick={() => {
                                          const currentCompanies =
                                            methods.getValues(
                                              "spouseDisabilityCompanies",
                                            ) || [];
                                          methods.setValue(
                                            "spouseDisabilityCompanies",
                                            [
                                              ...currentCompanies,
                                              {
                                                company: "",
                                                monthlyBenefit: "",
                                                benefitPeriod: "",
                                                waitingPeriod: "",
                                              },
                                            ],
                                          );
                                        }}
                                        sx={{ alignSelf: "flex-start" }}
                                      >
                                        Add Another Company
                                      </Button>

                                      <RHFRadioGroup
                                        name="spouseDisabilityReplacement"
                                        label="Will this disability coverage replace any other company's coverage?"
                                        options={[
                                          { label: "Yes", value: "yes" },
                                          { label: "No", value: "no" },
                                        ]}
                                      />

                                      {methods.watch(
                                        "spouseDisabilityReplacement",
                                      ) === "yes" && (
                                        <Box>
                                          <FormLabel required>
                                            How much will be replaced?
                                          </FormLabel>
                                          <RHFCurrencyField name="spouseDisabilityReplacementAmount" />
                                        </Box>
                                      )}
                                    </>
                                  )}
                                </Stack>
                              </Box>
                            </Stack>
                          </Stack>
                        </CardContent>
                      </Card>
                    )}
                  </Stack>
                </CardContent>
              </Card>
            </Stack>

            {/* Main Payment Information Card */}
            <Card sx={commonStyles.categoryCard}>
              <CardContent>
                <Stack spacing={2}>
                  {/* Category Header */}
                  <Box sx={commonStyles.coverageCategoryHeader}>
                    <Typography
                      variant="h4"
                      sx={commonStyles.coverageCategoryTitle}
                    >
                      Payment Information
                    </Typography>
                  </Box>

                  <Alert severity="info">
                    Please indicate how you would like to pay for this
                    insurance. You won't be billed until underwriting and review
                    are approved for coverage. We make sure your payment is
                    secure. You may find more details about your privacy and
                    safety in the privacy notice.
                  </Alert>

                  <RHFRadioGroup
                    name="wantsToAddPayment"
                    label="Do you want to add payment information now?"
                    options={[
                      { label: "Yes", value: "yes" },
                      { label: "No", value: "no" },
                    ]}
                    required
                  />

                  {wantsToAddPayment === "yes" && (
                    <Card variant="outlined" sx={commonStyles.coverageCard}>
                      <CardContent>
                        <Stack spacing={2}>
                          {/* Section Header */}
                          <Box>
                            <Stack
                              direction="row"
                              spacing={1}
                              alignItems="center"
                            >
                              <Payment color="primary" />
                              <Typography variant="h6">Your Payment</Typography>
                            </Stack>
                          </Box>

                          <Stack spacing={3}>
                            {/* Term Life Insurance Payment */}
                            <Box>
                              <Typography
                                variant="h6"
                                sx={{ mb: 2, fontWeight: 600 }}
                              >
                                Term Life Insurance
                              </Typography>

                              <Stack spacing={2}>
                                <RHFRadioGroup
                                  name="termLifePaymentMethod"
                                  label="Select new payment method"
                                  options={[
                                    { label: "Bill Me", value: "bill_me" },
                                    {
                                      label: "Bank Account",
                                      value: "bank_account",
                                    },
                                  ]}
                                  required
                                />

                                <RHFSelect
                                  name="termLifePaymentFrequency"
                                  label="Payment Frequency"
                                  options={[
                                    { label: "Monthly", value: "monthly" },
                                    { label: "Quarterly", value: "quarterly" },
                                    {
                                      label: "Semiannually",
                                      value: "semiannually",
                                    },
                                    { label: "Annually", value: "annually" },
                                  ]}
                                  required
                                />

                                {renderEstimatedCostSection(
                                  "li-term",
                                  termLifePaymentMethod,
                                  termLifePaymentFrequency,
                                  true,
                                )}
                              </Stack>
                            </Box>

                            {/* 10-Year Level Term Life Insurance Payment */}
                            <Box>
                              <Typography
                                variant="h6"
                                sx={{ mb: 2, fontWeight: 600 }}
                              >
                                10-Year Level Term Life Insurance
                              </Typography>

                              <Stack spacing={2}>
                                <RHFRadioGroup
                                  name="tenYearTermPaymentMethod"
                                  label="Select new payment method"
                                  options={[
                                    { label: "Bill Me", value: "bill_me" },
                                    {
                                      label: "Bank Account",
                                      value: "bank_account",
                                    },
                                  ]}
                                  required
                                />

                                <RHFSelect
                                  name="tenYearTermPaymentFrequency"
                                  label="Payment Frequency"
                                  options={[
                                    { label: "Monthly", value: "monthly" },
                                    { label: "Quarterly", value: "quarterly" },
                                    {
                                      label: "Semiannually",
                                      value: "semiannually",
                                    },
                                    { label: "Annually", value: "annually" },
                                  ]}
                                  required
                                />

                                {renderEstimatedCostSection(
                                  "li-10yr",
                                  tenYearTermPaymentMethod,
                                  tenYearTermPaymentFrequency,
                                  true,
                                )}
                              </Stack>
                            </Box>

                            {/* 20-Year Level Term Life Insurance Payment */}
                            <Box>
                              <Typography
                                variant="h6"
                                sx={{ mb: 2, fontWeight: 600 }}
                              >
                                20-Year Level Term Life Insurance
                              </Typography>

                              <Stack spacing={2}>
                                <RHFRadioGroup
                                  name="twentyYearTermPaymentMethod"
                                  label="Select new payment method"
                                  options={[
                                    { label: "Bill Me", value: "bill_me" },
                                    {
                                      label: "Bank Account",
                                      value: "bank_account",
                                    },
                                  ]}
                                  required
                                />

                                <RHFSelect
                                  name="twentyYearTermPaymentFrequency"
                                  label="Payment Frequency"
                                  options={[
                                    { label: "Monthly", value: "monthly" },
                                    { label: "Quarterly", value: "quarterly" },
                                    {
                                      label: "Semiannually",
                                      value: "semiannually",
                                    },
                                    { label: "Annually", value: "annually" },
                                  ]}
                                  required
                                />

                                {renderEstimatedCostSection(
                                  "li-20yr",
                                  twentyYearTermPaymentMethod,
                                  twentyYearTermPaymentFrequency,
                                  false,
                                )}
                              </Stack>
                            </Box>

                            {/* Accidental Death and Dismemberment Insurance Payment */}
                            <Box>
                              <Typography
                                variant="h6"
                                sx={{ mb: 2, fontWeight: 600 }}
                              >
                                Accidental Death and Dismemberment Insurance
                              </Typography>

                              <Stack spacing={2}>
                                <RHFRadioGroup
                                  name="addPaymentMethod"
                                  label="Select new payment method"
                                  options={[
                                    { label: "Bill Me", value: "bill_me" },
                                    {
                                      label: "Bank Account",
                                      value: "bank_account",
                                    },
                                  ]}
                                  required
                                />

                                <RHFSelect
                                  name="addPaymentFrequency"
                                  label="Payment Frequency"
                                  options={[
                                    { label: "Monthly", value: "monthly" },
                                    { label: "Quarterly", value: "quarterly" },
                                    {
                                      label: "Semiannually",
                                      value: "semiannually",
                                    },
                                    { label: "Annually", value: "annually" },
                                  ]}
                                  required
                                />

                                {renderEstimatedCostSection(
                                  "li-premier-accident",
                                  addPaymentMethod,
                                  addPaymentFrequency,
                                  false,
                                )}
                              </Stack>
                            </Box>

                            {/* Long-Term Disability Plus Insurance Payment */}
                            <Box>
                              <Typography
                                variant="h6"
                                sx={{ mb: 2, fontWeight: 600 }}
                              >
                                Long-Term Disability Plus Insurance
                              </Typography>

                              <Stack spacing={2}>
                                <RHFRadioGroup
                                  name="longTermDisabilityPaymentMethod"
                                  label="Select new payment method"
                                  options={[
                                    { label: "Bill Me", value: "bill_me" },
                                    {
                                      label: "Bank Account",
                                      value: "bank_account",
                                    },
                                  ]}
                                  required
                                />

                                <RHFSelect
                                  name="longTermDisabilityPaymentFrequency"
                                  label="Payment Frequency"
                                  options={[
                                    { label: "Monthly", value: "monthly" },
                                    { label: "Quarterly", value: "quarterly" },
                                    {
                                      label: "Semiannually",
                                      value: "semiannually",
                                    },
                                    { label: "Annually", value: "annually" },
                                  ]}
                                  required
                                />

                                {renderEstimatedCostSection(
                                  "di-level-rated",
                                  longTermDisabilityPaymentMethod,
                                  longTermDisabilityPaymentFrequency,
                                  false,
                                )}
                              </Stack>
                            </Box>

                            {/* Mid-Term Disability Insurance Payment */}
                            <Box>
                              <Typography
                                variant="h6"
                                sx={{ mb: 2, fontWeight: 600 }}
                              >
                                Mid-Term Disability Insurance
                              </Typography>

                              <Stack spacing={2}>
                                <RHFRadioGroup
                                  name="midTermDisabilityPaymentMethod"
                                  label="Select new payment method"
                                  options={[
                                    { label: "Bill Me", value: "bill_me" },
                                    {
                                      label: "Bank Account",
                                      value: "bank_account",
                                    },
                                  ]}
                                  required
                                />

                                <RHFSelect
                                  name="midTermDisabilityPaymentFrequency"
                                  label="Payment Frequency"
                                  options={[
                                    { label: "Monthly", value: "monthly" },
                                    { label: "Quarterly", value: "quarterly" },
                                    {
                                      label: "Semiannually",
                                      value: "semiannually",
                                    },
                                    { label: "Annually", value: "annually" },
                                  ]}
                                  required
                                />

                                {renderEstimatedCostSection(
                                  "di-step-rated",
                                  midTermDisabilityPaymentMethod,
                                  midTermDisabilityPaymentFrequency,
                                  false,
                                )}
                              </Stack>
                            </Box>

                            {/* Professional Overhead Expense Disability Insurance Payment */}
                            <Box>
                              <Typography
                                variant="h6"
                                sx={{ mb: 2, fontWeight: 600 }}
                              >
                                Professional Overhead Expense Disability
                                Insurance
                              </Typography>

                              <Stack spacing={2}>
                                <RHFRadioGroup
                                  name="professionalOverheadPaymentMethod"
                                  label="Select new payment method"
                                  options={[
                                    { label: "Bill Me", value: "bill_me" },
                                    {
                                      label: "Bank Account",
                                      value: "bank_account",
                                    },
                                  ]}
                                  required
                                />

                                <RHFSelect
                                  name="professionalOverheadPaymentFrequency"
                                  label="Payment Frequency"
                                  options={[
                                    { label: "Monthly", value: "monthly" },
                                    { label: "Quarterly", value: "quarterly" },
                                    {
                                      label: "Semiannually",
                                      value: "semiannually",
                                    },
                                    { label: "Annually", value: "annually" },
                                  ]}
                                  required
                                />

                                {renderEstimatedCostSection(
                                  "oo-office-overhead",
                                  professionalOverheadPaymentMethod,
                                  professionalOverheadPaymentFrequency,
                                  false,
                                )}
                              </Stack>
                            </Box>

                            {/* Critical Illness Insurance Payment */}
                            <Box>
                              <Typography
                                variant="h6"
                                sx={{ mb: 2, fontWeight: 600 }}
                              >
                                Critical Illness Insurance
                              </Typography>

                              <Stack spacing={2}>
                                <RHFRadioGroup
                                  name="criticalIllnessPaymentMethod"
                                  label="Select new payment method"
                                  options={[
                                    { label: "Bill Me", value: "bill_me" },
                                    {
                                      label: "Bank Account",
                                      value: "bank_account",
                                    },
                                  ]}
                                  required
                                />

                                <RHFSelect
                                  name="criticalIllnessPaymentFrequency"
                                  label="Payment Frequency"
                                  options={[
                                    { label: "Monthly", value: "monthly" },
                                    { label: "Quarterly", value: "quarterly" },
                                    {
                                      label: "Semiannually",
                                      value: "semiannually",
                                    },
                                    { label: "Annually", value: "annually" },
                                  ]}
                                  required
                                />

                                {renderEstimatedCostSection(
                                  "sh-critical-illness",
                                  criticalIllnessPaymentMethod,
                                  criticalIllnessPaymentFrequency,
                                  false,
                                )}
                              </Stack>
                            </Box>

                            {/* Hospital Money Insurance Payment */}
                            <Box>
                              <Typography
                                variant="h6"
                                sx={{ mb: 2, fontWeight: 600 }}
                              >
                                Hospital Money Insurance
                              </Typography>

                              <Stack spacing={2}>
                                <RHFRadioGroup
                                  name="hospitalMoneyPaymentMethod"
                                  label="Select new payment method"
                                  options={[
                                    { label: "Bill Me", value: "bill_me" },
                                    {
                                      label: "Bank Account",
                                      value: "bank_account",
                                    },
                                  ]}
                                  required
                                />

                                <RHFSelect
                                  name="hospitalMoneyPaymentFrequency"
                                  label="Payment Frequency"
                                  options={[
                                    { label: "Monthly", value: "monthly" },
                                    { label: "Quarterly", value: "quarterly" },
                                    {
                                      label: "Semiannually",
                                      value: "semiannually",
                                    },
                                    { label: "Annually", value: "annually" },
                                  ]}
                                  required
                                />

                                {renderEstimatedCostSection(
                                  "sh-hospital-income",
                                  hospitalMoneyPaymentMethod,
                                  hospitalMoneyPaymentFrequency,
                                  false,
                                )}
                              </Stack>
                            </Box>

                            {/* Bank Account Details - Show if any payment method is bank account */}
                            {needsBankAccount && (
                              <Box>
                                <Typography
                                  variant="h6"
                                  sx={{ mb: 2, fontWeight: 600 }}
                                >
                                  Bank Account Details
                                </Typography>

                                <Stack spacing={2}>
                                  <RHFTextField
                                    name="routingNumber"
                                    label="Routing Number"
                                    type="number"
                                    required
                                  />

                                  <RHFTextField
                                    name="accountNumber"
                                    label="Account Number"
                                    type="number"
                                    required
                                  />

                                  <RHFTextField
                                    name="nameOnAccount"
                                    label="Name on Account"
                                    required
                                  />

                                  <RHFTextField
                                    name="bankInstitution"
                                    label="Bank/Institution"
                                    required
                                  />

                                  <Box sx={{ mt: 3 }}>
                                    <Typography
                                      variant="h6"
                                      sx={{ mb: 2, fontWeight: 600 }}
                                    >
                                      Bank Account Information
                                    </Typography>

                                    <Typography
                                      variant="body2"
                                      color="text.secondary"
                                      sx={{ mb: 2 }}
                                    >
                                      "Based on the billing frequency which I
                                      selected above, I request and authorize
                                      American Bar Endowment Plan Administrator
                                      to make withdrawals against the account
                                      specified above or any other account
                                      subsequently identified by me, and each
                                      bank to process those withdrawals as if I
                                      had signed them, for the purpose of
                                      collecting premium contributions due under
                                      each insurance plan indicated as
                                      AutoPay(ETF) in this Application Form."
                                    </Typography>

                                    <RHFCheckbox
                                      name="bankAccountConsent"
                                      label="I have reviewed the information above and consent to the terms by checking this box."
                                    />
                                  </Box>
                                </Stack>
                              </Box>
                            )}
                          </Stack>
                        </Stack>
                      </CardContent>
                    </Card>
                  )}
                </Stack>
              </CardContent>
            </Card>
          </FormStepTransition>
        </FormPageLayout>
      </form>
    </FormProvider>
  );
}
