import { paymentControlField } from "../../config/fields/storedSurfaces";
import { useEffect } from "react";
import { Alert, Stack } from "@mui/material";
import type { FormRouteRenderProps } from "../../app/RoutePage";
import { SHARED_METHOD_FIELD, SHARED_FREQUENCY_FIELD, type sharedPaymentState } from "../../domain/sharedPaymentChoices";
import FieldRenderer from "./FieldRenderer";

type Props = Pick<FormRouteRenderProps, "control" | "errors" | "setValue"> & { state: ReturnType<typeof sharedPaymentState> };
export default function SharedPaymentControls({ control, errors, setValue, state }: Props) {
  const serializedUpdates = JSON.stringify(state.updates);
  useEffect(() => {
    const updates = JSON.parse(serializedUpdates) as Record<string, string>;
    for (const [key, value] of Object.entries(updates)) setValue(key, value, { shouldDirty: true, shouldValidate: true });
  }, [serializedUpdates, setValue]);
  return <Stack spacing={2}>
    {state.shareMethod && paymentControlField("payment-shared-method", SHARED_METHOD_FIELD, state.methodOptions) && <>
      <FieldRenderer control={control} errors={errors} field={paymentControlField("payment-shared-method", SHARED_METHOD_FIELD, state.methodOptions)!} />
      {!state.methodOptions.length && <Alert severity="warning">These products do not have a payment method in common. Contact us for help with payment options.</Alert>}
    </>}
    {state.shareFrequency && state.updates[SHARED_FREQUENCY_FIELD] === undefined && paymentControlField("payment-shared-frequency", SHARED_FREQUENCY_FIELD, state.frequencyOptions) && <>
      <FieldRenderer control={control} errors={errors} field={{ ...paymentControlField("payment-shared-frequency", SHARED_FREQUENCY_FIELD, state.frequencyOptions)!, disabled: !state.frequencyOptions.length }} />
      {!state.frequencyOptions.length && <Alert severity="info">Select payment methods with a frequency available for every product.</Alert>}
    </>}
  </Stack>;
}
