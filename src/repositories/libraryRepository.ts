import { getPageDefinitions } from "../config/pages";
import { fieldCatalog } from "../config/fields";
import { pageFieldOrder } from "../config/fields/pageFieldOrder";
import { coverages } from "../config/coverages";
import { coverageCategories } from "../config/coverageCategories";
import { allFlows } from "../content/docs/flows";
import { configurationsData } from "../content/docs/configurations";
import { siteRules } from "../content/docs/siteRules";
import { urlParameters } from "../content/docs/urlParameters";
import { cmsEntries } from "../content/docs/cmsEntries";
import { featuresData } from "../content/docs/features";
import { patternCatalog } from "../domain/libraryCatalog";
import { flagCatalog } from "../domain/libraryCatalog";

export const curatedLibrarySnapshot = { get pages() { return getPageDefinitions(); }, fieldCatalog, pageFieldOrder, coverages, coverageCategories, allFlows, configurationsData, siteRules, urlParameters, cmsEntries, featuresData, patternCatalog, flagCatalog };
export type LibrarySnapshot = { [K in keyof typeof curatedLibrarySnapshot]: typeof curatedLibrarySnapshot[K] extends unknown[] ? typeof curatedLibrarySnapshot[K] : typeof curatedLibrarySnapshot[K] extends readonly (infer Row)[] ? readonly Row[] : typeof curatedLibrarySnapshot[K] };
export interface LibraryReadAdapter { read(): LibrarySnapshot }
export function createLibraryRepository(adapter: LibraryReadAdapter) {
  const snapshot = adapter.read();
  return { read<K extends keyof LibrarySnapshot>(catalog: K): LibrarySnapshot[K] { return snapshot[catalog]; } };
}
export const libraryRepository = createLibraryRepository({ read: () => curatedLibrarySnapshot });
