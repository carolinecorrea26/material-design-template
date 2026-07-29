import { type ReactNode } from "react";
import { Alert, Box, Stack } from "@mui/material";
import PageTitle from "./Title";

type PageLayoutProps = {
  title: ReactNode;
  subhead?: ReactNode;
  children?: ReactNode;
  help?: ReactNode;
  actions?: ReactNode;
  error?: string;
  maxWidth?: number | string;
  onBack?: () => void;
  aboveHeader?: ReactNode;
  headerOverride?: ReactNode;
  noTitle?: boolean;
  noContainer?: boolean;
};

export default function PageLayout({
  title,
  subhead,
  children,
  help,
  actions,
  error,
  maxWidth = 700,
  onBack,
  aboveHeader,
  headerOverride,
  noTitle,
}: PageLayoutProps) {
  return (
    <Stack
      spacing={2}
      sx={{ flex: 1, alignItems: "center", justifyContent: "flex-start" }}
    >
      <Box sx={{ width: "100%", maxWidth }}>
        <Stack spacing={0}>
          {aboveHeader}
          <Stack spacing={2}>
            {headerOverride ??
              (!noTitle && title ? (
                <Stack spacing={1} sx={{ padding: "0 0.5rem" }}>
                  <PageTitle
                    title={title}
                    subhead={subhead}
                    onBack={onBack}
                  />
                  {error && (
                    <Alert severity="error" sx={{ width: "100%" }}>
                      {error}
                    </Alert>
                  )}
                  {help}
                </Stack>
              ) : undefined)}
            <Box sx={{ width: "100%" }}>{children}</Box>
            <Box>
              <Stack
                direction="row"
                spacing={1.5}
                justifyContent="flex-end"
                alignItems="center"
              >
                {actions}
              </Stack>
            </Box>
          </Stack>
        </Stack>
      </Box>
    </Stack>
  );
}
