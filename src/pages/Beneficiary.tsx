import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormLabel,
  MenuItem,
  Radio,
  Stack,
  Tab,
  Tabs,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import AddListItem from "../components/fields/DynamicListItem";
import ApplicantSection from "../components/fields/ApplicantSection";
import { shouldShowApplicantLabel } from "../utils/applicantVisibility";
import FormRoutePage from "../components/page/RoutePage";
import FormPageHelp from "../components/help/Panel";
import { getActiveClientCoverages } from "../config/client/getActiveClientCoverages";
import { coverageCategories } from "../config/coverageCategories";
import type { CoverageApplicantId } from "../config/coverages/types";
import { useApplicationForm } from "../app/ApplicationFormContext";
import { beneficiaryHelpItems } from "../content/helpContent";

type BeneficiaryDesignation = "primary" | "contingent";
type BeneficiaryType = "individual" | "trust";

type BeneficiaryItem = {
  id: string;
  designation: BeneficiaryDesignation;
  beneficiaryType: BeneficiaryType;
  firstName: string;
  lastName: string;
  relationship: string;
  trustName: string;
  trustDate: string;
  share: number;
};

type BeneficiaryFormValues = {
  designation: BeneficiaryDesignation;
  beneficiaryType: BeneficiaryType;
  firstName: string;
  lastName: string;
  relationship: string;
  trustName: string;
  trustDate: string;
  share: string;
};

type ProductContext = {
  productKey: string;
  coverageId: string;
  coverageName: string;
  applicantId: CoverageApplicantId;
};

const DEFAULT_BENEFICIARY_FORM: BeneficiaryFormValues = {
  designation: "primary",
  beneficiaryType: "individual",
  firstName: "",
  lastName: "",
  relationship: "",
  trustName: "",
  trustDate: "",
  share: "",
};

const RELATIONSHIP_OPTIONS = [
  "Spouse",
  "Child",
  "Parent",
  "Sibling",
  "Other Relative",
  "Other",
];

const ELIGIBLE_CATEGORY_IDS = new Set(["LI", "AD"]);

function getBeneficiaryDisplayName(item: BeneficiaryItem) {
  const formatDisplay = (value: string) => value.trim().toUpperCase();

  if (item.beneficiaryType === "trust") {
    return formatDisplay(item.trustName);
  }

  return formatDisplay(`${item.firstName} ${item.lastName}`);
}

function getDesignationLabel(designation: BeneficiaryDesignation) {
  return designation === "primary" ? "Primary" : "Contingent";
}

function getRelationshipLabel(item: BeneficiaryItem) {
  if (item.beneficiaryType === "trust") {
    return "Trust";
  }

  return item.relationship || "Relationship not provided";
}

const toggleRadioGroupSx = {
  display: "flex",
  flexDirection: "column",
  gap: 1,
  mt: 1,
};

const toggleRadioButtonSx = {
  width: "100%",
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-start",
  gap: 1.5,
  py: 1.5,
  textTransform: "none",
};

