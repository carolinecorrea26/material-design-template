import * as React from "react";
import { Card, CardContent, Stack, Typography } from "@mui/material";
import PageHeader from "../components/layout/PageHeader";

export default function Preview() {
  return (
    <Stack spacing={2}>
      <PageHeader title="Preview" />
      <Card>
        <CardContent>
          <Typography variant="body1">
            Stub only. Read-only review with Edit links. Lock notice appears when proceeding (Step 6).
          </Typography>
        </CardContent>
      </Card>
    </Stack>
  );
}
