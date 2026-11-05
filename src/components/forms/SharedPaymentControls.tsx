import type { FieldDefinition } from "../../config/fields/types";
import { useEffect } from "react";
import { Alert, Stack } from "@mui/material";
import type { FormRouteRenderProps } from "../../app/RoutePage";
import { SHARED_FREQUENCY_FIELD, type sharedPaymentState } from "../../domain/sharedPaymentChoices";
import FieldRenderer from "./FieldRenderer";

type Props = Pick<FormRouteRenderProps, "control" | "errors" | "setValue"> & { state: ReturnType<typeof sharedPaymentState>; methodField?: FieldDefinition; frequencyField?: FieldDefinition };
export default function SharedPaymentControls({ control, errors, setValue, state, methodField, frequencyField }: Props) {
  const serializedUpdates = JSON.stringify(state.updates);
  useEffect(() => {
    const updates = JSON.parse(serializedUpdates) as Record<string, string>;
    for (const [key, value] of Object.entries(updates)) setValue(key, value, { shouldDirty: true, shouldValidate: true });
  }, [serializedUpdates, setValue]);
  return <Stack spacing={2}>
    {state.shareMethod && methodField && <>
      <FieldRenderer control={control} errors={errors} field={methodField} />
      {!state.methodOptions.length && <Alert severity="warning">These products do not have a payment method in common. Contact us for help with payment options.</Alert>}
    </>}
    {state.shareFrequency && state.updates[SHARED_FREQUENCY_FIELD] === undefined && frequencyField && <>
      <FieldRenderer control={control} errors={errors} field={{ ...frequencyField, disabled: !state.frequencyOptions.length }} />
      {!state.frequencyOptions.length && <Alert severity="info">Select payment methods with a frequency available for every product.</Alert>}
    </>}
  </Stack>;
}