export default function Beneficiary() {
  const { values, setPageValues } = useApplicationForm();
  const coverages = useMemo(() => getActiveClientCoverages(), []);

  const selectedCoverageIds = Array.isArray(values.coverageSelections)
    ? values.coverageSelections
    : [];

  const storedAmounts = useMemo<Record<string, number>>(() => {
    if (
      values.coverageAmounts != null &&
      typeof values.coverageAmounts === "object" &&
      !Array.isArray(values.coverageAmounts)
    ) {
      return values.coverageAmounts as Record<string, number>;
    }

    return {};
  }, [values.coverageAmounts]);

  const productApplicants = useMemo<
    Record<string, CoverageApplicantId[]>
  >(() => {
    if (
      values.productApplicants != null &&
      typeof values.productApplicants === "object" &&
      !Array.isArray(values.productApplicants)
    ) {
      return values.productApplicants as Record<string, CoverageApplicantId[]>;
    }
    return {};
  }, [values.productApplicants]);

  const beneficiariesByProduct = useMemo<Record<string, BeneficiaryItem[]>>(
    () =>
      values.beneficiaries != null &&
      typeof values.beneficiaries === "object" &&
      !Array.isArray(values.beneficiaries)
        ? (values.beneficiaries as Record<string, BeneficiaryItem[]>)
        : {},
    [values.beneficiaries],
  );

  const selectedCoverages = coverages.filter(
    (coverage) =>
      selectedCoverageIds.includes(coverage.id) &&
      ELIGIBLE_CATEGORY_IDS.has(coverage.categoryId),
  );

  const selectedDependents = Array.isArray(values.dependents)
    ? values.dependents
    : [];

  function isApplicantSelectedForProduct(
    coverageId: string,
    applicantId: CoverageApplicantId,
  ): boolean {
    // If the dependent type is no longer selected on eligibility, never show it
    if (applicantId === "spouse" && !selectedDependents.includes("spouse"))
      return false;
    if (applicantId === "child" && !selectedDependents.includes("child"))
      return false;

    const selectedApplicantsForProduct = productApplicants[coverageId];

    if (
      Object.prototype.hasOwnProperty.call(productApplicants, coverageId) &&
      Array.isArray(selectedApplicantsForProduct)
    ) {
      return selectedApplicantsForProduct.includes(applicantId);
    }

    if (applicantId === "member") return true;
    if (applicantId === "spouse") return selectedDependents.includes("spouse");
    if (applicantId === "child") return selectedDependents.includes("child");
    return false;
  }

  const applicantProducts = useMemo(() => {
    const byApplicant: Record<"member" | "spouse", ProductContext[]> = {
      member: [],
      spouse: [],
    };

    for (const coverage of selectedCoverages) {
      const memberKey = `${coverage.id}:member`;
      if (
        (storedAmounts[memberKey] ?? 0) > 0 &&
        isApplicantSelectedForProduct(coverage.id, "member")
      ) {
        byApplicant.member.push({
          productKey: memberKey,
          coverageId: coverage.id,
          coverageName: coverage.name,
          applicantId: "member",
        });
      }

      const spouseKey = `${coverage.id}:spouse`;
      if (
        (storedAmounts[spouseKey] ?? 0) > 0 &&
        isApplicantSelectedForProduct(coverage.id, "spouse")
      ) {
        byApplicant.spouse.push({
          productKey: spouseKey,
          coverageId: coverage.id,
          coverageName: coverage.name,
          applicantId: "spouse",
        });
      }
    }

    return byApplicant;
  }, [selectedCoverages, storedAmounts, productApplicants, selectedDependents]);

  const [activeProduct, setActiveProduct] = useState<ProductContext | null>(
    null,
  );
  const [editingId, setEditingId] = useState<string | null>(null);
  const [modalValues, setModalValues] = useState<BeneficiaryFormValues>(
    DEFAULT_BENEFICIARY_FORM,
  );
  const [modalError, setModalError] = useState<string | null>(null);
  const [committedSharePercent, setCommittedSharePercent] = useState<
    number | null
  >(null);

  // "Apply to other coverages" dialog state
  const [applyToOthersOpen, setApplyToOthersOpen] = useState(false);
  const [applyToOthersItem, setApplyToOthersItem] =
    useState<BeneficiaryItem | null>(null);
  const [applyToOthersSource, setApplyToOthersSource] =
    useState<ProductContext | null>(null);
  const [applyToOthersSelected, setApplyToOthersSelected] = useState<string[]>(
    [],
  );

  const helpItems = beneficiaryHelpItems;

  function parseCommittedShare(rawShare: string): number | null {
    const parsed = Number(rawShare);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
  }

  function getProductBeneficiaries(productKey: string): BeneficiaryItem[] {
    const items = beneficiariesByProduct[productKey];
    return Array.isArray(items) ? items : [];
  }

  function upsertProductBeneficiaries(
    productKey: string,
    nextItems: BeneficiaryItem[],
  ) {
    setPageValues({
      beneficiaries: {
        ...beneficiariesByProduct,
        [productKey]: nextItems,
      },
    });
  }

  function openAddModal(product: ProductContext) {
    setActiveProduct(product);
    setEditingId(null);
    setModalValues(DEFAULT_BENEFICIARY_FORM);
    setModalError(null);
    setCommittedSharePercent(null);
  }

  function openEditModal(product: ProductContext, item: BeneficiaryItem) {
    setActiveProduct(product);
    setEditingId(item.id);
    setModalValues({
      designation: item.designation,
      beneficiaryType: item.beneficiaryType,
      firstName: item.firstName,
      lastName: item.lastName,
      relationship: item.relationship,
      trustName: item.trustName,
      trustDate: item.trustDate,
      share: item.share > 0 ? String(item.share) : "",
    });
    setModalError(null);
    setCommittedSharePercent(null);
  }

  function closeModal() {
    setActiveProduct(null);
    setEditingId(null);
    setModalValues(DEFAULT_BENEFICIARY_FORM);
    setModalError(null);
    setCommittedSharePercent(null);
  }

  function removeBeneficiary(productKey: string, itemId: string) {
    const current = getProductBeneficiaries(productKey);
    upsertProductBeneficiaries(
      productKey,
      current.filter((item) => item.id !== itemId),
    );
  }

  function getFilteredListForDesignation(
    list: BeneficiaryItem[],
    designation: BeneficiaryDesignation,
  ) {
    return list.filter(
      (item) =>
        item.designation === designation &&
        (editingId == null || item.id !== editingId),
    );
  }

  function getDesignationRemaining(
    list: BeneficiaryItem[],
    designation: BeneficiaryDesignation,
  ) {
    const used = getFilteredListForDesignation(list, designation).length;
    return Math.max(0, 10 - used);
  }

  function getShareRemaining(
    list: BeneficiaryItem[],
    designation: BeneficiaryDesignation,
  ) {
    const assigned = getFilteredListForDesignation(list, designation).reduce(
      (sum, item) => sum + item.share,
      0,
    );
    return Math.max(0, 100 - assigned);
  }

  function hasTypeForDesignation(
    list: BeneficiaryItem[],
    designation: BeneficiaryDesignation,
    type: BeneficiaryType,
  ) {
    return getFilteredListForDesignation(list, designation).some(
      (item) => item.beneficiaryType === type,
    );
  }

  function isDesignationMaxed(
    list: BeneficiaryItem[],
    designation: BeneficiaryDesignation,
  ) {
    const items = list.filter((item) => item.designation === designation);
    if (items.length === 0) return false;
    if (items.length >= 10) return true;
    if (items.some((item) => item.beneficiaryType === "trust")) return true;
    const totalShare = items.reduce((sum, item) => sum + item.share, 0);
    return totalShare >= 100;
  }

  function isProductFullyMaxed(productKey: string) {
    const list = getProductBeneficiaries(productKey);
    return (
      isDesignationMaxed(list, "primary") &&
      isDesignationMaxed(list, "contingent")
    );
  }

  function saveBeneficiary() {
    if (!activeProduct) return;

    const currentList = getProductBeneficiaries(activeProduct.productKey);
    const remainingSlots = getDesignationRemaining(
      currentList,
      modalValues.designation,
    );

    if (remainingSlots <= 0) {
      setModalError(
        `You have reached the maximum of 10 ${modalValues.designation} beneficiaries for this product.`,
      );
      return;
    }

    const parsedShare =
      modalValues.beneficiaryType === "individual"
        ? Number(modalValues.share)
        : 0;

    if (modalValues.beneficiaryType === "individual") {
      if (!Number.isFinite(parsedShare) || parsedShare <= 0) {
        setModalError("Enter a valid share percentage greater than 0.");
        return;
      }

      const unassignedShare = getShareRemaining(
        currentList,
        modalValues.designation,
      );
      if (parsedShare > unassignedShare) {
        setModalError(
          `Share exceeds available unassigned percentage (${unassignedShare}%).`,
        );
        return;
      }
    }

    if (modalValues.beneficiaryType === "individual") {
      if (!modalValues.firstName.trim() || !modalValues.lastName.trim()) {
        setModalError("First Name and Last Name are required.");
        return;
      }

      if (!modalValues.relationship) {
        setModalError("Relationship is required.");
        return;
      }
    } else {
      if (!modalValues.trustName.trim()) {
        setModalError("Name of Trust is required.");
        return;
      }
      if (!modalValues.trustDate) {
        setModalError("Date of Trust is required.");
        return;
      }
    }

    const nextItem: BeneficiaryItem = {
      id: editingId ?? crypto.randomUUID(),
      designation: modalValues.designation,
      beneficiaryType: modalValues.beneficiaryType,
      firstName: modalValues.firstName.trim(),
      lastName: modalValues.lastName.trim(),
      relationship: modalValues.relationship,
      trustName: modalValues.trustName.trim(),
      trustDate: modalValues.trustDate,
      share: parsedShare,
    };

    const nextList = editingId
      ? currentList.map((item) => (item.id === editingId ? nextItem : item))
      : [...currentList, nextItem];

    upsertProductBeneficiaries(activeProduct.productKey, nextList);

    // After saving (not editing), offer to apply to other products
    if (!editingId) {
      const applicantId = activeProduct.applicantId;
      const otherProducts = applicantProducts[
        applicantId === "member" ? "member" : "spouse"
      ].filter((p) => p.productKey !== activeProduct.productKey);

      if (otherProducts.length > 0) {
        setApplyToOthersItem(nextItem);
        setApplyToOthersSource(activeProduct);
        setApplyToOthersSelected([]);
        setApplyToOthersOpen(true);
        closeModal();
        return;
      }
    }

    closeModal();
  }

  function applyBeneficiaryToSelected() {
    if (!applyToOthersItem || !applyToOthersSource) return;

    const nextBeneficiaries = { ...beneficiariesByProduct };

    for (const productKey of applyToOthersSelected) {
      const existing = Array.isArray(nextBeneficiaries[productKey])
        ? (nextBeneficiaries[productKey] as BeneficiaryItem[])
        : [];
      // Add a copy with a new unique ID
      nextBeneficiaries[productKey] = [
        ...existing,
        { ...applyToOthersItem, id: crypto.randomUUID() },
      ];
    }

    setPageValues({ beneficiaries: nextBeneficiaries });
    setApplyToOthersOpen(false);
    setApplyToOthersItem(null);
    setApplyToOthersSource(null);
    setApplyToOthersSelected([]);
  }

  function closeApplyToOthers() {
    setApplyToOthersOpen(false);
    setApplyToOthersItem(null);
    setApplyToOthersSource(null);
    setApplyToOthersSelected([]);
  }

  function renderProductCard(product: ProductContext) {
    const items = getProductBeneficiaries(product.productKey);

    return (
      <Box
        key={product.productKey}
        sx={{
          border: "1px solid",
          borderColor: "divider",
          borderRadius: "16px",
          background:
            "linear-gradient(135deg, rgb(244, 248, 255) 0%, rgb(255, 255, 255) 52%, rgb(247, 251, 255) 100%)",
          p: 2.5,
          display: "flex",
          flexDirection: "column",
          gap: 1.5,
        }}
      >
        <Stack spacing={1.5}>
          <Stack spacing={1}>
            <Typography
              variant="body2"
              sx={{ fontWeight: 600, fontSize: "1rem" }}
            >
              {product.coverageName}
            </Typography>
          </Stack>

          {(["primary", "contingent"] as const).map((designation) => {
            const designationItems = items.filter(
              (item) => item.designation === designation,
            );
            if (designationItems.length === 0) return null;
            return (
              <Stack spacing={0.75} key={designation}>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{
                    fontWeight: 600,
                    fontSize: "0.6875rem",
                    textTransform: "uppercase",
                  }}
                >
                  {getDesignationLabel(designation)}
                </Typography>
                {designationItems.map((item) => (
                  <AddListItem
                    key={item.id}
                    onEdit={() => openEditModal(product, item)}
                    onRemove={() =>
                      removeBeneficiary(product.productKey, item.id)
                    }
                  >
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {getBeneficiaryDisplayName(item)}
                    </Typography>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ fontSize: "0.6875rem" }}
                    >
                      {getRelationshipLabel(item)}
                      {item.beneficiaryType === "individual"
                        ? ` | ${item.share}%`
                        : ""}
                    </Typography>
                  </AddListItem>
                ))}
              </Stack>
            );
          })}

          {isProductFullyMaxed(product.productKey) ? (
            <Alert severity="info" sx={{ mt: 1 }}>
              No more beneficiaries can be added online for this coverage.
            </Alert>
          ) : (
            <Button
              variant="outlined"
              fullWidth
              startIcon={<AddIcon />}
              onClick={() => openAddModal(product)}
            >
              Add Beneficiary
            </Button>
          )}
        </Stack>
      </Box>
    );
  }

  function renderApplicantSection(applicant: "member" | "spouse") {
    const products = applicantProducts[applicant];
    if (!products.length) return null;

    const groupedByCategory = coverageCategories
      .filter((category) => ELIGIBLE_CATEGORY_IDS.has(category.id))
      .map((category) => ({
        category,
        products: products.filter((product) => {
          const coverage = selectedCoverages.find(
            (c) => c.id === product.coverageId,
          );
          return coverage?.categoryId === category.id;
        }),
      }))
      .filter((group) => group.products.length > 0);

    return (
      <ApplicantSection
        applicant={applicant === "member" ? "self" : "spouse"}
        showLabel={shouldShowApplicantLabel(applicant, values)}
      >
        <Stack spacing={2}>
          {groupedByCategory.map((group) => (
            <Stack spacing={1.25} key={group.category.id}>
              <Stack spacing={1.25}>
                {group.products.map((product) => renderProductCard(product))}
              </Stack>
            </Stack>
          ))}
        </Stack>
      </ApplicantSection>
    );
  }

  const modalItems = activeProduct
    ? getProductBeneficiaries(activeProduct.productKey)
    : [];

  const remainingDesignationSlots = getDesignationRemaining(
    modalItems,
    modalValues.designation,
  );
  const remainingShare = getShareRemaining(modalItems, modalValues.designation);
  const displayRemainingShare = Math.max(
    0,
    remainingShare -
      (modalValues.beneficiaryType === "individual"
        ? (committedSharePercent ?? 0)
        : 0),
  );

  const designationHasIndividual = hasTypeForDesignation(
    modalItems,
    modalValues.designation,
    "individual",
  );
  const designationHasTrust = hasTypeForDesignation(
    modalItems,
    modalValues.designation,
    "trust",
  );

  const individualBlocked =
    !editingId && (designationHasTrust || remainingShare === 0);
  const trustBlocked =
    !editingId && (designationHasIndividual || designationHasTrust);

  const hasAnyApplicantProducts =
    applicantProducts.member.length > 0 || applicantProducts.spouse.length > 0;

  useEffect(() => {
    function handleDevFillForm() {
      const allProducts = [
        ...applicantProducts.member,
        ...applicantProducts.spouse,
      ];

      if (!allProducts.length) {
        return;
      }

      const nextBeneficiaries = { ...beneficiariesByProduct };
      let hasChanges = false;

      for (const product of allProducts) {
        const existingItems = Array.isArray(
          beneficiariesByProduct[product.productKey],
        )
          ? (beneficiariesByProduct[product.productKey] as BeneficiaryItem[])
          : [];

        if (existingItems.length > 0) {
          continue;
        }

        nextBeneficiaries[product.productKey] = [
          {
            id: crypto.randomUUID(),
            designation: "primary",
            beneficiaryType: "individual",
            firstName: product.applicantId === "spouse" ? "Spouse" : "Test",
            lastName: "Beneficiary",
            relationship: product.applicantId === "spouse" ? "Spouse" : "Other",
            trustName: "",
            trustDate: "",
            share: 100,
          },
        ];
        hasChanges = true;
      }

      if (hasChanges) {
        setPageValues({ beneficiaries: nextBeneficiaries });
      }
    }

    window.addEventListener("devtools:fillform", handleDevFillForm);
    return () =>
      window.removeEventListener("devtools:fillform", handleDevFillForm);
  }, [applicantProducts, beneficiariesByProduct, setPageValues]);

  return (
    <FormRoutePage
      pageId="beneficiary"
      help={<FormPageHelp items={helpItems} />}
    >
      {!hasAnyApplicantProducts ? (
        <Alert severity="info">
          No self or spouse Life/AD product selections were found.
        </Alert>
      ) : (
        <Stack spacing={2.5}>
          {renderApplicantSection("member")}
          {renderApplicantSection("spouse")}
        </Stack>
      )}

      <Dialog
        open={!!activeProduct}
        onClose={closeModal}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {editingId ? "Edit Beneficiary" : "Add Beneficiary"}
          {activeProduct ? ` - ${activeProduct.coverageName}` : ""}
        </DialogTitle>

        <DialogContent>
          <Stack spacing={2} sx={{ pt: 0.5 }}>
            <Box>
              <Tabs
                value={modalValues.designation}
                onChange={(_, value: BeneficiaryDesignation) =>
                  setModalValues((current) => ({
                    ...current,
                    designation: value,
                  }))
                }
              >
                <Tab label="Primary" value="primary" />
                <Tab label="Contingent" value="contingent" />
              </Tabs>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: "block", mt: 0.5, fontSize: "0.6875rem" }}
              >
                <Typography
                  component="span"
                  sx={{
                    color:
                      remainingDesignationSlots === 0
                        ? "error.main"
                        : "primary.main",
                    fontWeight: 700,
                    fontSize: "inherit",
                  }}
                >
                  {remainingDesignationSlots}
                </Typography>{" "}
                {modalValues.designation} beneficiaries remaining
              </Typography>
            </Box>

            {remainingDesignationSlots === 0 && !editingId && (
              <Alert severity="warning">
                No more {modalValues.designation} beneficiaries can be added
                online.
              </Alert>
            )}

            <FormControl
              disabled={remainingDesignationSlots === 0 && !editingId}
            >
              <FormLabel>Beneficiary Type</FormLabel>
              <ToggleButtonGroup
                exclusive
                value={modalValues.beneficiaryType}
                disabled={remainingDesignationSlots === 0 && !editingId}
                onChange={(_, value: BeneficiaryType | null) => {
                  if (value === null) return;
                  setModalValues((current) => ({
                    ...current,
                    beneficiaryType: value,
                  }));
                  setCommittedSharePercent(null);
                }}
                sx={toggleRadioGroupSx}
              >
                <ToggleButton value="individual" sx={toggleRadioButtonSx}>
                  <Radio
                    checked={modalValues.beneficiaryType === "individual"}
                    size="small"
                    sx={{ p: 0 }}
                  />
                  Individual
                </ToggleButton>
                <ToggleButton value="trust" sx={toggleRadioButtonSx}>
                  <Radio
                    checked={modalValues.beneficiaryType === "trust"}
                    size="small"
                    sx={{ p: 0 }}
                  />
                  Trust
                </ToggleButton>
              </ToggleButtonGroup>
            </FormControl>

            {modalValues.beneficiaryType === "individual" &&
              individualBlocked && (
                <Alert severity="warning">
                  {designationHasTrust
                    ? `A trust has already been designated as ${modalValues.designation} beneficiary. Individuals cannot be added for this designation.`
                    : "No more individuals can be added \u2014 0% unassigned share remaining."}
                </Alert>
              )}

            {modalValues.beneficiaryType === "trust" && trustBlocked && (
              <Alert severity="warning">
                {designationHasTrust
                  ? `Only one trust can be designated per ${modalValues.designation} beneficiary.`
                  : `An individual has already been designated as ${modalValues.designation} beneficiary. A trust cannot be added for this designation.`}
              </Alert>
            )}

            {modalValues.beneficiaryType === "individual" ? (
              <>
                <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                  <TextField
                    label="First Name"
                    disabled={
                      (remainingDesignationSlots === 0 || individualBlocked) &&
                      !editingId
                    }
                    value={modalValues.firstName}
                    onChange={(event) =>
                      setModalValues((current) => ({
                        ...current,
                        firstName: event.target.value,
                      }))
                    }
                    fullWidth
                  />

                  <TextField
                    label="Last Name"
                    disabled={
                      (remainingDesignationSlots === 0 || individualBlocked) &&
                      !editingId
                    }
                    value={modalValues.lastName}
                    onChange={(event) =>
                      setModalValues((current) => ({
                        ...current,
                        lastName: event.target.value,
                      }))
                    }
                    fullWidth
                  />
                </Stack>

                <TextField
                  select
                  label="Relationship"
                  disabled={
                    (remainingDesignationSlots === 0 || individualBlocked) &&
                    !editingId
                  }
                  value={modalValues.relationship}
                  onChange={(event) =>
                    setModalValues((current) => ({
                      ...current,
                      relationship: event.target.value,
                    }))
                  }
                  fullWidth
                >
                  {RELATIONSHIP_OPTIONS.map((option) => (
                    <MenuItem key={option} value={option}>
                      {option}
                    </MenuItem>
                  ))}
                </TextField>

                <TextField
                  label="% Share"
                  disabled={
                    (remainingDesignationSlots === 0 || individualBlocked) &&
                    !editingId
                  }
                  value={modalValues.share}
                  onChange={(event) => {
                    const sanitizedShare = event.target.value
                      .replace(/\D/g, "")
                      .slice(0, 3);
                    setModalValues((current) => ({
                      ...current,
                      share: sanitizedShare,
                    }));
                    setCommittedSharePercent(null);
                  }}
                  onBlur={() =>
                    setCommittedSharePercent(
                      parseCommittedShare(modalValues.share),
                    )
                  }
                  inputProps={{
                    inputMode: "numeric",
                    pattern: "[0-9]*",
                    maxLength: 3,
                  }}
                  fullWidth
                />

                <Stack direction="row" spacing={1}>
                  {[25, 50, 75, 100].map((percent) => (
                    <Button
                      key={percent}
                      size="small"
                      variant="outlined"
                      disabled={
                        (remainingDesignationSlots === 0 ||
                          individualBlocked) &&
                        !editingId
                      }
                      onClick={() => {
                        setModalValues((current) => ({
                          ...current,
                          share: String(percent),
                        }));
                        setCommittedSharePercent(percent);
                      }}
                    >
                      {percent}%
                    </Button>
                  ))}
                </Stack>

                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ fontSize: "0.6875rem" }}
                >
                  <Typography
                    component="span"
                    sx={{
                      color:
                        displayRemainingShare === 0
                          ? "error.main"
                          : "primary.main",
                      fontWeight: 700,
                      fontSize: "inherit",
                    }}
                  >
                    {displayRemainingShare}%
                  </Typography>{" "}
                  unassigned remaining
                </Typography>
              </>
            ) : (
              <>
                <TextField
                  label="Name of Trust"
                  disabled={
                    (remainingDesignationSlots === 0 || trustBlocked) &&
                    !editingId
                  }
                  value={modalValues.trustName}
                  onChange={(event) =>
                    setModalValues((current) => ({
                      ...current,
                      trustName: event.target.value,
                    }))
                  }
                  fullWidth
                />

                <TextField
                  label="Date of Trust"
                  disabled={
                    (remainingDesignationSlots === 0 || trustBlocked) &&
                    !editingId
                  }
                  value={modalValues.trustDate}
                  onChange={(event) =>
                    setModalValues((current) => ({
                      ...current,
                      trustDate: event.target.value,
                    }))
                  }
                  type="date"
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                />
              </>
            )}

            {modalError ? <Alert severity="error">{modalError}</Alert> : null}
          </Stack>
        </DialogContent>

        <DialogActions>
          <Button onClick={closeModal}>Cancel</Button>
          <Button
            variant="contained"
            onClick={saveBeneficiary}
            disabled={
              !editingId &&
              (remainingDesignationSlots === 0 ||
                (modalValues.beneficiaryType === "individual" &&
                  individualBlocked) ||
                (modalValues.beneficiaryType === "trust" && trustBlocked))
            }
          >
            Save Beneficiary
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={applyToOthersOpen}
        onClose={closeApplyToOthers}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Apply to Other Coverages</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 0.5 }}>
            <Typography variant="body2" color="text.secondary">
              Would you like to apply this beneficiary to other coverages?
            </Typography>
            {(() => {
              if (!applyToOthersSource) return null;
              const applicantKey =
                applyToOthersSource.applicantId === "member"
                  ? "member"
                  : "spouse";
              const otherProducts = applicantProducts[applicantKey].filter(
                (p) => p.productKey !== applyToOthersSource.productKey,
              );
              return (
                <Stack spacing={1}>
                  {otherProducts.map((product) => (
                    <Box
                      key={product.productKey}
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                      }}
                    >
                      <Checkbox
                        checked={applyToOthersSelected.includes(
                          product.productKey,
                        )}
                        onChange={(_, checked) => {
                          setApplyToOthersSelected((prev) =>
                            checked
                              ? [...prev, product.productKey]
                              : prev.filter((k) => k !== product.productKey),
                          );
                        }}
                      />
                      <Typography variant="body2">
                        {product.coverageName}
                      </Typography>
                    </Box>
                  ))}
                </Stack>
              );
            })()}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeApplyToOthers}>Skip</Button>
          <Button
            variant="contained"
            onClick={applyBeneficiaryToSelected}
            disabled={applyToOthersSelected.length === 0}
          >
            Apply to Selected
          </Button>
        </DialogActions>
      </Dialog>
    </FormRoutePage>
  );
}
