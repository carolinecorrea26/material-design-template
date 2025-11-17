import * as React from "react";
import { Card, CardContent, Stack, Typography } from "@mui/material";
import PageHeader from "../components/layout/PageHeader";

export default function Consent() {
  return (
    <Stack spacing={2}>
      <PageHeader title="Consent" />
      <Card>
        <CardContent>
          <Typography variant="body1">
            Stub only. Read & Sign; Electronic Consent for Self (and Spouse if applicable).
          </Typography>
        </CardContent>
      </Card>
    </Stack>
  );
}
