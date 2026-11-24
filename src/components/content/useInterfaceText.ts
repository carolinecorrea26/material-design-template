import { useComponentContent } from './ComponentContentContext';
import { requirementText } from '../../domain/requirementContent';

/** Shared interface copy uses the installed projection, including later revisions. */
export function useInterfaceText() {
  const copy = useComponentContent().shared.interfaceMessages;
  return (key: string, variables: Record<string, string> = {}) => requirementText('value', variables, { value: copy[key] });
}
