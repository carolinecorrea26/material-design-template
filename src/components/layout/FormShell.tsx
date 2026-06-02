import type { ReactNode } from "react";
import { Stack } from "@mui/material";

type FormShellProps = {
  headerWide?: ReactNode;
  header?: ReactNode;
  body?: ReactNode;
  footer?: ReactNode;
};

export default function FormShell({
  headerWide,
  header,
  body,
  footer,
}: FormShellProps) {
  return (
    <Stack spacing={0}>
      {headerWide}
      <Stack spacing={2}>
        {header}
        {body}
        {footer}
      </Stack>
    </Stack>
  );
}
