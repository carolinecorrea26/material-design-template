import { Alert, Box } from "@mui/material";

type PageErrorAlertProps = {
  /** Error message to display. Renders nothing when undefined. */
  error?: string;
};

export default function PageErrorAlert({ error }: PageErrorAlertProps) {
  if (!error) return null;

  return (
    <Box sx={{ mb: 2 }}>
      <Alert severity="error" sx={{ width: "100%" }}>
        {error}
      </Alert>
    </Box>
  );
}
