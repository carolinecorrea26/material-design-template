import { useContext } from 'react';
import EstimatedRate, { type EstimatedRateProps } from '../../components/coverage/EstimatedRate';
import { ApplicationFormContext } from '../ApplicationFormContext';
import { getPrototypeLibrary } from '../../domain/prototypeLibrary';
import { associationRatesSuppressed } from '../../domain/ratePresentation';
export default function ConfiguredEstimatedRate(props: EstimatedRateProps) {
  const application = useContext(ApplicationFormContext), library = getPrototypeLibrary();
  return <EstimatedRate {...props} display={library && associationRatesSuppressed(library.site, application?.values ?? {}) ? { status: 'hidden' } : props.display} />;
}
