import lists from '../../requirements/global/option-lists.json';
/** Boolean readouts use shared field choices, not page-specific CMS copy. */
export function booleanAnswerLabel(value: boolean): string {
  return lists['yes-no'].find(option => option.value === (value ? 'yes' : 'no'))!.label;
}
