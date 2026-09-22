import type { PageId } from "../../types";
import { getActiveClient } from "../client/getActiveClient";
import type { ApplicationFormValues } from "../../app/ApplicationFormContext";
import { getPageFields } from "../fields/getPageFields";
import { fieldCatalog } from "../fields";
import type { FieldDefinition } from "../fields/types";
import { evaluateVisibilityRules } from "../pageSections/evaluateVisibilityRules";
import { membershipClientFields } from "./membership";

export function getClientPageFields(
  pageId: PageId,
  values?: ApplicationFormValues,
) {
  const client = getActiveClient();
  const baseFields = getPageFields(pageId);

  if (pageId !== "membership") {
    const clientPageConfig = client.fields[pageId];
    if (
      !clientPageConfig?.extra?.length &&
      !clientPageConfig?.overrides &&
      !clientPageConfig?.hidden?.length
    ) {
      return baseFields;
    }

    const overrides = clientPageConfig?.overrides ?? {};
    const mergedBase = baseFields.map((field) => {
      const override = overrides[field.id];
      return override ? { ...field, ...override } : field;
    });

    const extraFields = (clientPageConfig?.extra ?? [])
      .map((id) => {
        const base = fieldCatalog[id as keyof typeof fieldCatalog];
        if (!base) return null;
        const override = overrides[id];
        return override ? { ...base, ...override } : base;
      })
      .filter((f): f is FieldDefinition => Boolean(f));

    const hidden = new Set<string>(clientPageConfig?.hidden ?? []);
    return [...mergedBase, ...extraFields].filter(
      (field) => !hidden.has(field.id),
    );
  }

  const clientConfig = membershipClientFields[client.id];
  const overrides = clientConfig?.overrides ?? {};
  const extraFields = clientConfig?.extraFields ?? [];

  const mergedFields = baseFields.map((field) => {
    const override = overrides[field.id];

    if (!override) {
      return field;
    }

    return {
      ...field,
      ...override,
    };
  });

  const visibleFields = mergedFields.filter(
    (field) => !overrides[field.id]?.hidden,
  );

  const visibleExtraFields = extraFields.filter((field) =>
    evaluateVisibilityRules(field.visibleWhen, values ?? {}),
  );

  return [...visibleFields, ...visibleExtraFields];
}
