import { persistence } from "../persistence/client";
export const auditService = {
  async getRecent(limit = 20) { return (await persistence.list("auditEvents")).sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, limit); },
};
