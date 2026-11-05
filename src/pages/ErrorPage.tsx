import { useApplicationForm } from '../app/ApplicationFormContext';
import { useApplicationSession } from '../app/ApplicationSessionContext';
import ApplicationErrorState, { type ApplicationErrorStatus } from '../components/feedback/ApplicationErrorState';
import { useLocation } from 'react-router-dom';
import { recoveryIncident, type RecoveryIncident } from '../domain/recoveryIncident';

export default function ErrorPage({ status = 404, incident }: { status?: ApplicationErrorStatus; incident?: RecoveryIncident }) {
  const { resetValues } = useApplicationForm();
  const { resetApplicationSession } = useApplicationSession();
  const location = useLocation();
  const state = location.state as { recoveryIncident?: unknown } | null;
  const context = incident ?? (state?.recoveryIncident ? recoveryIncident(state.recoveryIncident) : undefined);
  return <ApplicationErrorState status={status} incident={context} onStartNew={() => { resetValues(); resetApplicationSession(); }} />;
}
