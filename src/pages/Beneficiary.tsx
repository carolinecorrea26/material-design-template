import { useEffect, useMemo, useState } from "react";
import ProductCard from "../components/layout/ProductCard";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Divider,
  FormControl,
  FormLabel,
  Radio,
  Stack,
  Tab,
  Tabs,
  Typography,
} from "@mui/material";
import SelectionGroup from "../components/forms/SelectionGroup";
import AddIcon from "@mui/icons-material/Add";
import { useForm, type Control, type FieldErrors } from "react-hook-form";
import DynamicListItem from "../components/forms/DynamicListItem";
import ApplicantSectionDivider from "../components/layout/ApplicantSectionDivider";
import CategoryCard from "../components/layout/CategoryCard";
import AppModal from "../components/layout/AppModal";
import FieldRenderer from "../components/forms/FieldRenderer";
import { shouldShowApplicantLabel } from "../utils/applicantVisibility";
import FormRoutePage from "../app/RoutePage";
import AppDrawer from "../components/layout/AppDrawer";
import { getClientPageRequirement } from "../config/client/getClientPageRequirement";
import { getActiveClientCoverages } from "../config/client/getActiveClientCoverages";
import {
  coverageCategories,
  getCoverageCategorySectionLabel,
} from "../config/coverageCategories";
import { getActiveClient } from "../config/client/getActiveClient";
import type { CoverageApplicantId } from "../config/coverages/types";
import type { FieldDefinition } from "../config/fields/types";
import { useApplicationForm } from "../app/ApplicationFormContext";
import { beneficiaryHelpItems } from "../content/helpContent";
import FormHelpChips from "../components/content/HelpChips";
import { getContent } from "../content";

const content = getContent();

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

type ProductContext = {
  productKey: string;
  coverageId: string;
  coverageName: string;
  applicantId: CoverageApplicantId;
};

const RELATIONSHIP_OPTIONS = [
  "Spouse",
  "Child",
  "Parent",
  "Sibling",
  "Other Relative",
  "Other",
];

const BENEFICIARY_INDIVIDUAL_FIELDS: FieldDefinition[] = [
  {
    id: "firstName",
    label: "First Name",
    inputType: "text",
    required: true,
  },
  {
    id: "lastName",
    label: "Last Name",
    inputType: "text",
    required: true,
  },
  {
    id: "relationship",
    label: "Relationship",
    inputType: "dropdown",
    required: true,
    options: RELATIONSHIP_OPTIONS.map((r) => ({ value: r, label: r })),
  },
  {
    id: "share",
    label: "% Share",
    inputType: "text",
    inputMode: "numeric",
    required: true,
    format: "percent",
  },
];

const BENEFICIARY_TRUST_FIELDS: FieldDefinition[] = [
  {
    id: "trustName",
    label: "Name of Trust",
    inputType: "text",
    required: true,
  },
  {
    id: "trustDate",
    label: "Date of Trust",
    inputType: "date",
    required: true,
  },
];

const ELIGIBLE_CATEGORY_IDS = new Set(["LI", "AD"]);

const BENEFICIARY_INFO_OPT_IN_FIELD_ID = "beneficiary-information-opt-in";

const beneficiaryInfoOptInField: FieldDefinition = {
  id: BENEFICIARY_INFO_OPT_IN_FIELD_ID,
  label: "Do you want to add beneficiary information?",
  inputType: "radio",
  required: true,
  options: [
    { value: "yes", label: "Yes" },
    { value: "no", label: "No" },
  ],
};

function shouldShowBeneficiaryQuestions(
  pageRequirement: "required" | "optional" | "none",
  values: Record<string, unknown>,
): boolean {
  if (pageRequirement !== "optional") {
    return true;
  }

  return values[BENEFICIARY_INFO_OPT_IN_FIELD_ID] === "yes";
}

