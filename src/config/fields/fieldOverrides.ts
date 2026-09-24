import type { ClientConfig } from "../clients/types";
import type { ClientEntityId, SiteId } from "../../data/model";
import type { PageId } from "../../types";
import type { FieldDefinition, FieldId } from "./types";

export type FieldOverrideValues = Partial<Omit<FieldDefinition, "id">>;

export type ScopedFieldOverride = {
  fieldId: FieldId;
  pageId: PageId;
  scope: "global" | "client" | "site";
  clientIds?: ClientEntityId[];
  siteIds?: SiteId[];
  /** Explicit scoped placement for a canonical field not in the base page order. */
  include?: boolean;
  hidden?: boolean;
  values?: FieldOverrideValues;
};

function withoutIdentity(
  override: Partial<FieldDefinition>,
): FieldOverrideValues {
  const values = { ...override };
  delete values.id;
  return values;
}

/** Converts the retained ClientConfig authoring shape at one clear boundary. */
export function normalizeClientFieldOverrides(
  client: ClientConfig,
  clientId: ClientEntityId,
): ScopedFieldOverride[] {
  return Object.entries(client.fields).flatMap(([pageId, config]) => {
    if (!config) return [];
    const scope = {
      pageId: pageId as PageId,
      scope: "client" as const,
      clientIds: [clientId],
    };
    return [
      ...(config.extra ?? []).map((fieldId): ScopedFieldOverride => ({
        ...scope,
        fieldId: fieldId as FieldId,
        include: true,
      })),
      ...Object.entries(config.overrides ?? {}).flatMap(
        ([fieldId, override]): ScopedFieldOverride[] =>
          override
            ? [{
                ...scope,
                fieldId: fieldId as FieldId,
                values: withoutIdentity(override),
              }]
            : [],
      ),
      ...(config.required ?? []).map((fieldId): ScopedFieldOverride => ({
        ...scope,
        fieldId: fieldId as FieldId,
        values: { required: true },
      })),
      ...(config.hidden ?? []).map((fieldId): ScopedFieldOverride => ({
        ...scope,
        fieldId: fieldId as FieldId,
        hidden: true,
      })),
    ];
  });
}

const membershipOverride = (
  siteId: SiteId,
  fieldId: FieldId,
  override: Omit<ScopedFieldOverride, "scope" | "siteIds" | "pageId" | "fieldId">,
): ScopedFieldOverride => ({
  pageId: "membership",
  fieldId,
  scope: "site",
  siteIds: [siteId],
  ...override,
});

const hideMembershipTitle = (siteId: SiteId) =>
  membershipOverride(siteId, "title", { hidden: true });

const includeMembershipField = (
  siteId: SiteId,
  fieldId: FieldId,
  visibilityConditionId?: FieldDefinition["visibilityConditionId"],
) => membershipOverride(siteId, fieldId, {
  include: true,
  values: visibilityConditionId ? { visibilityConditionId } : undefined,
});

