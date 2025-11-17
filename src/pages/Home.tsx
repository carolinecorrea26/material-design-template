import * as React from "react";
import { Card, CardContent, Stack, Typography, Button } from "@mui/material";
import { Link } from "react-router-dom";

export default function Home() {
  return (
    <Stack spacing={2}>
      <Typography variant="h3">Welcome</Typography>
      <Typography variant="body1">
        This is the starting point. We’ll replace this with the first page defined in the
        <strong> Site Functionality Details </strong> document in Step 2.
      </Typography>

      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Next Step
          </Typography>
          <Typography variant="body2" gutterBottom>
            We’ll enumerate pages and routes from the doc, then wire them here.
          </Typography>
          <Button component={Link} to="/" variant="contained">
            Placeholder CTA
          </Button>
        </CardContent>
      </Card>
    </Stack>
  );
}
