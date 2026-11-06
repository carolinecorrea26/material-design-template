import { requirementAnswerKey } from "../../domain/requirementFields";
import { fieldCatalog } from "./index";
export const childMapping = {
  fields: [
    fieldCatalog["child-first-name"],
    fieldCatalog["child-last-name"],
    fieldCatalog["child-birth-date"],
    fieldCatalog["child-gender"],
  ],
  fieldToKey: {
    "child-first-name": requirementAnswerKey("first-name", "child"),
    "child-last-name": requirementAnswerKey("last-name", "child"),
    "child-birth-date": requirementAnswerKey("birth-date", "child"),
    "child-gender": requirementAnswerKey("gender", "child"),
  } as const,
  gridFields: ["child-first-name", "child-last-name"],
};
