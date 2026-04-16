import { Alert } from "@mui/material";

type FormPageErrorProps = {
  message: string;
};

export default function FormPageError({ message }: FormPageErrorProps) {
  return (
    <Alert severity="error" sx={{ width: "100%" }}>
      {message}
    </Alert>
  );
}