/** Site-authored overrides formerly held by the Membership-only adapter. */
export const siteFieldOverrides: ScopedFieldOverride[] = [
  hideMembershipTitle("demo-default"),
  membershipOverride("demo-default", "membership", {
    values: { label: "Are you an active member of Demo Insurance?" },
  }),

  hideMembershipTitle("abe-default"),
  membershipOverride("abe-default", "membership", {
    values: {
      label:
        "Are you an active member of a State, Local, or Specialty Bar Association?",
    },
  }),

  membershipOverride("ama-default", "membership", {
    values: {
      label: "I am a (select one)",
      inputType: "dropdown",
      labelVariant: "standard",
      placeholder: "Select one",
      options: [
        { label: "Physician", value: "physician" },
        { label: "Resident", value: "resident" },
        { label: "Student", value: "student" },
        { label: "Retired Physician", value: "retired" },
        { label: "Spouse of Physician", value: "spouse" },
      ],
    },
  }),
  ...([
    "ama-physician-type",
    "ama-physician-title",
    "ama-physician-first-name",
    "ama-physician-last-name",
    "ama-physician-birth-date",
    "ama-physician-email",
  ] as FieldId[]).map((fieldId) =>
    includeMembershipField(
      "ama-default",
      fieldId,
      "condition-membership-ama-spouse",
    ),
  ),

  hideMembershipTitle("asce-default"),
  membershipOverride("asce-default", "membership", {
    values: {
      label: "Are you a member of the American Society of Civil Engineers?",
    },
  }),
  includeMembershipField("asce-default", "asce-member-id"),

  hideMembershipTitle("avma-default"),
  membershipOverride("avma-default", "membership", {
    values: {
      label: "Are you a member of the American Veterinary Medical Association?",
    },
  }),
  ...([
    "avma-vet-college",
    "avma-graduation-year",
    "avma-occupation",
  ] as FieldId[]).map((fieldId) =>
    includeMembershipField("avma-default", fieldId),
  ),

  hideMembershipTitle("csea-default"),
  membershipOverride("csea-default", "membership", {
    values: { label: "Are you a member of the CSEA?" },
  }),
  includeMembershipField("csea-default", "csea-performing-duties"),
  includeMembershipField("csea-default", "csea-occupation-group"),

  hideMembershipTitle("isitrust-default"),
  membershipOverride("isitrust-default", "membership", {
    values: {
      label: "I am a member of:",
      inputType: "searchable-select",
      labelVariant: "standard",
      placeholder: "Search or select association",
    },
  }),

  hideMembershipTitle("nso-default"),
  membershipOverride("nso-default", "membership", {
    values: { label: "Are you a nurse?" },
  }),

  hideMembershipTitle("waepa-standard"),
  membershipOverride("waepa-standard", "membership", {
    values: {
      label:
        "Are you a current WAEPA member, or are you becoming a new member?",
      inputType: "radio",
      options: [
        { label: "Current Member", value: "current" },
        { label: "New Member", value: "new" },
      ],
    },
  }),
  includeMembershipField(
    "waepa-standard",
    "waepa-declaration",
    "condition-membership-waepa-new",
  ),
  includeMembershipField(
    "waepa-standard",
    "waepa-attestation",
    "condition-membership-waepa-new",
  ),
  includeMembershipField(
    "waepa-standard",
    "waepa-employer",
    "condition-waepa-federal-active",
  ),
  includeMembershipField(
    "waepa-standard",
    "waepa-start-date",
    "condition-waepa-federal-active",
  ),
  includeMembershipField(
    "waepa-standard",
    "waepa-retired-employer",
    "condition-waepa-federal-annuitant",
  ),
  includeMembershipField(
    "waepa-standard",
    "waepa-retirement-date",
    "condition-waepa-federal-annuitant",
  ),
  ...([
    "waepa-member-first-name",
    "waepa-member-last-name",
    "waepa-member-id",
  ] as FieldId[]).map((fieldId) =>
    includeMembershipField(
      "waepa-standard",
      fieldId,
      "condition-waepa-associated-member",
    ),
  ),

  hideMembershipTitle("waepa-gi"),
];

const scopeRank: Record<ScopedFieldOverride["scope"], number> = {
  global: 0,
  client: 1,
  site: 2,
};

export function getApplicableFieldOverrides(
  overrides: ScopedFieldOverride[],
  context: { clientId: ClientEntityId; siteId: SiteId; pageId: PageId },
): ScopedFieldOverride[] {
  return overrides
    .filter((override) => {
      if (override.pageId !== context.pageId) return false;
      if (override.scope === "global") return true;
      if (override.scope === "client") {
        return override.clientIds?.includes(context.clientId) ?? false;
      }
      return override.siteIds?.includes(context.siteId) ?? false;
    })
    .sort((left, right) => scopeRank[left.scope] - scopeRank[right.scope]);
}
