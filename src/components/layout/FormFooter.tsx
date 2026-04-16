import type { ReactNode } from "react";

type FormFooterProps = {
  children: ReactNode;
};

export default function FormFooter({ children }: FormFooterProps) {
  return <div>{children}</div>;
}
