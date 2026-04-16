import type { ReactNode } from "react";

type FormBodyProps = {
  children: ReactNode;
};

export default function FormBody({ children }: FormBodyProps) {
  return <div>{children}</div>;
}
