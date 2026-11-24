import { selectedApplicationApplicants } from '../domain/applicantParticipation';
import PageHelp from "../components/content/PageHelp";
import { pageHelpItems } from "../content/helpContent";
import { orderCoveragePresentation } from "../domain/coveragePresentation";
import { activeFeaturedProduct, activeFirstCoverageCategory } from "../config/client/coverageProductScope";
import { resolveSiteId } from "../data/activeSite";
import { resolveActiveAssociationFromApplication } from '../data/activeAssociation';
import { applicationUnderwriting, applicationCoverageName } from "../domain/coverageRuntime";
import { getDesignationLabel } from "../components/beneficiary/beneficiaryRecords";
import { requirementText } from "../domain/requirementContent";
import BeneficiaryProductRecords from "../components/beneficiary/BeneficiaryProductRecords";
import { type BeneficiaryDesignation, type BeneficiaryType, type BeneficiaryItem } from "../components/beneficiary/beneficiaryRecords";
import { collectsBeneficiaries, beneficiaryQuestionsEnabled as shouldShowBeneficiaryQuestions } from "../domain/beneficiaryParticipation";
import { beneficiaryDesignationNote } from "../domain/beneficiaryNotes";
import { getPrototypeLibrary } from "../domain/prototypeLibrary";
import { validateBeneficiaryRecords } from '../domain/beneficiaryValidation';
import { getFieldSurface, getSurfaceFields, getSurfaceField, surfaceSemanticValues, beneficiarySemanticValues, beneficiaryStoredValues } from '../config/fields/storedSurfaces';
import { BENEFICIARY_INFO_OPT_IN_FIELD_ID } from "../config/fields/beneficiaryFields";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Divider,
  Stack,
  Tab,
  Tabs,
  Typography,
} from "@mui/material";
import ControlledFieldRenderer from "../components/forms/ControlledFieldRenderer";
import { useForm, type Control, type FieldErrors } from "react-hook-form";
import ApplicantSectionDivider from "../app/sections/ConfiguredApplicantSectionDivider";
import CategoryCard from "../components/layout/CategoryCard";
import AppModal from "../components/layout/AppModal";
import FieldRenderer from "../components/forms/FieldRenderer";
import { shouldShowApplicantLabel } from "../utils/applicantVisibility";
import FormRoutePage, { isSectionVisible } from "../app/RoutePage";
import { getClientPageRequirement } from "../config/client/getClientPageRequirement";
import { getActiveClientCoverages } from "../config/client/getActiveClientCoverages";
import {
  getCoverageCategories,
  getCoverageCategorySectionLabel,
} from "../config/coverageCategories";
import { getActiveClient } from "../config/client/getActiveClient";
import type { CoverageApplicantId } from "../config/coverages/types";
import { useApplicationForm } from "../app/ApplicationFormContext";
import { getContent } from "../content";
import FieldGrid from "../components/layout/FieldGrid";



type ProductContext = {
  productKey: string;
  coverageId: string;
  coverageName: string;
  applicantId: CoverageApplicantId;
};


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
    return getContent().beneficiary.missingBeneficiaryError;
  }

  for (const productKey of applicableProductKeys) {
    const invalid = validateBeneficiaryRecords(beneficiaries[productKey] as unknown[], getFieldSurface('beneficiaryIndividual'), getFieldSurface('beneficiaryTrust'), 'next');
    if (invalid) return invalid;
  }
  return undefined;
}

