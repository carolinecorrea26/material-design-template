import * as React from "react";
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Stack,
  Tab,
  Tabs,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import {
  Add as AddIcon,
  FavoriteBorder,
  People,
  PersonOutline,
  RemoveCircleRounded,
} from "@mui/icons-material";
import { FormProvider, useForm, useWatch } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import type { Applicant, CoverageCategory } from "../types/app";
import { getProducts } from "../api/client";
import { getClientBranding } from "../config/clients";
import PageHeader from "../components/layout/PageHeader";
import ScrollChipRow from "../components/layout/ScrollChipRow";
import FormPageLayout from "../components/layout/FormPageLayout";
import FormStepTransition from "../components/layout/FormStepTransition";
import PageNavigation from "../components/layout/PageNavigation";
import FormBottomDrawer from "../components/common/FormBottomDrawer";
import RHFRadioGroup from "../components/form/RHFRadioGroup";
import RHFSelect from "../components/form/RHFSelect";
import RHFTextField from "../components/form/RHFTextField";
import DateField from "../components/form/DateField";
import { useAppData } from "../state/AppDataContext";
import { useStepper } from "../state/StepperContext";
import { commonStyles } from "../theme/commonStyles";
import type { ProfileForm } from "../validation/profile";

type BeneficiaryFieldPrefix =
  | "termLife"
  | "add"
  | "spouseTermLife"
  | "spouseAdd";

type BeneficiaryTarget = {
  applicant: Applicant;
  category: CoverageCategory;
  productNames: string[];
};

type BeneficiarySummary = {
  type: "individual" | "trust";
  designation: "primary" | "contingent";
  name: string;
  relationship?: string;
  share: number;
};

const APPLICANT_LABELS: Record<Applicant, string> = {
  self: "Self",
  spouse: "Spouse",
  child: "Child(ren)",
};

const APPLICANT_ICONS: Record<Applicant, React.ElementType> = {
  self: PersonOutline,
  spouse: FavoriteBorder,
  child: People,
};

const COVERAGE_LABELS: Record<CoverageCategory, string> = {
  LI: "Life Insurance",
  AD: "Accidental Death and Dismemberment Insurance",
  DI: "Disability Insurance",
  OO: "Office Overhead Insurance",
  SH: "Supplemental Health Insurance",
};

type ProductInfo = {
  name: string;
  category: CoverageCategory;
};

const RELATIONSHIP_OPTIONS = [
  { label: "Spouse", value: "spouse" },
  { label: "Child", value: "child" },
  { label: "Parent", value: "parent" },
  { label: "Sibling", value: "sibling" },
  { label: "Other Relative", value: "other_relative" },
  { label: "Other", value: "other" },
];

function getPrefix(
  applicant: Applicant,
  category: CoverageCategory,
): BeneficiaryFieldPrefix | null {
  if (applicant === "self" && category === "LI") return "termLife";
  if (applicant === "self" && category === "AD") return "add";
  if (applicant === "spouse" && category === "LI") return "spouseTermLife";
  if (applicant === "spouse" && category === "AD") return "spouseAdd";
  return null;
}

function SectionLabel({
  icon,
  label,
}: {
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <Stack direction="row" spacing={1} alignItems="center">
      <Box
        sx={{
          color: "primary.main",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          "& svg": {
            width: "0.875em",
            height: "0.875em",
          },
        }}
      >
        {icon}
      </Box>
      <Typography sx={commonStyles.sidebarText}>{label}</Typography>
    </Stack>
  );
}