function getBeneficiaryPageError(
  pageRequirement: "required" | "optional" | "none",
  values: Record<string, unknown>,
  applicableProductKeys: string[],
): string | undefined {
  if (pageRequirement === "none") {
    return undefined;
  }

  if (
    pageRequirement === "optional" &&
    !shouldShowBeneficiaryQuestions(pageRequirement, values)
  ) {
    return undefined;
  }

  if (applicableProductKeys.length === 0) {
    return undefined;
  }

  const beneficiaries =
    values.beneficiaries != null &&
    typeof values.beneficiaries === "object" &&
    !Array.isArray(values.beneficiaries)
      ? (values.beneficiaries as Record<string, unknown>)
      : {};

  const hasMissingBeneficiaryInfo = applicableProductKeys.some((productKey) => {
    const entries = beneficiaries[productKey];
    return !Array.isArray(entries) || entries.length === 0;
  });

  if (hasMissingBeneficiaryInfo) {
    return content.beneficiary.missingBeneficiaryError;
  }

  return undefined;
}

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



export default function Beneficiary() {
  const { values, setPageValues } = useApplicationForm();
  const pageRequirement = getClientPageRequirement("beneficiary");
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
  const [modalError, setModalError] = useState<string | null>(null);

  // Local form for beneficiary modal fields (same pattern as DynamicList)
  const {
    control: modalControl,
    handleSubmit: handleModalSubmit,
    reset: resetModalForm,
    setValue: setModalValue,
    watch: watchModal,
    formState: { errors: modalErrors },
  } = useForm<Record<string, string>>({
    defaultValues: {
      firstName: "",
      lastName: "",
      relationship: "",
      share: "",
      trustName: "",
      trustDate: "",
    },
  });

  // Track designation and beneficiaryType outside useForm since they're structural selectors, not text fields
  const [modalDesignation, setModalDesignation] =
    useState<BeneficiaryDesignation>("primary");
  const [modalBeneficiaryType, setModalBeneficiaryType] =
    useState<BeneficiaryType>("individual");

  const modalShare = watchModal("share");

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

  const [activeHelpId, setActiveHelpId] = useState<string | null>(null);
  const activeHelpItem =
    helpItems.find((item) => item.id === activeHelpId) ?? null;

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
    resetModalForm({
      firstName: "",
      lastName: "",
      relationship: "",
      share: "",
      trustName: "",
      trustDate: "",
    });
    setModalDesignation("primary");
    setModalBeneficiaryType("individual");
    setModalError(null);
  }

  function openEditModal(product: ProductContext, item: BeneficiaryItem) {
    setActiveProduct(product);
    setEditingId(item.id);
    resetModalForm({
      firstName: item.firstName,
      lastName: item.lastName,
      relationship: item.relationship,
      share: item.share > 0 ? String(item.share) : "",
      trustName: item.trustName,
      trustDate: item.trustDate,
    });
    setModalDesignation(item.designation);
    setModalBeneficiaryType(item.beneficiaryType);
    setModalError(null);
  }

  function closeModal() {
    setActiveProduct(null);
    setEditingId(null);
    resetModalForm({
      firstName: "",
      lastName: "",
      relationship: "",
      share: "",
      trustName: "",
      trustDate: "",
    });
    setModalDesignation("primary");
    setModalBeneficiaryType("individual");
    setModalError(null);
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

  function saveBeneficiary(formData: Record<string, string>) {
    if (!activeProduct) return;

    const currentList = getProductBeneficiaries(activeProduct.productKey);
    const remainingSlots = getDesignationRemaining(
      currentList,
      modalDesignation,
    );

    if (remainingSlots <= 0) {
      setModalError(
        `You have reached the maximum of 10 ${modalDesignation} beneficiaries for this product.`,
      );
      return;
    }

    const parsedShare =
      modalBeneficiaryType === "individual" ? Number(formData.share) : 0;

    if (modalBeneficiaryType === "individual") {
      if (!Number.isFinite(parsedShare) || parsedShare <= 0) {
        setModalError("Enter a valid share percentage greater than 0.");
        return;
      }

      const unassignedShare = getShareRemaining(currentList, modalDesignation);
      if (parsedShare > unassignedShare) {
        setModalError(
          `Share exceeds available unassigned percentage (${unassignedShare}%).`,
        );
        return;
      }
    }

    const nextItem: BeneficiaryItem = {
      id: editingId ?? crypto.randomUUID(),
      designation: modalDesignation,
      beneficiaryType: modalBeneficiaryType,
      firstName: (formData.firstName ?? "").trim(),
      lastName: (formData.lastName ?? "").trim(),
      relationship: formData.relationship ?? "",
      trustName: (formData.trustName ?? "").trim(),
      trustDate: formData.trustDate ?? "",
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
      <ProductCard
        key={product.productKey}
        sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}
      >
        <Stack spacing={1.5}>
          <Stack spacing={1}>
            <Typography variant="productNameLabel">
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
                <Typography variant="overline" color="text.secondary">
                  {getDesignationLabel(designation)}
                </Typography>
                {designationItems.map((item) => (
                  <DynamicListItem
                    key={item.id}
                    onEdit={() => openEditModal(product, item)}
                    onRemove={() =>
                      removeBeneficiary(product.productKey, item.id)
                    }
                  >
                    <Typography variant="subtitle2">
                      {getBeneficiaryDisplayName(item)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {getRelationshipLabel(item)}
                      {item.beneficiaryType === "individual"
                        ? ` | ${item.share}%`
                        : ""}
                    </Typography>
                  </DynamicListItem>
                ))}
              </Stack>
            );
          })}

          {isProductFullyMaxed(product.productKey) ? (
            <Alert severity="info" sx={{ mt: 1 }}>
              {content.beneficiary.noMoreOnlineMessage}
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
      </ProductCard>
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
      <ApplicantSectionDivider
        applicant={applicant === "member" ? "self" : "spouse"}
        showLabel={shouldShowApplicantLabel(applicant, values)}
      >
        <Stack spacing={3}>
          {groupedByCategory.map((group) => {
            return (
              <Stack spacing={1.5} key={group.category.id}>
                <CategoryCard
                  label={getCoverageCategorySectionLabel(
                    group.category.id,
                    getActiveClient().coverages.categorySectionLabels,
                  )}
                  icon={group.category.icon}
                >
                  {group.products.map((product) => renderProductCard(product))}
                </CategoryCard>
              </Stack>
            );
          })}
        </Stack>
      </ApplicantSectionDivider>
    );
  }

  const modalItems = activeProduct
    ? getProductBeneficiaries(activeProduct.productKey)
    : [];

  const remainingDesignationSlots = getDesignationRemaining(
    modalItems,
    modalDesignation,
  );
  const remainingShare = getShareRemaining(modalItems, modalDesignation);
  const currentShareValue = Number(modalShare) || 0;
  const displayRemainingShare = Math.max(
    0,
    remainingShare -
      (modalBeneficiaryType === "individual" ? currentShareValue : 0),
  );

  const designationHasIndividual = hasTypeForDesignation(
    modalItems,
    modalDesignation,
    "individual",
  );
  const designationHasTrust = hasTypeForDesignation(
    modalItems,
    modalDesignation,
    "trust",
  );

  const individualBlocked =
    !editingId && (designationHasTrust || remainingShare === 0);
  const trustBlocked =
    !editingId && (designationHasIndividual || designationHasTrust);

  const hasAnyApplicantProducts =
    applicantProducts.member.length > 0 || applicantProducts.spouse.length > 0;
  const applicableProductKeys = [
    ...applicantProducts.member.map((product) => product.productKey),
    ...applicantProducts.spouse.map((product) => product.productKey),
  ];
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
      devFillFields={() =>
        pageRequirement === "optional" ? [beneficiaryInfoOptInField] : []
      }
      validate={(nextValues) =>
        getBeneficiaryPageError(
          pageRequirement,
          nextValues as Record<string, unknown>,
          applicableProductKeys,
        )
      }
      help={
        <>
          <FormHelpChips items={helpItems} onSelect={setActiveHelpId} />
          <AppDrawer
            open={!!activeHelpItem}
            title={activeHelpItem?.title ?? ""}
            onClose={() => setActiveHelpId(null)}
          >
            {activeHelpItem?.content}
          </AppDrawer>
        </>
      }
    >
      {({ control, errors, watchedValues }) => {
        const showBeneficiaryQuestions = shouldShowBeneficiaryQuestions(
          pageRequirement,
          watchedValues as Record<string, unknown>,
        );

        return (
          <>
            {pageRequirement === "optional" && (
              <FieldRenderer
                field={beneficiaryInfoOptInField}
                control={control}
                errors={errors}
              />
            )}

            {pageRequirement === "optional" && showBeneficiaryQuestions && (
              <Divider sx={{ my: 2 }} />
            )}

            {!hasAnyApplicantProducts ? (
              showBeneficiaryQuestions && (
                <Alert severity="info">
                  {content.beneficiary.noApplicantProductsMessage}
                </Alert>
              )
            ) : showBeneficiaryQuestions ? (
              <Stack spacing={2.5}>
                {renderApplicantSection("member")}
                {renderApplicantSection("spouse")}
              </Stack>
            ) : null}

            <AppModal
              open={!!activeProduct}
              onClose={closeModal}
              maxWidth={600}
              title={
                (editingId
                  ? content.dialogs.beneficiary.editTitle
                  : content.dialogs.beneficiary.addTitle) +
                (activeProduct ? ` - ${activeProduct.coverageName}` : "")
              }
              actions={[
                {
                  label: "Save Beneficiary",
                  onClick: () => {
                    const formEl = document.getElementById(
                      "beneficiary-modal-form",
                    ) as HTMLFormElement | null;
                    formEl?.requestSubmit();
                  },
                  variant: "contained",
                },
                {
                  label: "Cancel",
                  onClick: closeModal,
                  variant: "text",
                },
              ]}
            >
              <Box
                component="form"
                id="beneficiary-modal-form"
                noValidate
                onSubmit={(e) => {
                  e.stopPropagation();
                  handleModalSubmit(saveBeneficiary)(e);
                }}
              >
                <Stack spacing={2} sx={{ pt: 0.5 }}>
                  <Box>
                    <Tabs
                      value={modalDesignation}
                      onChange={(_, value: BeneficiaryDesignation) =>
                        setModalDesignation(value)
                      }
                    >
                      <Tab label="Primary" value="primary" />
                      <Tab label="Contingent" value="contingent" />
                    </Tabs>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ display: "block", mt: 0.5 }}
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
                      {modalDesignation} beneficiaries remaining
                    </Typography>
                  </Box>

                  {remainingDesignationSlots === 0 && !editingId && (
                    <Alert severity="warning">
                      No more {modalDesignation} beneficiaries can be added
                      online.
                    </Alert>
                  )}

                  <FormControl
                    disabled={remainingDesignationSlots === 0 && !editingId}
                  >
                    <FormLabel>Beneficiary Type</FormLabel>
                    <Stack
                      spacing={1}
                      sx={{ mt: 1 }}
                      role="radiogroup"
                      aria-label="Beneficiary Type"
                    >
                      {(
                        [
                          { value: "individual", label: "Individual" },
                          { value: "trust", label: "Trust" },
                        ] as { value: BeneficiaryType; label: string }[]
                      ).map((option) => {
                        const isDisabled =
                          remainingDesignationSlots === 0 && !editingId;
                        return (
                          <SelectionGroup
                            key={option.value}
                            role="radio"
                            aria-checked={modalBeneficiaryType === option.value}
                            tabIndex={
                              modalBeneficiaryType === option.value ? 0 : -1
                            }
                            onClick={() => {
                              if (!isDisabled)
                                setModalBeneficiaryType(option.value);
                            }}
                            onKeyDown={(e) => {
                              if (
                                !isDisabled &&
                                (e.key === " " || e.key === "Enter")
                              ) {
                                e.preventDefault();
                                setModalBeneficiaryType(option.value);
                              }
                            }}
                          >
                            <Radio
                              checked={modalBeneficiaryType === option.value}
                              disabled={isDisabled}
                              size="small"
                              sx={{ p: 0, pointerEvents: "none" }}
                              aria-hidden
                            />
                            <Box
                              component="span"
                              className="SelectionGroup-label"
                              sx={{ fontSize: "0.875rem" }}
                            >
                              {option.label}
                            </Box>
                          </SelectionGroup>
                        );
                      })}
                    </Stack>
                  </FormControl>

                  {modalBeneficiaryType === "individual" &&
                    individualBlocked && (
                      <Alert severity="warning">
                        {designationHasTrust
                          ? `A trust has already been designated as ${modalDesignation} beneficiary. Individuals cannot be added for this designation.`
                          : "No more individuals can be added \u2014 0% unassigned share remaining."}
                      </Alert>
                    )}

                  {modalBeneficiaryType === "trust" && trustBlocked && (
                    <Alert severity="warning">
                      {designationHasTrust
                        ? `Only one trust can be designated per ${modalDesignation} beneficiary.`
                        : `An individual has already been designated as ${modalDesignation} beneficiary. A trust cannot be added for this designation.`}
                    </Alert>
                  )}

                  {modalBeneficiaryType === "individual" ? (
                    <>
                      <Box
                        sx={{
                          display: "grid",
                          gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                          gap: { xs: 0, sm: 2 },
                        }}
                      >
                        {BENEFICIARY_INDIVIDUAL_FIELDS.filter(
                          (f) => f.id === "firstName" || f.id === "lastName",
                        ).map((f) => (
                          <FieldRenderer
                            key={f.id}
                            field={{
                              ...f,
                              disabled:
                                (remainingDesignationSlots === 0 ||
                                  individualBlocked) &&
                                !editingId,
                            }}
                            control={
                              modalControl as unknown as Control<
                                Record<string, string | boolean | string[]>
                              >
                            }
                            errors={
                              modalErrors as FieldErrors<
                                Record<string, string | boolean | string[]>
                              >
                            }
                          />
                        ))}
                      </Box>

                      {BENEFICIARY_INDIVIDUAL_FIELDS.filter(
                        (f) => f.id === "relationship",
                      ).map((f) => (
                        <FieldRenderer
                          key={f.id}
                          field={{
                            ...f,
                            disabled:
                              (remainingDesignationSlots === 0 ||
                                individualBlocked) &&
                              !editingId,
                          }}
                          control={
                            modalControl as unknown as Control<
                              Record<string, string | boolean | string[]>
                            >
                          }
                          errors={
                            modalErrors as FieldErrors<
                              Record<string, string | boolean | string[]>
                            >
                          }
                        />
                      ))}

                      {BENEFICIARY_INDIVIDUAL_FIELDS.filter(
                        (f) => f.id === "share",
                      ).map((f) => (
                        <FieldRenderer
                          key={f.id}
                          field={{
                            ...f,
                            disabled:
                              (remainingDesignationSlots === 0 ||
                                individualBlocked) &&
                              !editingId,
                          }}
                          control={
                            modalControl as unknown as Control<
                              Record<string, string | boolean | string[]>
                            >
                          }
                          errors={
                            modalErrors as FieldErrors<
                              Record<string, string | boolean | string[]>
                            >
                          }
                        />
                      ))}

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
                              setModalValue("share", String(percent));
                            }}
                          >
                            {percent}%
                          </Button>
                        ))}
                      </Stack>

                      <Typography
                        variant="caption"
                        color="text.secondary"
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
                      {BENEFICIARY_TRUST_FIELDS.map((f) => (
                        <FieldRenderer
                          key={f.id}
                          field={{
                            ...f,
                            disabled:
                              (remainingDesignationSlots === 0 ||
                                trustBlocked) &&
                              !editingId,
                          }}
                          control={
                            modalControl as unknown as Control<
                              Record<string, string | boolean | string[]>
                            >
                          }
                          errors={
                            modalErrors as FieldErrors<
                              Record<string, string | boolean | string[]>
                            >
                          }
                        />
                      ))}
                    </>
                  )}

                  {modalError ? (
                    <Alert severity="error">{modalError}</Alert>
                  ) : null}
                </Stack>
              </Box>
            </AppModal>

            <AppModal
              open={applyToOthersOpen}
              onClose={closeApplyToOthers}
              maxWidth={600}
              title={content.dialogs.beneficiary.applyToOthersTitle}
              actions={[
                {
                  label: "Apply to Selected",
                  onClick: applyBeneficiaryToSelected,
                  variant: "contained",
                },
                {
                  label: "Skip",
                  onClick: closeApplyToOthers,
                  variant: "text",
                },
              ]}
            >
              <Stack spacing={2} sx={{ pt: 0.5 }}>
                <Typography variant="body2" color="text.secondary">
                  {content.dialogs.beneficiary.applyToOthersPrompt}
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
                                  : prev.filter(
                                      (k) => k !== product.productKey,
                                    ),
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
            </AppModal>
          </>
        );
      }}
    </FormRoutePage>
  );
}
