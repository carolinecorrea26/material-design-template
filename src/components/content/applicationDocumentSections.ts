import { booleanAnswerLabel } from '../../domain/answerLabels';
import { getResolvedApplicantLabels } from '../../config/formSectionTitle';
import { shouldShowApplicantLabel } from '../../utils/applicantVisibility';
import { getClientPageRequirement } from '../../config/client/getClientPageRequirement';
import { resolvePageParticipation } from '../../config/flowGates';
import { beneficiaryQuestionsEnabled, collectsBeneficiaries } from '../../domain/beneficiaryParticipation';
import { orderCoveragePresentation } from '../../domain/coveragePresentation';
import { getActiveClient } from '../../config/client/getActiveClient';
import { activeFeaturedProduct, activeFirstCoverageCategory } from '../../config/client/coverageProductScope';
import { resolveSiteId } from '../../data/activeSite';
import { applicantParticipatesInPage } from '../../config/flowGates';
import { profileFinancialTotal, profileCalculationApplies } from '../../domain/profileFinancialCalculations';
import { requirementText } from "../../domain/requirementContent";
import { getContent } from "../../content";
import { getPageSections } from '../../config/pageSections';
import { getClientPageFields } from '../../config/clientFields/getClientPageFields';
import { getPrototypeLibrary } from '../../domain/prototypeLibrary';
import { financialQuestionnaireForApplication } from '../../domain/financialQuestionnaire';
import { buildSelectedCoverageEntries } from '../../utils/coverageDecisions';
import { reconcileApplicationRiders } from '../../domain/applicationRiders';
import { getActiveClientCoverages } from "../../config/client/getActiveClientCoverages";
import { fieldCatalog } from "../../config/fields";
import type { FieldDefinition, FieldId } from "../../config/fields/types";
import {
  sectionLabels,
} from "../../config/pageSections/pageSections";
import { isSectionVisible } from "../../app/RoutePage";
import type { ApplicationFormValues } from "../../app/ApplicationFormContext";
import type { PageId } from "../../types";

type DisplayEntry = {
  label: string;
  value: string;
  fieldId?: string;
};

type DisplayGroup = {
  title?: string;
  coverageKey?: string;
  entries: DisplayEntry[];
};

type DisplaySection = {
  title: string;
  groups: DisplayGroup[];
};

type BeneficiaryItem = {
  designation: "primary" | "contingent";
  beneficiaryType: "individual" | "trust";
  firstName: string;
  lastName: string;
  relationship: string;
  trustName: string;
  share: number;
};

const PLACEHOLDER = "\u2014";

function documentPageTitle(pageId: PageId) {
  const page = getContent().pages[pageId];
  if (!page) throw new Error(`Missing document page content: ${pageId}`);
  return page.navTitle ?? page.title;
}

export function getDocumentPages(): Array<{ pageId: PageId; title: string }> {
  const library = getPrototypeLibrary();
  const ids = library?.pages.find(page => page.key === 'review')?.definition.previewPageIds;
  if (!ids) throw new Error('Missing fresh-start Review preview page definitions');
  return library!.pages.filter(page => page.enabled && ids.includes(page.definition.id)).map(page => ({ pageId: page.definition.id, title: documentPageTitle(page.definition.id) }));
}

function formatLabel(value: string) {
  return value
    .replace(/[-_]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (match) => match.toUpperCase());
}

function formatDate(value: string) {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return value;
  return `${match[2]}/${match[3]}/${match[1]}`;
}

