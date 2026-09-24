export const portalExperiences = ["internal-admin", "tpa-admin", "advisor"] as const;
export type PortalExperience = (typeof portalExperiences)[number];

export const permissions = [
  "site.read",
  "site.edit",
  "coverage.read",
  "coverage.edit",
  "rules.read",
  "rules.edit",
  "config.read",
  "config.edit",
  "change.read",
  "change.create",
  "change.approve",
  "change.manage",
  "release.read",
  "release.manage",
  "application.read",
  "application.create",
  "application.edit",
  "application.approve",
  "application.reject",
  "analytics.read",
  "users.manage",
] as const;

export type Permission = (typeof permissions)[number];
export type AccessScopeType = "global" | "tpa" | "client" | "site" | "advisor" | "application";

export type AccessScope = {
  type: AccessScopeType;
  ids?: string[];
};

export type Persona = {
  id: string;
  label: string;
  experience: PortalExperience;
  permissions: Permission[];
  scope: AccessScope;
  emphasis: string[];
};

const internalRead: Permission[] = [
  "site.read",
  "coverage.read",
  "rules.read",
  "config.read",
  "change.read",
  "release.read",
  "application.read",
];

export const internalPersonas: Persona[] = [
  {
    id: "portal-admin",
    label: "Portal Admin",
    experience: "internal-admin",
    scope: { type: "global" },
    permissions: [...permissions],
    emphasis: ["all changes", "site configuration", "release readiness"],
  },
  {
    id: "developer",
    label: "Developer",
    experience: "internal-admin",
    scope: { type: "global" },
    permissions: [...internalRead, "site.edit", "rules.edit", "config.edit", "change.create"],
    emphasis: ["development", "rules and configuration", "release work"],
  },
  {
    id: "qa",
    label: "QA",
    experience: "internal-admin",
    scope: { type: "global" },
    permissions: [...internalRead, "change.approve"],
    emphasis: ["QA", "regression scope", "logic changes"],
  },
  {
    id: "account-manager",
    label: "Account Manager",
    experience: "internal-admin",
    scope: { type: "client" },
    permissions: [...internalRead, "change.create"],
    emphasis: ["client requests", "site drafts", "upcoming client releases"],
  },
  {
    id: "marketing",
    label: "Marketing",
    experience: "internal-admin",
    scope: { type: "global" },
    permissions: [...internalRead, "change.create"],
    emphasis: ["content", "email", "branding"],
  },
  {
    id: "ux-design",
    label: "UX / Design",
    experience: "internal-admin",
    scope: { type: "global" },
    permissions: [...internalRead, "change.create"],
    emphasis: ["pages and fields", "experience variants", "features"],
  },
  {
    id: "analytics",
    label: "Analytics",
    experience: "internal-admin",
    scope: { type: "global" },
    permissions: [...internalRead, "analytics.read"],
    emphasis: ["application reporting", "site reporting", "operational trends"],
  },
];

export const externalPersonaExamples: Persona[] = [
  {
    id: "tpa-administrator",
    label: "TPA Administrator",
    experience: "tpa-admin",
    scope: { type: "tpa", ids: [] },
    permissions: ["site.read", "application.read", "application.approve", "application.reject"],
    emphasis: ["applications requiring action", "permitted sites", "client reporting"],
  },
  {
    id: "advisor",
    label: "Advisor",
    experience: "advisor",
    scope: { type: "advisor", ids: [] },
    permissions: ["application.read", "application.create", "application.edit"],
    emphasis: ["my applications", "current action owner", "next action"],
  },
];

export function hasPermission(persona: Persona, permission: Permission) {
  return persona.permissions.includes(permission);
}

export function isRecordInScope(
  scope: AccessScope,
  record: Partial<Record<Exclude<AccessScopeType, "global">, string>>,
) {
  if (scope.type === "global") return true;
  return Boolean(scope.ids?.includes(record[scope.type] ?? ""));
}
