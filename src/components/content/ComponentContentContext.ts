import { createContext, useContext } from 'react';
import { getPrototypeLibrary } from '../../domain/prototypeLibrary';
import type { SiteContent } from '../../content/types';
import * as defaults from '../../content/defaults';
const defaultContent: SiteContent = {
  home: defaults.homeDefaults, coverage: defaults.coverageDefaults, navigation: defaults.navigationDefaults,
  footer: defaults.footerDefaults, review: defaults.reviewDefaults, receipt: defaults.receiptDefaults,
  help: defaults.helpDefaults, shared: defaults.sharedDefaults, pages: defaults.pagesDefaults,
  beneficiary: defaults.beneficiaryDefaults, dialogs: defaults.dialogsDefaults, statusMessages: defaults.statusMessagesDefaults,
};
/** Explicit presentation content. Standalone components always have static defaults. */
export const ComponentContentContext = createContext<SiteContent | undefined>(undefined);
export const useComponentContent = () => useContext(ComponentContentContext) ?? getPrototypeLibrary()?.content ?? defaultContent;
