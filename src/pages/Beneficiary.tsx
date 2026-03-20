import * as React from "react";
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  ListSubheader,
  MenuItem,
  Select,
  Stack,
  Tab,
  Tabs,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import {
  Add as AddIcon,
  EditOutlined,
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

type ApplicantCoverageEntry = {
  productName: string;
  category: CoverageCategory;
};

type BeneficiarySummary = {
  type: "individual" | "trust";
  designation: "primary" | "contingent";
  name: string;
  firstName?: string;
  lastName?: string;
  trustName?: string;
  trustDate?: string;
  relationship?: string;
  share: number;
};

type ExistingBeneficiaryOption = {
  id: string;
  type: "individual" | "trust";
  label: string;
  summary: BeneficiarySummary;
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
  existingBeneficiaryOptions,
  onExistingBeneficiaryChange,
  customShare,
  sharePreset,
  onCustomShareChange,
  onCustomShareBlur,
  onPresetChange,
  unassignedRemaining,
}: {
  prefix: BeneficiaryFieldPrefix;
  existingBeneficiaryOptions: ExistingBeneficiaryOption[];
  onExistingBeneficiaryChange: (id: string) => void;
  customShare: string;
  sharePreset: string | null;
  onCustomShareChange: (value: string) => void;
  onCustomShareBlur: () => void;
  onPresetChange: (value: string | null) => void;
  unassignedRemaining: number;
}) {
  const [existingSelection, setExistingSelection] = React.useState("");
  const beneficiaryType = useWatch({
    name: `${prefix}BeneficiaryType` as keyof ProfileForm,
  }) as ProfileForm["termLifeBeneficiaryType"];

  React.useEffect(() => {
    setExistingSelection("");
  }, [prefix]);

  const individualOptions = existingBeneficiaryOptions.filter(
    (option) => option.type === "individual",
  );
  const trustOptions = existingBeneficiaryOptions.filter(
    (option) => option.type === "trust",
  );

  return (
    <Stack spacing={2}>
      {existingBeneficiaryOptions.length > 0 ? (
        <FormControl fullWidth>
          <InputLabel id={`${prefix}-existing-beneficiary-label`}>
            Add Existing Beneficiary
          </InputLabel>
          <Select
            labelId={`${prefix}-existing-beneficiary-label`}
            label="Add Existing Beneficiary"
            value={existingSelection}
            onChange={(event) => {
              const selectedId = event.target.value;
              setExistingSelection(selectedId);
              if (selectedId) {
                onExistingBeneficiaryChange(selectedId);
              }
            }}
          >
            {individualOptions.length > 0 ? (
              <ListSubheader>Individual</ListSubheader>
            ) : null}
            {individualOptions.map((option) => (
              <MenuItem key={option.id} value={option.id}>
                {option.label}
              </MenuItem>
            ))}
            {trustOptions.length > 0 ? (
              <ListSubheader>Trust</ListSubheader>
            ) : null}
            {trustOptions.map((option) => (
              <MenuItem key={option.id} value={option.id}>
                {option.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      ) : null}

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
          <Stack spacing={2}>
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
                <ToggleButton value="100">100%</ToggleButton>
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
  const [activeScopeKey, setActiveScopeKey] = React.useState<string | null>(
    null,
  );
  const [activeTargetLabel, setActiveTargetLabel] = React.useState("");
  const [activeEditIndex, setActiveEditIndex] = React.useState<number | null>(
    null,
  );
  const [activeDesignation, setActiveDesignation] = React.useState<
    "primary" | "contingent"
  >("primary");
  const [sharePreset, setSharePreset] = React.useState<string | null>(null);
  const [customShare, setCustomShare] = React.useState("");
  const [pendingShareValue, setPendingShareValue] = React.useState<number>(0);
  const [beneficiarySummaries, setBeneficiarySummaries] = React.useState<
    Record<string, BeneficiarySummary[]>
  >({});
  const [assignSeparatelyByApplicant, setAssignSeparatelyByApplicant] =
    React.useState<Record<Applicant, boolean>>({
      self: false,
      spouse: false,
      child: false,
    });

  const getScopeKey = (prefix: BeneficiaryFieldPrefix, productName?: string) =>
    `${prefix}::${productName ?? "__all__"}`;

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

        if (!category || (category !== "LI" && category !== "AD")) return;

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
    scopeKey: string,
    targetLabel: string,
    editIndex: number | null = null,
  ) => {
    const scopeSummaries = beneficiarySummaries[scopeKey] ?? [];
    const existingItem =
      editIndex !== null ? scopeSummaries[editIndex] : undefined;

    const existingShare = (existingItem?.share ?? "").toString();
    if (["25", "50", "75", "100"].includes(existingShare)) {
      setSharePreset(existingShare);
      setCustomShare("");
      setPendingShareValue(Number(existingShare));
    } else {
      setSharePreset(null);
      setCustomShare(existingShare);
      setPendingShareValue(Number.parseFloat(existingShare || "0") || 0);
    }

    const primaryCount = scopeSummaries.filter(
      (item) => item.designation === "primary",
    ).length;
    setActiveDesignation(
      existingItem?.designation ??
        (primaryCount >= 10 ? "contingent" : "primary"),
    );

    const typeField = `${prefix}BeneficiaryType` as keyof ProfileForm;
    const designationField =
      `${prefix}BeneficiaryDesignation` as keyof ProfileForm;
    const firstNameField = `${prefix}BeneficiaryFirstName` as keyof ProfileForm;
    const lastNameField = `${prefix}BeneficiaryLastName` as keyof ProfileForm;
    const relationshipField =
      `${prefix}BeneficiaryRelationship` as keyof ProfileForm;
    const shareField = `${prefix}BeneficiaryShare` as keyof ProfileForm;
    const trustNameField = `${prefix}TrustName` as keyof ProfileForm;
    const trustDateField = `${prefix}TrustDate` as keyof ProfileForm;

    methods.setValue(typeField, (existingItem?.type ?? "individual") as never);
    methods.setValue(
      designationField,
      (existingItem?.designation ?? undefined) as never,
    );
    methods.setValue(firstNameField, (existingItem?.firstName ?? "") as never);
    methods.setValue(lastNameField, (existingItem?.lastName ?? "") as never);
    methods.setValue(
      relationshipField,
      (existingItem?.relationship ?? "") as never,
    );
    methods.setValue(shareField, (existingShare || "") as never);
    methods.setValue(trustNameField, (existingItem?.trustName ?? "") as never);
    methods.setValue(trustDateField, (existingItem?.trustDate ?? "") as never);

    setActiveEditIndex(editIndex);
    setActivePrefix(prefix);
    setActiveScopeKey(scopeKey);
    setActiveTargetLabel(targetLabel);
  };

  const closeBeneficiaryModal = () => {
    setActivePrefix(null);
    setActiveScopeKey(null);
    setActiveTargetLabel("");
    setActiveEditIndex(null);
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

  const removeBeneficiaryByScope = (scopeKey: string, index: number) => {
    setBeneficiarySummaries((prev) => ({
      ...prev,
      [scopeKey]: (prev[scopeKey] ?? []).filter(
        (_, itemIndex) => itemIndex !== index,
      ),
    }));
  };

  const handleSaveBeneficiary = async () => {
    if (!activePrefix || !activeScopeKey) return;

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

    const scopeSummaries = beneficiarySummaries[activeScopeKey] ?? [];
    const itemsExcludingEdit = scopeSummaries.filter(
      (_, index) => index !== activeEditIndex,
    );
    const designationCount = itemsExcludingEdit.filter(
      (item) => item.designation === designation,
    ).length;
    if (designationCount >= 10) return;

    const existingTotal = itemsExcludingEdit.reduce(
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
      firstName,
      lastName,
      trustName,
      trustDate: methods.getValues(trustDateField)?.toString().trim() ?? "",
    };

    setBeneficiarySummaries((prev) => ({
      ...prev,
      [activeScopeKey]:
        activeEditIndex === null
          ? [...(prev[activeScopeKey] ?? []), summary]
          : (prev[activeScopeKey] ?? []).map((item, index) =>
              index === activeEditIndex ? summary : item,
            ),
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
    if (!activePrefix || !activeScopeKey) return 100;
    const total = (beneficiarySummaries[activeScopeKey] ?? [])
      .filter((_, index) => index !== activeEditIndex)
      .reduce((sum, item) => sum + item.share, 0);
    return Math.max(0, 100 - total - pendingShareValue);
  }, [
    activePrefix,
    activeScopeKey,
    activeEditIndex,
    beneficiarySummaries,
    pendingShareValue,
  ]);

  const activeDesignationCounts = React.useMemo(() => {
    if (!activePrefix || !activeScopeKey) return { primary: 0, contingent: 0 };
    const summaries = beneficiarySummaries[activeScopeKey] ?? [];
    return {
      primary: summaries.filter((item) => item.designation === "primary")
        .length,
      contingent: summaries.filter((item) => item.designation === "contingent")
        .length,
    };
  }, [activePrefix, activeScopeKey, beneficiarySummaries]);

  const activeExistingBeneficiaries = React.useMemo(() => {
    if (!activePrefix) return [] as ExistingBeneficiaryOption[];

    const keysForPrefix = Object.keys(beneficiarySummaries).filter((key) =>
      key.startsWith(`${activePrefix}::`),
    );
    const allItems = keysForPrefix.flatMap(
      (key) => beneficiarySummaries[key] ?? [],
    );
    const unique = new Map<string, BeneficiarySummary>();

    allItems.forEach((item) => {
      const identity = `${item.type}:${item.name}:${item.relationship ?? ""}`;
      if (!unique.has(identity)) {
        unique.set(identity, item);
      }
    });

    return Array.from(unique.entries()).map(([id, summary]) => ({
      id,
      type: summary.type,
      label: summary.name.toUpperCase(),
      summary,
    }));
  }, [activePrefix, beneficiarySummaries]);

  const handleAddExistingBeneficiary = (id: string) => {
    if (!activePrefix) return;
    const selected = activeExistingBeneficiaries.find(
      (option) => option.id === id,
    );
    if (!selected) return;

    const existingItem = selected.summary;
    const typeField = `${activePrefix}BeneficiaryType` as keyof ProfileForm;
    const firstNameField =
      `${activePrefix}BeneficiaryFirstName` as keyof ProfileForm;
    const lastNameField =
      `${activePrefix}BeneficiaryLastName` as keyof ProfileForm;
    const relationshipField =
      `${activePrefix}BeneficiaryRelationship` as keyof ProfileForm;
    const shareField = `${activePrefix}BeneficiaryShare` as keyof ProfileForm;
    const trustNameField = `${activePrefix}TrustName` as keyof ProfileForm;
    const trustDateField = `${activePrefix}TrustDate` as keyof ProfileForm;

    methods.setValue(typeField, existingItem.type as never);
    methods.setValue(firstNameField, (existingItem.firstName ?? "") as never);
    methods.setValue(lastNameField, (existingItem.lastName ?? "") as never);
    methods.setValue(
      relationshipField,
      (existingItem.relationship ?? "") as never,
    );
    methods.setValue(trustNameField, (existingItem.trustName ?? "") as never);
    methods.setValue(trustDateField, (existingItem.trustDate ?? "") as never);

    const existingShare = existingItem.share.toString();
    methods.setValue(shareField, existingShare as never);
    if (["25", "50", "75", "100"].includes(existingShare)) {
      setSharePreset(existingShare);
      setCustomShare("");
      setPendingShareValue(Number(existingShare));
    } else {
      setSharePreset(null);
      setCustomShare(existingShare);
      setPendingShareValue(Number.parseFloat(existingShare || "0") || 0);
    }
  };

  const helperTitle =
    helpTopic === "share" ? "What is the % share?" : "What is a beneficiary?";

  const helperBody =
    helpTopic === "share"
      ? "The % share for a beneficiary determines how much of the policy payout each person will receive. You assign a percentage to each beneficiary, and all percentages must add up to 100%. For example, if one person is assigned 60% and another 40%, they will receive those portions of the total benefit when it’s paid out. If naming a trust as beneficiary, 100% of proceeds will be paid to the trust."
      : `A beneficiary is the person, people, or trust you choose to receive the money from your policy when you pass away. This can be a family member, friend, or trust, and you can update your beneficiary choices if your situation changes. A primary beneficiary is a designated individual who would receive the proceeds of the policy first. A contingent beneficiary is a designated individual who would receive the proceeds of the policy if the primary beneficiary is unable to receive them. You may add up to ten primary and ten contingent beneficiaries online. If no beneficiary is named, proceeds will be paid in accord with policy provisions. If you wish to add beneficiary information at a later time, or need to add more, please contact the plan administrator at ${phoneNumber}. Note: The beneficiary for dependent Child(ren) coverage is the Member.`;

  const renderApplicantCoverage = (
    applicant: Applicant,
    applicantTargets: BeneficiaryTarget[],
  ) => {
    const coverageEntries: ApplicantCoverageEntry[] = applicantTargets.flatMap(
      (target) =>
        target.productNames.map((productName) => ({
          productName,
          category: target.category,
        })),
    );

    const combinedCoverageLabel = `Coverage: ${coverageEntries
      .map((entry) => entry.productName)
      .join(", ")}`;

    const defaultPrefix =
      applicant === "self"
        ? "termLife"
        : applicant === "spouse"
          ? "spouseTermLife"
          : null;
    const allScopeKey = defaultPrefix ? getScopeKey(defaultPrefix) : "";
    const assignSeparately = assignSeparatelyByApplicant[applicant];

    const renderSummaryAndAdd = (scopeKey: string, modalLabel: string) => {
      const scopeSummaries = beneficiarySummaries[scopeKey] ?? [];
      return (
        <Stack spacing={2}>
          {scopeSummaries.map((summary, index) => (
            <Box
              key={`${scopeKey}-${index}`}
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
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<EditOutlined fontSize="small" />}
                      onClick={() => {
                        const scopePrefix = scopeKey.split(
                          "::",
                        )[0] as BeneficiaryFieldPrefix;
                        openBeneficiaryModal(
                          scopePrefix,
                          scopeKey,
                          modalLabel,
                          index,
                        );
                      }}
                      sx={{ minWidth: 0, px: 1, py: 0.25, fontSize: "0.75rem" }}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="outlined"
                      size="small"
                      color="error"
                      startIcon={<RemoveCircleRounded fontSize="small" />}
                      onClick={() => removeBeneficiaryByScope(scopeKey, index)}
                      sx={{ minWidth: 0, px: 1, py: 0.25, fontSize: "0.75rem" }}
                    >
                      Remove
                    </Button>
                  </Stack>
                </Stack>
                <Typography variant="body2" color="text.secondary">
                  {summary.designation === "primary" ? "Primary" : "Contingent"}{" "}
                  · {summary.type === "trust" ? "Trust" : "Individual"}
                </Typography>
                <Typography variant="body2" textTransform="uppercase">
                  {summary.name}
                </Typography>
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
            onClick={() => {
              const scopePrefix = scopeKey.split(
                "::",
              )[0] as BeneficiaryFieldPrefix;
              openBeneficiaryModal(scopePrefix, scopeKey, modalLabel);
            }}
          >
            Add Beneficiary
          </Button>
        </Stack>
      );
    };

    return (
      <Stack key={`${applicant}-coverage`} spacing={2}>
        <Typography variant="body2" color="text.secondary">
          {combinedCoverageLabel}
        </Typography>

        {applicant === "child" ? (
          <Alert severity="info">
            The beneficiary for dependent Child(ren) coverage is the Member.
          </Alert>
        ) : defaultPrefix ? (
          <Stack spacing={2}>
            {coverageEntries.length > 1 ? (
              <Button
                variant="text"
                size="small"
                sx={{ minWidth: 0, p: 0, alignSelf: "flex-start" }}
                onClick={() =>
                  setAssignSeparatelyByApplicant((prev) => ({
                    ...prev,
                    [applicant]: !prev[applicant],
                  }))
                }
              >
                {assignSeparately
                  ? "Use same beneficiary(ies) for all coverages"
                  : "Customize beneficiary(ies) per coverage"}
              </Button>
            ) : null}
            {assignSeparately
              ? coverageEntries.map((entry) => {
                  const scopePrefix = getPrefix(applicant, entry.category);
                  if (!scopePrefix) return null;
                  const scopeKey = getScopeKey(scopePrefix, entry.productName);
                  const modalLabel = `Coverage: ${entry.productName}`;
                  return (
                    <Stack key={scopeKey} spacing={1.5}>
                      <Typography variant="body2" color="text.secondary">
                        Coverage: {entry.productName}
                      </Typography>
                      {renderSummaryAndAdd(scopeKey, modalLabel)}
                    </Stack>
                  );
                })
              : renderSummaryAndAdd(allScopeKey, combinedCoverageLabel)}
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
                      label: "What is the % share?",
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
                    {renderApplicantCoverage(applicant, applicantTargets)}
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
          <Stack spacing={2}>
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
                existingBeneficiaryOptions={activeExistingBeneficiaries}
                onExistingBeneficiaryChange={handleAddExistingBeneficiary}
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
            {activeEditIndex === null
              ? "Save Beneficiary"
              : "Update Beneficiary"}
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