function formatCurrency(value: string) {
  const digits = value.replace(/[^\d.-]/g, "");
  if (!digits) return value;

  const parsed = Number(digits);
  if (!Number.isFinite(parsed)) return value;

  return parsed.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

function resolveOptionLabel(field: FieldDefinition | undefined, value: string) {
  return (
    field?.options?.find((option) => option.value === value)?.label ?? value
  );
}

function toTitleCase(value: string) {
  return value
    .toLowerCase()
    .replace(/\b([a-z])/g, (letter) => letter.toUpperCase());
}

function normalizeDisplayCasing(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return trimmed;

  // Preserve emails, links, ids, and already-cased strings.
  if (
    trimmed.includes("@") ||
    /https?:\/\//i.test(trimmed) ||
    trimmed.includes("www.")
  ) {
    return trimmed;
  }

  if (!/[a-z]/.test(trimmed) || /[A-Z]/.test(trimmed)) {
    return trimmed;
  }

  return toTitleCase(trimmed);
}

function hasFilledValue(rawValue: unknown) {
  if (rawValue == null) return false;
  if (typeof rawValue === "string") return rawValue.trim().length > 0;
  if (Array.isArray(rawValue)) return rawValue.length > 0;
  return true;
}

function formatFieldValue(fieldId: string, rawValue: unknown) {
  if (rawValue == null || rawValue === "") {
    return PLACEHOLDER;
  }

  const field = fieldCatalog[fieldId as keyof typeof fieldCatalog];

  if (typeof rawValue === "boolean") {
    return field?.options?.find(option => option.value === (rawValue ? 'yes' : 'no'))?.label ?? booleanAnswerLabel(rawValue);
  }

  if (Array.isArray(rawValue)) {
    if (rawValue.length === 0) {
      return PLACEHOLDER;
    }

    return rawValue
      .map((entry) =>
        normalizeDisplayCasing(resolveOptionLabel(field, String(entry))),
      )
      .join(", ");
  }

  if (typeof rawValue === "number") {
    return String(rawValue);
  }

  if (typeof rawValue === "string") {
    if (field?.format === 'ssn') {
      const digits = rawValue.replace(/\D/g, '');
      return `***-**-${digits.length === 9 ? digits.slice(-4) : '****'}`;
    }
    if (field?.inputType === "date") {
      return formatDate(rawValue);
    }

    if (field?.format === "currency") {
      return formatCurrency(rawValue);
    }

    return normalizeDisplayCasing(resolveOptionLabel(field, rawValue));
  }

  return String(rawValue);
}

/** Returns a group key if this field should be merged into a combined Name entry, null otherwise. */
function getNameGroupKey(fieldId: string): string | null {
  if (
    fieldId === "title" ||
    fieldId === "first-name" ||
    fieldId === "last-name"
  )
    return "name";
  if (fieldId === "spouse-first-name" || fieldId === "spouse-last-name")
    return "spouse-name";
  if (fieldId === "child-first-name" || fieldId === "child-last-name")
    return "child-name";
  if (fieldId === "physician-first-name" || fieldId === "physician-last-name")
    return "physician-name";
  if (
    fieldId === "ama-physician-first-name" ||
    fieldId === "ama-physician-last-name" ||
    fieldId === "ama-physician-title"
  )
    return "ama-physician-name";
  return null;
}

/** Returns all field IDs that belong to the same name group. */
function getNameGroupFieldIds(groupKey: string): string[] {
  switch (groupKey) {
    case "name":
      return ["title", "first-name", "last-name"];
    case "spouse-name":
      return ["spouse-first-name", "spouse-last-name"];
    case "child-name":
      return ["child-first-name", "child-last-name"];
    case "physician-name":
      return ["physician-first-name", "physician-last-name"];
    case "ama-physician-name":
      return [
        "ama-physician-title",
        "ama-physician-first-name",
        "ama-physician-last-name",
      ];
    default:
      return [];
  }
}

function buildNameValue(
  groupKey: string,
  values: ApplicationFormValues,
): string {
  const fieldIds = getNameGroupFieldIds(groupKey);
  const parts = fieldIds
    .map((id) => {
      const raw = values[id];
      if (!raw) return "";
      const field = fieldCatalog[id as keyof typeof fieldCatalog];
      return resolveOptionLabel(field, String(raw)).trim();
    })
    .filter(Boolean);
  return parts.join(" ") || PLACEHOLDER;
}

function getApplicantLabel(applicant: string) {
  if (applicant === "member") return getResolvedApplicantLabels(getActiveClient().applicantLabels).member;
  if (applicant === "spouse") return getResolvedApplicantLabels(getActiveClient().applicantLabels).spouse;
  if (applicant === "child") return getResolvedApplicantLabels(getActiveClient().applicantLabels).child;
  return formatLabel(applicant);
}

function resolveProfileGroupTitle(sectionId: string) {
  if (sectionId.includes("Physician")) {
    return requirementText("application.document-preview.physician");
  }

  if (sectionId.includes("Financial")) {
    return sectionLabels.financialInfo;
  }

  if (sectionId.includes("DriversLicense")) {
    return requirementText("application.document-preview.drivers-license");
  }

  if (sectionId.includes("TravelOutsideUs")) {
    return requirementText("application.document-preview.outside-us-travel");
  }

  if (sectionId.includes("OutsideUs")) {
    return requirementText("application.document-preview.outside-us-residence");
  }

  if (sectionId.includes("Personal")) {
    return sectionLabels.personalInfo;
  }

  return undefined;
}

function resolveSectionGroupTitle(
  pageId: PageId,
  section: {
    id: string;
    title?: string;
    description?: string;
  },
) {
  if (section.title) {
    return section.title;
  }

  if (section.description) {
    return section.description;
  }

  if (pageId === "profile") {
    return resolveProfileGroupTitle(section.id);
  }

  return undefined;
}

const previewLabelOverrides: Record<string, string> = {
  "outside-us-country": requirementText("application.document-preview.country-residence"),
  "travel-outside-us-country": requirementText("application.document-preview.country-travel"),
  "spouse-outside-us-country": requirementText("application.document-preview.spouse-country-residence"),
  "spouse-travel-outside-us-country": requirementText("application.document-preview.spouse-country-travel"),
};

function dedupeAndFormatLabels(entries: DisplayEntry[]) {
  const labelCounts = new Map<string, number>();
  for (const entry of entries) {
    labelCounts.set(entry.label, (labelCounts.get(entry.label) ?? 0) + 1);
  }

  const usedLabels = new Map<string, number>();

  return entries.map((entry) => {
    let label = entry.label;
    const isDuplicated = (labelCounts.get(entry.label) ?? 0) > 1;

    if (isDuplicated && entry.fieldId) {
      label =
        previewLabelOverrides[entry.fieldId] ?? formatLabel(entry.fieldId);
    }

    const nextUse = (usedLabels.get(label) ?? 0) + 1;
    usedLabels.set(label, nextUse);
    if (nextUse > 1) {
      label = `${label} (${nextUse})`;
    }

    return {
      ...entry,
      label,
    };
  });
}

function formatCoverageAmount(value: unknown) {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
    return null;
  }

  return value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

function getRecordValue<T>(
  value: unknown,
  validator: (candidate: unknown) => candidate is T,
) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {} as Record<string, T>;
  }

  const source = value as Record<string, unknown>;
  const out: Record<string, T> = {};

  for (const [key, candidate] of Object.entries(source)) {
    if (validator(candidate)) {
      out[key] = candidate;
    }
  }

  return out;
}

