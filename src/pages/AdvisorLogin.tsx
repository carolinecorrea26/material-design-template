import {
  Avatar,
  Box,
  Button,
  Stack,
  Tab,
  Tabs,
  Typography,
} from "@mui/material";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import SupportAgentRoundedIcon from "@mui/icons-material/SupportAgentRounded";
import FormRoutePage, {
  isSectionVisible,
  type FormRouteRenderProps,
} from "../app/RoutePage";
import FieldRenderer from "../components/forms/FieldRenderer";
import { getPageTitle, getPageSubhead } from "../config/pages";

export default function AdvisorLogin() {
  return (
    <FormRoutePage
      pageId="advisor-login"
      formMaxWidth={500}
      hideActions
      noTitle
      resolveNextPageId={(values) =>
        values["advisor-flow-type"] === "saved" ? "resume" : "membership"
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
    <Box sx={{ p: { xs: "24px 0", lg: "32px 0" } }}>
      <Stack spacing={2.5} alignItems="center">
        <Avatar
          sx={{
            bgcolor: (theme) => theme.palette.primary.light + "22",
            width: 72,
            height: 72,
          }}
        >
          <SupportAgentRoundedIcon
            sx={{ color: "primary.main", fontSize: 48 }}
          />
        </Avatar>

        <Box sx={{ textAlign: "center" }}>
          <Typography variant="formPageTitle">
            {getPageTitle("advisor-login")}
          </Typography>
          {getPageSubhead("advisor-login") && (
            <Typography variant="subtitle1" mt={0.5}>
              {getPageSubhead("advisor-login")}
            </Typography>
          )}
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
          <Tab label="Start New" value="new" />
          <Tab label="Continue Saved" value="saved" />
        </Tabs>

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
          startIcon={<LockOutlinedIcon />}
          sx={{
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
