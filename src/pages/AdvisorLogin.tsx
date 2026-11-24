import { Controller } from 'react-hook-form';
import { getFieldValidationRules } from '../utils/fieldValidation';
import { useApplicationForm } from '../app/ApplicationFormContext';
import { useApplicationSession } from '../app/ApplicationSessionContext';
import { advisorEntryValues } from '../domain/advisorFlow';
import { requirementText } from "../domain/requirementContent";
import {
  Box,
  Button,
  Stack,
  Tab,
  Tabs,
  Typography,
  FormHelperText,
} from "@mui/material";
import FormRoutePage, {
  isSectionVisible,
  type FormRouteRenderProps,
} from "../app/RoutePage";
import FieldRenderer from "../components/forms/FieldRenderer";
import FieldGrid from '../components/layout/FieldGrid';
import { getPageTitle, getPageSubhead, getPageSectionNote } from "../config/pages";

export default function AdvisorLogin() {
  const { resetValues, setPageValues } = useApplicationForm();
  const { resetApplicationSession } = useApplicationSession();
  return (
    <FormRoutePage
      pageId="advisor-login"
      formMaxWidth={500}
      hideActions
      prepareSubmitValues={values => advisorEntryValues(values, values["advisor-flow-type"] === "saved" ? "saved" : "new")}
      onBeforeNext={({ values }) => { resetValues(); resetApplicationSession(); setPageValues(values); return true; }}
      noTitle
      formHeader={<Box sx={{ bgcolor: "primary.dark", color: theme => theme.palette.getContrastText(theme.palette.primary.dark), px: 3, py: 4, textAlign: "center" }}>
        <Typography variant="h5" component="h1" sx={{ fontWeight: 800 }}>{getPageTitle("advisor-login")}</Typography>
        <Typography variant="body2" sx={{ mt: 1 }}>{getPageSubhead("advisor-login")}</Typography>
      </Box>}
      resolveNextPageId={(values) =>
        values["advisor-flow-type"] === "saved" ? "resume" : "membership"
      }
    >
      {(props) => <AdvisorLoginFields {...props} />}
    </FormRoutePage>
  );
}

function AdvisorLoginFields({
  control,
  errors,
  watchedValues,
  allFields,
  pageSections,
}: FormRouteRenderProps) {
  const mode = watchedValues["advisor-flow-type"] === "saved" ? "saved" : "new";
  const modeField = allFields.find(field => field.id === 'advisor-flow-type');
  if (!modeField?.options?.length) throw new Error('Missing configured advisor login modes');

  return (
    <Box>
      <Stack spacing={2.5} alignItems="center">
        <Controller name={modeField.id} control={control} rules={getFieldValidationRules(modeField)} render={({ field: modeInput }) => <Tabs
          value={modeField.options!.some(option => option.value === modeInput.value) ? modeInput.value : false}
          variant="fullWidth"
          onChange={(_, value: string) => modeInput.onChange(value)}
          onBlur={modeInput.onBlur}
          aria-label={modeField.label}
          aria-describedby="advisor-mode-instructions"
          sx={{
            width: "100%",
            borderBottom: 1,
            borderColor: "divider",
            minHeight: 44,
            "& .MuiTab-root": {
              minHeight: 44,
              fontWeight: 700,
              textTransform: "none",
            },
          }}
        >
          {modeField.options!.map(option => <Tab key={option.value} label={option.label} value={option.value} />)}
        </Tabs>} />
        {errors[modeField.id]?.message && <FormHelperText error>{String(errors[modeField.id]!.message)}</FormHelperText>}

        <Typography id="advisor-mode-instructions" variant="body2" color="text.secondary" sx={{ width: "100%", lineHeight: 1.65 }}>
          {getPageSectionNote("advisor-login", mode === "new" ? "advisorLoginNew" : "advisorLoginSaved")}
        </Typography>

        <FieldGrid sx={{ width: "100%" }}>
          {pageSections.map((section) => {
            if (!isSectionVisible(section, watchedValues)) return null;

            return section.fieldIds.filter(fieldId => fieldId !== modeField.id).map((fieldId) => {
              const field = allFields.find((entry) => entry.id === fieldId);
              if (!field) return null;

              return (
                <FieldRenderer
                  key={field.id}
                  field={field}
                  control={control}
                  errors={errors}
                />
              );
            });
          })}
        </FieldGrid>

        <Button
          type="submit"
          variant="contained"
          size="large"
          fullWidth
          sx={{
            py: 1.45,
            fontSize: "1rem",
            textTransform: "none",
            boxShadow: "0 14px 28px rgba(0, 0, 0, 0.16)",
          }}
        >
          {requirementText("application.ui.log-in")}</Button>
      </Stack>
    </Box>
  );
}
