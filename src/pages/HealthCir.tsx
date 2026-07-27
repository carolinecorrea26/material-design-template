import { Typography } from "@mui/material";
import FormRoutePage from "../app/RoutePage";

export default function HealthCir() {
  return (
    <FormRoutePage pageId="health-cir">
      {() => (
        <Typography variant="body2" color="text.secondary">
          This page is a placeholder for CIR health questions.
        </Typography>
      )}
    </FormRoutePage>
  );
}
