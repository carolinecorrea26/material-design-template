import { getPrototypeLibrary } from "../domain/prototypeLibrary";
import { configuredHealthQuestionnaire } from "../domain/configuredHealthQuestionnaire";
import { attachPageAnalytics, emitPageAnalytics } from "../analytics/runtime";
import { getAnalyticsInventory } from "../analytics/inventory";
import { resolveSiteId } from "../data/activeSite";
import { getFormTemplate } from "../config/template/resolveTemplate";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Alert, Box } from "@mui/material";
import { useForm, type FieldErrors } from "react-hook-form";
import { useNavigate, useLocation } from "react-router-dom";
import type { PageId } from "../types";
import { getClientPageFields } from "../config/clientFields/getClientPageFields";
import {
  getResolvedFormFlow,
  getNextFormPageId,
  getPreviousFormPageId,
} from "../config/formFlow";
import { getPagePath, getPageInfoNote, getPageSubhead, getPageTitle } from "../config/pages";
import { getPageSections } from "../config/pageSections";
import type { PageSectionConfig } from "../config/pageSections/types";
import { resolveVisibilityCondition } from "../config/conditions";
import type { FieldDefinition } from "../config/fields/types";
import {
  type ApplicationFormValues,
  useApplicationForm,
} from "./ApplicationFormContext";
import { isApplicantApplying } from "../utils/applicantVisibility";
import PageShell from "../components/layout/PageShell";
import PageHeader from "../components/layout/PageHeader";
import FormShell from "../components/layout/FormShell";
import PageNav from "../components/navigation/PageNav";
import ProgressStep, {
  Breadcrumbs,
} from "../components/navigation/ProgressStep";
import { getActiveProgressStepIndex } from "../config/progressSteps";
import { generateFormDataUpToPage } from "../dev/utils/generateFormData";
import {
  getForwardMessages,
  BACK_MESSAGE,
  MESSAGE_DURATION,
} from "../config/transitionMessages";
import { sendAutosaveMockEmail } from "../utils/mockEmail";
import { useApplicationSession } from "./ApplicationSessionContext";
import { useSinglePageFlow } from "./SinglePageFlowContext";

import PageTransitionSkeleton from "../components/feedback/PageTransitionSkeleton";
import ProgressSavedSnackbar from "../components/feedback/ProgressSavedSnackbar";
import PageAlert from "../components/feedback/PageAlert";
import { applicationRecovery } from '../content/applicationRecovery';

type FormRouteFieldValue = string | boolean | string[];
type FormRoutePageFormValues = Record<string, FormRouteFieldValue>;

export type FormRoutePageValues = ApplicationFormValues;

export type FormRouteRenderProps = {
  control: ReturnType<typeof useForm<FormRoutePageFormValues>>["control"];
  errors: ReturnType<
    typeof useForm<FormRoutePageFormValues>
  >["formState"]["errors"];
  watchedValues: FormRoutePageValues;
  allFields: ReturnType<typeof getClientPageFields>;
  pageSections: ReturnType<typeof getPageSections>;
  setValue: ReturnType<typeof useForm<FormRoutePageFormValues>>["setValue"];
  trigger: ReturnType<typeof useForm<FormRoutePageFormValues>>["trigger"];
};

export type BeforeNextContext = {
  values: FormRoutePageValues;
  continueNavigation: () => void;
};

type DevFillContext = {
  currentValues: FormRoutePageValues;
  currentFields: FieldDefinition[];
  setValue: ReturnType<typeof useForm<FormRoutePageFormValues>>["setValue"];
  setPageValues: ReturnType<typeof useApplicationForm>["setPageValues"];
};

