import { useState, type ReactNode } from "react";
import { useForm } from "react-hook-form";
import { Box, Button, Typography } from "@mui/material";
import type { ApplicationFormValues } from "../src/app/ApplicationFormContext";
import type { resolveActiveAssociationFromApplication } from "../src/data";
import type { FormRouteRenderProps } from "../src/app/RoutePage";
import ComponentFixture from "./fixtures/ComponentFixture";
import type { PrototypeLibrary } from "../src/domain/prototypeLibrary";
import type { TemplateCapability } from "../src/dev/storybook/globalTemplate";
import type { ClientConfig } from "../src/config/clients/types";

type Values = Record<string, string | boolean | string[]>;
type Props = {
  capability?: TemplateCapability;
  initialValues?: Values;
  children: (props: Pick<FormRouteRenderProps, "control" | "errors" | "setValue" | "allFields"> & {
    values: ApplicationFormValues;
    client: ClientConfig;
    associationResolution: ReturnType<typeof resolveActiveAssociationFromApplication>;
  }) => ReactNode;
};

// Detached authored fields and local validation; no membership/participation gate.
export default function MembershipStoryForm({ capability, ...props }: Props) {
  return <ComponentFixture capability={capability}>{fixture => <MembershipForm {...props} fixture={fixture} />}</ComponentFixture>;
}
function MembershipForm({ initialValues = {}, children, fixture }: Omit<Props, 'capability'> & { fixture: PrototypeLibrary }) {
  const form = useForm<Values>({ defaultValues: initialValues, mode: "onBlur" });
  const values = form.watch();
  const [validated, setValidated] = useState(false);
  const client = fixture.client;
  const associationResolution = { status: 'resolved' as const, association: fixture.associationContext.allAssociations[0] } as ReturnType<typeof resolveActiveAssociationFromApplication>;
  const allFields = (fixture.site.configuration.pages.find(page => page.key === 'membership')?.fields ?? [])
    .filter(row => row.included).map(row => row.definition)
    .map(field => field.id === 'membership' && fixture.associationContext.selection?.mode === 'select' ? {
      ...field, label: 'I am a member of', inputType: 'searchable-select' as const,
      placeholder: 'Search or select association', options: fixture.associationContext.allAssociations.map(association => ({ value: association.id, label: association.name })),
    } : field);
  return (
    <Box component="form" noValidate onSubmit={form.handleSubmit(() => setValidated(true), () => setValidated(false))} sx={{ width: "100%", maxWidth: 640, mx: "auto", p: { xs: 2, sm: 4 } }}>
      {children({ control: form.control, errors: form.formState.errors, setValue: form.setValue, allFields, values, client, associationResolution })}
      <Button type="submit" variant="outlined" sx={{ mt: 3 }}>Check required fields</Button>
      <Typography role="status" variant="body2" sx={{ mt: 1 }}>{validated ? "Required fields are complete." : ""}</Typography>
    </Box>
  );
}
