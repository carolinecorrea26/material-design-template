import { getPrototypeLibrary } from "../domain/prototypeLibrary";
import { getClientPageFields } from "../config/clientFields/getClientPageFields";
import { childMapping } from "../config/fields/eligibilityListFields";
import { useEffect, useMemo, useRef, useState } from "react";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import HighlightOffRoundedIcon from "@mui/icons-material/HighlightOffRounded";
import {
  Alert,
  Box,
  Collapse,
  Snackbar,
  TextField,
  Typography,
} from "@mui/material";
import InputAdornment from "@mui/material/InputAdornment";
import { Controller } from "react-hook-form";
import { useLocation, useNavigate } from "react-router-dom";
import FormRoutePage, {
  type FormRouteRenderProps,
  isSectionVisible,
} from "../app/RoutePage";
import FieldRenderer from "../components/forms/FieldRenderer";
import DynamicList from "../components/forms/DynamicList";
import ApplicantSectionDivider from "../components/layout/ApplicantSectionDivider";
import MemberVerification from "../components/ui/MemberVerification";
import { lookupPrototypeTpa, resolveTpaOutcome, tpaOutcomeValues, type TpaResolution } from "../domain/tpaIntegration";
import {
  deriveStateProvinceFromZipOrPostalCode,
  formatZipOrPostalCode,
} from "../utils/zipToStateProvince";
import { useApplicationForm } from "../app/ApplicationFormContext";
import { getActiveClient } from "../config/client/getActiveClient";
import FieldGrid from "../components/layout/FieldGrid";

export default function Eligibility() {
  const location = useLocation();
  const navigate = useNavigate();
  const { setPageValues } = useApplicationForm();
  const client = getActiveClient();

  const resumeLoadedFromRouteState = Boolean(
    (location.state as { resumeLoaded?: boolean } | null)?.resumeLoaded,
  );

  const [showResumeLoadedSnackbar, setShowResumeLoadedSnackbar] = useState(
    resumeLoadedFromRouteState,
  );

  const [memberVerificationOpen, setMemberVerificationOpen] = useState(false);
  // Track the lookup inputs so changes require a fresh verification attempt.
  const tpaCompletedRef = useRef<string | null>(null);
  const tpaMemberRef = useRef<TpaResolution>({ existingMember: false, activeCoverage: false });
  // Ref to the hidden form submit button so we can trigger it after modal close.
  const formSubmitRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!resumeLoadedFromRouteState) return;
    navigate(location.pathname, { replace: true, state: {} });
  }, [location.pathname, navigate, resumeLoadedFromRouteState]);

  function handleModalClose(verified: boolean) {
    setPageValues(tpaOutcomeValues(tpaMemberRef.current, resolveTpaOutcome(client, tpaMemberRef.current, verified)));
    setMemberVerificationOpen(false);
    // Programmatically re-submit the form now that the modal is done.
    // validate() will pass this time because tpaCompletedRef.current is true.
    requestAnimationFrame(() => {
      formSubmitRef.current?.click();
    });
  }

  return (
    <>
      <FormRoutePage
        pageId="eligibility"
        validate={(nextValues) => {
          if (client.applicantExperience?.eligibleStatesOnly && !deriveStateProvinceFromZipOrPostalCode(String(nextValues["zip-postal-code"] ?? ""), getClientPageFields("eligibility").find(f => f.id === "state-province")?.options ?? [])) return "The state for this ZIP / Postal Code may not be eligible for coverage.";
          const dependents = Array.isArray(nextValues.dependents)
            ? nextValues.dependents
            : [];

          if (dependents.includes("child") && client.applicantExperience?.childEligibility?.mode !== "notice-only") {
            const children = Array.isArray(nextValues.children)
              ? nextValues.children
              : [];
            if (children.length === 0) {
              return "Please add at least one child or remove child from dependents.";
            }
          }

          if (dependents.includes("spouse")) {
            const spouseFirstName = String(
              nextValues["spouse-first-name"] ?? "",
            ).trim();
            const spouseLastName = String(
              nextValues["spouse-last-name"] ?? "",
            ).trim();
            if (!spouseFirstName && !spouseLastName) {
              return "Please add spouse details or remove spouse from dependents.";
            }
          }

          const member = lookupPrototypeTpa(client, nextValues);
          const outcome = resolveTpaOutcome(client, member);
          const lookupKey = JSON.stringify([client.id, client.tpaIntegration, member,
            (client.tpaIntegration?.lookupFields ?? ["first-name", "last-name", "birth-date", ...Object.keys(client.features?.memberVerificationMatchFacts ?? {})]).map(field => nextValues[field])]);
          if (outcome.verifyIdentity && tpaCompletedRef.current !== lookupKey) {
            tpaMemberRef.current = member;
            tpaCompletedRef.current = lookupKey;
            setPageValues(tpaOutcomeValues(member, resolveTpaOutcome(client, member, false)));
            setMemberVerificationOpen(true);
            return "\u200b";
          }
          if (!outcome.verifyIdentity) setPageValues(tpaOutcomeValues(member, outcome));

          return undefined;
        }}
      >
        {(props) => (
          <>
            <EligibilityFields {...props} />
            {/* Hidden submit trigger used by handleModalClose */}
            <button
              ref={formSubmitRef}
              type="submit"
              form={`eligibility-form`}
              style={{ display: "none" }}
              aria-hidden="true"
            />
          </>
        )}
      </FormRoutePage>

      <MemberVerification
        open={memberVerificationOpen}
        onClose={handleModalClose}
      />

      <Snackbar
        open={showResumeLoadedSnackbar}
        autoHideDuration={4000}
        onClose={() => setShowResumeLoadedSnackbar(false)}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          onClose={() => setShowResumeLoadedSnackbar(false)}
          severity="success"
          variant="filled"
          sx={{ width: "100%" }}
        >
          Saved application loaded successfully.
        </Alert>
      </Snackbar>
    </>
  );
}

