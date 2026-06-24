import { clients } from "../clients/index";
import { resolveClientId } from "./resolveClientId";

export function getActiveClient() {
  const clientId = resolveClientId();
  return clients[clientId];
}
