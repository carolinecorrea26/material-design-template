import type { PageId } from "../../types/page";
import { getActiveClient } from "../../client/getActiveClient";
import type { ApplicationFormValues } from "../../state/ApplicationFormContext";
import { getPageFields } from "../fields/getPageFields";
import { membershipClientFields } from "./membership";

export function getClientPageFields(
  pageId: PageId,
  values?: ApplicationFormValues,
) {
  const client = getActiveClient();
  const baseFields = getPageFields(pageId);

  if (pageId !== "membership") {
    return baseFields;
  }

  const clientConfig = membershipClientFields[client.id];
  const overrides = clientConfig?.overrides ?? {};
  const extraFields = clientConfig?.extraFields ?? [];
  const showTitleField = clientConfig?.showTitleField ?? false;

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

  const visibleFields = mergedFields.filter((field) => {
    if (field.id === "title" && !showTitleField) {
      return false;
    }

    return !overrides[field.id]?.hidden;
  });

  const visibleExtraFields =
    client.id === "waepa" && values?.membership !== "new" ? [] : extraFields;

  return [...visibleFields, ...visibleExtraFields];
}
