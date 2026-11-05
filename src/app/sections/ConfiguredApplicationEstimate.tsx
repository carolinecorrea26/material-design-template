import type { ReactNode } from 'react';
import ApplicationEstimate from '../../components/coverage/ApplicationEstimate';
import type { ApplicationFormValues } from '../ApplicationFormContext';
import { useApplicationForm } from '../ApplicationFormContext';
import { useApplicationEstimates } from '../estimates/useApplicationEstimates';
export default function ConfiguredApplicationEstimate({ actions, values: currentValues }: { actions?: ReactNode; values?: ApplicationFormValues }) {
  const { values } = useApplicationForm();
  const estimate = useApplicationEstimates(currentValues ?? values);
  return <ApplicationEstimate {...estimate} actions={actions} />;
}
