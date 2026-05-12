import { type ReactNode } from "react";
import { Box, Stack } from "@mui/material";
import FormPageActions from "./FormPageActions";
import FormPageContent from "./FormPageContent";
import FormPageError from "./FormPageError";
import FormPageTitle from "./FormPageTitle";
import FormShell from "../layout/FormShell";

type FormPageProps = {
  title: string;
  children?: ReactNode;
  help?: ReactNode;
  actions?: ReactNode;
  error?: string;
  maxWidth?: number | string;
};

export default function FormPage({
  title,
  children,
  help,
  actions,
  error,
  maxWidth = 700,
}: FormPageProps) {
  return (
    <Stack
      spacing={2}
      sx={{ flex: 1, alignItems: "center", justifyContent: "flex-start" }}
    >
      <Box sx={{ width: "100%", maxWidth }}>
        <FormShell
          header={
            title ? (
              <Stack spacing={1} sx={{ padding: "0 0.5rem" }}>
                <FormPageTitle title={title} />
                {error && <FormPageError message={error} />}
                {help}
              </Stack>
            ) : undefined
          }
          body={<FormPageContent>{children}</FormPageContent>}
          footer={<FormPageActions>{actions}</FormPageActions>}
        />
      </Box>
    </Stack>
  );
}