type FormRoutePageProps = {
  pageId: PageId;
  title?: ReactNode;
  subhead?: ReactNode;
  formMaxWidth?: number | string;
  /** Full-width presentation above the padded form body, within the shared surface. */
  formHeader?: ReactNode;
  noTitle?: boolean;
  hideActions?: boolean;
  hideNextButton?: boolean | ((values: FormRoutePageValues) => boolean);
  disableNextButton?: boolean | ((values: FormRoutePageValues) => boolean);
  help?: ReactNode | ((props: FormRouteRenderProps) => ReactNode);
  children: ReactNode | ((props: FormRouteRenderProps) => ReactNode);
  validate?: (values: FormRoutePageValues) => string | undefined;
  defaultValueOverrides?: FormRoutePageFormValues;
  devFillFields?: (currentValues: FormRoutePageValues) => FieldDefinition[];
  /** Explicitly rendered policy fields participate in restoration, validation and dev fill. */
  runtimeFields?: (currentValues: FormRoutePageValues) => FieldDefinition[];
  onDevFill?: (context: DevFillContext) => void;
  onBeforeNext?: (context: BeforeNextContext) => boolean;
  resolveNextPageId?: (values: FormRoutePageValues) => PageId | null;
  initialTransitionMessage?: string;
};

/** Restore configured repeatable records alongside scalar field defaults. */
export function getPageCollectionDefaults(pageId: PageId, values: Record<string, unknown>): FormRoutePageFormValues {
  const library = getPrototypeLibrary();
  const healthCollections = library && ["health-li", "health-di", "health-ci", "health-cir"].includes(pageId)
    ? (["member", "spouse"] as const).flatMap(applicant => configuredHealthQuestionnaire(library.site, pageId, applicant, values).items.filter(item => item.repeated).map(item => item.collection))
    : [];
  const names = new Set([
    ...getPageSections(pageId).flatMap(section => section.collectionName ? [section.collectionName] : []),
    ...Object.values(getPrototypeLibrary()?.fieldCollections ?? {}).filter(collection => collection.pageKey === pageId).map(collection => collection.name),
    ...healthCollections,
  ]);
  return Object.fromEntries([...names].flatMap(name => Array.isArray(values[name]) ? [[name, values[name]]] : [])) as FormRoutePageFormValues;
}

function getDefaultValueForField(field: FieldDefinition): FormRouteFieldValue {
  if (field.defaultValue !== undefined) return field.defaultValue;
  if (field.inputType === "checkbox") {
    return false;
  }

  if (
    field.inputType === "checkbox-group" ||
    field.inputType === "multi-select"
  ) {
    return [];
  }

  return "";
}

function getStoredFieldValue(
  value: ApplicationFormValues[string] | undefined,
): FormRouteFieldValue | undefined {
  if (
    typeof value === "string" ||
    typeof value === "boolean" ||
    (Array.isArray(value) && value.every((entry) => typeof entry === "string"))
  ) {
    return value;
  }

  return undefined;
}

function getMergedPageFields(
  pageId: PageId,
  values: FormRoutePageValues,
  devFillFields?: (currentValues: FormRoutePageValues) => FieldDefinition[],
  runtimeFields?: (currentValues: FormRoutePageValues) => FieldDefinition[],
) {
  return [
    ...getClientPageFields(pageId, values),
    ...(runtimeFields?.(values) ?? []),
    ...(devFillFields?.(values) ?? []).filter(f => { const library = getPrototypeLibrary(); if (!library) return true; const captured = library.site.configuration.pages.find(p => p.key === pageId)?.fields.find(field => field.key === f.id); return captured ? captured.included : f.id.startsWith("payment-method:") || f.id.startsWith("payment-frequency:"); }),
  ].filter(
    (field, index, fields) =>
      fields.findIndex((entry) => entry.id === field.id) === index,
  );
}

export function isSectionVisible(
  section: PageSectionConfig,
  values: FormRoutePageValues,
): boolean {
  const resolvedFlow = getResolvedFormFlow();
  const coverageIndex = resolvedFlow.indexOf("coverage");
  const sectionPageIndex = resolvedFlow.indexOf(section.pageId);
  const useApplicantCoverageGate =
    sectionPageIndex >= coverageIndex && coverageIndex !== -1;

  if (
    useApplicantCoverageGate &&
    section.applicant &&
    !isApplicantApplying(section.applicant, values)
  ) {
    return false;
  }

  return resolveVisibilityCondition(section, values);
}

