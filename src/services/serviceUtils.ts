import type { PersistenceAdapter } from "../persistence/adapter";
import { newId, now } from "../persistence/ids";
import type { AuditAction, Json } from "../persistence/types";

export const DEMO_ACTOR = "user-demo-admin";

export async function audit(adapter: PersistenceAdapter, input: {
  entityType: string; entityId: string; action: AuditAction; fieldKey?: string | null;
  oldValue?: Json; newValue?: Json; performedBy?: string; changeRequestId?: string | null;
}) {
  return adapter.insert("auditEvents", {
    id: newId(), entityType: input.entityType, entityId: input.entityId, action: input.action,
    fieldKey: input.fieldKey ?? null, oldValueJson: input.oldValue ?? null, newValueJson: input.newValue ?? null,
    performedBy: input.performedBy ?? DEMO_ACTOR, changeRequestId: input.changeRequestId ?? null, createdAt: now(),
  });
}

export const active = <T extends { deletedAt: string | null }>(rows: T[], includeArchived = false) => includeArchived ? rows : rows.filter((row) => !row.deletedAt);