function isNonNullable<T>(value: T | null | undefined): value is T {
  return value != null;
}

function buildSectionEntries(values: ApplicationFormValues, pageId: PageId) {
  const sections = getPageSections(pageId);
  const fields = getClientPageFields(pageId, values);
  const visibleIds = new Set(fields.map(field => field.id));
  const library = getPrototypeLibrary();
  const selections = buildSelectedCoverageEntries(values, getActiveClientCoverages());
  const riders = reconcileApplicationRiders(getActiveClientCoverages(), values).coverageRiders;
  const childApplied = selections.some(entry => entry.applicant === 'child' || entry.coverage.riders?.some(rider => rider.dependentApplicant === 'child' && riders[`${entry.coverageId}:${rider.id}:${entry.applicant}`]));
  const groups = sections
    .filter(section => isSectionVisible(section, values) && (pageId !== 'profile' || !section.applicant || applicantParticipatesInPage('profile', section.applicant, values)) && (section.applicant !== 'child' || childApplied) && (section.id !== 'profileFinancialQuestionnaireSelf' || financialQuestionnaireForApplication(library?.site.configuration, selections, values)))
    .flatMap((section) => {
      const collections = Object.values(library?.fieldCollections ?? {}).filter(collection => collection.pageKey === pageId && collection.sectionId === section.id);
      const collectionGroups = collections.flatMap(collection => {
        if (collection.libraryGroup?.afterFieldKey && (!visibleIds.has(collection.libraryGroup.afterFieldKey) || pageId === 'profile' && values[collection.libraryGroup.afterFieldKey] !== 'yes')) return [];
        const items = values[collection.name];
        return Array.isArray(items) ? items.flatMap((item, index) => {
          if (!item || typeof item !== 'object') return [];
          const entries = collection.mapping.fields.flatMap(field => {
            const value = (item as Record<string, unknown>)[collection.mapping.fieldToKey[field.id]];
            return hasFilledValue(value) ? [{ label: field.label, value: formatFieldValue(field.id, value), fieldId: field.id }] : [];
          });
          return entries.length ? [{ title: `${collection.label} ${index + 1}`, entries }] : [];
        }) : [];
      });
      const processed = new Set<string>();
      const entries: DisplayEntry[] = [];

      for (const fieldId of section.fieldIds) {
        if (processed.has(fieldId)) {
          continue;
        }

        if (!visibleIds.has(fieldId)) continue;
        const rawValue = values[fieldId];
        const groupKey = getNameGroupKey(fieldId);
        if (groupKey) {
          // Only emit the combined entry once — when we hit the first field in the group
          const groupFieldIds = getNameGroupFieldIds(groupKey);
          const isFirstInGroup =
            groupFieldIds[0] === fieldId ||
            !groupFieldIds
              .slice(0, groupFieldIds.indexOf(fieldId))
              .some((id) => visibleIds.has(id) && section.fieldIds.includes(id as FieldId));

          if (isFirstInGroup) {
            const nameValue = buildNameValue(groupKey, values);
            if (nameValue !== PLACEHOLDER) {
              entries.push({
                label: requirementText("application.document-preview.name"),
                value: nameValue,
                fieldId,
              });
            }
          }

          // Mark all group fields as processed
          for (const id of groupFieldIds) {
            processed.add(id);
          }
          continue;
        }

        if (!hasFilledValue(rawValue)) {
          processed.add(fieldId);
          continue;
        }

        const field = fields.find(field => field.id === fieldId);
        const value = formatFieldValue(fieldId, rawValue);
        if (value === PLACEHOLDER) {
          processed.add(fieldId);
          continue;
        }

        entries.push({
          label: field?.label ?? formatLabel(fieldId),
          value,
          fieldId,
        });
        processed.add(fieldId);
      }

      if (pageId === 'profile' && section.id === 'profileFinancialQuestionnaireSelf' && values['is-self-employed'] === 'yes') {
        const policy = library?.client.applicantExperience?.profile?.financialCalculations;
        if (!policy) throw new Error('Missing fresh-start Profile financial calculations');
        for (const calculation of policy.calculations) {
          if (profileCalculationApplies(calculation, values)) entries.push({ label: requirementText(calculation.label), value: new Intl.NumberFormat('en-US', { style: 'currency', currency: policy.currency }).format(profileFinancialTotal(policy, calculation.id, values)), fieldId: calculation.id });
        }
      }
      const sectionEntries = dedupeAndFormatLabels(entries);
      return [...(sectionEntries.length ? [{ title: resolveSectionGroupTitle(pageId, section), entries: sectionEntries } satisfies DisplayGroup] : []), ...collectionGroups];
    })
    .filter(isNonNullable);

  return groups;
}