function getDevValue(field: {
  id: string;
  inputType: string;
  format?: string;
  options?: { value: string }[];
}) {
  if (field.id === "dependents") return [];
  if (field.id.includes("-onset")) return "01/2020";
  if (field.id.startsWith("payment-method:")) return "bill-me";
  if (field.id.startsWith("payment-frequency:")) return "monthly";
  if (field.id === "payment-routing-number") return "021000021";
  if (field.id === "payment-account-number") return "123456789";
  if (field.id === "payment-account-type") return "checking";
  if (field.id === "bank-authorization") return true;
  if (field.format === "currency") return "$5,000";
  if (field.format === "percent") return "50";
  if (field.inputType === "checkbox") return true;
  if (field.inputType === "checkbox-group") {
    return field.options?.[0]?.value ? [field.options[0].value] : [];
  }
  if (field.inputType === "multi-select") {
    return field.options?.[0]?.value ? [field.options[0].value] : [];
  }
  if (
    field.inputType === "radio" ||
    field.inputType === "dropdown" ||
    field.inputType === "searchable-select"
  ) {
    return field.options?.[0]?.value ?? "";
  }
  if (field.inputType === "date") return "1990-01-01";
  if (field.inputType === "number") return "100";
  if (field.format === "ssn") return "123-45-6789";
  if (field.format === "email" || field.id.toLowerCase().includes("email"))
    return "test@example.com";
  if (field.format === "phone" || field.id.toLowerCase().includes("phone"))
    return "(555) 123-4567";
  if (field.id.toLowerCase().includes("zip")) return "10001";
  if (field.id.toLowerCase().includes("state")) return "NY";
  return "Test";
}

function emitProgressSnapshot(values: FormRoutePageValues) {
  window.dispatchEvent(
    new CustomEvent<FormRoutePageValues>("form:progresssnapshot", {
      detail: values,
    }),
  );
}

function emitPendingBreadcrumbCompletion(pageId: PageId | null) {
  window.dispatchEvent(
    new CustomEvent<PageId | null>("form:pendingbreadcrumbcompletion", {
      detail: pageId,
    }),
  );
}

