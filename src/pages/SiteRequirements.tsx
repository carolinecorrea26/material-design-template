import * as React from "react";
import {
  Box,
  Container,
  Stack,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  FormControlLabel,
  Switch,
  MenuItem,
  Divider,
  Alert,
  Chip,
} from "@mui/material";
import { FormProvider, useForm } from "react-hook-form";
import RHFTextField from "../components/form/RHFTextField";
import RHFSelect from "../components/form/RHFSelect";
import RHFCheckbox from "../components/form/RHFCheckbox";
import { THEME_COLORS } from "../config/themeColors";

interface SiteRequirementsForm {
  // Basic Info
  clientName: string;
  clientAcronym: string;
  themeColor: string;

  // Features
  showPartnerLogo: boolean;
  showRatingBadges: boolean;
  enableDisabilityInsurance: boolean;
  enableLifeInsurance: boolean;
  showCoverageDetails: boolean;
  showMembershipPage: boolean;

  // Coverage Categories
  coverageLI: boolean;
  coverageAD: boolean;
  coverageDI: boolean;
  coverageOO: boolean;
  coverageSH: boolean;

  // Products File
  productsFile: string;

  // Contact Info
  phone: string;
  phoneDisplay: string;

  // Branding
  heroTitle: string;
  heroSubtitle: string;

  // Membership Questions
  membershipPrimaryQuestion: string;
  membershipSpouseQuestion: string;
  membershipType: string;
}

