import { requirementText } from "../domain/requirementContent";
import {
  Box,
  Button,
  Stack,
  Tab,
  Tabs,
  Typography,
} from "@mui/material";
import FormRoutePage, {
  isSectionVisible,
  type FormRouteRenderProps,
} from "../app/RoutePage";
import FieldRenderer from "../components/forms/FieldRenderer";
import { getPageTitle, getPageSubhead, getPageSectionNote } from "../config/pages";

export default function AdvisorLogin() {
  return (
    <FormRoutePage
      pageId="advisor-login"
      formMaxWidth={500}
      hideActions
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
  setValue,
}: FormRouteRenderProps) {
  const mode = watchedValues["advisor-flow-type"] === "saved" ? "saved" : "new";

  return (
    <Box>
      <Stack spacing={2.5} alignItems="center">
        <Tabs
          value={mode}
          variant="fullWidth"
          onChange={(_, value: "new" | "saved") =>
            setValue("advisor-flow-type", value, {
              shouldDirty: true,
              shouldTouch: false,
              shouldValidate: false,
            })
          }
          aria-label={requirementText("application.ui.advisor-login-type")}
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
          <Tab label={requirementText("application.ui.start")} value="new" />
          <Tab label={requirementText("home.landing-notice.continue")} value="saved" />
        </Tabs>

        <Typography id="advisor-mode-instructions" variant="body2" color="text.secondary" sx={{ width: "100%", lineHeight: 1.65 }}>
          {getPageSectionNote("advisor-login", mode === "new" ? "advisorLoginNew" : "advisorLoginSaved")}
        </Typography>

        <Stack spacing={2} sx={{ width: "100%" }}>
          {pageSections.map((section) => {
            if (!isSectionVisible(section, watchedValues)) return null;

            return section.fieldIds.map((fieldId) => {
              const field = allFields.find((entry) => entry.id === fieldId);
              if (!field) return null;

              const loginField = {
                ...field,
                labelVariant: "floating" as const,
                placeholder: undefined,
              };

              return (
                <FieldRenderer
                  key={field.id}
                  field={loginField}
                  control={control}
                  errors={errors}
                />
              );
            });
          })}
        </Stack>

        <Button
          type="submit"
          variant="contained"
          size="large"
          fullWidth
          sx={{
            py: 1.45,
            fontSize: "1rem",
            fontWeight: 800,
            textTransform: "none",
            boxShadow: "0 14px 28px rgba(0, 0, 0, 0.16)",
          }}
        >
          {requirementText("application.ui.log-in")}</Button>
      </Stack>
    </Box>
  );
}