function EligibilityFields({
  control,
  errors,
  watchedValues,
  allFields,
  pageSections,
  setValue,
  trigger,
}: FormRouteRenderProps) {
  const experience = getActiveClient().applicantExperience;
  const collection = getPrototypeLibrary()?.fieldCollections.children;
  const [showAutoSetMessage, setShowAutoSetMessage] = useState(false);
  const showMessageFrameRef = useRef<number | null>(null);
  const hideMessageTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (showMessageFrameRef.current !== null) {
        window.cancelAnimationFrame(showMessageFrameRef.current);
      }
      if (hideMessageTimeoutRef.current !== null) {
        window.clearTimeout(hideMessageTimeoutRef.current);
      }
    };
  }, []);

  const zipPostalCodeValue = String(watchedValues["zip-postal-code"] ?? "");
  const stateProvinceValue = String(watchedValues["state-province"] ?? "");

  const stateProvinceField = allFields.find(
    (field) => field.id === "state-province",
  );

  const stateProvinceOptions = useMemo(
    () => stateProvinceField?.options ?? [],
    [stateProvinceField],
  );

  useEffect(() => {
    const trimmed = zipPostalCodeValue.trim();
    if (trimmed.length < 5) return;

    const derivedStateProvinceValue = deriveStateProvinceFromZipOrPostalCode(
      zipPostalCodeValue,
      stateProvinceOptions,
    );

    if (!derivedStateProvinceValue) {
      if (experience?.eligibleStatesOnly && stateProvinceValue) setValue("state-province", "", { shouldDirty: true, shouldValidate: true });
      return;
    }
    if (derivedStateProvinceValue === stateProvinceValue) return;

    setValue("state-province", derivedStateProvinceValue, {
      shouldDirty: true,
      shouldValidate: true,
    });

    if (showMessageFrameRef.current !== null) {
      window.cancelAnimationFrame(showMessageFrameRef.current);
    }

    showMessageFrameRef.current = window.requestAnimationFrame(() => {
      setShowAutoSetMessage(true);
    });

    if (hideMessageTimeoutRef.current !== null) {
      window.clearTimeout(hideMessageTimeoutRef.current);
    }

    hideMessageTimeoutRef.current = window.setTimeout(() => {
      setShowAutoSetMessage(false);
    }, 4000);
  }, [zipPostalCodeValue, stateProvinceOptions, stateProvinceValue, setValue, experience]);

  return (
    <>
      {pageSections.map((section) => {
        if (!isSectionVisible(section, watchedValues)) return null;

        const content =
          section.id === "childSection" && experience?.childEligibility?.mode === "notice-only" ? <Alert severity="info">{experience.childEligibility.note}</Alert> : section.id === "childSection" ? (
            <>
              <Alert severity="info" sx={{ mt: 1, mb: 2 }}>
                Only unmarried children are eligible for coverage.
              </Alert>
              <DynamicList
                control={control}
                name={collection?.name ?? "children"}
                label={collection?.label ?? "Child"}
                maxItems={collection?.maxItems ?? 10}
                mapping={collection?.mapping ?? {
                  ...childMapping,
                  fields: [...childMapping.fields, ...allFields.filter(field => field.id === "child-unmarried" || field.id === "child-full-time-student")],
                  fieldToKey: { ...childMapping.fieldToKey, "child-unmarried": "unmarried", "child-full-time-student": "fullTimeStudent" },
                }}
                renderItem={(item) => (
                  <Typography variant="body2">
                    {`${item.firstName} ${item.lastName}`.trim().toUpperCase()}
                  </Typography>
                )}
              />
            </>
          ) : section.id === "spouseSection" ? (
            (() => {
              const nameFields = ["spouse-first-name", "spouse-last-name"];
              const firstNameIndex = section.fieldIds.findIndex((id) =>
                nameFields.includes(id),
              );
              const beforeName = section.fieldIds.slice(0, firstNameIndex);
              const afterName = section.fieldIds.filter(
                (id) => !nameFields.includes(id) && !beforeName.includes(id),
              );

              return (
                <>
                  {beforeName.map((fieldId) => {
                    const field = allFields.find((f) => f.id === fieldId);
                    if (!field) return null;
                    return (
                      <FieldRenderer
                        key={field.id}
                        field={field}
                        control={control}
                        errors={errors}
                      />
                    );
                  })}

                  <FieldGrid>
                    {section.fieldIds
                      .filter((fieldId) => nameFields.includes(fieldId))
                      .map((fieldId) => {
                        const field = allFields.find((f) => f.id === fieldId);
                        if (!field) return null;
                        return (
                          <FieldRenderer
                            key={field.id}
                            field={field}
                            control={control}
                            errors={errors}
                          />
                        );
                      })}
                  </FieldGrid>

                  {afterName.map((fieldId) => {
                    const field = allFields.find((f) => f.id === fieldId);
                    if (!field) return null;
                    return (
                      <FieldRenderer
                        key={field.id}
                        field={field}
                        control={control}
                        errors={errors}
                      />
                    );
                  })}
                </>
              );
            })()
          ) : (
            <>
              {section.fieldIds.map((fieldId) => {
                const field = allFields.find((f) => f.id === fieldId);
                if (!field) return null;

                if (field.id === "zip-postal-code") {
                  return (
                    <Controller
                      key={field.id}
                      name={field.id}
                      control={control}
                      rules={{
                        required: `${field.label} is required.`,
                        validate: (value) => {
                          if (!value) return true;
                          return String(value).trim().length >= 5
                            ? true
                            : "Enter a valid ZIP / Postal Code.";
                        },
                      }}
                      render={({ field: controllerField }) => {
                        const value = (controllerField.value as string) ?? "";
                        const hasError = Boolean(errors[field.id]);
                        const inputChecksOn = new URLSearchParams(
                          window.location.search,
                        ).has("inputChecks");
                        const isComplete =
                          inputChecksOn &&
                          !hasError &&
                          value.trim().length >= 5;

                        return (
                          <TextField
                            label={field.label}
                            required={field.required}
                            type="text"
                            fullWidth
                            margin="normal"
                            placeholder={field.placeholder}
                            autoComplete={field.autoComplete}
                            inputProps={{
                              inputMode: "text",
                              maxLength: 7,
                            }}
                            value={value}
                            onChange={(event) => {
                              controllerField.onChange(
                                formatZipOrPostalCode(event.target.value),
                              );
                            }}
                            onBlur={() => {
                              controllerField.onBlur();
                              void trigger("zip-postal-code");
                            }}
                            disabled={field.disabled}
                            error={hasError}
                            helperText={
                              (errors[field.id]?.message as string) ?? ""
                            }
                            InputProps={{
                              endAdornment: isComplete ? (
                                <InputAdornment position="end">
                                  <CheckCircleRoundedIcon
                                    aria-label="Completed"
                                    sx={{
                                      color: "success.main",
                                      fontSize: { xs: "1rem", md: "1.25rem" },
                                    }}
                                  />
                                </InputAdornment>
                              ) : inputChecksOn && hasError ? (
                                <InputAdornment position="end">
                                  <HighlightOffRoundedIcon
                                    aria-label="Error"
                                    sx={{
                                      color: "error.main",
                                      fontSize: "1.25rem",
                                    }}
                                  />
                                </InputAdornment>
                              ) : undefined,
                            }}
                          />
                        );
                      }}
                    />
                  );
                }

                if (field.id === "state-province") {
                  return (
                    <Box key={field.id}>
                      <FieldRenderer
                        field={field}
                        control={control}
                        errors={!stateProvinceOptions.some(o => o.value === deriveStateProvinceFromZipOrPostalCode(zipPostalCodeValue, stateProvinceOptions)) && zipPostalCodeValue.trim().length >= 5 && experience?.eligibleStatesOnly ? { ...errors, "state-province": { type: "eligibility", message: "The state for this ZIP / Postal Code may not be eligible for coverage." } } as typeof errors : errors}
                      />
                      <Collapse
                        in={showAutoSetMessage}
                        timeout={220}
                        unmountOnExit
                      >
                        <Box
                          sx={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 0.5,
                            mt: 0.5,
                            animation: "zipStateReveal 220ms ease",
                            "@keyframes zipStateReveal": {
                              from: {
                                opacity: 0,
                                transform: "translateY(-6px)",
                              },
                              to: {
                                opacity: 1,
                                transform: "translateY(0)",
                              },
                            },
                          }}
                        >
                          <CheckRoundedIcon
                            sx={{
                              fontSize: 16,
                              color: "success.main",
                            }}
                          />
                          <Typography
                            variant="caption"
                            sx={{ color: "success.main", fontWeight: 500 }}
                          >
                            Based on your ZIP / postal code
                          </Typography>
                        </Box>
                      </Collapse>
                    </Box>
                  );
                }

                return (
                  <FieldRenderer
                    key={field.id}
                    field={field}
                    control={control}
                    errors={errors}
                  />
                );
              })}
            </>
          );

        return (
          <div key={section.id}>
            {section.applicant && section.applicant !== "self" ? (
              <ApplicantSectionDivider applicant={section.applicant}>
                {content}
              </ApplicantSectionDivider>
            ) : (
              <>{content}</>
            )}
          </div>
        );
      })}
    </>
  );
}
