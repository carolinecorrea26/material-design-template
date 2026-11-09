import { Alert, Box, Link, Stack, Typography } from "@mui/material";
import type { ComponentProps } from "react";
import type { ClientConfig } from "../../config/clients/types";
import FieldRenderer from "../forms/FieldRenderer";
import { requirementText } from "../../domain/requirementContent";

type Props = Pick<ComponentProps<typeof FieldRenderer>, "control" | "errors"> & {
  membershipField?: ComponentProps<typeof FieldRenderer>["field"];
  client: ClientConfig;
  associationLinkError?: string;
  membershipIneligibility?: string;
  showMembershipIneligibleAlert: boolean;
  onMembershipChange?: ComponentProps<typeof FieldRenderer>["onValueChange"];
};

/** Membership question with the page's existing link, eligibility and non-member feedback. */
export default function MembershipStatus({ membershipField, client, control, errors,
  associationLinkError, membershipIneligibility, showMembershipIneligibleAlert, onMembershipChange }: Props) {
  const [beforeWebsite, afterWebsite] = requirementText("membership.not-member.website", { clientPhone: client.support.phoneDisplay ?? client.support.phone ?? "" }).split("{{clientWebsite}}");
  return <>
    {associationLinkError && (
      <Alert severity="error" sx={{ mb: 2 }}>
        {associationLinkError} Please request a valid application link.
      </Alert>
    )}
    {membershipIneligibility && (
      <Alert severity="error" sx={{ mb: 2 }}>
        {membershipIneligibility}
      </Alert>
    )}
    {membershipField && (
      <FieldRenderer
        key={membershipField.id}
        field={membershipField}
        control={control}
        errors={errors}
        onValueChange={onMembershipChange}
      />
    )}

    {showMembershipIneligibleAlert && (
      <Alert severity="warning" sx={{ mt: 2 }}>
        <Stack spacing={2}>
          <Typography variant="body2">
            {requirementText("membership.not-member.message")}
          </Typography>

          <Box>
            <Typography
              variant="subtitle2"
              sx={{ fontWeight: 700, mb: 1 }}
            >
              {requirementText("membership.not-member.heading")}
            </Typography>
            <Typography variant="body2">
              {requirementText("membership.not-member.body", { clientName: client.branding.name })}
            </Typography>
          </Box>

          {client.support.website && (
            <Typography variant="body2">
              {beforeWebsite}
              {afterWebsite !== undefined && <Link
                href={`https://${client.support.website}`}
                target="_blank"
                rel="noopener noreferrer"
                sx={{
                  font: "inherit",
                }}
              >
                {client.support.website}
              </Link>}
              {afterWebsite}
            </Typography>
          )}
        </Stack>
      </Alert>
    )}

  </>;
}