function BeneficiaryFields({
  prefix,
  customShare,
  sharePreset,
  onCustomShareChange,
  onCustomShareBlur,
  onPresetChange,
  unassignedRemaining,
}: {
  prefix: BeneficiaryFieldPrefix;
  customShare: string;
  sharePreset: string | null;
  onCustomShareChange: (value: string) => void;
  onCustomShareBlur: () => void;
  onPresetChange: (value: string | null) => void;
  unassignedRemaining: number;
}) {
  const beneficiaryType = useWatch({
    name: `${prefix}BeneficiaryType` as keyof ProfileForm,
  }) as ProfileForm["termLifeBeneficiaryType"];

  return (
    <Stack spacing={2}>
      <RHFRadioGroup
        name={`${prefix}BeneficiaryType` as keyof ProfileForm}
        label="Choose Beneficiary"
        options={[
          { label: "Individual", value: "individual" },
          { label: "Trust", value: "trust" },
        ]}
        required
      />

      {beneficiaryType === "individual" ? (
        <Stack spacing={2}>
          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            <RHFTextField
              name={`${prefix}BeneficiaryFirstName` as keyof ProfileForm}
              label="First Name"
              required
            />
            <RHFTextField
              name={`${prefix}BeneficiaryLastName` as keyof ProfileForm}
              label="Last Name"
              required
            />
          </Stack>
          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            <RHFSelect
              name={`${prefix}BeneficiaryRelationship` as keyof ProfileForm}
              label="Relationship"
              options={RELATIONSHIP_OPTIONS}
              required
            />
            <Stack spacing={1} sx={{ flex: 1 }}>
              {/* <Typography variant="body2" sx={{ fontWeight: 500 }}>
                % Share
              </Typography> */}
              <RHFTextField
                name={`${prefix}BeneficiaryShare` as keyof ProfileForm}
                label="% Share"
                type="number"
                required
                value={customShare}
                onChange={(event) => onCustomShareChange(event.target.value)}
                onBlur={onCustomShareBlur}
                inputProps={{ min: 0, max: 100 }}
              />
              <ToggleButtonGroup
                color="primary"
                exclusive
                value={sharePreset}
                onChange={(_, value: string | null) => onPresetChange(value)}
                size="small"
              >
                <ToggleButton value="25">25%</ToggleButton>
                <ToggleButton value="50">50%</ToggleButton>
                <ToggleButton value="75">75%</ToggleButton>
              </ToggleButtonGroup>

              <Typography variant="caption" color="text.secondary">
                Unassigned % remaining:{" "}
                <Box
                  component="span"
                  sx={{ fontWeight: 700, color: "primary.main" }}
                >
                  {unassignedRemaining}%
                </Box>
              </Typography>
            </Stack>
          </Stack>
        </Stack>
      ) : null}

      {beneficiaryType === "trust" ? (
        <Stack spacing={2}>
          <RHFTextField
            name={`${prefix}TrustName` as keyof ProfileForm}
            label="Name of Trust"
            required
          />
          <DateField
            name={`${prefix}TrustDate` as keyof ProfileForm}
            label="Date of Trust"
            required
          />
        </Stack>
      ) : null}
    </Stack>
  );
}

