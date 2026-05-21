import { Box, Button, Stack, Tab, Tabs, Typography } from "@mui/material";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
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
      formMaxWidth={400}
      noTitle
      noContainer
      hideActions
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
    <Box
      sx={{
        width: "100%",
        borderRadius: "28px",
        backgroundColor: "#ffffff",
        boxShadow: "0 24px 70px rgba(15, 23, 42, 0.12)",
        px: { xs: 3, sm: 4 },
        py: { xs: 3.5, sm: 4 },
        mt: { xs: 3, sm: 4 },
      }}
    >
      <Stack spacing={2.5}>
        <Box>
          <Typography
            component="h1"
            sx={{
              color: "text.primary",
              fontSize: { xs: "1.25rem", sm: "1.5rem" },
              fontWeight: 700,
              lineHeight: 1.1,
              letterSpacing: "-0.04em",
              mb: 0.75,
            }}
          >
            Advisor Login
          </Typography>

          <Typography
            variant="body1"
            sx={{
              color: "text.secondary",
              fontSize: "1rem",
              lineHeight: 1.5,
            }}
          >
            Start or continue an application below.
          </Typography>
        </Box>

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
          <Tab label="New" value="new" />
          <Tab label="Saved" value="saved" />
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
                helperText: undefined,
              };

              return (
                <FieldRenderer
                  key={field.id}
                  field={loginField}
                  control={control}
                  errors={errors}
                  // margin="dense"
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
    </Box>
  );
}