function buildCoverageSection(values: ApplicationFormValues): DisplaySection {
  const coverages = getActiveClientCoverages();
  const activeEntries = buildSelectedCoverageEntries(values, coverages);
  const selectedIds = orderCoveragePresentation(coverages.filter(coverage => activeEntries.some(entry => entry.coverageId === coverage.id)), getActiveClient().coverages, activeFeaturedProduct(resolveSiteId()), activeFirstCoverageCategory(resolveSiteId())).products.map(product => product.id);

  const coverageAmounts = getRecordValue<number>(
    values.coverageAmounts,
    (candidate): candidate is number =>
      typeof candidate === "number" && Number.isFinite(candidate),
  );

  const coverageRiders = reconcileApplicationRiders(coverages, values).coverageRiders;

  const coverageRiderAmounts = getRecordValue<number>(
    values.coverageRiderAmounts,
    (candidate): candidate is number =>
      typeof candidate === "number" && Number.isFinite(candidate),
  );

  const coverageWaitingPeriods = getRecordValue<string>(
    values.coverageWaitingPeriods,
    (candidate): candidate is string => typeof candidate === "string",
  );

  const coverageMaxBenefitPeriods = getRecordValue<string>(
    values.coverageMaxBenefitPeriods,
    (candidate): candidate is string => typeof candidate === "string",
  );

  const coverageById = new Map(
    coverages.map((coverage) => [coverage.id, coverage]),
  );

  const groups = selectedIds
    .flatMap((coverageId) => {
      const coverage = coverageById.get(coverageId);
      if (!coverage) return [];

      const visibleApplicants = activeEntries.filter(entry => entry.coverageId === coverageId).map(entry => entry.applicant);

      return visibleApplicants.map(applicant => {
        const entries: DisplayEntry[] = [];
        const amount = formatCoverageAmount(
          coverageAmounts[`${coverage.id}:${applicant}`],
        );

        if (amount) {
          entries.push({
            label: requirementText("application.document-preview.amount"),
            value: amount,
          });
        }

        const selectedRiders = (coverage.riders ?? [])
          .filter(
            (rider) =>
              coverageRiders[`${coverage.id}:${rider.id}:${applicant}`],
          )
          .map((rider) => {
            const label = rider.dependentApplicant ? `${rider.dependentApplicant === "spouse" ? getResolvedApplicantLabels(getActiveClient().applicantLabels).spouse : getResolvedApplicantLabels(getActiveClient().applicantLabels).child}: ${rider.name}` : rider.name;
            if (!rider.hasAmount) return label;
            const riderAmount = formatCoverageAmount(
              coverageRiderAmounts[`${coverage.id}:${rider.id}:${applicant}`],
            );
            return riderAmount ? `${label} (${riderAmount})` : label;
          });

        if (selectedRiders.length > 0) {
          entries.push({
            label: requirementText("application.document-preview.riders"),
            value: selectedRiders.join(", "),
          });
        }

        const applicantWaitingPeriods =
          coverage.waitingPeriodOptionsByApplicant?.[applicant];
        if (applicantWaitingPeriods?.length) {
          const selectedValue =
            coverageWaitingPeriods[`${coverage.id}:${applicant}`] ??
            applicantWaitingPeriods[0].value;
          const selectedLabel =
            applicantWaitingPeriods.find(
              (option) => option.value === selectedValue,
            )?.label ?? selectedValue;
          entries.push({
            label: requirementText("application.document-preview.waiting-period"),
            value: selectedLabel,
          });
        }

        const applicantBenefitPeriods =
          coverage.maxBenefitPeriodOptionsByApplicant?.[applicant];
        if (applicantBenefitPeriods?.length) {
          const selectedValue =
            coverageMaxBenefitPeriods[`${coverage.id}:${applicant}`] ??
            applicantBenefitPeriods[0].value;
          const selectedLabel =
            applicantBenefitPeriods.find(
              (option) => option.value === selectedValue,
            )?.label ?? selectedValue;
          entries.push({
            label: requirementText("application.document-preview.benefit-option"),
            value: selectedLabel,
          });
        }
      if (
        coverage.waitingPeriodOptions &&
        coverage.waitingPeriodOptions.length > 0
      ) {
        const selectedWaitingPeriod =
          coverageWaitingPeriods[coverage.id] ??
          coverage.waitingPeriodOptions[0].value;
        const waitingPeriodLabel =
          coverage.waitingPeriodOptions.find(
            (option) => option.value === selectedWaitingPeriod,
          )?.label ?? selectedWaitingPeriod;
        if (waitingPeriodLabel) {
          entries.push({
            label: requirementText("application.document-preview.waiting-period"),
            value: waitingPeriodLabel,
          });
        }
      }

      if (
        coverage.maxBenefitPeriodOptions &&
        coverage.maxBenefitPeriodOptions.length > 0
      ) {
        const selectedMaxBenefitPeriod =
          coverageMaxBenefitPeriods[coverage.id] ??
          coverage.maxBenefitPeriodOptions[0].value;
        const maxBenefitPeriodLabel =
          coverage.maxBenefitPeriodOptions.find(
            (option) => option.value === selectedMaxBenefitPeriod,
          )?.label ?? selectedMaxBenefitPeriod;
        if (maxBenefitPeriodLabel) {
          entries.push({
            label: requirementText("application.document-preview.max-benefit-period"),
            value: maxBenefitPeriodLabel,
          });
        }
      }

      if (entries.length === 0) {
        entries.push({
          label: requirementText("application.document-preview.selected"),
          value: booleanAnswerLabel(true),
        });
      }

      return {
        title: shouldShowApplicantLabel(applicant, values, coverages) ? `${coverage.name} - ${getApplicantLabel(applicant)}` : coverage.name,
        coverageKey: `${coverage.id}:${applicant}`,
        entries,
      } satisfies DisplayGroup;
      });
    })
    .filter(isNonNullable);

  return {
    title: documentPageTitle('coverage'),
    groups,
  };
}

