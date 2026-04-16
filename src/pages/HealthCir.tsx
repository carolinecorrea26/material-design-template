import { Typography } from "@mui/material";
import FormRoutePage from "../components/form/FormRoutePage";

export default function HealthCir() {
  return (
    <FormRoutePage pageId="health-cir">
      {() => (
        <Typography variant="body2" color="text.secondary">
          This page is a placeholder for future health questions.
        </Typography>
      )}
    </FormRoutePage>
  );
}
