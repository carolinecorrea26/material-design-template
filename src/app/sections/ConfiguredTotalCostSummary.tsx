import { useContext, type ComponentProps } from 'react';
import TotalCostSummary from '../../components/coverage/TotalCostSummary';
import { ApplicationFormContext } from '../ApplicationFormContext';
import { getPrototypeLibrary } from '../../domain/prototypeLibrary';
import { associationRatesSuppressed, resolveRatePresentation } from '../../domain/ratePresentation';
export default function ConfiguredTotalCostSummary(props: ComponentProps<typeof TotalCostSummary>) {
  const application = useContext(ApplicationFormContext), library = getPrototypeLibrary();
  return <TotalCostSummary {...props}
    display={library && associationRatesSuppressed(library.site, application?.values ?? {}) ? { status: 'hidden' } : props.display}
    items={props.items.map(item => {
      const reference = library ? resolveRatePresentation(library.site, item.id).referenceTable : undefined;
      return reference && !item.display ? { ...item, display: { status: 'reference-table', table: reference } } : item;
    })} />;
}

export type { TotalCostSummaryItem } from "../../components/coverage/TotalCostSummary";
