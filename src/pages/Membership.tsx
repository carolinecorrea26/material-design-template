import { Alert, Box, Stack, Typography } from "@mui/material";

import { getActiveClient } from "../client/getActiveClient";
import FieldRenderer from "../components/form/FieldRenderer";
import FormRoutePage from "../components/form/FormRoutePage";
import FormPageHelp from "../components/form/FormPageHelp";
import CostEstimateDrawerContent from "../components/common/CostEstimateDrawerContent";
import {
  coverageOptionsAvailableHelpItem,
  // groupInsuranceHelpItem,
  howApplyingWorksHelpItem,
} from "../content/helpContent";

export default function Membership() {
  const client = getActiveClient();
  const pageId = "membership";

  const helpItems = [
    coverageOptionsAvailableHelpItem,
    howApplyingWorksHelpItem,
    {
      id: "estimate-cost",
      label: "How much does it cost?",
      title: "How much does it cost?",
      content: <CostEstimateDrawerContent />,
    },
    // groupInsuranceHelpItem(client.branding.name),
  ];

  return (
    <FormRoutePage
      pageId={pageId}
      help={<FormPageHelp items={helpItems} />}
      initialTransitionMessage="Loading your membership application..."
    >
      {({ control, errors, watchedValues, allFields }) => {
        const membershipField = allFields.find(
          (field) => field.id === "membership",
        );
        const remainingFields = allFields.filter(
          (field) => field.id !== "membership",
        );

        const membershipValue = watchedValues.membership;

        const showMembershipIneligibleAlert =
          client.id !== "ama" &&
          client.id !== "waepa" &&
          membershipValue === "no";

        const showMembershipFollowUpFields =
          client.id === "ama"
            ? Boolean(membershipValue)
            : client.id === "waepa"
              ? membershipValue === "current" || membershipValue === "new"
              : membershipValue === "yes";

        const hasTitleField = remainingFields.some(
          (field) => field.id === "title",
        );

        return (
          <>
            {membershipField && (
              <FieldRenderer
                key={membershipField.id}
                field={membershipField}
                control={control}
                errors={errors}
              />
            )}

            {showMembershipIneligibleAlert && (
              <Alert severity="warning" sx={{ mt: 2 }}>
                <Stack spacing={2}>
                  <Typography variant="body2">
                    Membership is required to apply for coverage through{" "}
                    {client.branding.name}. If you&apos;re unsure of your
                    membership status, here are some ways to confirm:
                  </Typography>

                  <Box>
                    <Typography
                      variant="subtitle2"
                      sx={{ fontWeight: 700, mb: 1 }}
                    >
                      Check your membership
                    </Typography>
                    <Stack component="ul" spacing={1} sx={{ m: 0, pl: 2.5 }}>
                      <Typography component="li" variant="body2">
                        Look for a membership card or welcome email from your
                        association.
                      </Typography>
                      <Typography component="li" variant="body2">
                        Check if you receive association newsletters, journals,
                        or other member communications.
                      </Typography>
                      <Typography component="li" variant="body2">
                        Log in to your association&apos;s member portal to
                        verify your status.
                      </Typography>
                    </Stack>
                  </Box>

                  <Box>
                    <Typography
                      variant="subtitle2"
                      sx={{ fontWeight: 700, mb: 1 }}
                    >
                      Not yet a member?
                    </Typography>
                    <Typography variant="body2">
                      You can apply for membership with your association to
                      become eligible for coverage. Contact{" "}
                      {client.branding.name}
                      or visit your association&apos;s website to learn about
                      membership options and how to join.
                    </Typography>
                  </Box>

                  {client.support.website && (
                    <Typography variant="body2">
                      For more information, visit{" "}
                      <Typography
                        component="a"
                        href={`https://${client.support.website}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        sx={{
                          color: "primary.main",
                          textDecoration: "underline",
                          font: "inherit",
                        }}
                      >
                        {client.support.website}
                      </Typography>{" "}
                      or call {client.support.phoneDisplay}.
                    </Typography>
                  )}
                </Stack>
              </Alert>
            )}

            {showMembershipFollowUpFields && (
              <>
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: {
                      xs: "1fr",
                      sm: hasTitleField ? "120px 1fr 1fr" : "1fr 1fr",
                    },
                    gap: { xs: 0, sm: 2 },
                  }}
                >
                  {remainingFields
                    .filter((field) =>
                      ["title", "first-name", "last-name"].includes(field.id),
                    )
                    .map((field) => (
                      <FieldRenderer
                        key={field.id}
                        field={field}
                        control={control}
                        errors={errors}
                      />
                    ))}
                </Box>

                {remainingFields
                  .filter(
                    (field) =>
                      !["title", "first-name", "last-name"].includes(field.id),
                  )
                  .map((field) => (
                    <FieldRenderer
                      key={field.id}
                      field={field}
                      control={control}
                      errors={errors}
                    />
                  ))}
              </>
            )}
          </>
        );
      }}
    </FormRoutePage>
  );
}
