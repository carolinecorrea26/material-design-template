import * as React from "react";
import { Card, CardContent, Stack, Typography } from "@mui/material";
import PageHeader from "../../components/layout/PageHeader";

export default function Payment() {
  return (
    <Stack spacing={2}>
      <PageHeader title="Payment" />
      <Card>
        <CardContent>
          <Typography variant="body1">
            Stub only. Payment method/frequency per product; estimated cost
            calculation (Step 6/7, per doc).
          </Typography>
        </CardContent>
      </Card>
    </Stack>
  );
}
