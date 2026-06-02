import { type ReactNode } from "react";
import { Box, Stack } from "@mui/material";
import FormPageActions from "./FormPageActions";
import FormPageContent from "./FormPageContent";
import FormPageError from "./FormPageError";
import FormPageTitle from "./FormPageTitle";
import FormShell from "../layout/FormShell";

type FormPageProps = {
  title: ReactNode;
  subhead?: ReactNode;
  children?: ReactNode;
  help?: ReactNode;
  actions?: ReactNode;
  error?: string;
  maxWidth?: number | string;
  onBack?: () => void;
  compactTitle?: boolean;
  aboveHeader?: ReactNode;
  headerOverride?: ReactNode;
  noTitle?: boolean;
  noContainer?: boolean;
};

export default function FormPage({
  title,
  subhead,
  children,
  help,
  actions,
  error,
  maxWidth = 700,
  onBack,
  compactTitle,
  aboveHeader,
  headerOverride,
  noTitle,
  noContainer,
}: FormPageProps) {
  return (
    <Stack
      spacing={2}
      sx={{ flex: 1, alignItems: "center", justifyContent: "flex-start" }}
    >
      <Box sx={{ width: "100%", maxWidth }}>
        <FormShell
          headerWide={aboveHeader}
          header={
            headerOverride ??
            (!noTitle && title ? (
              <Stack spacing={1} sx={{ padding: "0 0.5rem" }}>
                <FormPageTitle
                  title={title}
                  subhead={subhead}
                  compact={compactTitle}
                  onBack={onBack}
                />
                {error && <FormPageError message={error} />}
                {help}
              </Stack>
            ) : undefined)
          }
          body={
            <FormPageContent noContainer={noContainer}>
              {children}
            </FormPageContent>
          }
          footer={<FormPageActions>{actions}</FormPageActions>}
        />
      </Box>
    </Stack>
  );
}
