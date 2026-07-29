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
import ApplicantSection from "../components/forms/ApplicantSection";
import { fieldCatalog } from "../config/fields";
import {
  deriveStateProvinceFromZipOrPostalCode,
  formatZipOrPostalCode,
} from "../utils/zipToStateProvince";
import { useApplicationForm } from "../app/ApplicationFormContext";
import { getActiveClient } from "../config/client/getActiveClient";

const childMapping = {
  fields: [
    fieldCatalog["child-first-name"],
    fieldCatalog["child-last-name"],
    fieldCatalog["child-birth-date"],
    fieldCatalog["child-gender"],
  ],
  fieldToKey: {
    "child-first-name": "firstName",
    "child-last-name": "lastName",
    "child-birth-date": "birthDate",
    "child-gender": "gender",
  } as const,
  gridFields: ["child-first-name", "child-last-name"],
};

export default function Eligibility() {
  const location = useLocation();
  const navigate = useNavigate();
  const resumeLoadedFromRouteState = Boolean(
    (
      location.state as {
        resumeLoaded?: boolean;
      } | null
    )?.resumeLoaded,
  );

  const [showResumeLoadedSnackbar, setShowResumeLoadedSnackbar] = useState(
    resumeLoadedFromRouteState,
  );

  useEffect(() => {
    if (!resumeLoadedFromRouteState) {
      return;
    }

    // Clear one-time location state so refresh/back doesn't keep re-triggering.
    navigate(location.pathname, { replace: true, state: {} });
  }, [location.pathname, navigate, resumeLoadedFromRouteState]);

  return (
    <>
      <FormRoutePage
        pageId="eligibility"
        validate={(nextValues) => {
          const dependents = Array.isArray(nextValues.dependents)
            ? nextValues.dependents
            : [];

          if (dependents.includes("child")) {
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

          return undefined;
        }}
      >
        {(props) => <EligibilityFields {...props} />}
      </FormRoutePage>
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
  allFields: rawAllFields,
  pageSections,
  setValue,
  trigger,
}: FormRouteRenderProps) {
  const { values: appValues } = useApplicationForm();
  const client = getActiveClient();
  const [showAutoSetMessage, setShowAutoSetMessage] = useState(false);
  const showMessageFrameRef = useRef<number | null>(null);
  const hideMessageTimeoutRef = useRef<number | null>(null);

  // For AMA spouse-of-physician, remove "Spouse" from dependent options
  const allFields = useMemo(() => {
    if (client.id === "ama" && appValues.membership === "spouse") {
      return rawAllFields.map((field) => {
        if (field.id === "dependents" && field.options) {
          return {
            ...field,
            options: field.options.filter((opt) => opt.value !== "spouse"),
          };
        }
        return field;
      });
    }
    return rawAllFields;
  }, [rawAllFields, client.id, appValues.membership]);

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
    if (trimmed.length < 5) {
      return;
    }

    const derivedStateProvinceValue = deriveStateProvinceFromZipOrPostalCode(
      zipPostalCodeValue,
      stateProvinceOptions,
    );

    if (!derivedStateProvinceValue) {
      return;
    }

    if (derivedStateProvinceValue === stateProvinceValue) {
      return;
    }

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
  }, [zipPostalCodeValue, stateProvinceOptions, stateProvinceValue, setValue]);

  return (
    <>
      {pageSections.map((section) => {
        if (!isSectionVisible(section, watchedValues)) return null;

        const content =
          section.id === "childSection" ? (
            <DynamicList
              control={control}
              name="children"
              label="Child"
              mapping={childMapping}
              renderItem={(item) => (
                <Typography variant="body2">
                  {`${item.firstName} ${item.lastName}`.trim().toUpperCase()}
                </Typography>
              )}
            />
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

                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                      gap: { xs: 0, sm: 2 },
                    }}
                  >
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
                  </Box>

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
                        required: "This field is required.",
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
                        errors={errors}
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
              <ApplicantSection applicant={section.applicant}>
                {content}
              </ApplicantSection>
            ) : (
              <>{content}</>
            )}
          </div>
        );
      })}
    </>
  );
}
