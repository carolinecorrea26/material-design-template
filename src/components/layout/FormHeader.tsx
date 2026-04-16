import type { ReactNode } from "react";
import { Stack } from "@mui/material";

type FormHeaderProps = {
  children: ReactNode;
};

export default function FormHeader({ children }: FormHeaderProps) {
  return <Stack spacing={0.5}>{children}</Stack>;
}
