import { Typography } from "@mui/material";
import FormRoutePage from "../components/page/RoutePage";

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