export default function Beneficiary() {
  const { data, setProfile } = useAppData();
  const { markComplete } = useStepper();
  const navigate = useNavigate();
  const branding = getClientBranding();
  const [productsById, setProductsById] = React.useState<
    Record<string, ProductInfo>
  >({});
  const [helpTopic, setHelpTopic] = React.useState<
    "beneficiary" | "share" | null
  >(null);
  const [activePrefix, setActivePrefix] =
    React.useState<BeneficiaryFieldPrefix | null>(null);
  const [activeTargetLabel, setActiveTargetLabel] = React.useState("");
  const [activeDesignation, setActiveDesignation] = React.useState<
    "primary" | "contingent"
  >("primary");
  const [sharePreset, setSharePreset] = React.useState<string | null>(null);
  const [customShare, setCustomShare] = React.useState("");
  const [pendingShareValue, setPendingShareValue] = React.useState<number>(0);
  const [beneficiarySummaries, setBeneficiarySummaries] = React.useState<
    Record<BeneficiaryFieldPrefix, BeneficiarySummary[]>
  >({
    termLife: [],
    add: [],
    spouseTermLife: [],
    spouseAdd: [],
  });

  const methods = useForm<ProfileForm>({
    defaultValues: {
      ...(data.profile ?? {}),
    },
    mode: "onSubmit",
  });

  React.useEffect(() => {
    let mounted = true;
    getProducts()
      .then((products) => {
        if (!mounted || !Array.isArray(products)) return;
        const map: Record<string, ProductInfo> = {};
        products.forEach((product) => {
          map[product.id] = { name: product.name, category: product.category };
        });
        setProductsById(map);
      })
      .catch((error) => {
        console.error("Failed to load products", error);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const selectedTargets = React.useMemo<BeneficiaryTarget[]>(() => {
    const coverageSelections = data.coverage ?? [];
    const grouped = new Map<string, BeneficiaryTarget>();

    coverageSelections
      .filter((item) => item.amount > 0)
      .forEach((item) => {
        const productInfo = productsById[item.productId];
        const productName = productInfo?.name ?? item.productId;
        const category = productInfo?.category;

        if (!category) return;

        const groupedKey = `${item.applicant}:${category}`;
        const existing = grouped.get(groupedKey);
        if (existing) {
          if (!existing.productNames.includes(productName)) {
            existing.productNames.push(productName);
          }
          return;
        }

        grouped.set(groupedKey, {
          applicant: item.applicant,
          category,
          productNames: [productName],
        });
      });

    return Array.from(grouped.values());
  }, [data.coverage, productsById]);

  const targetsByApplicant = React.useMemo(
    () => ({
      self: selectedTargets.filter((target) => target.applicant === "self"),
      spouse: selectedTargets.filter((target) => target.applicant === "spouse"),
      child: selectedTargets.filter((target) => target.applicant === "child"),
    }),
    [selectedTargets],
  );

  const phoneNumber =
    branding.phoneDisplay || branding.phone || "(800) 000-0000";

  const onSubmit = (values: ProfileForm) => {
    setProfile({
      ...(data.profile ?? {}),
      ...values,
    });
    markComplete();
    navigate("/contact");
  };

  const openBeneficiaryModal = (
    prefix: BeneficiaryFieldPrefix,
    targetLabel: string,
  ) => {
    const existingShare = (
      methods.getValues(`${prefix}BeneficiaryShare` as keyof ProfileForm) ?? ""
    ).toString();
    if (["25", "50", "75"].includes(existingShare)) {
      setSharePreset(existingShare);
      setCustomShare("");
      setPendingShareValue(Number(existingShare));
    } else {
      setSharePreset(null);
      setCustomShare(existingShare);
      setPendingShareValue(Number.parseFloat(existingShare || "0") || 0);
    }
    const existingForPrefix = beneficiarySummaries[prefix];
    const primaryCount = existingForPrefix.filter(
      (item) => item.designation === "primary",
    ).length;
    setActiveDesignation(primaryCount >= 10 ? "contingent" : "primary");
    setActivePrefix(prefix);
    setActiveTargetLabel(targetLabel);
  };

  const closeBeneficiaryModal = () => {
    setActivePrefix(null);
    setActiveTargetLabel("");
    setActiveDesignation("primary");
    setSharePreset(null);
    setCustomShare("");
    setPendingShareValue(0);
  };

  const handlePresetChange = (value: string | null) => {
    if (!activePrefix) return;
    setSharePreset(value);
    setCustomShare("");
    setPendingShareValue(Number.parseFloat(value ?? "0") || 0);
    methods.setValue(
      `${activePrefix}BeneficiaryShare` as keyof ProfileForm,
      (value ?? "") as never,
      { shouldDirty: true },
    );
  };

  const handleCustomShareChange = (value: string) => {
    if (!activePrefix) return;
    setCustomShare(value);
    setSharePreset(null);
    setPendingShareValue(0);
    methods.setValue(
      `${activePrefix}BeneficiaryShare` as keyof ProfileForm,
      value as never,
      { shouldDirty: true },
    );
  };

  const handleCustomShareBlur = () => {
    const parsed = Number.parseFloat(customShare || "0");
    setPendingShareValue(Number.isFinite(parsed) ? parsed : 0);
  };

  const removeBeneficiary = (prefix: BeneficiaryFieldPrefix, index: number) => {
    setBeneficiarySummaries((prev) => ({
      ...prev,
      [prefix]: prev[prefix].filter((_, itemIndex) => itemIndex !== index),
    }));
  };

  const handleSaveBeneficiary = async () => {
    if (!activePrefix) return;

    const typeField = `${activePrefix}BeneficiaryType` as keyof ProfileForm;
    const designationField =
      `${activePrefix}BeneficiaryDesignation` as keyof ProfileForm;
    const firstNameField =
      `${activePrefix}BeneficiaryFirstName` as keyof ProfileForm;
    const lastNameField =
      `${activePrefix}BeneficiaryLastName` as keyof ProfileForm;
    const relationshipField =
      `${activePrefix}BeneficiaryRelationship` as keyof ProfileForm;
    const shareField = `${activePrefix}BeneficiaryShare` as keyof ProfileForm;
    const trustNameField = `${activePrefix}TrustName` as keyof ProfileForm;
    const trustDateField = `${activePrefix}TrustDate` as keyof ProfileForm;

    const type = methods.getValues(typeField) as
      | "individual"
      | "trust"
      | undefined;
    const designation = activeDesignation;

    const fieldsToValidate: Array<keyof ProfileForm> = [typeField];
    if (type === "individual") {
      fieldsToValidate.push(
        firstNameField,
        lastNameField,
        relationshipField,
        shareField,
      );
    }
    if (type === "trust") {
      fieldsToValidate.push(trustNameField, trustDateField);
    }

    const isValid = await methods.trigger(fieldsToValidate);
    if (!isValid || !type) return;

    const designationCount = beneficiarySummaries[activePrefix].filter(
      (item) => item.designation === designation,
    ).length;
    if (designationCount >= 10) return;

    const existingTotal = beneficiarySummaries[activePrefix].reduce(
      (total, item) => total + item.share,
      0,
    );

    const shareValue = methods.getValues(shareField)?.toString() ?? "";
    const parsedShare =
      type === "trust" ? 100 : Number.parseFloat(shareValue || "0");
    if (
      !Number.isFinite(parsedShare) ||
      parsedShare <= 0 ||
      parsedShare > 100
    ) {
      methods.setError(shareField, {
        type: "manual",
        message: "Enter a valid % share between 1 and 100.",
      });
      return;
    }
    if (parsedShare > Math.max(0, 100 - existingTotal)) {
      methods.setError(shareField, {
        type: "manual",
        message: "Share exceeds the remaining unassigned percentage.",
      });
      return;
    }

    const firstName =
      methods.getValues(firstNameField)?.toString().trim() ?? "";
    const lastName = methods.getValues(lastNameField)?.toString().trim() ?? "";
    const trustName =
      methods.getValues(trustNameField)?.toString().trim() ?? "";
    const relationship = methods
      .getValues(relationshipField)
      ?.toString()
      .trim();

    const summary: BeneficiarySummary = {
      type,
      designation,
      share: parsedShare,
      relationship,
      name:
        type === "trust"
          ? trustName
          : `${firstName} ${lastName}`.replace(/\s+/g, " ").trim(),
    };

    setBeneficiarySummaries((prev) => ({
      ...prev,
      [activePrefix]: [...prev[activePrefix], summary],
    }));

    methods.setValue(typeField, undefined as never);
    methods.setValue(designationField, designation as never);
    methods.setValue(firstNameField, "" as never);
    methods.setValue(lastNameField, "" as never);
    methods.setValue(relationshipField, "" as never);
    methods.setValue(shareField, "" as never);
    methods.setValue(trustNameField, "" as never);
    methods.setValue(trustDateField, "" as never);

    closeBeneficiaryModal();
  };

  const activeUnassignedRemaining = React.useMemo(() => {
    if (!activePrefix) return 100;
    const total = beneficiarySummaries[activePrefix].reduce(
      (sum, item) => sum + item.share,
      0,
    );
    return Math.max(0, 100 - total - pendingShareValue);
  }, [activePrefix, beneficiarySummaries, pendingShareValue]);

  const activeDesignationCounts = React.useMemo(() => {
    if (!activePrefix) return { primary: 0, contingent: 0 };
    const summaries = beneficiarySummaries[activePrefix];
    return {
      primary: summaries.filter((item) => item.designation === "primary")
        .length,
      contingent: summaries.filter((item) => item.designation === "contingent")
        .length,
    };
  }, [activePrefix, beneficiarySummaries]);

  const helperTitle =
    helpTopic === "share"
      ? "How does assigning % share work?"
      : "What is a beneficiary?";

  const helperBody =
    helpTopic === "share"
      ? "The % share for a beneficiary determines how much of the policy payout each person will receive. You assign a percentage to each beneficiary, and all percentages must add up to 100%. For example, if one person is assigned 60% and another 40%, they will receive those portions of the total benefit when it’s paid out. If naming a trust as beneficiary, 100% of proceeds will be paid to the trust."
      : `A beneficiary can be a person or a trust. If naming more than one person as beneficiary, the percentage of death proceeds to be distributed to each must total 100%. If naming a trust as beneficiary, 100% of proceeds will be paid to the trust. A primary beneficiary is a designated individual who would receive the proceeds of the policy first. A contingent beneficiary is a designated individual who would receive the proceeds of the policy if the primary beneficiary is unable to receive them. You may add up to ten primary and ten contingent beneficiaries online. If no beneficiary is named, proceeds will be paid in accord with policy provisions. If you wish to add beneficiary information at a later time, or need to add more, please contact the plan administrator at ${phoneNumber}. Note: The beneficiary for dependent Child(ren) coverage is the Member.`;

  const renderTargetRow = (target: BeneficiaryTarget) => {
    const prefix = getPrefix(target.applicant, target.category);
    const targetLabel = `${APPLICANT_LABELS[target.applicant]} · ${COVERAGE_LABELS[target.category]}`;
    const summaries = prefix ? beneficiarySummaries[prefix] : [];

    return (
      <Stack key={`${target.applicant}-${target.category}`} spacing={2}>
        <Typography sx={commonStyles.sidebarText}>{targetLabel}</Typography>
        <Typography variant="body2" color="text.secondary">
          Selected products: {target.productNames.join(", ")}
        </Typography>

        {target.applicant === "child" ? (
          <Alert severity="info">
            The beneficiary for dependent Child(ren) coverage is the Member.
          </Alert>
        ) : prefix ? (
          <Stack spacing={2}>
            {summaries.map((summary, index) => (
              <Box
                key={`${prefix}-${index}`}
                sx={commonStyles.mutedSectionPanel}
              >
                <Stack spacing={1.5}>
                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                  >
                    <Typography
                      variant="overline"
                      sx={commonStyles.overlineLabel}
                    >
                      Beneficiary {index + 1}
                    </Typography>
                    <Button
                      size="small"
                      color="error"
                      startIcon={<RemoveCircleRounded />}
                      onClick={() => removeBeneficiary(prefix, index)}
                    >
                      Remove
                    </Button>
                  </Stack>
                  <Typography variant="body2" color="text.secondary">
                    {summary.designation === "primary"
                      ? "Primary"
                      : "Contingent"}{" "}
                    · {summary.type === "trust" ? "Trust" : "Individual"}
                  </Typography>
                  <Typography variant="body2">{summary.name}</Typography>
                  {summary.type === "individual" && summary.relationship ? (
                    <Typography variant="body2" color="text.secondary">
                      Relationship: {summary.relationship}
                    </Typography>
                  ) : null}
                  <Typography variant="body2" color="text.secondary">
                    Share: {summary.share}%
                  </Typography>
                </Stack>
              </Box>
            ))}

            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              fullWidth
              onClick={() => openBeneficiaryModal(prefix, targetLabel)}
            >
              Add Beneficiary
            </Button>
          </Stack>
        ) : (
          <Alert severity="info">
            This coverage does not require beneficiary details here.
          </Alert>
        )}
      </Stack>
    );
  };

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit)} noValidate>
        <FormPageLayout
          header={
            <PageHeader
              title="Add your beneficiary information."
              notes={
                <ScrollChipRow
                  items={[
                    {
                      label: "What is a beneficiary?",
                      onClick: () => setHelpTopic("beneficiary"),
                    },
                    {
                      label: "How does assigning % share work?",
                      onClick: () => setHelpTopic("share"),
                    },
                  ]}
                />
              }
            />
          }
          navigation={
            <PageNavigation
              hasUnsavedChanges={() => methods.formState.isDirty}
            />
          }
        >
          <FormStepTransition>
            <Stack spacing={4}>
              {selectedTargets.length === 0 ? (
                <Alert severity="info">
                  No eligible beneficiary coverages are selected yet.
                </Alert>
              ) : null}

              {(["self", "spouse", "child"] as Applicant[]).map((applicant) => {
                const applicantTargets = targetsByApplicant[applicant];
                if (applicantTargets.length === 0) return null;

                const ApplicantIcon = APPLICANT_ICONS[applicant];

                return (
                  <Stack key={applicant} spacing={2.5}>
                    <SectionLabel
                      icon={<ApplicantIcon />}
                      label={APPLICANT_LABELS[applicant]}
                    />
                    <Stack spacing={3}>
                      {applicantTargets.map((target, index) => (
                        <React.Fragment
                          key={`${target.applicant}-${target.category}-fragment`}
                        >
                          {renderTargetRow(target)}
                          {index < applicantTargets.length - 1 ? (
                            <Divider />
                          ) : null}
                        </React.Fragment>
                      ))}
                    </Stack>
                  </Stack>
                );
              })}
            </Stack>
          </FormStepTransition>
        </FormPageLayout>
      </form>

      <Dialog
        open={Boolean(activePrefix)}
        onClose={closeBeneficiaryModal}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Add Beneficiary</DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ mt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              {activeTargetLabel}
            </Typography>
            <Tabs
              value={activeDesignation}
              onChange={(_, value: "primary" | "contingent") =>
                setActiveDesignation(value)
              }
              variant="fullWidth"
            >
              <Tab value="primary" label="Primary" />
              <Tab value="contingent" label="Contingent" />
            </Tabs>
            <Typography variant="caption" color="text.secondary">
              {activeDesignation === "primary" ? "Primary" : "Contingent"}{" "}
              beneficiaries remaining:{" "}
              {10 - activeDesignationCounts[activeDesignation]} of 10
            </Typography>
            {activePrefix ? (
              <BeneficiaryFields
                prefix={activePrefix}
                sharePreset={sharePreset}
                customShare={customShare}
                onPresetChange={handlePresetChange}
                onCustomShareChange={handleCustomShareChange}
                onCustomShareBlur={handleCustomShareBlur}
                unassignedRemaining={activeUnassignedRemaining}
              />
            ) : null}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={closeBeneficiaryModal}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveBeneficiary}>
            Save Beneficiary
          </Button>
        </DialogActions>
      </Dialog>

      <FormBottomDrawer
        open={Boolean(helpTopic)}
        title={helperTitle}
        onClose={() => setHelpTopic(null)}
        onOpen={() => setHelpTopic("beneficiary")}
      >
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ lineHeight: 1.7 }}
        >
          {helperBody}
        </Typography>
      </FormBottomDrawer>
    </FormProvider>
  );
}
