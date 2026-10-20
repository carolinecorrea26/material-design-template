import { fieldCatalog } from "./index";
export const childMapping = {
  fields: [
    fieldCatalog["child-first-name"],
    fieldCatalog["child-last-name"],
    fieldCatalog["child-birth-date"],
    fieldCatalog["child-gender"],
  ],
  fieldToKey: {
    "child-first-name": "firstName",
    "child-last-name": "lastName",
    "child-birth-date": "birthDate",
    "child-gender": "gender",
  } as const,
  gridFields: ["child-first-name", "child-last-name"],
};
