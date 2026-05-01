import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
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
import AddListItem from "../components/form/AddListItem";
import ApplicantSection from "../components/form/ApplicantSection";
import { shouldShowApplicantLabel } from "../components/form/applicantVisibility";
import FormRoutePage from "../components/form/FormRoutePage";
import FormSectionTitle from "../components/form/FormSectionTitle";
import { getActiveClientCoverages } from "../client/getActiveClientCoverages";
import { coverageCategories } from "../config/coverageCategories";
import type { CoverageApplicantId } from "../config/coverages/types";
import { useApplicationForm } from "../state/ApplicationFormContext";

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

  const helpItems = useMemo(
    () => [
      {
        id: "beneficiary-basics",
        label: "What is a beneficiary?",
        title: "What is a beneficiary?",
        content: (
          <Stack spacing={2}>
            <Typography variant="body2">
              A beneficiary is the person, people, or trust you choose to
              receive the money from your policy when you pass away.
            </Typography>
            <Typography variant="body2">
              This can be a family member, friend, or trust, and you can update
              your beneficiary choices if your situation changes.
            </Typography>
            <Typography variant="body2">
              A <strong>primary beneficiary</strong> is the person or entity who
              would receive the policy proceeds first.
            </Typography>
            <Typography variant="body2">
              A <strong>contingent beneficiary</strong> would receive the policy
              proceeds if the primary beneficiary is unable to receive them.
            </Typography>
            <Typography variant="body2">
              You may add up to ten primary and ten contingent beneficiaries
              online. If no beneficiary is named, proceeds will be paid
              according to the policy provisions.
            </Typography>
            <Typography variant="body2">
              For dependent child coverage, the beneficiary is the member.
            </Typography>
          </Stack>
        ),
      },
      {
        id: "beneficiary-share",
        label: "What is the % share?",
        title: "What is the % share?",
        content: (
          <Stack spacing={2}>
            <Typography variant="body2">
              The percentage share determines how much of the policy payout each
              beneficiary will receive.
            </Typography>
            <Typography variant="body2">
              You assign a percentage to each individual beneficiary, and the
              percentages for that designation must add up to 100%.
            </Typography>
            <Typography variant="body2">
              For example, if one beneficiary is assigned 60% and another is
              assigned 40%, they would receive those portions of the total
              benefit.
            </Typography>
            <Typography variant="body2">
              If you name a trust as beneficiary, 100% of the proceeds will be
              paid to the trust.
            </Typography>
          </Stack>
        ),
      },
    ],
    [],
  );

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
    closeModal();
  }

  function renderProductCard(product: ProductContext) {
    const items = getProductBeneficiaries(product.productKey);

    return (
      <Card
        key={product.productKey}
        variant="outlined"
        sx={{ borderRadius: 2, p: 2, backgroundColor: "background.paper" }}
      >
        <Stack spacing={1.5}>
          <Stack spacing={1}>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {product.coverageName}
            </Typography>
          </Stack>

          {items.map((item) => (
            <AddListItem
              key={item.id}
              onEdit={() => openEditModal(product, item)}
              onRemove={() => removeBeneficiary(product.productKey, item.id)}
            >
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {getBeneficiaryDisplayName(item)}
              </Typography>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ fontSize: "0.6875rem" }}
              >
                {getDesignationLabel(item.designation)} |{" "}
                {getRelationshipLabel(item)}
                {item.beneficiaryType === "individual"
                  ? ` | ${item.share}%`
                  : ""}
              </Typography>
            </AddListItem>
          ))}

          <Button
            variant="outlined"
            fullWidth
            startIcon={<AddIcon />}
            onClick={() => openAddModal(product)}
          >
            Add Beneficiary
          </Button>
        </Stack>
      </Card>
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
        showLabel={shouldShowApplicantLabel(applicant, values, "beneficiary")}
      >
        <Stack spacing={2}>
          {groupedByCategory.map((group) => (
            <Stack spacing={1.25} key={group.category.id}>
              <FormSectionTitle
                icon={group.category.icon}
                label={group.category.label}
              />
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
    <FormRoutePage pageId="beneficiary" helpItems={helpItems}>
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
                    color: remainingDesignationSlots === 0 ? "error.main" : "primary.main",
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
                No more {modalValues.designation} beneficiaries can be added online.
              </Alert>
            )}

            <FormControl disabled={remainingDesignationSlots === 0 && !editingId}>
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

            {modalValues.beneficiaryType === "individual" ? (
              <>
                {remainingShare === 0 && !editingId && (
                  <Alert severity="warning">
                    No more individuals can be added — 0% unassigned share
                    remaining.
                  </Alert>
                )}

                <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                  <TextField
                    label="First Name"
                    disabled={(remainingDesignationSlots === 0 || remainingShare === 0) && !editingId}
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
                    disabled={(remainingDesignationSlots === 0 || remainingShare === 0) && !editingId}
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
                  disabled={(remainingDesignationSlots === 0 || remainingShare === 0) && !editingId}
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
                  disabled={(remainingDesignationSlots === 0 || remainingShare === 0) && !editingId}
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
                      disabled={(remainingDesignationSlots === 0 || remainingShare === 0) && !editingId}
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
                      color: displayRemainingShare === 0 ? "error.main" : "primary.main",
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
                  disabled={remainingDesignationSlots === 0 && !editingId}
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
                  disabled={remainingDesignationSlots === 0 && !editingId}
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
            disabled={remainingDesignationSlots === 0 && !editingId}
          >
            Save Beneficiary
          </Button>
        </DialogActions>
      </Dialog>
    </FormRoutePage>
  );
}
