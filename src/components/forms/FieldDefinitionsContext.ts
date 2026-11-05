import { createContext } from "react";
import type { FieldDefinition } from "../../config/fields/types";
/** Optional authored sibling definitions (e.g. phone type); no business rules or applicant state. */
export const FieldDefinitionsContext = createContext<FieldDefinition[] | undefined>(undefined);
