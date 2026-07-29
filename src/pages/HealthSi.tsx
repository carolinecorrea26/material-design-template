import { Typography } from "@mui/material";
import FormRoutePage from "../app/RoutePage";

export default function HealthSi() {
  return (
    <FormRoutePage pageId="health-si">
      {() => (
        <Typography variant="body2" color="text.secondary">
          This page is a placeholder for SI health questions.
        </Typography>
      )}
    </FormRoutePage>
  );
}
