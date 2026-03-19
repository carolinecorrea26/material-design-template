import * as React from "react";
import {
  Stack,
  Typography,
  Box,
  Alert,
  Card,
  CardContent,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import {
  Edit,
  Person,
  People,
  ChildFriendly,
  AccountBalance,
  ContactMail,
  Security,
  MedicalServices,
  FamilyRestroom,
  Payment,
  HealthAndSafety,
  AttachMoney,
} from "@mui/icons-material";
import { formatAnswer, shouldExcludeField } from "../utils/previewFormatting";

// Health questions mapping
const healthQuestions: Record<number, string> = {
  1: "Are you currently confined to a hospital, nursing home, psychiatric facility, incarcerated in a prison/correctional facility, currently on parole or currently receiving home health care/assisted living care?",
  2: "During the last five years, have you ever been declined, postponed, or offered rated life or health insurance or been denied a reinstatement, reissue or renewal for life or health insurance, or are you currently receiving disability benefits?",
  3: "Are you currently undergoing a medical evaluation for any condition not yet given a diagnosis?",
  4: "In the last five years, have you been convicted of a felony; been charged or convicted with assault; been charged with operating a vehicle while under the influence of alcohol or drugs; been charged three or more times with a moving violation; currently have a revoked or suspended license; or currently on parole or incarcerated in a correctional institution?",
  5: "During the last five years, has any person to be insured been medically diagnosed by a licensed member of the medical profession with HIV or AIDS, or tested positive for Human Immunodeficiency Virus (HIV)?",
  6: "During the last five years have you been medically diagnosed by a licensed member of the medical profession as having or been treated for heart disease, a heart attack, chest pains, irregular heartbeat, arrhythmia, open heart surgery, defibrillator or a pacemaker?",
  7: "During the last five years have you been medically diagnosed by a licensed member of the medical profession as having or been treated for diabetes, a stroke (CVA), a transient ischemic attack (TIA), aneurysm or kidney disease?",
  8: "During the last five years have you been medically diagnosed by a licensed member of the medical profession as having or been treated for depression, anxiety, mental disorder, suicide attempt(s), drug use or treatment, or alcohol abuse or treatment?",
  9: "During the last five years have you been medically diagnosed by a licensed member of the medical profession as having or been treated for cirrhosis, hepatitis, Lou Gehrig's Disease/ALS or other neuro-muscular, paralysis or seizure disorder?",
  10: "During the last five years have you been medically diagnosed by a licensed member of the medical profession as having or been treated for cancer (except basal cell or squamous cell skin cancer), tumors, cysts, masses or growths of any type, lymphoma, any blood disorder, except HIV, or connective tissue disorder?",
  11: "During the last five years have you been medically diagnosed by a licensed member of the medical profession as having or been treated for Crohn's disease, disorder of pancreas, disorder of the immune system, except HIV?",
  12: "During the last five years have you been medically diagnosed by a licensed member of the medical profession as having or been treated for hypertension, elevated cholesterol, respiratory disease or disorder, or sleep apnea?",
  13: "During the last five years have you been medically diagnosed by a licensed member of the medical profession as having or been treated for anemia, colitis or arthritis?",
  14: "During the past five years, have you flown an airplane (other than scheduled commercial or corporate aviation); engaged in any of the following: sky sports, underwater sports, climbing sports, motor sports, in any type vehicle, or any extreme sport (bungee jumping, cave exploration, heliskiing, rodeo riding, etc)?",
  15: "Have any of your siblings or either of your parents been diagnosed with or died from cancer or cardiovascular disease prior to age 60?",
};
import PageHeader from "../components/layout/PageHeader";
import PageNavigation from "../components/layout/PageNavigation";
import FormStepTransition from "../components/layout/FormStepTransition";
import FormPageLayout from "../components/layout/FormPageLayout";
import EditConfirmationModal from "../components/modals/EditConfirmationModal";
import { useAppData } from "../state/AppDataContext";
import { useNavigate } from "react-router-dom";
import { commonStyles } from "../theme/commonStyles";
import type { Product } from "../types/app";
import { useStepper } from "../state/StepperContext";

export default function Preview() {
  const { data } = useAppData();
  const navigate = useNavigate();
  const { next, markComplete } = useStepper();
  const [products, setProducts] = React.useState<Product[]>([]);
  const [showEditModal, setShowEditModal] = React.useState(false);
  const [pendingEditPath, setPendingEditPath] = React.useState<string>("");
  const [showAdvisorConfirmDialog, setShowAdvisorConfirmDialog] =
    React.useState(false);
  const isAdvisorFlow = data.isAdvisorFlow;

  // Fetch products to get names
  React.useEffect(() => {
    fetch("/api/products")
      .then((res) => res.json())
      .then((data) => setProducts(data))
      .catch((err) => console.error("Failed to load products", err));
  }, []);

  // Helper to get product name from ID
  const getProductName = (productId: string): string => {
    const product = products.find((p) => p.id === productId);
    return product ? product.name : productId;
  };

  const handleEdit = (path: string) => {
    setPendingEditPath(path);
    setShowEditModal(true);
  };

  const handleConfirmEdit = () => {
    setShowEditModal(false);
    navigate(pendingEditPath);
  };

  const handleCancelEdit = () => {
    setShowEditModal(false);
    setPendingEditPath("");
  };

  const handleContinue = () => {
    // If advisor flow, show confirmation dialog
    if (isAdvisorFlow) {
      setShowAdvisorConfirmDialog(true);
    } else {
      // Regular flow - proceed to consent
      markComplete();
      next();
      navigate("/consent");
    }
  };

  const handleAdvisorConfirm = () => {
    setShowAdvisorConfirmDialog(false);
    markComplete();
    navigate("/advisor-success");
  };

  const handleAdvisorCancel = () => {
    setShowAdvisorConfirmDialog(false);
  };

  // Helper to format rider name for display
  const formatRiderName = (riderKey: string): string => {
    // Convert camelCase to Title Case with spaces
    return riderKey
      .replace(/([A-Z])/g, " $1")
      .replace(/^./, (str) => str.toUpperCase())
      .trim();
  };

  // Helper to display field value
  const displayValue = (value: any): string => {
    return formatAnswer(value);
  };

  // Helper to render field
  const renderField = (
    label: string,
    value: any,
    fieldPath?: string,
    isLongLabel?: boolean,
  ) => {
    // Check if field should be excluded
    if (fieldPath && shouldExcludeField(fieldPath)) {
      return null;
    }

    // For very long labels, stack them vertically
    if (isLongLabel) {
      return (
        <Box sx={{ py: 0.5 }}>
          <Typography variant="body2" sx={{ fontWeight: 500, mb: 0.5 }}>
            {label}:
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {displayValue(value)}
          </Typography>
        </Box>
      );
    }

    return (
      <Box sx={{ display: "flex", gap: 2, py: 0.5, alignItems: "flex-start" }}>
        <Typography
          variant="body2"
          sx={{ width: "250px", flexShrink: 0, fontWeight: 500 }}
        >
          {label}:
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ flex: 1 }}>
          {displayValue(value)}
        </Typography>
      </Box>
    );
  };

  // Helper to render section header with edit button
  const renderCategoryHeader = (title: string, editPath: string) => (
    <Box
      sx={{
        ...commonStyles.coverageCategoryHeader,
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
        <Typography variant="h4" sx={commonStyles.coverageCategoryTitle}>
          {title}
        </Typography>
      </Box>
      <Button
        variant="outlined"
        color="primary"
        size="small"
        startIcon={<Edit />}
        onClick={() => handleEdit(editPath)}
      >
        Edit
      </Button>
    </Box>
  );

  // Helper to render subsection header without edit button
  const renderSectionHeader = (title: string, icon: React.ReactNode) => (
    <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
      <Box sx={commonStyles.iconCircle}>{icon}</Box>
      <Typography variant="h6">{title}</Typography>
    </Stack>
  );

  return (
    <FormPageLayout
      header={
        <PageHeader
          title="Review Application"
          notes="Please review your application and if needed, click the Edit ✎ button to make changes. Once you proceed to the next page, you will not be able to make any changes. Please review your information carefully before continuing."
        />
      }
      navigation={<PageNavigation onContinue={handleContinue} />}
    >
      <FormStepTransition>
        <Alert severity="warning" sx={{ mb: 2 }}>
          <strong>Important:</strong> Once you proceed to the next page, you
          will not be able to make any changes to your application.
        </Alert>

        <Stack spacing={4}>
          {/* Eligibility Card */}
          {data.eligibility && (
            <Card sx={commonStyles.categoryCard}>
              <CardContent>
                <Stack spacing={2}>
                  {/* Category Header */}
                  {renderCategoryHeader("Eligibility", "/eligibility")}

                  {/* Your Eligibility Sub-card */}
                  <Card variant="outlined">
                    <CardContent>
                      {renderSectionHeader(
                        "Your Eligibility",
                        <Person color="primary" />,
                      )}
                      <Stack spacing={1}>
                        {renderField(
                          "Member Status",
                          data.eligibility.isMember,
                        )}
                        {renderField("Title", data.eligibility.title)}
                        {renderField("First Name", data.eligibility.firstName)}
                        {renderField(
                          "Middle Initial",
                          data.eligibility.middleInitial,
                        )}
                        {renderField("Last Name", data.eligibility.lastName)}
                        {renderField("Suffix", data.eligibility.suffix)}
                        {renderField("Birthday", data.eligibility.birthday)}
                        {renderField("Gender", data.eligibility.gender)}
                        {renderField("State", data.eligibility.state)}
                        {renderField("Email", data.eligibility.email)}
                        {renderField(
                          "Tobacco User",
                          data.eligibility.smokerSelf,
                        )}
                        {/* Note: selfCoverages (which coverage categories) is excluded from preview */}
                      </Stack>
                    </CardContent>
                  </Card>

                  {/* Spouse Eligibility Sub-card */}
                  {data.eligibility?.applicants?.spouse && (
                    <Card variant="outlined">
                      <CardContent>
                        {renderSectionHeader(
                          "Spouse Eligibility",
                          <People color="primary" />,
                        )}
                        <Stack spacing={1}>
                          {renderField(
                            "Member Status",
                            data.eligibility.spouseIsMember,
                          )}
                          {renderField("Title", data.eligibility.spouseTitle)}
                          {renderField(
                            "First Name",
                            data.eligibility.spouseFirstName,
                          )}
                          {renderField(
                            "Middle Initial",
                            data.eligibility.spouseMiddleInitial,
                          )}
                          {renderField(
                            "Last Name",
                            data.eligibility.spouseLastName,
                          )}
                          {renderField("Suffix", data.eligibility.spouseSuffix)}
                          {renderField(
                            "Birthday",
                            data.eligibility.spouseBirthday,
                          )}
                          {renderField("Gender", data.eligibility.spouseGender)}
                          {renderField(
                            "Tobacco User",
                            data.eligibility.smokerSpouse,
                          )}
                          {/* Note: spouseCoverages (which coverage categories) is excluded from preview */}
                        </Stack>
                      </CardContent>
                    </Card>
                  )}

                  {/* Child(ren) Eligibility Sub-card */}
                  {data.eligibility?.applicants?.child &&
                    data.eligibility.children &&
                    data.eligibility.children.length > 0 && (
                      <Card variant="outlined">
                        <CardContent>
                          {renderSectionHeader(
                            "Child(ren) Eligibility",
                            <ChildFriendly color="primary" />,
                          )}
                          <Stack spacing={2}>
                            {data.eligibility.children.map((child, index) => (
                              <Box
                                key={index}
                                sx={{
                                  pl: 2,
                                  borderLeft: 2,
                                  borderColor: "divider",
                                }}
                              >
                                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                                  Child {index + 1}
                                </Typography>
                                <Stack spacing={1}>
                                  {renderField("First Name", child.firstName)}
                                  {renderField("Last Name", child.lastName)}
                                  {renderField("Birthday", child.birthday)}
                                  {renderField("Gender", child.gender)}
                                  {renderField(
                                    "Military Discharge",
                                    child.militaryDischarge,
                                  )}
                                </Stack>
                              </Box>
                            ))}
                          </Stack>
                        </CardContent>
                      </Card>
                    )}
                </Stack>
              </CardContent>
            </Card>
          )}

          {/* Coverage Card */}
          {data.coverage && (
            <Card sx={commonStyles.categoryCard}>
              <CardContent>
                <Stack spacing={2}>
                  {/* Category Header */}
                  {renderCategoryHeader("Coverage", "/coverage-options")}

                  {/* Your Coverage Sub-card */}
                  <Card variant="outlined">
                    <CardContent>
                      {renderSectionHeader(
                        "Your Coverage",
                        <Person color="primary" />,
                      )}
                      <Stack spacing={1}>
                        {data.coverage &&
                        data.coverage.filter(
                          (item) => item.applicant === "self",
                        ).length > 0 ? (
                          data.coverage
                            .filter((item) => item.applicant === "self")
                            .map((item, idx) => {
                              const product = products.find(
                                (p) => p.id === item.productId,
                              );
                              return (
                                <Box key={idx} sx={{ py: 0.5 }}>
                                  <Box
                                    sx={{
                                      display: "flex",
                                      alignItems: "center",
                                      gap: 1,
                                    }}
                                  >
                                    <Typography
                                      variant="body2"
                                      sx={{ fontWeight: 500 }}
                                    >
                                      {getProductName(item.productId)}
                                    </Typography>
                                    {product?.quickDecision && (
                                      <Typography
                                        variant="caption"
                                        sx={{
                                          bgcolor: "success.light",
                                          color: "success.dark",
                                          px: 1,
                                          py: 0.25,
                                          borderRadius: 0.5,
                                          fontWeight: 600,
                                        }}
                                      >
                                        QuickDecision℠
                                      </Typography>
                                    )}
                                  </Box>
                                  <Typography
                                    variant="body2"
                                    color="text.secondary"
                                    sx={{ pl: 2 }}
                                  >
                                    Coverage Amount: $
                                    {item.amount.toLocaleString()}
                                  </Typography>
                                  {item.riders &&
                                    Object.keys(item.riders).length > 0 && (
                                      <Box sx={{ pl: 2, mt: 0.5 }}>
                                        <Typography
                                          variant="body2"
                                          color="text.secondary"
                                          sx={{ fontWeight: 500 }}
                                        >
                                          Riders:
                                        </Typography>
                                        {Object.entries(item.riders).map(
                                          ([riderKey, riderValue]) => {
                                            if (!riderValue) return null;
                                            return (
                                              <Typography
                                                key={riderKey}
                                                variant="body2"
                                                color="text.secondary"
                                                sx={{ pl: 2 }}
                                              >
                                                • {formatRiderName(riderKey)}
                                                {typeof riderValue ===
                                                  "number" &&
                                                  `: $${riderValue.toLocaleString()}`}
                                              </Typography>
                                            );
                                          },
                                        )}
                                      </Box>
                                    )}
                                </Box>
                              );
                            })
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            No coverage selected
                          </Typography>
                        )}
                      </Stack>
                    </CardContent>
                  </Card>

                  {/* Spouse Coverage Sub-card */}
                  {data.eligibility?.applicants?.spouse && (
                    <Card variant="outlined">
                      <CardContent>
                        {renderSectionHeader(
                          "Spouse Coverage",
                          <People color="primary" />,
                        )}
                        <Stack spacing={1}>
                          {data.coverage &&
                          data.coverage.filter(
                            (item) => item.applicant === "spouse",
                          ).length > 0 ? (
                            data.coverage
                              .filter((item) => item.applicant === "spouse")
                              .map((item, idx) => {
                                const product = products.find(
                                  (p) => p.id === item.productId,
                                );
                                return (
                                  <Box key={idx} sx={{ py: 0.5 }}>
                                    <Box
                                      sx={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 1,
                                      }}
                                    >
                                      <Typography
                                        variant="body2"
                                        sx={{ fontWeight: 500 }}
                                      >
                                        {getProductName(item.productId)}
                                      </Typography>
                                      {product?.quickDecision && (
                                        <Typography
                                          variant="caption"
                                          sx={{
                                            bgcolor: "success.light",
                                            color: "success.dark",
                                            px: 1,
                                            py: 0.25,
                                            borderRadius: 0.5,
                                            fontWeight: 600,
                                          }}
                                        >
                                          QuickDecision℠
                                        </Typography>
                                      )}
                                    </Box>
                                    <Typography
                                      variant="body2"
                                      color="text.secondary"
                                      sx={{ pl: 2 }}
                                    >
                                      Coverage Amount: $
                                      {item.amount.toLocaleString()}
                                    </Typography>
                                    {item.riders &&
                                      Object.keys(item.riders).length > 0 && (
                                        <Box sx={{ pl: 2, mt: 0.5 }}>
                                          <Typography
                                            variant="body2"
                                            color="text.secondary"
                                            sx={{ fontWeight: 500 }}
                                          >
                                            Riders:
                                          </Typography>
                                          {Object.entries(item.riders).map(
                                            ([riderKey, riderValue]) => {
                                              if (!riderValue) return null;
                                              return (
                                                <Typography
                                                  key={riderKey}
                                                  variant="body2"
                                                  color="text.secondary"
                                                  sx={{ pl: 2 }}
                                                >
                                                  • {formatRiderName(riderKey)}
                                                  {typeof riderValue ===
                                                    "number" &&
                                                    `: $${riderValue.toLocaleString()}`}
                                                </Typography>
                                              );
                                            },
                                          )}
                                        </Box>
                                      )}
                                  </Box>
                                );
                              })
                          ) : (
                            <Typography variant="body2" color="text.secondary">
                              No coverage selected
                            </Typography>
                          )}
                        </Stack>
                      </CardContent>
                    </Card>
                  )}

                  {/* Child Coverage Sub-card */}
                  {data.eligibility?.applicants?.child && (
                    <Card variant="outlined">
                      <CardContent>
                        {renderSectionHeader(
                          "Child Coverage",
                          <ChildFriendly color="primary" />,
                        )}
                        <Stack spacing={1}>
                          {data.coverage &&
                          data.coverage.filter(
                            (item) => item.applicant === "child",
                          ).length > 0 ? (
                            data.coverage
                              .filter((item) => item.applicant === "child")
                              .map((item, idx) => (
                                <Box key={idx} sx={{ py: 0.5 }}>
                                  <Typography
                                    variant="body2"
                                    sx={{ fontWeight: 500 }}
                                  >
                                    {getProductName(item.productId)}
                                  </Typography>
                                  <Typography
                                    variant="body2"
                                    color="text.secondary"
                                    sx={{ pl: 2 }}
                                  >
                                    Coverage Amount: $
                                    {item.amount.toLocaleString()}
                                  </Typography>
                                  {item.riders &&
                                    Object.keys(item.riders).length > 0 && (
                                      <Box sx={{ pl: 2, mt: 0.5 }}>
                                        <Typography
                                          variant="body2"
                                          color="text.secondary"
                                          sx={{ fontWeight: 500 }}
                                        >
                                          Riders:
                                        </Typography>
                                        {Object.entries(item.riders).map(
                                          ([riderKey, riderValue]) => {
                                            if (!riderValue) return null;
                                            return (
                                              <Typography
                                                key={riderKey}
                                                variant="body2"
                                                color="text.secondary"
                                                sx={{ pl: 2 }}
                                              >
                                                • {formatRiderName(riderKey)}
                                                {typeof riderValue ===
                                                  "number" &&
                                                  `: $${riderValue.toLocaleString()}`}
                                              </Typography>
                                            );
                                          },
                                        )}
                                      </Box>
                                    )}
                                </Box>
                              ))
                          ) : (
                            <Typography variant="body2" color="text.secondary">
                              No coverage selected
                            </Typography>
                          )}
                        </Stack>
                      </CardContent>
                    </Card>
                  )}
                </Stack>
              </CardContent>
            </Card>
          )}

          {/* Contact Card */}
          {data.contact && (
            <Card sx={commonStyles.categoryCard}>
              <CardContent>
                <Stack spacing={2}>
                  {/* Category Header */}
                  {renderCategoryHeader("Contact", "/contact")}

                  {/* Your Contact Sub-card */}
                  <Card variant="outlined">
                    <CardContent>
                      {renderSectionHeader(
                        "Your Contact",
                        <Person color="primary" />,
                      )}
                      <Stack spacing={1}>
                        {renderField(
                          "Street Address",
                          data.contact.streetAddress,
                        )}
                        {renderField("Apt/Suite", data.contact.aptSuite)}
                        {renderField("City", data.contact.city)}
                        {renderField("State", data.contact.state)}
                        {renderField("ZIP Code", data.contact.zipCode)}
                        {renderField("Phone Number", data.contact.phoneNumber)}
                        {renderField("Phone Type", data.contact.phoneType)}
                        {renderField(
                          "Correspondence To",
                          data.contact.correspondenceTo,
                        )}

                        {data.contact.businessName && (
                          <>
                            <Typography
                              variant="subtitle2"
                              sx={{ mt: 2, mb: 1, fontWeight: 600 }}
                            >
                              Business Information
                            </Typography>
                            {renderField(
                              "Business Name",
                              data.contact.businessName,
                            )}
                            {renderField(
                              "Business Type",
                              data.contact.businessType,
                            )}
                            {renderField(
                              "Business Address Same as Home",
                              data.contact.businessAddressSameAsHome,
                            )}
                            {!data.contact.businessAddressSameAsHome && (
                              <>
                                {renderField(
                                  "Business Street Address",
                                  data.contact.businessStreetAddress,
                                )}
                                {renderField(
                                  "Business Apt/Suite",
                                  data.contact.businessAptSuite,
                                )}
                                {renderField(
                                  "Business City",
                                  data.contact.businessCity,
                                )}
                                {renderField(
                                  "Business State",
                                  data.contact.businessState,
                                )}
                                {renderField(
                                  "Business ZIP Code",
                                  data.contact.businessZipCode,
                                )}
                              </>
                            )}
                            {renderField(
                              "Business Phone Number",
                              data.contact.businessPhoneNumber,
                            )}
                          </>
                        )}
                      </Stack>
                    </CardContent>
                  </Card>

                  {/* Spouse Contact Sub-card */}
                  {data.eligibility?.applicants?.spouse && (
                    <Card variant="outlined">
                      <CardContent>
                        {renderSectionHeader(
                          "Spouse Contact",
                          <People color="primary" />,
                        )}
                        <Stack spacing={1}>
                          {renderField(
                            "Phone Number",
                            data.contact.spousePhoneNumber,
                          )}
                          {renderField(
                            "Phone Type",
                            data.contact.spousePhoneType,
                          )}
                          {renderField("Email", data.contact.spouseEmail)}
                        </Stack>
                      </CardContent>
                    </Card>
                  )}
                </Stack>
              </CardContent>
            </Card>
          )}

          {/* Personal Information Card */}
          {data.profile && (
            <Card sx={commonStyles.categoryCard}>
              <CardContent>
                <Stack spacing={2}>
                  {/* Category Header */}
                  {renderCategoryHeader("Personal Information", "/profile")}

                  {/* Your Personal Information Sub-card */}
                  <Card variant="outlined">
                    <CardContent>
                      {renderSectionHeader(
                        "Your Personal Information",
                        <Person color="primary" />,
                      )}
                      <Stack spacing={1}>
                        {renderField("Height", data.profile.heightFt)}
                        {renderField("Weight", data.profile.weight)}
                        {renderField(
                          "Weight 12 Months Ago",
                          data.profile.weight12MonthsAgo,
                        )}
                        {renderField(
                          "SSN",
                          data.profile.ssn
                            ? "***-**-" + data.profile.ssn.slice(-4)
                            : "—",
                        )}
                        {renderField(
                          "Membership ID",
                          data.profile.membershipId,
                        )}
                        {renderField(
                          "Marital Status",
                          data.profile.maritalStatus,
                        )}

                        <Typography
                          variant="subtitle2"
                          sx={{ mt: 2, mb: 1, fontWeight: 600 }}
                        >
                          Driver's License
                        </Typography>
                        {renderField(
                          "Has Driver's License",
                          data.profile.hasDriversLicense,
                        )}
                        {data.profile.hasDriversLicense === "yes" && (
                          <>
                            {renderField(
                              "License Number",
                              data.profile.driversLicenseNumber,
                            )}
                            {renderField(
                              "License State",
                              data.profile.driversLicenseState,
                            )}
                          </>
                        )}

                        <Typography
                          variant="subtitle2"
                          sx={{ mt: 2, mb: 1, fontWeight: 600 }}
                        >
                          Residency
                        </Typography>
                        {renderField(
                          "Intent to Reside Outside US/Canada",
                          data.profile.residencyIntentOutsideUS,
                        )}
                        {data.profile.residencyIntentOutsideUS === "yes" && (
                          <>
                            {renderField(
                              "Duration (months)",
                              data.profile.residencyDurationMonths,
                            )}
                            {renderField(
                              "Country",
                              data.profile.residencyCountry,
                            )}
                          </>
                        )}
                        {renderField(
                          "Intent for 6+ Months Outside US/Canada",
                          data.profile.residencyIntentSixMonths,
                        )}
                        {data.profile.residencyIntentSixMonths === "yes" &&
                          renderField(
                            "Country",
                            data.profile.residencySixMonthsCountry,
                          )}

                        {(data.profile.physicianFirstName ||
                          data.profile.physicianLastName) && (
                          <>
                            <Typography
                              variant="subtitle2"
                              sx={{ mt: 2, mb: 1, fontWeight: 600 }}
                            >
                              Health Care Information
                            </Typography>
                            {renderField(
                              "Physician Name",
                              `${data.profile.physicianFirstName || ""} ${data.profile.physicianLastName || ""}`.trim(),
                            )}
                            {renderField(
                              "Physician Phone",
                              data.profile.physicianPhoneNumber,
                            )}
                            {renderField(
                              "Medical Facility",
                              data.profile.medicalFacilityName,
                            )}
                            {data.profile.medicalStreetAddress && (
                              <>
                                {renderField(
                                  "Street Address",
                                  data.profile.medicalStreetAddress,
                                )}
                                {renderField(
                                  "Apt/Suite",
                                  data.profile.medicalAptSuite,
                                )}
                                {renderField("City", data.profile.medicalCity)}
                                {renderField(
                                  "State",
                                  data.profile.medicalState,
                                )}
                                {renderField(
                                  "ZIP Code",
                                  data.profile.medicalZipCode,
                                )}
                              </>
                            )}
                          </>
                        )}
                      </Stack>
                    </CardContent>
                  </Card>

                  {/* Spouse Personal Information Sub-card */}
                  {data.eligibility?.applicants?.spouse && (
                    <Card variant="outlined">
                      <CardContent>
                        {renderSectionHeader(
                          "Spouse Personal Information",
                          <People color="primary" />,
                        )}
                        <Stack spacing={1}>
                          {renderField("Height", data.profile.spouseHeightFt)}
                          {renderField("Weight", data.profile.spouseWeight)}
                          {renderField(
                            "Weight 12 Months Ago",
                            data.profile.spouseWeight12MonthsAgo,
                          )}
                          {renderField(
                            "SSN",
                            data.profile.spouseSsn
                              ? "***-**-" + data.profile.spouseSsn.slice(-4)
                              : "—",
                          )}

                          <Typography
                            variant="subtitle2"
                            sx={{ mt: 2, mb: 1, fontWeight: 600 }}
                          >
                            Driver's License
                          </Typography>
                          {renderField(
                            "Has Driver's License",
                            data.profile.spouseHasDriversLicense,
                          )}
                          {data.profile.spouseHasDriversLicense === "yes" && (
                            <>
                              {renderField(
                                "License Number",
                                data.profile.spouseDriversLicenseNumber,
                              )}
                              {renderField(
                                "License State",
                                data.profile.spouseDriversLicenseState,
                              )}
                            </>
                          )}

                          <Typography
                            variant="subtitle2"
                            sx={{ mt: 2, mb: 1, fontWeight: 600 }}
                          >
                            Residency
                          </Typography>
                          {renderField(
                            "Intent to Reside Outside US/Canada",
                            data.profile.spouseResidencyIntentOutsideUS,
                          )}
                          {data.profile.spouseResidencyIntentOutsideUS ===
                            "yes" && (
                            <>
                              {renderField(
                                "Duration (months)",
                                data.profile.spouseResidencyDurationMonths,
                              )}
                              {renderField(
                                "Country",
                                data.profile.spouseResidencyCountry,
                              )}
                            </>
                          )}
                          {renderField(
                            "Intent for 6+ Months Outside US/Canada",
                            data.profile.spouseResidencyIntentSixMonths,
                          )}
                          {data.profile.spouseResidencyIntentSixMonths ===
                            "yes" &&
                            renderField(
                              "Country",
                              data.profile.spouseResidencySixMonthsCountry,
                            )}

                          {(data.profile.spousePhysicianFirstName ||
                            data.profile.spousePhysicianLastName) && (
                            <>
                              <Typography
                                variant="subtitle2"
                                sx={{ mt: 2, mb: 1, fontWeight: 600 }}
                              >
                                Health Care Information
                              </Typography>
                              {renderField(
                                "Physician Name",
                                `${data.profile.spousePhysicianFirstName || ""} ${data.profile.spousePhysicianLastName || ""}`.trim(),
                              )}
                              {renderField(
                                "Physician Phone",
                                data.profile.spousePhysicianPhoneNumber,
                              )}
                              {renderField(
                                "Medical Facility",
                                data.profile.spouseMedicalFacilityName,
                              )}
                              {data.profile.spouseMedicalStreetAddress && (
                                <>
                                  {renderField(
                                    "Street Address",
                                    data.profile.spouseMedicalStreetAddress,
                                  )}
                                  {renderField(
                                    "Apt/Suite",
                                    data.profile.spouseMedicalAptSuite,
                                  )}
                                  {renderField(
                                    "City",
                                    data.profile.spouseMedicalCity,
                                  )}
                                  {renderField(
                                    "State",
                                    data.profile.spouseMedicalState,
                                  )}
                                  {renderField(
                                    "ZIP Code",
                                    data.profile.spouseMedicalZipCode,
                                  )}
                                </>
                              )}
                            </>
                          )}
                        </Stack>
                      </CardContent>
                    </Card>
                  )}
                </Stack>
              </CardContent>
            </Card>
          )}

          {/* Other Coverage Card */}
          <Card sx={commonStyles.categoryCard}>
            <CardContent>
              <Stack spacing={2}>
                {/* Category Header */}
                {renderCategoryHeader("Other Coverage", "/profile")}

                {/* Your Other Coverage Sub-card */}
                <Card variant="outlined">
                  <CardContent>
                    {renderSectionHeader(
                      "Your Other Coverage",
                      <Person color="primary" />,
                    )}
                    <Stack spacing={1}>
                      <Typography
                        variant="subtitle2"
                        sx={{ fontWeight: 600, mb: 1 }}
                      >
                        Life Insurance
                      </Typography>
                      {renderField(
                        "Has Other Life Insurance",
                        data.profile.hasOtherLifeInsurance,
                      )}
                      {data.profile.hasOtherLifeInsurance === "yes" && (
                        <>
                          {renderField(
                            "Amount",
                            data.profile.otherLifeInsuranceAmount,
                          )}
                          {renderField(
                            "Is Replacement",
                            data.profile.lifeInsuranceReplacement,
                          )}
                        </>
                      )}
                      {renderField(
                        "Has Pending Life Insurance",
                        data.profile.hasLifeInsurancePending,
                      )}
                      {data.profile.hasLifeInsurancePending === "yes" && (
                        <>
                          {renderField(
                            "Pending Amount",
                            data.profile.pendingLifeInsuranceAmount,
                          )}
                          {renderField(
                            "Pending Company",
                            data.profile.pendingLifeInsuranceCompany,
                          )}
                        </>
                      )}

                      <Typography
                        variant="subtitle2"
                        sx={{ mt: 2, fontWeight: 600, mb: 1 }}
                      >
                        Disability Insurance
                      </Typography>
                      {renderField(
                        "Has Disability Insurance",
                        data.profile.hasDisabilityInsurance,
                      )}
                      {data.profile.hasDisabilityInsurance === "yes" &&
                        data.profile.disabilityCompanies && (
                          <>
                            {data.profile.disabilityCompanies.map(
                              (company, idx) => (
                                <Box
                                  key={idx}
                                  sx={{
                                    pl: 2,
                                    borderLeft: 2,
                                    borderColor: "divider",
                                    my: 1,
                                  }}
                                >
                                  <Typography
                                    variant="caption"
                                    sx={{ fontWeight: 600 }}
                                  >
                                    Policy {idx + 1}
                                  </Typography>
                                  {renderField("Company", company.company)}
                                  {renderField(
                                    "Monthly Benefit",
                                    company.monthlyBenefit,
                                  )}
                                  {renderField(
                                    "Benefit Period",
                                    company.benefitPeriod,
                                  )}
                                  {renderField(
                                    "Waiting Period",
                                    company.waitingPeriod,
                                  )}
                                </Box>
                              ),
                            )}
                            {renderField(
                              "Is Replacement",
                              data.profile.disabilityReplacement,
                            )}
                            {data.profile.disabilityReplacement === "yes" &&
                              renderField(
                                "Replacement Amount",
                                data.profile.disabilityReplacementAmount,
                              )}
                          </>
                        )}
                    </Stack>
                  </CardContent>
                </Card>

                {/* Spouse Other Coverage Sub-card */}
                {data.eligibility?.applicants?.spouse && (
                  <Card variant="outlined">
                    <CardContent>
                      {renderSectionHeader(
                        "Spouse Other Coverage",
                        <People color="primary" />,
                      )}
                      <Stack spacing={1}>
                        <Typography
                          variant="subtitle2"
                          sx={{ fontWeight: 600, mb: 1 }}
                        >
                          Life Insurance
                        </Typography>
                        {renderField(
                          "Has Other Life Insurance",
                          data.profile.spouseHasOtherLifeInsurance,
                        )}
                        {data.profile.spouseHasOtherLifeInsurance === "yes" && (
                          <>
                            {renderField(
                              "Amount",
                              data.profile.spouseOtherLifeInsuranceAmount,
                            )}
                            {renderField(
                              "Is Replacement",
                              data.profile.spouseLifeInsuranceReplacement,
                            )}
                          </>
                        )}
                        {renderField(
                          "Has Pending Life Insurance",
                          data.profile.spouseHasLifeInsurancePending,
                        )}
                        {data.profile.spouseHasLifeInsurancePending ===
                          "yes" && (
                          <>
                            {renderField(
                              "Pending Amount",
                              data.profile.spousePendingLifeInsuranceAmount,
                            )}
                            {renderField(
                              "Pending Company",
                              data.profile.spousePendingLifeInsuranceCompany,
                            )}
                          </>
                        )}

                        <Typography
                          variant="subtitle2"
                          sx={{ mt: 2, fontWeight: 600, mb: 1 }}
                        >
                          Disability Insurance
                        </Typography>
                        {renderField(
                          "Has Disability Insurance",
                          data.profile.spouseHasDisabilityInsurance,
                        )}
                        {data.profile.spouseHasDisabilityInsurance === "yes" &&
                          data.profile.spouseDisabilityCompanies && (
                            <>
                              {data.profile.spouseDisabilityCompanies.map(
                                (company, idx) => (
                                  <Box
                                    key={idx}
                                    sx={{
                                      pl: 2,
                                      borderLeft: 2,
                                      borderColor: "divider",
                                      my: 1,
                                    }}
                                  >
                                    <Typography
                                      variant="caption"
                                      sx={{ fontWeight: 600 }}
                                    >
                                      Policy {idx + 1}
                                    </Typography>
                                    {renderField("Company", company.company)}
                                    {renderField(
                                      "Monthly Benefit",
                                      company.monthlyBenefit,
                                    )}
                                    {renderField(
                                      "Benefit Period",
                                      company.benefitPeriod,
                                    )}
                                    {renderField(
                                      "Waiting Period",
                                      company.waitingPeriod,
                                    )}
                                  </Box>
                                ),
                              )}
                              {renderField(
                                "Is Replacement",
                                data.profile.spouseDisabilityReplacement,
                              )}
                              {data.profile.spouseDisabilityReplacement ===
                                "yes" &&
                                renderField(
                                  "Replacement Amount",
                                  data.profile
                                    .spouseDisabilityReplacementAmount,
                                )}
                            </>
                          )}
                      </Stack>
                    </CardContent>
                  </Card>
                )}
              </Stack>
            </CardContent>
          </Card>

          {/* Beneficiary Card */}
          <Card sx={commonStyles.categoryCard}>
            <CardContent>
              <Stack spacing={2}>
                {/* Category Header */}
                {renderCategoryHeader("Beneficiary", "/profile")}

                {/* Your Beneficiary Sub-card */}
                <Card variant="outlined">
                  <CardContent>
                    {renderSectionHeader(
                      "Your Beneficiary",
                      <Person color="primary" />,
                    )}
                    <Stack spacing={2}>
                      {data.profile.wantsToBeneficiaries === "no" ? (
                        <Typography variant="body2" color="text.secondary">
                          No beneficiary information provided
                        </Typography>
                      ) : (
                        <>
                          {/* Term Life Beneficiary */}
                          {data.profile.termLifeBeneficiaryType && (
                            <Box>
                              <Typography
                                variant="subtitle2"
                                sx={{ fontWeight: 600, mb: 1 }}
                              >
                                Term Life Insurance Beneficiary
                              </Typography>
                              {renderField(
                                "Type",
                                data.profile.termLifeBeneficiaryType,
                              )}
                              {data.profile.termLifeBeneficiaryType ===
                              "individual" ? (
                                <>
                                  {renderField(
                                    "Designation",
                                    data.profile.termLifeBeneficiaryDesignation,
                                  )}
                                  {renderField(
                                    "First Name",
                                    data.profile.termLifeBeneficiaryFirstName,
                                  )}
                                  {renderField(
                                    "Last Name",
                                    data.profile.termLifeBeneficiaryLastName,
                                  )}
                                  {renderField(
                                    "Relationship",
                                    data.profile
                                      .termLifeBeneficiaryRelationship,
                                  )}
                                  {renderField(
                                    "Share %",
                                    data.profile.termLifeBeneficiaryShare,
                                  )}
                                </>
                              ) : (
                                <>
                                  {renderField(
                                    "Trust Name",
                                    data.profile.termLifeTrustName,
                                  )}
                                  {renderField(
                                    "Trust Date",
                                    data.profile.termLifeTrustDate,
                                  )}
                                </>
                              )}
                            </Box>
                          )}

                          {/* 10-Year Term Beneficiary */}
                          {data.profile.tenYearTermBeneficiaryType && (
                            <Box>
                              <Typography
                                variant="subtitle2"
                                sx={{ fontWeight: 600, mb: 1 }}
                              >
                                10-Year Level Term Life Insurance Beneficiary
                              </Typography>
                              {renderField(
                                "Type",
                                data.profile.tenYearTermBeneficiaryType,
                              )}
                              {data.profile.tenYearTermBeneficiaryType ===
                              "individual" ? (
                                <>
                                  {renderField(
                                    "Designation",
                                    data.profile
                                      .tenYearTermBeneficiaryDesignation,
                                  )}
                                  {renderField(
                                    "First Name",
                                    data.profile
                                      .tenYearTermBeneficiaryFirstName,
                                  )}
                                  {renderField(
                                    "Last Name",
                                    data.profile.tenYearTermBeneficiaryLastName,
                                  )}
                                  {renderField(
                                    "Relationship",
                                    data.profile
                                      .tenYearTermBeneficiaryRelationship,
                                  )}
                                  {renderField(
                                    "Share %",
                                    data.profile.tenYearTermBeneficiaryShare,
                                  )}
                                </>
                              ) : (
                                <>
                                  {renderField(
                                    "Trust Name",
                                    data.profile.tenYearTermTrustName,
                                  )}
                                  {renderField(
                                    "Trust Date",
                                    data.profile.tenYearTermTrustDate,
                                  )}
                                </>
                              )}
                            </Box>
                          )}

                          {/* 20-Year Term Beneficiary */}
                          {data.profile.twentyYearTermBeneficiaryType && (
                            <Box>
                              <Typography
                                variant="subtitle2"
                                sx={{ fontWeight: 600, mb: 1 }}
                              >
                                20-Year Level Term Life Insurance Beneficiary
                              </Typography>
                              {renderField(
                                "Type",
                                data.profile.twentyYearTermBeneficiaryType,
                              )}
                              {data.profile.twentyYearTermBeneficiaryType ===
                              "individual" ? (
                                <>
                                  {renderField(
                                    "Designation",
                                    data.profile
                                      .twentyYearTermBeneficiaryDesignation,
                                  )}
                                  {renderField(
                                    "First Name",
                                    data.profile
                                      .twentyYearTermBeneficiaryFirstName,
                                  )}
                                  {renderField(
                                    "Last Name",
                                    data.profile
                                      .twentyYearTermBeneficiaryLastName,
                                  )}
                                  {renderField(
                                    "Relationship",
                                    data.profile
                                      .twentyYearTermBeneficiaryRelationship,
                                  )}
                                  {renderField(
                                    "Share %",
                                    data.profile.twentyYearTermBeneficiaryShare,
                                  )}
                                </>
                              ) : (
                                <>
                                  {renderField(
                                    "Trust Name",
                                    data.profile.twentyYearTermTrustName,
                                  )}
                                  {renderField(
                                    "Trust Date",
                                    data.profile.twentyYearTermTrustDate,
                                  )}
                                </>
                              )}
                            </Box>
                          )}

                          {/* ADD Beneficiary */}
                          {data.profile.addBeneficiaryType && (
                            <Box>
                              <Typography
                                variant="subtitle2"
                                sx={{ fontWeight: 600, mb: 1 }}
                              >
                                Accidental Death & Dismemberment Beneficiary
                              </Typography>
                              {renderField(
                                "Type",
                                data.profile.addBeneficiaryType,
                              )}
                              {data.profile.addBeneficiaryType ===
                              "individual" ? (
                                <>
                                  {renderField(
                                    "Designation",
                                    data.profile.addBeneficiaryDesignation,
                                  )}
                                  {renderField(
                                    "First Name",
                                    data.profile.addBeneficiaryFirstName,
                                  )}
                                  {renderField(
                                    "Last Name",
                                    data.profile.addBeneficiaryLastName,
                                  )}
                                  {renderField(
                                    "Relationship",
                                    data.profile.addBeneficiaryRelationship,
                                  )}
                                  {renderField(
                                    "Share %",
                                    data.profile.addBeneficiaryShare,
                                  )}
                                </>
                              ) : (
                                <>
                                  {renderField(
                                    "Trust Name",
                                    data.profile.addTrustName,
                                  )}
                                  {renderField(
                                    "Trust Date",
                                    data.profile.addTrustDate,
                                  )}
                                </>
                              )}
                            </Box>
                          )}
                        </>
                      )}
                    </Stack>
                  </CardContent>
                </Card>

                {/* Spouse Beneficiary Sub-card */}
                {data.eligibility?.applicants?.spouse && (
                  <Card variant="outlined">
                    <CardContent>
                      {renderSectionHeader(
                        "Spouse Beneficiary",
                        <People color="primary" />,
                      )}
                      <Stack spacing={2}>
                        {/* Similar structure for spouse beneficiaries */}
                        {data.profile.spouseTermLifeBeneficiaryType ||
                        data.profile.spouseTenYearTermBeneficiaryType ||
                        data.profile.spouseTwentyYearTermBeneficiaryType ||
                        data.profile.spouseAddBeneficiaryType ? (
                          <>
                            {/* Spouse Term Life Beneficiary */}
                            {data.profile.spouseTermLifeBeneficiaryType && (
                              <Box>
                                <Typography
                                  variant="subtitle2"
                                  sx={{ fontWeight: 600, mb: 1 }}
                                >
                                  Term Life Insurance Beneficiary
                                </Typography>
                                {renderField(
                                  "Type",
                                  data.profile.spouseTermLifeBeneficiaryType,
                                )}
                                {data.profile.spouseTermLifeBeneficiaryType ===
                                "individual" ? (
                                  <>
                                    {renderField(
                                      "Designation",
                                      data.profile
                                        .spouseTermLifeBeneficiaryDesignation,
                                    )}
                                    {renderField(
                                      "First Name",
                                      data.profile
                                        .spouseTermLifeBeneficiaryFirstName,
                                    )}
                                    {renderField(
                                      "Last Name",
                                      data.profile
                                        .spouseTermLifeBeneficiaryLastName,
                                    )}
                                    {renderField(
                                      "Relationship",
                                      data.profile
                                        .spouseTermLifeBeneficiaryRelationship,
                                    )}
                                    {renderField(
                                      "Share %",
                                      data.profile
                                        .spouseTermLifeBeneficiaryShare,
                                    )}
                                  </>
                                ) : (
                                  <>
                                    {renderField(
                                      "Trust Name",
                                      data.profile.spouseTermLifeTrustName,
                                    )}
                                    {renderField(
                                      "Trust Date",
                                      data.profile.spouseTermLifeTrustDate,
                                    )}
                                  </>
                                )}
                              </Box>
                            )}

                            {/* Spouse 10-Year Term */}
                            {data.profile.spouseTenYearTermBeneficiaryType && (
                              <Box>
                                <Typography
                                  variant="subtitle2"
                                  sx={{ fontWeight: 600, mb: 1 }}
                                >
                                  10-Year Level Term Life Insurance Beneficiary
                                </Typography>
                                {renderField(
                                  "Type",
                                  data.profile.spouseTenYearTermBeneficiaryType,
                                )}
                                {data.profile
                                  .spouseTenYearTermBeneficiaryType ===
                                "individual" ? (
                                  <>
                                    {renderField(
                                      "Designation",
                                      data.profile
                                        .spouseTenYearTermBeneficiaryDesignation,
                                    )}
                                    {renderField(
                                      "First Name",
                                      data.profile
                                        .spouseTenYearTermBeneficiaryFirstName,
                                    )}
                                    {renderField(
                                      "Last Name",
                                      data.profile
                                        .spouseTenYearTermBeneficiaryLastName,
                                    )}
                                    {renderField(
                                      "Relationship",
                                      data.profile
                                        .spouseTenYearTermBeneficiaryRelationship,
                                    )}
                                    {renderField(
                                      "Share %",
                                      data.profile
                                        .spouseTenYearTermBeneficiaryShare,
                                    )}
                                  </>
                                ) : (
                                  <>
                                    {renderField(
                                      "Trust Name",
                                      data.profile.spouseTenYearTermTrustName,
                                    )}
                                    {renderField(
                                      "Trust Date",
                                      data.profile.spouseTenYearTermTrustDate,
                                    )}
                                  </>
                                )}
                              </Box>
                            )}

                            {/* Spouse 20-Year Term */}
                            {data.profile
                              .spouseTwentyYearTermBeneficiaryType && (
                              <Box>
                                <Typography
                                  variant="subtitle2"
                                  sx={{ fontWeight: 600, mb: 1 }}
                                >
                                  20-Year Level Term Life Insurance Beneficiary
                                </Typography>
                                {renderField(
                                  "Type",
                                  data.profile
                                    .spouseTwentyYearTermBeneficiaryType,
                                )}
                                {data.profile
                                  .spouseTwentyYearTermBeneficiaryType ===
                                "individual" ? (
                                  <>
                                    {renderField(
                                      "Designation",
                                      data.profile
                                        .spouseTwentyYearTermBeneficiaryDesignation,
                                    )}
                                    {renderField(
                                      "First Name",
                                      data.profile
                                        .spouseTwentyYearTermBeneficiaryFirstName,
                                    )}
                                    {renderField(
                                      "Last Name",
                                      data.profile
                                        .spouseTwentyYearTermBeneficiaryLastName,
                                    )}
                                    {renderField(
                                      "Relationship",
                                      data.profile
                                        .spouseTwentyYearTermBeneficiaryRelationship,
                                    )}
                                    {renderField(
                                      "Share %",
                                      data.profile
                                        .spouseTwentyYearTermBeneficiaryShare,
                                    )}
                                  </>
                                ) : (
                                  <>
                                    {renderField(
                                      "Trust Name",
                                      data.profile
                                        .spouseTwentyYearTermTrustName,
                                    )}
                                    {renderField(
                                      "Trust Date",
                                      data.profile
                                        .spouseTwentyYearTermTrustDate,
                                    )}
                                  </>
                                )}
                              </Box>
                            )}

                            {/* Spouse ADD */}
                            {data.profile.spouseAddBeneficiaryType && (
                              <Box>
                                <Typography
                                  variant="subtitle2"
                                  sx={{ fontWeight: 600, mb: 1 }}
                                >
                                  Accidental Death & Dismemberment Beneficiary
                                </Typography>
                                {renderField(
                                  "Type",
                                  data.profile.spouseAddBeneficiaryType,
                                )}
                                {data.profile.spouseAddBeneficiaryType ===
                                "individual" ? (
                                  <>
                                    {renderField(
                                      "Designation",
                                      data.profile
                                        .spouseAddBeneficiaryDesignation,
                                    )}
                                    {renderField(
                                      "First Name",
                                      data.profile
                                        .spouseAddBeneficiaryFirstName,
                                    )}
                                    {renderField(
                                      "Last Name",
                                      data.profile.spouseAddBeneficiaryLastName,
                                    )}
                                    {renderField(
                                      "Relationship",
                                      data.profile
                                        .spouseAddBeneficiaryRelationship,
                                    )}
                                    {renderField(
                                      "Share %",
                                      data.profile.spouseAddBeneficiaryShare,
                                    )}
                                  </>
                                ) : (
                                  <>
                                    {renderField(
                                      "Trust Name",
                                      data.profile.spouseAddTrustName,
                                    )}
                                    {renderField(
                                      "Trust Date",
                                      data.profile.spouseAddTrustDate,
                                    )}
                                  </>
                                )}
                              </Box>
                            )}
                          </>
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            No beneficiary information provided
                          </Typography>
                        )}
                      </Stack>
                    </CardContent>
                  </Card>
                )}
              </Stack>
            </CardContent>
          </Card>

          {/* Payment Card */}
          {data.payment && (
            <Card sx={commonStyles.categoryCard}>
              <CardContent>
                <Stack spacing={2}>
                  {/* Category Header */}
                  {renderCategoryHeader("Payment", "/profile")}

                  {/* Payment Sub-card */}
                  <Card variant="outlined">
                    <CardContent>
                      {renderSectionHeader(
                        "Your Payment",
                        <Payment color="primary" />,
                      )}
                      <Stack spacing={2}>
                        {data.profile.wantsToAddPayment === "no" ? (
                          <Typography variant="body2" color="text.secondary">
                            No payment information provided
                          </Typography>
                        ) : (
                          <>
                            {/* Payment methods for each product */}
                            {data.profile.termLifePaymentMethod && (
                              <Box>
                                <Typography
                                  variant="subtitle2"
                                  sx={{ fontWeight: 600, mb: 1 }}
                                >
                                  Term Life Insurance
                                </Typography>
                                {renderField(
                                  "Payment Method",
                                  data.profile.termLifePaymentMethod,
                                )}
                                {renderField(
                                  "Payment Frequency",
                                  data.profile.termLifePaymentFrequency,
                                )}
                              </Box>
                            )}

                            {data.profile.tenYearTermPaymentMethod && (
                              <Box>
                                <Typography
                                  variant="subtitle2"
                                  sx={{ fontWeight: 600, mb: 1 }}
                                >
                                  10-Year Level Term Life Insurance
                                </Typography>
                                {renderField(
                                  "Payment Method",
                                  data.profile.tenYearTermPaymentMethod,
                                )}
                                {renderField(
                                  "Payment Frequency",
                                  data.profile.tenYearTermPaymentFrequency,
                                )}
                              </Box>
                            )}

                            {data.profile.twentyYearTermPaymentMethod && (
                              <Box>
                                <Typography
                                  variant="subtitle2"
                                  sx={{ fontWeight: 600, mb: 1 }}
                                >
                                  20-Year Level Term Life Insurance
                                </Typography>
                                {renderField(
                                  "Payment Method",
                                  data.profile.twentyYearTermPaymentMethod,
                                )}
                                {renderField(
                                  "Payment Frequency",
                                  data.profile.twentyYearTermPaymentFrequency,
                                )}
                              </Box>
                            )}

                            {data.profile.addPaymentMethod && (
                              <Box>
                                <Typography
                                  variant="subtitle2"
                                  sx={{ fontWeight: 600, mb: 1 }}
                                >
                                  Accidental Death & Dismemberment
                                </Typography>
                                {renderField(
                                  "Payment Method",
                                  data.profile.addPaymentMethod,
                                )}
                                {renderField(
                                  "Payment Frequency",
                                  data.profile.addPaymentFrequency,
                                )}
                              </Box>
                            )}

                            {data.profile.longTermDisabilityPaymentMethod && (
                              <Box>
                                <Typography
                                  variant="subtitle2"
                                  sx={{ fontWeight: 600, mb: 1 }}
                                >
                                  Long-Term Disability Plus
                                </Typography>
                                {renderField(
                                  "Payment Method",
                                  data.profile.longTermDisabilityPaymentMethod,
                                )}
                                {renderField(
                                  "Payment Frequency",
                                  data.profile
                                    .longTermDisabilityPaymentFrequency,
                                )}
                              </Box>
                            )}

                            {data.profile.midTermDisabilityPaymentMethod && (
                              <Box>
                                <Typography
                                  variant="subtitle2"
                                  sx={{ fontWeight: 600, mb: 1 }}
                                >
                                  Mid-Term Disability
                                </Typography>
                                {renderField(
                                  "Payment Method",
                                  data.profile.midTermDisabilityPaymentMethod,
                                )}
                                {renderField(
                                  "Payment Frequency",
                                  data.profile
                                    .midTermDisabilityPaymentFrequency,
                                )}
                              </Box>
                            )}

                            {data.profile.professionalOverheadPaymentMethod && (
                              <Box>
                                <Typography
                                  variant="subtitle2"
                                  sx={{ fontWeight: 600, mb: 1 }}
                                >
                                  Professional Overhead Expense
                                </Typography>
                                {renderField(
                                  "Payment Method",
                                  data.profile
                                    .professionalOverheadPaymentMethod,
                                )}
                                {renderField(
                                  "Payment Frequency",
                                  data.profile
                                    .professionalOverheadPaymentFrequency,
                                )}
                              </Box>
                            )}

                            {data.profile.criticalIllnessPaymentMethod && (
                              <Box>
                                <Typography
                                  variant="subtitle2"
                                  sx={{ fontWeight: 600, mb: 1 }}
                                >
                                  Critical Illness
                                </Typography>
                                {renderField(
                                  "Payment Method",
                                  data.profile.criticalIllnessPaymentMethod,
                                )}
                                {renderField(
                                  "Payment Frequency",
                                  data.profile.criticalIllnessPaymentFrequency,
                                )}
                              </Box>
                            )}

                            {data.profile.hospitalMoneyPaymentMethod && (
                              <Box>
                                <Typography
                                  variant="subtitle2"
                                  sx={{ fontWeight: 600, mb: 1 }}
                                >
                                  Hospital Money
                                </Typography>
                                {renderField(
                                  "Payment Method",
                                  data.profile.hospitalMoneyPaymentMethod,
                                )}
                                {renderField(
                                  "Payment Frequency",
                                  data.profile.hospitalMoneyPaymentFrequency,
                                )}
                              </Box>
                            )}

                            {/* Bank Account Details if applicable */}
                            {(data.profile.routingNumber ||
                              data.profile.accountNumber) && (
                              <Box sx={{ mt: 2 }}>
                                <Typography
                                  variant="subtitle2"
                                  sx={{ fontWeight: 600, mb: 1 }}
                                >
                                  Bank Account Details
                                </Typography>
                                {renderField(
                                  "Routing Number",
                                  data.profile.routingNumber
                                    ? "****" +
                                        data.profile.routingNumber.slice(-4)
                                    : "—",
                                )}
                                {renderField(
                                  "Account Number",
                                  data.profile.accountNumber
                                    ? "****" +
                                        data.profile.accountNumber.slice(-4)
                                    : "—",
                                )}
                                {renderField(
                                  "Name on Account",
                                  data.profile.nameOnAccount,
                                )}
                                {renderField(
                                  "Bank Institution",
                                  data.profile.bankInstitution,
                                )}
                                {renderField(
                                  "Account Consent",
                                  data.profile.bankAccountConsent,
                                )}
                              </Box>
                            )}
                          </>
                        )}
                      </Stack>
                    </CardContent>
                  </Card>
                </Stack>
              </CardContent>
            </Card>
          )}

          {/* Financial Information Card */}
          {data.profile &&
            (data.profile.totalAnnualUnearnedIncome ||
              data.profile.soleProprietorGrossIncome ||
              data.profile.partnershipGrossIncome ||
              data.profile.employerName) && (
              <Card sx={commonStyles.categoryCard}>
                <CardContent>
                  <Stack spacing={2}>
                    {renderCategoryHeader("Financial Information", "/profile")}

                    <Card variant="outlined">
                      <CardContent>
                        {renderSectionHeader(
                          "Your Financial Details",
                          <AttachMoney color="primary" />,
                        )}
                        <Stack spacing={1}>
                          {data.profile.totalAnnualUnearnedIncome &&
                            renderField(
                              "Total Annual Unearned Income",
                              data.profile.totalAnnualUnearnedIncome,
                            )}
                          {data.profile.soleProprietorGrossIncome &&
                            renderField(
                              "Sole Proprietor Gross Income",
                              data.profile.soleProprietorGrossIncome,
                            )}
                          {data.profile.partnershipGrossIncome &&
                            renderField(
                              "Partnership Gross Income",
                              data.profile.partnershipGrossIncome,
                            )}
                          {data.profile.employerName &&
                            renderField(
                              "Employer Name",
                              data.profile.employerName,
                            )}
                          {data.profile.employerAddress &&
                            renderField(
                              "Employer Address",
                              data.profile.employerAddress,
                            )}
                          {data.profile.occupation &&
                            renderField("Occupation", data.profile.occupation)}
                          {data.profile.duties &&
                            renderField("Duties", data.profile.duties)}
                        </Stack>
                      </CardContent>
                    </Card>
                  </Stack>
                </CardContent>
              </Card>
            )}

          {/* Health History Card */}
          {data.healthHistory && (
            <Card sx={commonStyles.categoryCard}>
              <CardContent>
                <Stack spacing={2}>
                  {renderCategoryHeader("Health History", "/health-history")}

                  <Card variant="outlined">
                    <CardContent>
                      {renderSectionHeader(
                        "Your Health Information",
                        <HealthAndSafety color="primary" />,
                      )}
                      <Stack spacing={2}>
                        {Object.entries(data.healthHistory).map(
                          ([key, value], index) => {
                            // Only show questions (not detail fields)
                            if (key.includes("Details")) return null;

                            const questionNum = parseInt(
                              key.replace("question", ""),
                            );
                            const detailsKey = `question${questionNum}Details`;
                            const details =
                              data.healthHistory[
                                detailsKey as keyof typeof data.healthHistory
                              ];
                            const questionText =
                              healthQuestions[questionNum] ||
                              `Question ${questionNum}`;

                            return (
                              <Box
                                key={key}
                                sx={{
                                  pl: 2,
                                  borderLeft: 2,
                                  borderColor:
                                    value === "yes"
                                      ? "warning.main"
                                      : "divider",
                                }}
                              >
                                {renderField(
                                  questionText,
                                  value,
                                  undefined,
                                  true,
                                )}
                                {value === "yes" &&
                                  details &&
                                  typeof details === "object" && (
                                    <Box sx={{ pl: 2, mt: 1 }}>
                                      {(details as any).onsetDate &&
                                        renderField(
                                          "Onset Date",
                                          (details as any).onsetDate,
                                        )}
                                      {(details as any).conditionDetails &&
                                        renderField(
                                          "Condition Details",
                                          (details as any).conditionDetails,
                                        )}
                                      {(details as any).physicianInfo &&
                                        renderField(
                                          "Physician Info",
                                          (details as any).physicianInfo,
                                        )}
                                    </Box>
                                  )}
                              </Box>
                            );
                          },
                        )}
                      </Stack>
                    </CardContent>
                  </Card>
                </Stack>
              </CardContent>
            </Card>
          )}
        </Stack>
      </FormStepTransition>

      {/* Edit Confirmation Modal */}
      <EditConfirmationModal
        open={showEditModal}
        onClose={handleCancelEdit}
        onConfirm={handleConfirmEdit}
      />

      {/* Advisor Email Confirmation Dialog */}
      <Dialog
        open={showAdvisorConfirmDialog}
        onClose={handleAdvisorCancel}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 600 }}>Confirm Email</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            An email will be sent to the following address for signature:
          </Typography>
          <Typography
            variant="body1"
            sx={{ fontWeight: 600, color: "primary.main" }}
          >
            {data.eligibility?.email}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            Would you like to continue?
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleAdvisorCancel} variant="outlined">
            Cancel
          </Button>
          <Button
            onClick={handleAdvisorConfirm}
            variant="contained"
            color="primary"
          >
            Continue
          </Button>
        </DialogActions>
      </Dialog>
    </FormPageLayout>
  );
}