export default function SiteRequirements() {
  const methods = useForm<SiteRequirementsForm>({
    defaultValues: {
      clientName: "",
      clientAcronym: "",
      themeColor: "blue",
      showPartnerLogo: true,
      showRatingBadges: true,
      enableDisabilityInsurance: true,
      enableLifeInsurance: true,
      showCoverageDetails: true,
      showMembershipPage: false,
      coverageLI: true,
      coverageAD: false,
      coverageDI: true,
      coverageOO: false,
      coverageSH: false,
      productsFile: "products",
      phone: "",
      phoneDisplay: "",
      heroTitle: "",
      heroSubtitle: "",
      membershipPrimaryQuestion: "",
      membershipSpouseQuestion: "",
      membershipType: "radio",
    },
  });

  const { watch } = methods;
  const showMembershipPage = watch("showMembershipPage");

  const onSubmit = (data: SiteRequirementsForm) => {
    // Generate the client configuration
    const coverageCategories = [];
    if (data.coverageLI) coverageCategories.push("'LI'");
    if (data.coverageAD) coverageCategories.push("'AD'");
    if (data.coverageDI) coverageCategories.push("'DI'");
    if (data.coverageOO) coverageCategories.push("'OO'");
    if (data.coverageSH) coverageCategories.push("'SH'");

    const config = `
  ${data.clientAcronym.toLowerCase()}: {
    id: '${data.clientAcronym.toLowerCase()}',
    branding: {
      name: '${data.clientName}',
      acronym: '${data.clientAcronym}',
      logo: '/brand/${data.clientAcronym.toLowerCase()}/logo.png',
      logoAlt: '${data.clientAcronym} Logo',
      partnerLogo: '/brand/nyl/logo.png',
      partnerLogoAlt: 'New York Life Logo',
      heroImage: '/brand/${data.clientAcronym.toLowerCase()}/hero.png',
      heroImageAlt: '${data.clientName}',
      heroTitle: '${data.heroTitle}',
      heroSubtitle: '${data.heroSubtitle}',
      products: [],
      phone: '${data.phone}',
      phoneDisplay: '${data.phoneDisplay}',
    },
    theme: {
      colorName: '${data.themeColor}',
    },
    fieldLabels: {
      dateOfBirth: 'Birthday',
      gender: 'Gender',
      state: 'State',
      nicotineUse: 'Do you use tobacco products?',
    },
    ${
      showMembershipPage
        ? `membershipQuestion: {
      primaryQuestion: '${data.membershipPrimaryQuestion}',
      spouseQuestion: '${data.membershipSpouseQuestion}',
      type: '${data.membershipType}',
    },`
        : ""
    }
    features: {
      showPartnerLogo: ${data.showPartnerLogo},
      showRatingBadges: ${data.showRatingBadges},
      enableDisabilityInsurance: ${data.enableDisabilityInsurance},
      enableLifeInsurance: ${data.enableLifeInsurance},
      showCoverageDetails: ${data.showCoverageDetails},
      showMembershipPage: ${data.showMembershipPage},
    },
    productsFile: '${data.productsFile}',
    coverageCategories: [${coverageCategories.join(", ")}],
  },`;

    alert("Configuration generated.");
  };

  const themeColorOptions = Object.keys(THEME_COLORS).map((color) => ({
    label: color.charAt(0).toUpperCase() + color.slice(1),
    value: color,
  }));

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Stack spacing={4}>
        <Box>
          <Typography variant="h2" gutterBottom>
            Site Requirements & Configuration
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Internal form to create a new client site configuration. Fill out
            all fields to generate the configuration code.
          </Typography>
        </Box>

        <FormProvider {...methods}>
          <form onSubmit={methods.handleSubmit(onSubmit)}>
            <Stack spacing={4}>
              {/* Basic Information */}
              <Card>
                <CardContent>
                  <Typography
                    variant="h5"
                    gutterBottom
                    sx={{ fontWeight: 600 }}
                  >
                    Basic Information
                  </Typography>
                  <Stack spacing={3} sx={{ mt: 2 }}>
                    <RHFTextField
                      name="clientName"
                      label="Client Name"
                      placeholder="e.g., National Association of REALTORS®"
                      required
                    />
                    <RHFTextField
                      name="clientAcronym"
                      label="Client Acronym"
                      placeholder="e.g., NAR"
                      required
                    />
                    <RHFSelect
                      name="themeColor"
                      label="Theme Color"
                      options={themeColorOptions}
                      required
                    />
                  </Stack>
                </CardContent>
              </Card>

              {/* Contact Information */}
              <Card>
                <CardContent>
                  <Typography
                    variant="h5"
                    gutterBottom
                    sx={{ fontWeight: 600 }}
                  >
                    Contact Information
                  </Typography>
                  <Stack spacing={3} sx={{ mt: 2 }}>
                    <RHFTextField
                      name="phone"
                      label="Phone Number (digits only)"
                      placeholder="e.g., 8449270527"
                      required
                    />
                    <RHFTextField
                      name="phoneDisplay"
                      label="Phone Display Format"
                      placeholder="e.g., (844) 927-0527"
                      required
                    />
                  </Stack>
                </CardContent>
              </Card>

              {/* Branding */}
              <Card>
                <CardContent>
                  <Typography
                    variant="h5"
                    gutterBottom
                    sx={{ fontWeight: 600 }}
                  >
                    Branding & Content
                  </Typography>
                  <Stack spacing={3} sx={{ mt: 2 }}>
                    <RHFTextField
                      name="heroTitle"
                      label="Hero Title"
                      placeholder="e.g., Insurance coverage designed for REALTORS®"
                      required
                      multiline
                      rows={2}
                    />
                    <RHFTextField
                      name="heroSubtitle"
                      label="Hero Subtitle"
                      placeholder="e.g., Group Life and Disability Insurance available exclusively..."
                      required
                      multiline
                      rows={3}
                    />
                  </Stack>
                </CardContent>
              </Card>

              {/* Features */}
              <Card>
                <CardContent>
                  <Typography
                    variant="h5"
                    gutterBottom
                    sx={{ fontWeight: 600 }}
                  >
                    Features
                  </Typography>
                  <Stack spacing={2} sx={{ mt: 2 }}>
                    <RHFCheckbox
                      name="showPartnerLogo"
                      label="Show Partner (NYL) Logo"
                    />
                    <RHFCheckbox
                      name="showRatingBadges"
                      label="Show Rating Badges"
                    />
                    <RHFCheckbox
                      name="enableDisabilityInsurance"
                      label="Enable Disability Insurance"
                    />
                    <RHFCheckbox
                      name="enableLifeInsurance"
                      label="Enable Life Insurance"
                    />
                    <RHFCheckbox
                      name="showCoverageDetails"
                      label="Show Coverage Details Dropdown"
                    />
                    <RHFCheckbox
                      name="showMembershipPage"
                      label="Show Membership Page"
                    />
                  </Stack>
                </CardContent>
              </Card>

              {/* Membership Questions - Conditional */}
              {showMembershipPage && (
                <Card>
                  <CardContent>
                    <Typography
                      variant="h5"
                      gutterBottom
                      sx={{ fontWeight: 600 }}
                    >
                      Membership Questions
                    </Typography>
                    <Stack spacing={3} sx={{ mt: 2 }}>
                      <RHFTextField
                        name="membershipPrimaryQuestion"
                        label="Primary Member Question"
                        placeholder="e.g., Are you an active member of NAR?"
                        required
                      />
                      <RHFTextField
                        name="membershipSpouseQuestion"
                        label="Spouse Member Question"
                        placeholder="e.g., Is your spouse an active member of NAR?"
                        required
                      />
                      <RHFSelect
                        name="membershipType"
                        label="Question Type"
                        options={[
                          { label: "Radio Buttons (Yes/No)", value: "radio" },
                          { label: "Checkbox", value: "checkbox" },
                        ]}
                        required
                      />
                    </Stack>
                  </CardContent>
                </Card>
              )}

              {/* Coverage Categories */}
              <Card>
                <CardContent>
                  <Typography
                    variant="h5"
                    gutterBottom
                    sx={{ fontWeight: 600 }}
                  >
                    Coverage Categories
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 2 }}
                  >
                    Select which coverage categories are available for this
                    client
                  </Typography>
                  <Stack spacing={2}>
                    <RHFCheckbox
                      name="coverageLI"
                      label="Life Insurance (LI)"
                    />
                    <RHFCheckbox
                      name="coverageAD"
                      label="Accidental Death & Dismemberment (AD)"
                    />
                    <RHFCheckbox
                      name="coverageDI"
                      label="Disability Insurance (DI)"
                    />
                    <RHFCheckbox
                      name="coverageOO"
                      label="Office Overhead (OO)"
                    />
                    <RHFCheckbox
                      name="coverageSH"
                      label="Supplemental Health (SH)"
                    />
                  </Stack>
                </CardContent>
              </Card>

              {/* Products Configuration */}
              <Card>
                <CardContent>
                  <Typography
                    variant="h5"
                    gutterBottom
                    sx={{ fontWeight: 600 }}
                  >
                    Products Configuration
                  </Typography>
                  <Stack spacing={3} sx={{ mt: 2 }}>
                    <RHFSelect
                      name="productsFile"
                      label="Products File"
                      options={[
                        { label: "Standard Products", value: "products" },
                        { label: "Demo Products", value: "products-demo" },
                        { label: "NAR Products", value: "products-nar" },
                        {
                          label: "Custom (create new file)",
                          value: "products-custom",
                        },
                      ]}
                      required
                    />
                    <Alert severity="info">
                      If you select "Custom", you'll need to create a new
                      products JSON file in the data/fixtures directory.
                    </Alert>
                  </Stack>
                </CardContent>
              </Card>

              {/* Submit Button */}
              <Box sx={{ display: "flex", justifyContent: "center", gap: 2 }}>
                <Button
                  type="button"
                  variant="outlined"
                  size="large"
                  onClick={() => methods.reset()}
                >
                  Reset Form
                </Button>
                <Button type="submit" variant="contained" size="large">
                  Generate Configuration
                </Button>
              </Box>

              <Alert severity="warning">
                <Typography
                  variant="body2"
                  sx={{ fontWeight: 600 }}
                  gutterBottom
                >
                  Next Steps After Generation:
                </Typography>
                <Typography variant="body2" component="div">
                  1. Copy the generated configuration from the console
                  <br />
                  2. Add it to src/config/clients.ts in the CLIENTS object
                  <br />
                  3. Create the required brand assets in public/brand/[acronym]/
                  directory
                  <br />
                  4. If using custom products, create the products JSON file
                  <br />
                  5. Update ACTIVE_CLIENT_ID in src/config/clients.ts to test
                  <br />
                  6. Add the new client to the DevTools dropdown
                </Typography>
              </Alert>
            </Stack>
          </form>
        </FormProvider>
      </Stack>
    </Container>
  );
}
