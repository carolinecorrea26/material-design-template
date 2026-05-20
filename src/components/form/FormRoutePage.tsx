import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  Alert,
  Button,
  CircularProgress,
  Snackbar,
  Stack,
} from "@mui/material";
import { useForm, type FieldErrors } from "react-hook-form";
import { useNavigate, useLocation } from "react-router-dom";
import type { PageId } from "../../types/page";
import { getClientPageFields } from "../../config/clientFields/getClientPageFields";
import {
  formFlow,
  getNextFormPageId,
  getPreviousFormPageId,
} from "../../config/formFlow";
import { getPageTitle } from "../../config/pages";
import { getPageSections } from "../../config/pageSections";
import type { PageSectionConfig } from "../../config/pageSections/types";
import type { FieldDefinition } from "../../config/fields/types";
import {
  type ApplicationFormValues,
  useApplicationForm,
} from "../../state/ApplicationFormContext";
import { isApplicantApplying } from "./applicantVisibility";
import FormPage from "./FormPage";
import FormVerticalStepper, {
  VerticalStepperBreadcrumbs,
} from "./FormVerticalStepper";
import { getActiveProgressStepIndex } from "../../config/progressSteps";
import { generateFormDataUpToPage } from "../../dev/utils/generateFormData";
import FormHelpChips, { type HelpChipItem } from "./FormHelpChips";
import FormHelpDrawer from "./FormHelpDrawer";
import FormTransitionSkeleton from "./FormTransitionSkeleton";
import FormPageError from "./FormPageError";
import {
  getForwardMessages,
  BACK_MESSAGE,
  MESSAGE_DURATION,
} from "../../config/transitionMessages";
import type { ProgressVariant } from "../../types/progress";
import { readProgressVariant } from "../../utils/progressVariant";
import { sendAutosaveMockEmail } from "../../utils/mockEmail";

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

type FormRouteHelpItem = HelpChipItem & {
  title: string;
  content: ReactNode;
};

type DevFillContext = {
  currentValues: FormRoutePageValues;
  currentFields: FieldDefinition[];
  setValue: ReturnType<typeof useForm<FormRoutePageFormValues>>["setValue"];
  setPageValues: ReturnType<typeof useApplicationForm>["setPageValues"];
};

type FormRoutePageProps = {
  pageId: PageId;
  title?: string;
  formMaxWidth?: number | string;
  noBreadcrumb?: boolean;
  help?: ReactNode | ((props: FormRouteRenderProps) => ReactNode);
  helpItems?:
    | FormRouteHelpItem[]
    | ((props: FormRouteRenderProps) => FormRouteHelpItem[]);
  children: ReactNode | ((props: FormRouteRenderProps) => ReactNode);
  validate?: (values: FormRoutePageValues) => string | undefined;
  defaultValueOverrides?: FormRoutePageFormValues;
  devFillFields?: (currentValues: FormRoutePageValues) => FieldDefinition[];
  onDevFill?: (context: DevFillContext) => void;
  resolveNextPageId?: (values: FormRoutePageValues) => PageId | null;
  initialTransitionMessage?: string;
};

function getDefaultValueForField(field: FieldDefinition): FormRouteFieldValue {
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
) {
  return [
    ...getClientPageFields(pageId, values),
    ...(devFillFields?.(values) ?? []),
  ].filter(
    (field, index, fields) =>
      fields.findIndex((entry) => entry.id === field.id) === index,
  );
}

export function isSectionVisible(
  section: PageSectionConfig,
  values: FormRoutePageValues,
): boolean {
  const coverageOptionsIndex = formFlow.indexOf("coverage-options");
  const sectionPageIndex = formFlow.indexOf(section.pageId);
  const useApplicantCoverageGate =
    sectionPageIndex >= coverageOptionsIndex && coverageOptionsIndex !== -1;

  if (
    useApplicantCoverageGate &&
    section.applicant &&
    !isApplicantApplying(section.applicant, values)
  ) {
    return false;
  }

  if (!section.visibleWhen) return true;

  return section.visibleWhen.every((rule) => {
    const value = values[rule.fieldId];

    if ("equals" in rule) return value === rule.equals;
    if ("notEquals" in rule) return value !== rule.notEquals;
    if ("includes" in rule) {
      return Array.isArray(value) && value.includes(rule.includes);
    }

    return true;
  });
}

