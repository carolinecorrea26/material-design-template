import { Box, Tab, Tabs, Typography } from "@mui/material";
import FormRoutePage, {
  isSectionVisible,
  type FormRouteRenderProps,
} from "../components/form/FormRoutePage";
import FieldRenderer from "../components/form/FieldRenderer";

export default function AdvisorLogin() {
  return (
    <FormRoutePage
      pageId="advisor-login"
      title="Advisor Login"
      resolveNextPageId={(values) =>
        values["advisor-flow-type"] === "saved"
          ? "advisor-send-confirmation"
          : "eligibility"
      }
      defaultValueOverrides={{ "advisor-flow-type": "new" }}
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
    <>
      <Typography variant="body1" sx={{ color: "text.secondary", mb: 2 }}>
        Start a new application or resume a saved application below.
      </Typography>

      <Box sx={{ mb: 2 }}>
        <Tabs
          value={mode}
          onChange={(_, value: "new" | "saved") =>
            setValue("advisor-flow-type", value, {
              shouldDirty: true,
              shouldTouch: false,
              shouldValidate: false,
            })
          }
        >
          <Tab label="Start New" value="new" />
          <Tab label="Resume Saved" value="saved" />
        </Tabs>
      </Box>

      {pageSections.map((section) => {
        if (!isSectionVisible(section, watchedValues)) return null;

        return section.fieldIds.map((fieldId) => {
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
    </>
  );
}
