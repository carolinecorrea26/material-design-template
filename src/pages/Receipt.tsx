import * as React from "react";
import { Card, CardContent, Stack, Typography, Button } from "@mui/material";
import PageHeader from "../components/layout/PageHeader";
import { Link as RouterLink } from "react-router-dom";

export default function Receipt() {
  return (
    <Stack spacing={2}>
      <PageHeader title="Receipt" />
      <Card>
        <CardContent>
          <Typography variant="body1" gutterBottom>
            Stub only. Show receipt, download application link, and next steps (infographic placeholder).
          </Typography>
          <Button component={RouterLink} to="/" variant="contained">Return Home</Button>
        </CardContent>
      </Card>
    </Stack>
  );
}