function buildBeneficiariesSection(
  values: ApplicationFormValues,
): DisplaySection {
  const coverages = getActiveClientCoverages();
  const beneficiaries =
    values.beneficiaries &&
    typeof values.beneficiaries === "object" &&
    !Array.isArray(values.beneficiaries)
      ? (values.beneficiaries as Record<string, BeneficiaryItem[]>)
      : {};

  if (!beneficiaryQuestionsEnabled(getClientPageRequirement('beneficiary'), values)) return { title: documentPageTitle('beneficiary'), groups: [] };
  const applicable = new Set(buildSelectedCoverageEntries(values, coverages).filter(entry =>
    Number((values.coverageAmounts as Record<string, unknown> | undefined)?.[`${entry.coverageId}:${entry.applicant}`] ?? 0) > 0 &&
    collectsBeneficiaries(getPrototypeLibrary()?.site, entry.coverageId, entry.coverage.categoryId, entry.applicant, typeof values.membership === 'string' ? values.membership : undefined)
  ).map(entry => `${entry.coverageId}:${entry.applicant}`));
  const order = orderCoveragePresentation(coverages, getActiveClient().coverages, activeFeaturedProduct(resolveSiteId()), activeFirstCoverageCategory(resolveSiteId())).products.map(product => product.id);
  const entries = Object.entries(beneficiaries).filter(([key]) => applicable.has(key)).sort(([a], [b]) => order.indexOf(a.split(':')[0]) - order.indexOf(b.split(':')[0]) || Number(a.endsWith(':spouse')) - Number(b.endsWith(':spouse'))).map(([productKey, items]) => {
    const [coverageId, applicant] = productKey.split(":");
    const coverage = coverages.find((item) => item.id === coverageId);
    const label = coverage
      ? `${coverage.name} - ${getApplicantLabel(applicant)}`
      : productKey;

    const value =
      Array.isArray(items) && items.length > 0
        ? items
            .map((item) => {
              const name =
                item.beneficiaryType === "trust"
                  ? item.trustName
                  : `${item.firstName} ${item.lastName}`.trim();
              const relationship =
                item.beneficiaryType === "trust"
                  ? requirementText("application.document-preview.trust")
                  : item.relationship || requirementText("application.document-preview.relationship-missing");

              return `${formatLabel(item.designation)}: ${name || PLACEHOLDER} (${relationship}, ${item.share}%)`;
            })
            .join("; ")
        : PLACEHOLDER;

    return { label, value };
  });

  return {
    title: documentPageTitle('beneficiary'),
    groups: entries.filter(entry => entry.value !== PLACEHOLDER).length ? [{ entries: entries.filter(entry => entry.value !== PLACEHOLDER) }] : [],
  };
}

export function buildDocumentSections(values: ApplicationFormValues) {
  return getDocumentPages()
    .filter(entry => resolvePageParticipation(entry.pageId, values))
    .map((entry) => {
      if (entry.pageId === "coverage") {
        return buildCoverageSection(values);
      }

      if (entry.pageId === "beneficiary") {
        return buildBeneficiariesSection(values);
      }

      return {
        title: entry.title,
        groups: buildSectionEntries(values, entry.pageId),
      } satisfies DisplaySection;
    })
    .filter((section) => section.groups.length > 0);
}