function getDevValue(field: {
  id: string;
  inputType: string;
  format?: string;
  options?: { value: string }[];
}) {
  if (field.id === "dependents") return ["spouse"];
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
  if (field.inputType === "radio" || field.inputType === "dropdown") {
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
  formMaxWidth,
  noBreadcrumb,
  help,
  helpItems,
  children,
  validate,
  defaultValueOverrides,
  devFillFields,
  onDevFill,
  resolveNextPageId,
  initialTransitionMessage,
}: FormRoutePageProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { values, setPageValues } = useApplicationForm();

  const [showProgressSaved, setShowProgressSaved] = useState(false);

  const [progressVariant, setProgressVariant] = useState<ProgressVariant>(() =>
    readProgressVariant(),
  );

  useEffect(() => {
    function handleVariantChange(event: Event) {
      const customEvent = event as CustomEvent<ProgressVariant>;
      setProgressVariant(customEvent.detail ?? "vertical-stepper");
    }
    window.addEventListener(
      "devtools:progressvariantchange",
      handleVariantChange,
    );
    return () => {
      window.removeEventListener(
        "devtools:progressvariantchange",
        handleVariantChange,
      );
    };
  }, []);

  useEffect(() => {
    if ((location.state as Record<string, unknown>)?.showProgressSaved) {
      setShowProgressSaved(true);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate]);

  const initialFields = getMergedPageFields(pageId, values, devFillFields);
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
    {},
  );

  const {
    control,
    handleSubmit,
    watch,
    getValues,
    setValue,
    trigger,
    reset,
    formState: { errors },
  } = useForm<FormRoutePageFormValues>({
    defaultValues,
  });

  const watchedValues = { ...values, ...watch() };

  const watchRef = useRef(watch);
  watchRef.current = watch;
  const setPageValuesRef = useRef(setPageValues);
  setPageValuesRef.current = setPageValues;

  useEffect(() => {
    return () => {
      setPageValuesRef.current(watchRef.current());
    };
  }, []);

  const allFields = getMergedPageFields(pageId, watchedValues, devFillFields);
  const pageSections = getPageSections(pageId);

  useEffect(() => {
    const fields = getMergedPageFields(pageId, values, devFillFields);

    const restoredValues = fields.reduce<FormRoutePageFormValues>(
      (acc, field) => {
        acc[field.id] =
          defaultValueOverridesRef.current?.[field.id] ??
          getStoredFieldValue(values[field.id]) ??
          getDefaultValueForField(field);
        return acc;
      },
      {},
    );

    reset(restoredValues);
  }, [devFillFields, pageId, reset, values]);

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
  }, [devFillFields, getValues, onDevFill, pageId, setValue]);

  const [pageError, setPageError] = useState<string | undefined>();
  const [activeHelpId, setActiveHelpId] = useState<string | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(
    Boolean(initialTransitionMessage),
  );
  const [transitionMessage, setTransitionMessage] = useState(
    initialTransitionMessage ?? "",
  );
  const transitionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (initialTransitionMessage) {
      transitionTimerRef.current = setTimeout(() => {
        setIsTransitioning(false);
        setTransitionMessage("");
      }, 1000);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    return () => {
      if (transitionTimerRef.current) clearTimeout(transitionTimerRef.current);
      emitPendingBreadcrumbCompletion(null);
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

  function onSubmit(formValues: FormRoutePageValues) {
    const nextNavigationValues = {
      ...values,
      ...formValues,
    };

    const validationError = validate?.(nextNavigationValues);

    if (validationError) {
      setPageError(validationError);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    setPageError(undefined);
    setPageValues(formValues);
    if (pageId === "membership") {
      void sendAutosaveMockEmail(nextNavigationValues).catch((error) => {
        console.warn("Autosave mock email failed", error);
      });
    }

    const nextPageId =
      resolveNextPageId?.(nextNavigationValues) ??
      getNextFormPageId(pageId, nextNavigationValues);

    const destination = nextPageId ?? (pageId === "payment" ? "receipt" : null);
    if (!destination) return;

    const startTransition = () => {
      const [msg1, msg2] = getForwardMessages(pageId);
      emitPendingBreadcrumbCompletion(pageId);
      setTransitionMessage(msg1);
      setIsTransitioning(true);
      window.scrollTo({ top: 0 });

      transitionTimerRef.current = setTimeout(() => {
        setTransitionMessage(msg2);

        transitionTimerRef.current = setTimeout(() => {
          emitPendingBreadcrumbCompletion(null);
          emitProgressSnapshot(nextNavigationValues);
          navigate(`/${destination}`, { state: { showProgressSaved: true } });
        }, MESSAGE_DURATION);
      }, MESSAGE_DURATION);
    };

    startTransition();
  }

  function onFormError(fieldErrors: FieldErrors<FormRoutePageValues>) {
    setPageError("Please correct the errors below before continuing.");

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

      emitPendingBreadcrumbCompletion(null);
      setTransitionMessage(BACK_MESSAGE);
      setIsTransitioning(true);
      window.scrollTo({ top: 0 });

      transitionTimerRef.current = setTimeout(() => {
        emitProgressSnapshot(previousNavigationValues);
        navigate(`/${previousPageId}`);
      }, MESSAGE_DURATION);
    }
  }

  return (() => {
    const renderProps: FormRouteRenderProps = {
      control,
      errors,
      watchedValues,
      allFields,
      pageSections,
      setValue,
      trigger,
    };

    const resolvedHelpItems =
      typeof helpItems === "function"
        ? helpItems(renderProps)
        : (helpItems ?? []);

    const isVerticalStepper =
      progressVariant === "vertical-stepper" &&
      getActiveProgressStepIndex(pageId, values) >= 0;

    const activeHelpItem = useMemo(
      () => resolvedHelpItems.find((item) => item.id === activeHelpId) ?? null,
      [activeHelpId, resolvedHelpItems],
    );

    const renderedHelp = typeof help === "function" ? help(renderProps) : help;

    const renderedHelpSection =
      renderedHelp || resolvedHelpItems.length ? (
        <>
          {renderedHelp}
          {resolvedHelpItems.length ? (
            <>
              <FormHelpChips
                items={resolvedHelpItems}
                onSelect={(id) => setActiveHelpId(id)}
              />
              <FormHelpDrawer
                open={Boolean(activeHelpItem)}
                title={activeHelpItem?.title ?? ""}
                onClose={() => setActiveHelpId(null)}
              >
                {activeHelpItem?.content}
              </FormHelpDrawer>
            </>
          ) : null}
        </>
      ) : undefined;

    const formPageElement = (
      <FormPage
        title={isTransitioning ? "" : (title ?? getPageTitle(pageId))}
        error={isTransitioning ? undefined : pageError}
        help={isTransitioning ? undefined : renderedHelpSection}
        maxWidth={formMaxWidth}
        compactTitle={isVerticalStepper}
        noTitle={isVerticalStepper}
        noContainer={isVerticalStepper}
        onBack={
          !isVerticalStepper &&
          !isTransitioning &&
          getPreviousFormPageId(pageId, watchedValues)
            ? handleBack
            : undefined
        }
        actions={
          <>
            <Button
              type="button"
              form={`${pageId}-form`}
              onClick={handleBack}
              disabled={
                isTransitioning || !getPreviousFormPageId(pageId, watchedValues)
              }
            >
              Back
            </Button>
            <Button
              type="submit"
              form={`${pageId}-form`}
              variant="contained"
              disabled={isTransitioning}
            >
              {isTransitioning ? (
                <CircularProgress size={20} color="inherit" />
              ) : (
                "Next"
              )}
            </Button>
          </>
        }
        aboveHeader={
          isVerticalStepper && !noBreadcrumb ? (
            <VerticalStepperBreadcrumbs pageId={pageId} />
          ) : undefined
        }
      >
        {isTransitioning ? (
          <FormTransitionSkeleton statusMessage={transitionMessage} />
        ) : (
          <Stack spacing={2}>
            {isVerticalStepper && pageError && (
              <FormPageError message={pageError} />
            )}
            {isVerticalStepper && renderedHelpSection}
            <form
              id={`${pageId}-form`}
              noValidate
              onSubmit={handleSubmit(onSubmit, onFormError)}
            >
              {typeof children === "function"
                ? children(renderProps)
                : children}
            </form>
          </Stack>
        )}
      </FormPage>
    );

    return (
      <>
        <Snackbar
          open={showProgressSaved}
          autoHideDuration={3000}
          onClose={() => setShowProgressSaved(false)}
          anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
          sx={{
            bottom: { xs: 20, sm: 24, lg: "auto" },
            top: { lg: 24 },
          }}
        >
          <Alert
            onClose={() => setShowProgressSaved(false)}
            severity="success"
            variant="filled"
          >
            Progress saved!
          </Alert>
        </Snackbar>
        {isVerticalStepper ? (
          <FormVerticalStepper pageId={pageId}>
            {formPageElement}
          </FormVerticalStepper>
        ) : (
          formPageElement
        )}
      </>
    );
  })();
}
