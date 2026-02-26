import * as React from "react";
import {
  Stack,
  Typography,
  Alert,
  Box,
  Checkbox,
  FormControlLabel,
  Card,
  CardContent,
  TextField,
} from "@mui/material";
import PageHeader from "../components/layout/PageHeader";
import PageNavigation from "../components/layout/PageNavigation";
import FormStepTransition from "../components/layout/FormStepTransition";
import FormPageLayout from "../components/layout/FormPageLayout";
import { FormProvider, useForm, useWatch, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import RHFTextField from "../components/form/RHFTextField";
import RHFRadioGroup from "../components/form/RHFRadioGroup";
import RHFSelect from "../components/form/RHFSelect";
import { ContactSchema, type ContactForm } from "../validation/contact";
import { useAppData, enableAutosave } from "../state/AppDataContext";
import { useStepper } from "../state/StepperContext";
import { useNavigate } from "react-router-dom";
import { useSnackbar } from "../components/feedback/SnackbarProvider";
import { useScrollToFirstError } from "../hooks/useScrollToFirstError";
import { STATE_OPTIONS } from "../constants/eligibility";
import { Person, People } from "@mui/icons-material";
import { commonStyles } from "../theme/commonStyles";
import { formatUSPhone } from "../utils/formatting";

export default function Contact() {
  const { data, setContact } = useAppData();
  const { next, markComplete } = useStepper();
  const navigate = useNavigate();
  const { notify } = useSnackbar();

  // Check if spouse was selected in eligibility
  const spouseSelected = data.eligibility?.applicants?.spouse || false;
  const userState = data.eligibility?.state || "";

  // Business type options
  const businessTypeOptions = [
    { label: "Sole Proprietor", value: "sole_proprietor" },
    { label: "Corporation", value: "corporation" },
    { label: "Partnership", value: "partnership" },
  ];

  // Check if user applied for DI or OO products
  const hasDisabilityOrOfficeOverheadProducts =
    data.coverage?.some((item) => {
      // Look for products with DI or OO category
      return (
        item.productId.startsWith("di-") || item.productId.startsWith("oo-")
      );
    }) || false;

  const methods = useForm<ContactForm>({
    resolver: zodResolver(ContactSchema),
    mode: "onSubmit",
    reValidateMode: "onChange",
    defaultValues: data.contact ?? {
      streetAddress: "",
      aptSuite: "",
      city: "",
      state: userState,
      zipCode: "",
      phoneNumber: "",
      phoneType: undefined,
      correspondenceTo: undefined,
      businessName: "",
      businessType: undefined,
      businessAddressSameAsHome: false,
      businessStreetAddress: "",
      businessAptSuite: "",
      businessCity: "",
      businessState: "",
      businessZipCode: "",
      businessPhoneNumber: "",
      spousePhoneNumber: "",
      spousePhoneType: undefined,
      spouseEmail: "",
    },
  });

  useScrollToFirstError(methods);

  const correspondenceTo = useWatch({
    control: methods.control,
    name: "correspondenceTo",
  });
  const businessAddressSameAsHome = useWatch({
    control: methods.control,
    name: "businessAddressSameAsHome",
  });

  // Show business information if correspondence is to business OR user applied for DI/OO products
  const shouldShowBusinessInfo =
    correspondenceTo === "business" || hasDisabilityOrOfficeOverheadProducts;

  // Copy home address to business address when checkbox is checked
  React.useEffect(() => {
    if (businessAddressSameAsHome) {
      const homeAddress = methods.getValues();
      methods.setValue("businessStreetAddress", homeAddress.streetAddress);
      methods.setValue("businessAptSuite", homeAddress.aptSuite || "");
      methods.setValue("businessCity", homeAddress.city);
      methods.setValue("businessState", homeAddress.state);
      methods.setValue("businessZipCode", homeAddress.zipCode);
    }
  }, [businessAddressSameAsHome, methods]);

  // DevTools: Fill form with test data
  React.useEffect(() => {
    const handleFillForm = () => {
      const filledData: ContactForm = {
        streetAddress: "123 Main St",
        aptSuite: "Apt 4B",
        city: "New York",
        state: userState,
        zipCode: "10001",
        phoneNumber: "555-123-4567",
        phoneType: "mobile",
        correspondenceTo: "business",
        businessName: "Acme Corporation",
        businessType: "corporation",
        businessAddressSameAsHome: false,
        businessStreetAddress: "456 Business Ave",
        businessAptSuite: "Suite 200",
        businessCity: "New York",
        businessState: "NY",
        businessZipCode: "10002",
        businessPhoneNumber: "555-234-5678",
        spousePhoneNumber: spouseSelected ? "555-987-6543" : "",
        spousePhoneType: spouseSelected ? "home" : undefined,
        spouseEmail: spouseSelected ? "spouse@example.com" : "",
      };

      methods.reset(filledData);
    };

    window.addEventListener("devtools:fillform", handleFillForm);
    return () =>
      window.removeEventListener("devtools:fillform", handleFillForm);
  }, [methods, userState, spouseSelected]);

  const onSubmit = (values: ContactForm) => {
    // Custom validation for business information
    if (shouldShowBusinessInfo) {
      const errors: string[] = [];

      if (!values.businessName) errors.push("Business name is required");
      if (!values.businessType) errors.push("Business type is required");

      if (!values.businessAddressSameAsHome) {
        if (!values.businessStreetAddress)
          errors.push("Business street address is required");
        if (!values.businessCity) errors.push("Business city is required");
        if (!values.businessState) errors.push("Business state is required");
        if (!values.businessZipCode)
          errors.push("Business zip code is required");
      }

      if (errors.length > 0) {
        notify(errors.join(", "), "error");
        return;
      }
    }

    setContact(values);
    enableAutosave();
    markComplete();
    next();
    navigate("/profile");
  };

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit)} noValidate>
        <FormPageLayout
          header={
            <PageHeader
              title="Contact Information"
              notes="Please provide your contact information below. This ensures we can reach you if we have questions and keep you informed about your application status."
            />
          }
          navigation={
            <PageNavigation
              hasUnsavedChanges={() => methods.formState.isDirty}
            />
          }
        >
          {/* Page-level Error Alert */}
          {Object.keys(methods.formState.errors).length > 0 && (
            <Alert severity="error">
              Please complete all required fields to continue.
            </Alert>
          )}

          <FormStepTransition>
            {/* Main Contact Information Card */}
            <Card sx={commonStyles.categoryCard}>
              <CardContent>
                <Stack spacing={2}>
                  {/* Category Header */}
                  <Box sx={commonStyles.coverageCategoryHeader}>
                    <Typography
                      variant="h4"
                      sx={commonStyles.coverageCategoryTitle}
                    >
                      Contact Information
                    </Typography>
                  </Box>

                  <Alert severity="info">
                    A representative of New York Life or their medical service
                    provider may contact you to collect your health history and,
                    if necessary, schedule any medical exam that may be needed
                    at no cost to you and at a time and place convenient to you.
                    Your prompt responses will help speed up the processing of
                    your application.{" "}
                    <strong>Learn more about medical underwriting.</strong>
                  </Alert>

                  {/* Your Contact Card */}
                  <Card variant="outlined" sx={commonStyles.coverageCard}>
                    <CardContent>
                      <Stack spacing={2}>
                        {/* Applicant Header */}
                        <Box>
                          <Stack
                            direction="row"
                            spacing={1.5}
                            alignItems="center"
                          >
                            <Box sx={commonStyles.iconCircle}>
                              <Person color="primary" />
                            </Box>
                            <Typography variant="h6">Your Contact</Typography>
                          </Stack>
                        </Box>

                        <Stack spacing={2}>
                          <RHFTextField
                            name="streetAddress"
                            label="Street Address"
                            required
                          />
                          <RHFTextField name="aptSuite" label="Apt/Suite" />

                          <Stack
                            direction={{ xs: "column", md: "row" }}
                            spacing={2}
                          >
                            <Box sx={{ flex: 1 }}>
                              <RHFTextField name="city" label="City" required />
                            </Box>
                            <Box sx={{ width: { md: "150px" } }}>
                              <RHFTextField
                                name="state"
                                label="State"
                                required
                                disabled
                              />
                            </Box>
                            <Box sx={{ width: { md: "120px" } }}>
                              <RHFTextField
                                name="zipCode"
                                label="Zip Code"
                                required
                              />
                            </Box>
                          </Stack>

                          <Stack direction="column" spacing={2}>
                            <Controller
                              name="phoneNumber"
                              control={methods.control}
                              render={({ field, fieldState }) => (
                                <TextField
                                  {...field}
                                  label="Phone Number"
                                  required
                                  fullWidth
                                  autoComplete="tel"
                                  inputProps={{ inputMode: "tel" }}
                                  value={field.value ?? ""}
                                  onChange={(e) =>
                                    field.onChange(
                                      formatUSPhone(e.target.value),
                                    )
                                  }
                                  error={!!fieldState.error}
                                  helperText={fieldState.error?.message}
                                />
                              )}
                            />
                            <RHFRadioGroup
                              name="phoneType"
                              label="Phone Type"
                              options={[
                                { label: "Home", value: "home" },
                                { label: "Business", value: "business" },
                                { label: "Mobile", value: "mobile" },
                              ]}
                              required
                            />
                          </Stack>

                          <RHFRadioGroup
                            name="correspondenceTo"
                            label="Send Correspondence To"
                            options={[
                              {
                                label: "Residential Address",
                                value: "residential",
                              },
                              { label: "Business Address", value: "business" },
                            ]}
                            required
                          />

                          {/* Business Information Section - Conditional */}
                          {shouldShowBusinessInfo && (
                            <Box
                              sx={{
                                mt: 3,
                                p: 2,
                                border: 1,
                                borderColor: "divider",
                                borderRadius: 1,
                              }}
                            >
                              <Stack spacing={2}>
                                {/* Business Information Header */}
                                <Box>
                                  <Stack
                                    direction="row"
                                    spacing={1}
                                    alignItems="center"
                                  >
                                    <Typography variant="h6">
                                      Business/Employer Information
                                    </Typography>
                                  </Stack>
                                </Box>

                                <Alert severity="info">
                                  Please include the following details of your
                                  business or employer.
                                </Alert>

                                <RHFTextField
                                  name="businessName"
                                  label="Name of Business or Employer"
                                  required
                                />
                                <RHFSelect
                                  name="businessType"
                                  label="Type of Business"
                                  options={businessTypeOptions}
                                  required
                                />

                                <FormControlLabel
                                  control={
                                    <Checkbox
                                      checked={
                                        businessAddressSameAsHome || false
                                      }
                                      onChange={(e) =>
                                        methods.setValue(
                                          "businessAddressSameAsHome",
                                          e.target.checked,
                                        )
                                      }
                                    />
                                  }
                                  label="Business address is the same as home address"
                                />

                                {!businessAddressSameAsHome && (
                                  <>
                                    <RHFTextField
                                      name="businessStreetAddress"
                                      label="Business Street Address"
                                      required
                                    />
                                    <RHFTextField
                                      name="businessAptSuite"
                                      label="Apt/Suite"
                                    />

                                    <Stack
                                      direction={{ xs: "column", md: "row" }}
                                      spacing={2}
                                    >
                                      <Box sx={{ flex: 1 }}>
                                        <RHFTextField
                                          name="businessCity"
                                          label="City"
                                          required
                                        />
                                      </Box>
                                      <Box sx={{ width: { md: "150px" } }}>
                                        <RHFSelect
                                          name="businessState"
                                          label="State"
                                          options={STATE_OPTIONS}
                                          required
                                        />
                                      </Box>
                                      <Box sx={{ width: { md: "120px" } }}>
                                        <RHFTextField
                                          name="businessZipCode"
                                          label="Zip Code"
                                          required
                                        />
                                      </Box>
                                    </Stack>

                                    <Controller
                                      name="businessPhoneNumber"
                                      control={methods.control}
                                      render={({ field, fieldState }) => (
                                        <TextField
                                          {...field}
                                          label="Business Phone Number"
                                          fullWidth
                                          autoComplete="tel"
                                          inputProps={{ inputMode: "tel" }}
                                          value={field.value ?? ""}
                                          onChange={(e) =>
                                            field.onChange(
                                              formatUSPhone(e.target.value),
                                            )
                                          }
                                          error={!!fieldState.error}
                                          helperText={fieldState.error?.message}
                                        />
                                      )}
                                    />
                                  </>
                                )}
                              </Stack>
                            </Box>
                          )}
                        </Stack>
                      </Stack>
                    </CardContent>
                  </Card>

                  {/* Spouse Contact Card - Conditional */}
                  {spouseSelected && (
                    <Card variant="outlined" sx={commonStyles.coverageCard}>
                      <CardContent>
                        <Stack spacing={2}>
                          {/* Applicant Header */}
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
                                Spouse Contact
                              </Typography>
                            </Stack>
                          </Box>

                          <Stack spacing={2}>
                            <Stack direction="column" spacing={2}>
                              <Controller
                                name="spousePhoneNumber"
                                control={methods.control}
                                render={({ field, fieldState }) => (
                                  <TextField
                                    {...field}
                                    label="Phone Number"
                                    required
                                    fullWidth
                                    autoComplete="tel"
                                    inputProps={{ inputMode: "tel" }}
                                    value={field.value ?? ""}
                                    onChange={(e) =>
                                      field.onChange(
                                        formatUSPhone(e.target.value),
                                      )
                                    }
                                    error={!!fieldState.error}
                                    helperText={fieldState.error?.message}
                                  />
                                )}
                              />
                              <RHFRadioGroup
                                name="spousePhoneType"
                                label="Phone Type"
                                options={[
                                  { label: "Home", value: "home" },
                                  { label: "Business", value: "business" },
                                  { label: "Mobile", value: "mobile" },
                                ]}
                                required
                              />
                              <RHFTextField
                                name="spouseEmail"
                                label="Email"
                                type="email"
                                helperText="We'll use this email to send important information about the policy."
                              />
                            </Stack>
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
