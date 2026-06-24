import { Typography } from "@mui/material";
import FormRoutePage from "../components/page/RoutePage";

export default function HealthDi() {
  return (
    <FormRoutePage pageId="health-di">
      {() => (
        <Typography variant="body2" color="text.secondary">
          This page is a placeholder for future health questions.
        </Typography>
      )}
    </FormRoutePage>
  );
}
