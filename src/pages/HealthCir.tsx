import { Typography } from "@mui/material";
import FormRoutePage from "../app/RoutePage";
import { getContent } from "../content";

export default function HealthCir() {
  const content = getContent().statusMessages.healthCir;
  return (
    <FormRoutePage pageId="health-cir">
      {() => (
        <Typography variant="body2" color="text.secondary">
          {content.body}
        </Typography>
      )}
    </FormRoutePage>
  );
}
