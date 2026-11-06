import { Alert, Box, Stack } from "@mui/material";
import { useForm } from "react-hook-form";
import type { FieldDefinition } from "../../config/fields/types";
import AddressFields from "../forms/AddressFields";
import AppModal from "../layout/AppModal";

export default function VerificationAddress({ fields, values, onContinue, onClose }: {
  fields: FieldDefinition[];
  values: Record<string, unknown>;
  onContinue: (address: Record<string, string | boolean | string[]>) => void;
  onClose: () => void;
}) {
  const form = useForm<Record<string, string | boolean | string[]>>({
    defaultValues: Object.fromEntries(fields.map(field => [field.id, String(values[field.id] ?? "")])),
  });
  return <AppModal open onClose={onClose} title="Confirm your address" maxWidth={680}
    actions={[{ label: "Continue to member verification", onClick: () => { void form.handleSubmit(onContinue)(); } }, { label: "Cancel", onClick: onClose, variant: "text" }]}>
    <Stack spacing={2}>
      <Alert severity="info">Please provide your full residential address before continuing to member verification.</Alert>
      <Box component="form" noValidate onSubmit={form.handleSubmit(onContinue)}>
        <AddressFields fields={fields} control={form.control} errors={form.formState.errors} />
      </Box>
    </Stack>
  </AppModal>;
}
