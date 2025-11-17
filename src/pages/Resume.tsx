import * as React from "react";
import { Card, CardContent, Stack, Typography } from "@mui/material";
import PageHeader from "../components/layout/PageHeader";

export default function Resume() {
  return (
    <Stack spacing={2}>
      <PageHeader title="Resume Application" />
      <Card>
        <CardContent>
          <Typography variant="body1">
            Stub only. Email → secure link sent → phone code → resume to last saved step.
          </Typography>
        </CardContent>
      </Card>
    </Stack>
  );
}
