import FieldGrid from '../layout/FieldGrid';
import { requirementText } from '../../domain/requirementContent';
import type { FieldDefinition } from "../../config/fields/types";
import { useEffect } from "react";
import { Alert } from "@mui/material";
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
  return <FieldGrid>
    {state.shareMethod && methodField && <>
      <FieldRenderer control={control} errors={errors} field={methodField} />
      {!state.methodOptions.length && <Alert severity="warning">{requirementText('payment.shared.no-common-method')}</Alert>}
    </>}
    {state.shareFrequency && state.updates[SHARED_FREQUENCY_FIELD] === undefined && frequencyField && <>
      <FieldRenderer control={control} errors={errors} field={{ ...frequencyField, disabled: !state.frequencyOptions.length }} />
      {!state.frequencyOptions.length && <Alert severity="info">{requirementText('payment.shared.no-common-frequency')}</Alert>}
    </>}
  </FieldGrid>;
}
