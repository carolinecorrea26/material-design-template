import { Button, Stack, Tab, Tabs } from "@mui/material";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import FormRoutePage, {
  isSectionVisible,
  type FormRouteRenderProps,
} from "../components/page/RoutePage";
import FieldRenderer from "../components/fields/FieldRenderer";

export default function AdvisorLogin() {
  return (
    <FormRoutePage
      pageId="advisor-login"
      formMaxWidth={400}
      hideActions
      // title="Advisor Login"
      // subhead="Start or continue an application below."
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
    <Stack spacing={2.5}>
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
        aria-label="Advisor login type"
        sx={{
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
        <Tab label="Start" value="new" />
        <Tab label="Continue" value="saved" />
      </Tabs>

      <Stack spacing={2}>
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
        startIcon={<LockOutlinedIcon />}
        sx={{
          borderRadius: "12px",
          py: 1.45,
          fontSize: "1rem",
          fontWeight: 800,
          textTransform: "none",
          boxShadow: "0 14px 28px rgba(0, 0, 0, 0.16)",
        }}
      >
        Log in
      </Button>
    </Stack>
  );
}
