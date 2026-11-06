import { expect, it } from "vitest";
import { normalizeChildValues } from "./ApplicationFormContext";

it("migrates legacy child answers without overwriting newer answers", () => {
  const values = { children: [{ firstName: "Old", "child-first-name": "New", lastName: "Name", birthDate: "2015-01-01", gender: "female", fullTimeStudent: "yes", honorablyDischargedServiceMember: "no", other: "kept" }] };
  expect(normalizeChildValues(values)).toEqual({ children: [{ "child-first-name": "New", "child-last-name": "Name", "child-birth-date": "2015-01-01", "child-gender": "female", "child-full-time-student": "yes", "child-honorably-discharged-service-member": "no", other: "kept" }] });
  expect(values.children[0].firstName).toBe("Old");
});