export default function FormRoutePage({
  pageId,
  title,
  subhead,
  formMaxWidth,
  formHeader,
  noTitle,
  hideActions,
  hideNextButton,
  disableNextButton,
  help,
  children,
  validate,
  defaultValueOverrides,
  devFillFields,
  runtimeFields,
  onDevFill,
  onBeforeNext,
  resolveNextPageId,
  initialTransitionMessage,
}: FormRoutePageProps) {
  const analyticsRoot = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!analyticsRoot.current) return;
    const siteKey = resolveSiteId();
    return attachPageAnalytics(analyticsRoot.current, pageId, { siteKey, template: getFormTemplate(), revision: getPrototypeLibrary(siteKey)?.revision ?? "prototype" }, getAnalyticsInventory(siteKey));
  }, [pageId]);
  const navigate = useNavigate();
  const location = useLocation();
  const { values, setPageValues, saveApplication } = useApplicationForm();
  const { reviewSubmitted, markReviewSubmitted } = useApplicationSession();
  const singlePageFlow = useSinglePageFlow();
  const isSinglePage = Boolean(singlePageFlow);

  const [showProgressSaved, setShowProgressSaved] = useState(false);

  useEffect(() => {
    if ((location.state as Record<string, unknown>)?.showProgressSaved) {
      setShowProgressSaved(true);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate]);

  const initialFields = getMergedPageFields(pageId, values, devFillFields, runtimeFields);
  const defaultValueOverridesRef = useRef(defaultValueOverrides);
  defaultValueOverridesRef.current = defaultValueOverrides;

  const defaultValues = initialFields.reduce<FormRoutePageFormValues>(
    (acc, field) => {
      acc[field.id] =
        defaultValueOverrides?.[field.id] ??
        getStoredFieldValue(values[field.id]) ??
        getDefaultValueForField(field);
      return acc;
    },
    getPageCollectionDefaults(pageId, values),
  );

  const {
    control,
    handleSubmit,
    watch,
    getValues,
    setValue,
    trigger,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormRoutePageFormValues>({
    defaultValues,
  });

  const watchedValues = { ...values, ...watch() };

  const watchRef = useRef(watch);
  watchRef.current = watch;
  const setPageValuesRef = useRef(setPageValues);
  setPageValuesRef.current = setPageValues;
  const hasExplicitlySavedRef = useRef(false);

  useEffect(() => {
    return () => {
      if (!hasExplicitlySavedRef.current) {
        setPageValuesRef.current(watchRef.current());
      }
    };
  }, []);

  const allFields = getMergedPageFields(pageId, watchedValues, devFillFields, runtimeFields);
  const runtimeFieldsRef = useRef(runtimeFields);
  runtimeFieldsRef.current = runtimeFields;
  const devFillFieldsRef = useRef(devFillFields);
  devFillFieldsRef.current = devFillFields;
  const pageSections = getPageSections(pageId);

  useEffect(() => {
    const fields = getMergedPageFields(pageId, values, devFillFieldsRef.current, runtimeFieldsRef.current);

    const restoredValues = fields.reduce<FormRoutePageFormValues>(
      (acc, field) => {
        acc[field.id] =
          defaultValueOverridesRef.current?.[field.id] ??
          getStoredFieldValue(values[field.id]) ??
          getDefaultValueForField(field);
        return acc;
      },
      getPageCollectionDefaults(pageId, values),
    );

    reset(restoredValues);
  }, [pageId, reset, values]);

  useEffect(() => {
    function handleDevFillForm() {
      const formDataUpToPage = generateFormDataUpToPage(pageId);

      const currentValues = {
        ...formDataUpToPage,
        ...getValues(),
      };

      const currentFields = getMergedPageFields(
        pageId,
        currentValues,
        devFillFields,
        runtimeFields,
      );

      const devFilledValues = currentFields.reduce<FormRoutePageFormValues>(
        (acc, field) => {
          acc[field.id] = getDevValue(field);
          return acc;
        },
        {},
      );

      setPageValuesRef.current({
        ...formDataUpToPage,
        ...devFilledValues,
      });

      currentFields.forEach((field) => {
        setValue(field.id, devFilledValues[field.id], {
          shouldDirty: true,
          shouldTouch: true,
          shouldValidate: false,
        });
      });

      onDevFill?.({
        currentValues: {
          ...currentValues,
          ...devFilledValues,
        },
        currentFields,
        setValue,
        setPageValues: setPageValuesRef.current,
      });
    }

    window.addEventListener("devtools:fillform", handleDevFillForm);

    return () =>
      window.removeEventListener("devtools:fillform", handleDevFillForm);
  }, [devFillFields, getValues, onDevFill, pageId, runtimeFields, setValue]);

  const [pageError, setPageError] = useState<string | undefined>();
  const [isTransitioning, setIsTransitioning] = useState(
    !isSinglePage && Boolean(initialTransitionMessage),
  );
  const [transitionMessage, setTransitionMessage] = useState(
    initialTransitionMessage ?? "",
  );
  const transitionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (initialTransitionMessage && !isSinglePage) {
      transitionTimerRef.current = setTimeout(() => {
        setIsTransitioning(false);
        setTransitionMessage("");
      }, MESSAGE_DURATION);
    }
  }, [initialTransitionMessage, isSinglePage]);

  useEffect(() => {
    return () => {
      if (transitionTimerRef.current) clearTimeout(transitionTimerRef.current);
    };
  }, []);

  const scrollToFirstError = useCallback(() => {
    requestAnimationFrame(() => {
      const firstErrorField = document.querySelector(
        '[aria-invalid="true"], .Mui-error input, .Mui-error textarea, .Mui-error .MuiSelect-select',
      );

      if (firstErrorField) {
        firstErrorField.scrollIntoView({ behavior: "smooth", block: "center" });
      } else {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    });
  }, []);

  const continueToNextPage = useCallback(
    (nextNavigationValues: FormRoutePageValues) => {
      const resolvedNextPageId = resolveNextPageId?.(nextNavigationValues);
      const nextPageId =
        resolvedNextPageId === undefined
          ? getNextFormPageId(pageId, nextNavigationValues)
          : resolvedNextPageId;

      const destination =
        nextPageId ?? (pageId === "payment" ? "receipt" : null);
      if (!destination) return;


      const [msg1, msg2] = getForwardMessages(pageId);

      emitPendingBreadcrumbCompletion(pageId);
      setTransitionMessage(msg1);
      setIsTransitioning(true);
      if (singlePageFlow) {
        singlePageFlow.setNavigationPending(true);
        document.getElementById(`${pageId}-form`)?.closest('[data-single-page-step]')?.scrollIntoView({ behavior: "smooth", block: "start" });
      } else window.scrollTo({ top: 0 });

      transitionTimerRef.current = setTimeout(() => {
        setTransitionMessage(msg2);

        transitionTimerRef.current = setTimeout(() => {
          emitProgressSnapshot(nextNavigationValues);
          if (singlePageFlow) singlePageFlow.completeSection(pageId, destination);
          else navigate(getPagePath(destination), { state: { showProgressSaved: true } });
        }, MESSAGE_DURATION);
      }, MESSAGE_DURATION);
    },
    [navigate, pageId, resolveNextPageId, singlePageFlow],
  );

  function analyticsEvent(event: "submit" | "validation-failed") {
    const siteKey = resolveSiteId();
    emitPageAnalytics(pageId, event, { siteKey, template: getFormTemplate(), revision: getPrototypeLibrary(siteKey)?.revision ?? "prototype" }, getAnalyticsInventory(siteKey));
  }
  async function onSubmit(formValues: FormRoutePageValues) {
    const nextNavigationValues = {
      ...values,
      ...formValues,
    };

    const validationError = validate?.(nextNavigationValues);

    if (validationError) {
      analyticsEvent("validation-failed");
      setPageError(validationError);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    analyticsEvent("submit");
    setPageError(undefined);
    try {
      await saveApplication?.(nextNavigationValues, pageId === 'coverage' || pageId === 'review' ? pageId : undefined);
    } catch {
      setPageError(`${applicationRecovery['save-failed'].message} ${applicationRecovery['save-failed'].guidance}`);
      return;
    }
    setPageValues(formValues);
    hasExplicitlySavedRef.current = true;

    if (pageId === "membership") {
      void sendAutosaveMockEmail(nextNavigationValues).catch((error) => {
        console.warn("Autosave mock email failed", error);
      });
    }

    if (pageId === "review") {
      markReviewSubmitted();
    }

    const shouldContinue = onBeforeNext?.({
      values: nextNavigationValues,
      continueNavigation: () => continueToNextPage(nextNavigationValues),
    });

    if (shouldContinue === false) {
      return;
    }

    continueToNextPage(nextNavigationValues);
  }

  function onFormError(fieldErrors: FieldErrors<FormRoutePageValues>) {
    analyticsEvent("validation-failed");
    setPageError(applicationRecovery.validation.message);

    if (Object.keys(fieldErrors).length > 0) {
      scrollToFirstError();
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  function handleBack() {
    const previousPageId = getPreviousFormPageId(pageId, watchedValues);

    if (previousPageId) {
      const previousNavigationValues = {
        ...values,
        ...getValues(),
      };

      setPageValues(previousNavigationValues);
      hasExplicitlySavedRef.current = true;


      emitPendingBreadcrumbCompletion(null);
      setTransitionMessage(BACK_MESSAGE);
      setIsTransitioning(true);
      if (singlePageFlow) singlePageFlow.setNavigationPending(true);
      else window.scrollTo({ top: 0 });

      transitionTimerRef.current = setTimeout(() => {
        emitProgressSnapshot(previousNavigationValues);
        if (singlePageFlow) {
          singlePageFlow.setNavigationPending(false);
          singlePageFlow.goToSection(previousPageId);
        } else navigate(getPagePath(previousPageId));
      }, MESSAGE_DURATION);
    }
  }

  const renderProps: FormRouteRenderProps = {
    control,
    errors,
    watchedValues,
    allFields,
    pageSections,
    setValue,
    trigger,
  };

  const renderedHelp = typeof help === "function" ? help(renderProps) : help;

  const activeProgressStepIndex = getActiveProgressStepIndex(pageId, values);
  const hasMainSteps = !isSinglePage && activeProgressStepIndex >= 0;

  const resolvedTitle = title ?? getPageTitle(pageId);
  const resolvedSubhead = subhead ?? getPageSubhead(pageId);
  const resolvedInfoNote = getPageInfoNote(pageId);

  // After review is submitted, disable back navigation on post-review pages
  const flow = getResolvedFormFlow();
  const reviewIndex = flow.indexOf("review");
  const currentIndex = flow.indexOf(pageId);
  const isAfterReview =
    reviewSubmitted && reviewIndex !== -1 && currentIndex > reviewIndex;

  const formPageElement = (
    <PageShell
      title={resolvedTitle}
      maxWidth={hasMainSteps || isSinglePage ? "100%" : formMaxWidth}
      noTitle
      actions={undefined}
    >
      <Box ref={analyticsRoot} data-analytics-page={pageId}>
        <FormShell
          sx={{
            ...(formHeader ? { p: 0, overflow: "hidden" } : {}),
            mb: hasMainSteps ? 1 : 0,
          }}
        >
          {formHeader}
          <Box sx={formHeader ? { p: { xs: 2, sm: 3 } } : undefined}>
          {(hasMainSteps || isSinglePage) && (
            <Box sx={{ mb: 1.5 }}>
              <Breadcrumbs pageId={pageId} />
            </Box>
          )}
          {isTransitioning ? (
            <PageTransitionSkeleton message={transitionMessage} />
          ) : (
            <>
              {!noTitle && (
                <PageHeader
                  title={resolvedTitle}
                  subhead={resolvedSubhead}
                  onBack={
                    !isAfterReview &&
                    getPreviousFormPageId(pageId, watchedValues)
                      ? handleBack
                      : undefined
                  }
                  help={renderedHelp}
                />
              )}
              {resolvedInfoNote && (
                <Box sx={{ mb: 2 }}>
                  <Alert severity="info" sx={{ width: "100%", whiteSpace: "pre-line" }}>
                    {resolvedInfoNote}
                  </Alert>
                </Box>
              )}
              <PageAlert severity="error" message={pageError} />
              <form
                id={`${pageId}-form`}
                noValidate
                onSubmit={handleSubmit(onSubmit, onFormError)}
              >
                {typeof children === "function"
                  ? children(renderProps)
                  : children}
              </form>
            </>
          )}
          {!hideActions &&
            !(typeof hideNextButton === "function"
              ? hideNextButton(watchedValues)
              : hideNextButton) && (
              <PageNav
                formId={`${pageId}-form`}
                isTransitioning={isTransitioning}
                disabled={
                  isSubmitting || (typeof disableNextButton === "function"
                    ? disableNextButton(watchedValues)
                    : Boolean(disableNextButton))
                }
              />
            )}
          </Box>
        </FormShell>
      </Box>
    </PageShell>
  );

  return (
    <>
      <ProgressSavedSnackbar
        open={showProgressSaved}
        onClose={() => setShowProgressSaved(false)}
      />

      {hasMainSteps ? (
        <ProgressStep pageId={pageId}>{formPageElement}</ProgressStep>
      ) : (
        formPageElement
      )}
    </>
  );
}