export default function Beneficiary() {
  const content = getContent();
  const { values, setPageValues } = useApplicationForm();
  const associationKey = resolveActiveAssociationFromApplication(resolveSiteId(), values).association?.id;
  const individualFields = getSurfaceFields("beneficiaryIndividual");
  const trustFields = getSurfaceFields("beneficiaryTrust");
  const maxBeneficiaries = getFieldSurface("beneficiaryIndividual").maxItems!;
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

  const productApplicants = useMemo(() => selectedApplicationApplicants(values, coverages), [values, coverages]);

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
      selectedCoverageIds.includes(coverage.id),
  );

  const isApplicantSelectedForProduct = useCallback((coverageId: string, applicantId: CoverageApplicantId) =>
    productApplicants[coverageId]?.includes(applicantId) ?? false, [productApplicants]);

  const applicantProducts = useMemo(() => {
    const byApplicant: Record<"member" | "spouse", ProductContext[]> = {
      member: [],
      spouse: [],
    };

    for (const coverage of selectedCoverages) {
      const memberKey = `${coverage.id}:member`;
      if (
        coverage.applicants.includes('member') &&
        (storedAmounts[memberKey] ?? 0) > 0 &&
        isApplicantSelectedForProduct(coverage.id, "member") && collectsBeneficiaries(getPrototypeLibrary()?.site, coverage.id, coverage.categoryId, "member", associationKey)
      ) {
        byApplicant.member.push({
          productKey: memberKey,
          coverageId: coverage.id,
          coverageName: applicationCoverageName(coverage, values),
          applicantId: "member",
        });
      }

      const spouseKey = `${coverage.id}:spouse`;
      if (
        coverage.applicants.includes('spouse') &&
        (storedAmounts[spouseKey] ?? 0) > 0 &&
        isApplicantSelectedForProduct(coverage.id, "spouse") && collectsBeneficiaries(getPrototypeLibrary()?.site, coverage.id, coverage.categoryId, "spouse", associationKey)
      ) {
        byApplicant.spouse.push({
          productKey: spouseKey,
          coverageId: coverage.id,
          coverageName: applicationCoverageName(coverage, values),
          applicantId: "spouse",
        });
      }
    }

    return byApplicant;
  }, [selectedCoverages, storedAmounts, isApplicantSelectedForProduct, values, associationKey]);

  const [activeProduct, setActiveProduct] = useState<ProductContext | null>(
    null,
  );
  const [editingId, setEditingId] = useState<string | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);

  // Focus the product's "Add Beneficiary" button after a removal, since the
  // removed row's own Remove button (which held focus) is unmounted immediately.
  const addBeneficiaryButtonRefs = useRef<
    Record<string, HTMLButtonElement | null>
  >({});

  // Local form for beneficiary modal fields (same pattern as DynamicList)
  const {
    control: modalControl,
    handleSubmit: handleModalSubmit,
    reset: resetModalForm,
    setValue: setModalValue,
    setError: setModalFieldError,
    watch: watchModal,
    formState: { errors: modalErrors },
  } = useForm<Record<string, string>>({
    defaultValues: Object.fromEntries([...individualFields, ...trustFields].map(field => [field.id, ""])),
  });

  // Track designation and beneficiaryType outside useForm since they're structural selectors, not text fields
  const [modalDesignation, setModalDesignation] =
    useState<BeneficiaryDesignation>("primary");
  const [modalBeneficiaryType, setModalBeneficiaryType] =
    useState<BeneficiaryType>("individual");

  const shareKey = getFieldSurface("beneficiaryIndividual").mapping.fieldToKey["beneficiary-share"];
  const modalShare = watchModal(shareKey);

  // "Apply to other coverages" dialog state
  const [applyToOthersOpen, setApplyToOthersOpen] = useState(false);
  const [applyToOthersError, setApplyToOthersError] = useState<string | null>(null);
  const [applyToOthersItem, setApplyToOthersItem] =
    useState<BeneficiaryItem | null>(null);
  const [applyToOthersSource, setApplyToOthersSource] =
    useState<ProductContext | null>(null);
  const [applyToOthersSelected, setApplyToOthersSelected] = useState<string[]>(
    [],
  );


  function getProductBeneficiaries(productKey: string): BeneficiaryItem[] {
    const items = beneficiariesByProduct[productKey];
    return Array.isArray(items) ? items.filter(item => item && typeof item === "object" && !Array.isArray(item)).map(item => beneficiarySemanticValues(item as unknown as Record<string, unknown>) as unknown as BeneficiaryItem) : [];
  }

  function upsertProductBeneficiaries(
    productKey: string,
    nextItems: BeneficiaryItem[],
  ) {
    setPageValues({
      beneficiaries: {
        ...beneficiariesByProduct,
        [productKey]: nextItems.map(item => beneficiaryStoredValues(item as unknown as Record<string, unknown>)),
      },
    });
  }

  const allApplicantProducts = [...applicantProducts.member, ...applicantProducts.spouse];
  function canApplyBeneficiary(product: ProductContext, item: BeneficiaryItem) {
    return !validateBeneficiaryRecords([...getProductBeneficiaries(product.productKey), item].map(row => beneficiaryStoredValues(row as unknown as Record<string, unknown>)), getFieldSurface("beneficiaryIndividual"), getFieldSurface("beneficiaryTrust"));
  }
  function offerApplyToOthers(source: ProductContext, item: BeneficiaryItem) {
    const targets = allApplicantProducts.filter(product => product.productKey !== source.productKey && canApplyBeneficiary(product, item));
    if (!targets.length) return false;
    setApplyToOthersItem(item);
    setApplyToOthersSource(source);
    setApplyToOthersSelected(targets.map(product => product.productKey));
    setApplyToOthersError(null);
    setApplyToOthersOpen(true);
    return true;
  }

  function openAddModal(product: ProductContext) {
    setActiveProduct(product);
    setEditingId(null);
    resetModalForm(Object.fromEntries([...individualFields, ...trustFields].map(field => [field.id, ""])));
    setModalDesignation("primary");
    setModalBeneficiaryType("individual");
    setModalError(null);
  }

  function openEditModal(product: ProductContext, item: BeneficiaryItem) {
    setActiveProduct(product);
    setEditingId(item.id);
    const surface = getFieldSurface(item.beneficiaryType === "trust" ? "beneficiaryTrust" : "beneficiaryIndividual");
    const stored = item as unknown as Record<string, unknown>;
    resetModalForm(Object.fromEntries(surface.mapping.fields.map(field => {
      const key = surface.mapping.fieldToKey[field.id];
      const role = field.id.replace('beneficiary-', '');
      return [key, String(stored[key] ?? stored[role] ?? '')];
    })));
    setModalDesignation(item.designation);
    setModalBeneficiaryType(item.beneficiaryType);
    setModalError(null);
  }

  function closeModal() {
    setActiveProduct(null);
    setEditingId(null);
    resetModalForm(Object.fromEntries([...individualFields, ...trustFields].map(field => [field.id, ""])));
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
    requestAnimationFrame(() => {
      addBeneficiaryButtonRefs.current[productKey]?.focus();
    });
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
    const maximum = getFieldSurface(modalBeneficiaryType === "trust" ? "beneficiaryTrust" : "beneficiaryIndividual").maxItems!;
    return Math.max(0, maximum - used);
  }

  function getShareRemaining(
    list: BeneficiaryItem[],
    designation: BeneficiaryDesignation,
  ) {
    const assigned = getFilteredListForDesignation(list, designation).reduce((sum, item) => sum + (Number(item.share) || 0), 0);
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
    if (items.length >= maxBeneficiaries) return true;
    if (items.some((item) => item.beneficiaryType === "trust")) return true;
    const totalShare = items.reduce((sum, item) => sum + (Number(item.share) || 0), 0);
    return totalShare >= 100;
  }

  function isProductFullyMaxed(productKey: string) {
    const list = getProductBeneficiaries(productKey);
    return (
      isDesignationMaxed(list, "primary") &&
      isDesignationMaxed(list, "contingent")
    );
  }

  function saveBeneficiary(boundData: Record<string, string>) {
    const formData = surfaceSemanticValues(modalBeneficiaryType === "individual" ? "beneficiaryIndividual" : "beneficiaryTrust", boundData) as Record<string, string>;
    if (!activeProduct) return;
    if (!allApplicantProducts.some(product => product.productKey === activeProduct.productKey)) { setModalError(requirementText("beneficiary.error.coverage-unavailable")); return; }

    const currentList = getProductBeneficiaries(activeProduct.productKey);
    const remainingSlots = getDesignationRemaining(
      currentList,
      modalDesignation,
    );

    if (remainingSlots <= 0) {
      setModalError(requirementText("beneficiary.error.maximum", { maximum: String(getFieldSurface(modalBeneficiaryType === "trust" ? "beneficiaryTrust" : "beneficiaryIndividual").maxItems), designation: getDesignationLabel(modalDesignation) }));
      return;
    }

    const parsedShare =
      modalBeneficiaryType === "individual" ? Number(formData.share) : 0;

    if (modalBeneficiaryType === "individual") {
      if (!Number.isFinite(parsedShare) || parsedShare <= 0) {
        const message = requirementText("beneficiary.error.share-positive");
        setModalError(message);
        setModalFieldError(shareKey, { type: "manual", message });
        return;
      }

      const unassignedShare = getShareRemaining(currentList, modalDesignation);
      if (parsedShare > unassignedShare) {
        const message = requirementText("beneficiary.error.share-exceeds", { remaining: String(unassignedShare) });
        setModalError(message);
        setModalFieldError(shareKey, { type: "manual", message });
        return;
      }
    }

    const previousItem = currentList.find(item => item.id === editingId);
    const nextItem: BeneficiaryItem = {
      ...(previousItem ?? {}),
      ...Object.fromEntries((modalBeneficiaryType === "individual" ? individualFields : trustFields).map(field => [field.id, boundData[field.id] ?? ""])),
      id: editingId ?? crypto.randomUUID(),
      designation: modalDesignation,
      beneficiaryType: modalBeneficiaryType,
      firstName: (formData.firstName ?? previousItem?.firstName ?? "").trim(),
      lastName: (formData.lastName ?? previousItem?.lastName ?? "").trim(),
      relationship: formData.relationship ?? previousItem?.relationship ?? "",
      trustName: (formData.trustName ?? previousItem?.trustName ?? "").trim(),
      trustDate: formData.trustDate ?? previousItem?.trustDate ?? "",
      share: parsedShare,
    };

    const nextList = editingId
      ? currentList.map((item) => (item.id === editingId ? nextItem : item))
      : [...currentList, nextItem];

    const invalid = validateBeneficiaryRecords(nextList.map(item => beneficiaryStoredValues(item as unknown as Record<string, unknown>)), getFieldSurface("beneficiaryIndividual"), getFieldSurface("beneficiaryTrust"));
    if (invalid) { setModalError(invalid); return; }
    upsertProductBeneficiaries(activeProduct.productKey, nextList);

    if (!editingId) offerApplyToOthers(activeProduct, nextItem);
    closeModal();
  }

  function applyBeneficiaryToSelected() {
    if (!applyToOthersItem || !applyToOthersSource) return;
    if (!applyToOthersSelected.length) {
      setApplyToOthersError(requirementText("beneficiary.apply.error-empty"));
      return;
    }

    const nextBeneficiaries = { ...beneficiariesByProduct };

    for (const productKey of applyToOthersSelected) {
      if (!allApplicantProducts.some(product => product.productKey === productKey) || productKey === applyToOthersSource.productKey) { setApplyToOthersError(requirementText("beneficiary.error.coverage-unavailable")); return; }
      const invalid = validateBeneficiaryRecords([...(Array.isArray(nextBeneficiaries[productKey]) ? nextBeneficiaries[productKey] : []), beneficiaryStoredValues(applyToOthersItem as unknown as Record<string, unknown>)], getFieldSurface("beneficiaryIndividual"), getFieldSurface("beneficiaryTrust"));
      if (invalid) { setApplyToOthersError(invalid); return; }
    }

    for (const productKey of applyToOthersSelected) {
      const existing = Array.isArray(nextBeneficiaries[productKey])
        ? (nextBeneficiaries[productKey] as BeneficiaryItem[])
        : [];
      // Add a copy with a new unique ID
      nextBeneficiaries[productKey] = [
        ...existing,
        beneficiaryStoredValues({ ...applyToOthersItem, id: crypto.randomUUID() }) as unknown as BeneficiaryItem,
      ];
    }

    setPageValues({ beneficiaries: nextBeneficiaries });
    setApplyToOthersOpen(false);
    setApplyToOthersItem(null);
    setApplyToOthersSource(null);
    setApplyToOthersSelected([]);
    setApplyToOthersError(null);
  }

  function closeApplyToOthers() {
    setApplyToOthersOpen(false);
    setApplyToOthersItem(null);
    setApplyToOthersSource(null);
    setApplyToOthersSelected([]);
    setApplyToOthersError(null);
  }

  function renderProductCard(product: ProductContext) {
    const library = getPrototypeLibrary();
    return <BeneficiaryProductRecords key={product.productKey} productName={product.coverageName}
      items={getProductBeneficiaries(product.productKey)}
      relationshipOptions={getSurfaceField("beneficiaryIndividual", "beneficiary-relationship")?.options}
      note={library ? beneficiaryDesignationNote(library.site, product.coverageId, product.applicantId) ?? undefined : undefined}
      quickDecision={coverages.some(coverage => coverage.id === product.coverageId && applicationUnderwriting(coverage, product.applicantId, values).underwritingType === "QD")}
      capacityMessage={isProductFullyMaxed(product.productKey) ? content.beneficiary.noMoreOnlineMessage : undefined}
      onEdit={item => openEditModal(product, item)} onRemove={id => removeBeneficiary(product.productKey, id)} onAdd={() => openAddModal(product)}
      onApply={allApplicantProducts.some(target => target.productKey !== product.productKey) ? item => offerApplyToOthers(product, item) : undefined}
      canApply={item => allApplicantProducts.some(target => target.productKey !== product.productKey && canApplyBeneficiary(target, item))}
      addButtonRef={element => { addBeneficiaryButtonRefs.current[product.productKey] = element; }} />;
  }

  function renderApplicantSection(applicant: "member" | "spouse") {
    const products = applicantProducts[applicant];
    if (!products.length) return null;

    const orderedCategories = orderCoveragePresentation(selectedCoverages, getActiveClient().coverages, activeFeaturedProduct(resolveSiteId()), activeFirstCoverageCategory(resolveSiteId())).categories;
    const groupedByCategory = orderedCategories.map(id => getCoverageCategories().find(category => category.id === id)!)
      .filter((category) => products.some(product => coverages.some(coverage => coverage.id === product.coverageId && coverage.categoryId === category.id)))
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
    remainingShare - (modalBeneficiaryType === "individual" ? currentShareValue : 0),
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
      runtimeFields={() =>
        pageRequirement === "optional" ? getSurfaceFields("beneficiaryControls").filter(field => field.id === BENEFICIARY_INFO_OPT_IN_FIELD_ID) : []
      }
      validate={(nextValues) =>
        getBeneficiaryPageError(
          pageRequirement,
          nextValues as Record<string, unknown>,
          applicableProductKeys,
        )
      }
      help={<PageHelp items={pageHelpItems("beneficiary")} />}
    >
      {({ control, errors, watchedValues, pageSections }) => {
        const showBeneficiaryQuestions = shouldShowBeneficiaryQuestions(
          pageRequirement,
          watchedValues as Record<string, unknown>,
        );

        return (
          <>
            {!hasAnyApplicantProducts && showBeneficiaryQuestions && <Alert severity="info">{content.beneficiary.noApplicantProductsMessage}</Alert>}
            <Stack spacing={2.5}>{pageSections.filter(section => isSectionVisible(section, watchedValues)).map(section => {
              if (section.components?.includes("FieldGroup")) return pageRequirement === "optional" ? <Box key={section.id}>
                <FieldRenderer field={getSurfaceField("beneficiaryControls", BENEFICIARY_INFO_OPT_IN_FIELD_ID)!} control={control} errors={errors} />
                {showBeneficiaryQuestions && <Divider sx={{ my: 2 }} />}
              </Box> : null;
              if (section.components?.includes("BeneficiaryProductRecords") && showBeneficiaryQuestions) return <Box key={section.id}>{renderApplicantSection(section.applicant === "spouse" ? "spouse" : "member")}</Box>;
              return null;
            })}</Stack>

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
                  label: requirementText("beneficiary.dialog.save"),
                  onClick: () => {
                    const formEl = document.getElementById(
                      "beneficiary-modal-form",
                    ) as HTMLFormElement | null;
                    formEl?.requestSubmit();
                  },
                  variant: "contained",
                },
                {
                  label: requirementText("beneficiary.dialog.cancel"),
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
                <FieldGrid sx={{ pt: 0.5 }}>
                  <Box>
                    <Tabs
                      value={modalDesignation}
                      onChange={(_, value: BeneficiaryDesignation) =>
                        setModalDesignation(value)
                      }
                    >
                      <Tab label={requirementText("beneficiary.designation.primary")} value="primary" />
                      <Tab label={requirementText("beneficiary.designation.contingent")} value="contingent" />
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
                      {getDesignationLabel(modalDesignation)} {requirementText("beneficiary.designation.remaining")}</Typography>
                  </Box>

                  {remainingDesignationSlots === 0 && !editingId && (
                    <Alert severity="warning">
                      {requirementText("beneficiary.error.designation-full", { designation: getDesignationLabel(modalDesignation) })}</Alert>
                  )}

                  <ControlledFieldRenderer
                    field={{ ...getSurfaceField("beneficiaryControls", "beneficiaryType")!, disabled: remainingDesignationSlots === 0 && !editingId }}
                    value={modalBeneficiaryType}
                    onChange={value => setModalBeneficiaryType(value as BeneficiaryType)}
                  />

                  {modalBeneficiaryType === "individual" &&
                    individualBlocked && (
                      <Alert severity="warning">
                        {designationHasTrust
                          ? requirementText("beneficiary.error.trust-exists", { designation: getDesignationLabel(modalDesignation) })
                          : requirementText("beneficiary.error.no-unassigned-share")}
                      </Alert>
                    )}

                  {modalBeneficiaryType === "trust" && trustBlocked && (
                    <Alert severity="warning">
                      {designationHasTrust
                        ? requirementText("beneficiary.error.one-trust", { designation: getDesignationLabel(modalDesignation) })
                        : requirementText("beneficiary.error.individual-exists", { designation: getDesignationLabel(modalDesignation) })}
                    </Alert>
                  )}

                  {modalBeneficiaryType === "individual" ? (
                    <>
                      {individualFields.map((field, index) => {
                        const render = (f: typeof field) => <FieldRenderer key={f.id} field={{ ...f, disabled: (remainingDesignationSlots === 0 || individualBlocked) && !editingId }} control={modalControl as unknown as Control<Record<string, string | boolean | string[]>>} errors={modalErrors as FieldErrors<Record<string, string | boolean | string[]>>} />;
                        const gridIds = getFieldSurface("beneficiaryIndividual").mapping.gridFields;
                        const storedId = getFieldSurface("beneficiaryIndividual").mapping.fields[index].id;
                        const inGrid = gridIds.includes(storedId);
                        const previous = getFieldSurface("beneficiaryIndividual").mapping.fields[index - 1];
                        let consecutive = 0;
                        for (let cursor = index - 1; cursor >= 0 && gridIds.includes(getFieldSurface("beneficiaryIndividual").mapping.fields[cursor].id); cursor--) consecutive++;
                        if (inGrid && previous && gridIds.includes(previous.id) && consecutive % 2 === 1) return null;
                        const next = getFieldSurface("beneficiaryIndividual").mapping.fields[index + 1];
                        return inGrid ? <FieldGrid key={field.id} columns="equal">{render(field)}{next && gridIds.includes(next.id) && render(individualFields[index + 1])}</FieldGrid> : render(field);
                      })}

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
                              setModalValue(shareKey, String(percent));
                            }}
                          >
                            {percent}{"%"}</Button>
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
                          {displayRemainingShare}{"%"}</Typography>{" "}
                        {requirementText("beneficiary.share.remaining")}</Typography>
                    </>
                  ) : (
                    <>
                      {trustFields.map((f) => (
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
                </FieldGrid>
              </Box>
            </AppModal>

            <AppModal
              open={applyToOthersOpen}
              onClose={closeApplyToOthers}
              maxWidth={600}
              title={content.dialogs.beneficiary.applyToOthersTitle}
              actions={[
                {
                  label: requirementText("beneficiary.apply.confirm"),
                  onClick: applyBeneficiaryToSelected,
                  variant: "contained",
                },
                {
                  label: requirementText("beneficiary.apply.cancel"),
                  onClick: closeApplyToOthers,
                  variant: "text",
                },
              ]}
            >
              <Stack spacing={2} sx={{ pt: 0.5 }}>
                {applyToOthersError && <Alert severity="error">{applyToOthersError}</Alert>}
                <Typography variant="body2" color="text.secondary">
                  {content.dialogs.beneficiary.applyToOthersPrompt}
                </Typography>
                {(() => {
                  if (!applyToOthersSource) return null;
                  const otherProducts = allApplicantProducts.filter(
                    (p) => p.productKey !== applyToOthersSource.productKey,
                  );
                  return (
                    <Stack spacing={2}>
                      {(["member", "spouse"] as const).map(applicant => {
                        const products = otherProducts.filter(product => product.applicantId === applicant);
                        return products.length ? <ApplicantSectionDivider key={applicant} applicant={applicant === "member" ? "self" : "spouse"} showLabel={shouldShowApplicantLabel(applicant, values)}>
                        <Stack spacing={1}>{products.map((product) => (
                        <Box
                          key={product.productKey}
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1,
                          }}
                        >
                          <ControlledFieldRenderer
                            field={{
                              ...getSurfaceField("beneficiaryCopyControls", "beneficiaryApplyTarget")!,
                              id: `apply-beneficiary-${product.productKey}`,
                              label: product.coverageName,
                              disabled: !!applyToOthersItem && !canApplyBeneficiary(product, applyToOthersItem),
                            }}
                            value={applyToOthersSelected.includes(product.productKey)}
                            onChange={checked => setApplyToOthersSelected(prev => checked ? [...prev, product.productKey] : prev.filter(key => key !== product.productKey))}
                          />
                        </Box>
                      ))}</Stack></ApplicantSectionDivider> : null;
                      })}
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
