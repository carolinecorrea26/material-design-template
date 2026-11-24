import FormFieldDefinitions from '../src/components/forms/FormFieldDefinitions';
import { useState, type ReactNode } from "react";
import { useForm } from "react-hook-form";
import { Box, Button, Typography } from "@mui/material";
import type { ApplicationFormValues } from "../src/app/ApplicationFormContext";
import type { resolveActiveAssociationFromApplication } from "../src/data";
import type { FormRouteRenderProps } from "../src/app/RoutePage";
import ComponentFixture from "./fixtures/ComponentFixture";
import type { PrototypeLibrary } from "../src/domain/prototypeLibrary";
import type { TemplateCapability, MembershipExampleConfiguration } from "../src/dev/storybook/globalTemplate";
import type { ClientConfig } from "../src/config/clients/types";
import type { FieldDefinition } from "../src/domain/fields";
import type { PageSectionComponent } from "../src/config/pageSections/types";
import { resolveAssociationMembershipField } from '../src/config/clientFields/getClientPageFields';
import type { Site } from '../src/data';

type Values = Record<string, string | boolean | string[]>;
type Props = {
  capability?: TemplateCapability;
  membership?: MembershipExampleConfiguration;
  initialValues?: Values;
  children: (props: Pick<FormRouteRenderProps, "control" | "errors" | "setValue" | "allFields"> & {
    values: ApplicationFormValues;
    client: ClientConfig;
    componentFields: (type: string) => FieldDefinition[];
    associationResolution: ReturnType<typeof resolveActiveAssociationFromApplication>;
  }) => ReactNode;
};

// Detached authored fields and local validation; no membership/participation gate.
export default function MembershipStoryForm({ capability, membership, ...props }: Props) {
  return <ComponentFixture capability={capability} membership={membership}>{fixture => <MembershipForm {...props} fixture={fixture} />}</ComponentFixture>;
}
function MembershipForm({ initialValues = {}, children, fixture }: Omit<Props, 'capability'> & { fixture: PrototypeLibrary }) {
  const form = useForm<Values>({ defaultValues: initialValues, mode: "onBlur" });
  const values = form.watch();
  const [validated, setValidated] = useState(false);
  const client = fixture.client;
  const associationResolution = { status: 'resolved' as const, association: fixture.associationContext.allAssociations[0] } as ReturnType<typeof resolveActiveAssociationFromApplication>;
  const page = fixture.site.configuration.pages.find(page => page.key === 'membership')!;
  const allFields = page.fields.filter(row => row.included).map(row => resolveAssociationMembershipField(row.definition,
    { id: fixture.site.siteKey, associationSelection: fixture.associationContext.selection } as Site,
    fixture.associationContext.associations, associationResolution));
  const componentFields = (type: string) => {
    const find = (nodes: PageSectionComponent[]): string[] => nodes.flatMap(node => node.type === type ? node.fieldIds ?? [] : find(node.components ?? []));
    const section = page.sections.find(section => section.definition.value.composition?.some(node => node.type === type));
    const ids = section?.definition.value.fieldIds ?? page.sections.flatMap(section => find(section.definition.value.composition ?? []));
    return ids.flatMap(id => allFields.filter(field => field.id === id));
  };
  return (
    <FormFieldDefinitions fields={allFields}><Box component="form" noValidate onSubmit={form.handleSubmit(() => setValidated(true), () => setValidated(false))} sx={{ width: "100%", maxWidth: 640, mx: "auto", p: { xs: 2, sm: 4 } }}>
      {children({ control: form.control, errors: form.formState.errors, setValue: form.setValue, allFields, componentFields, values, client, associationResolution })}
      <Button type="submit" variant="outlined" sx={{ mt: 3 }}>Check required fields</Button>
      <Typography role="status" variant="body2" sx={{ mt: 1 }}>{validated ? "Required fields are complete." : ""}</Typography>
    </Box></FormFieldDefinitions>
  );
}
