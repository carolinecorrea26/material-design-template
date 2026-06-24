import { clients } from "../clients/index";
import type { ClientId } from "../../types";

const CLIENT_QUERY_PARAM = "client";
const CLIENT_STORAGE_KEY = "activeClientId";
const DEFAULT_CLIENT_ID: ClientId = "demo";

function isClientId(value: string | null): value is ClientId {
  return !!value && value in clients;
}

function getClientIdFromUrl(): ClientId | null {
  const params = new URLSearchParams(window.location.search);
  const clientId = params.get(CLIENT_QUERY_PARAM);

  return isClientId(clientId) ? clientId : null;
}

function getClientIdFromStorage(): ClientId | null {
  const clientId = window.sessionStorage.getItem(CLIENT_STORAGE_KEY);

  return isClientId(clientId) ? clientId : null;
}

export function resolveClientId(): ClientId {
  const urlClientId = getClientIdFromUrl();

  if (urlClientId) {
    window.sessionStorage.setItem(CLIENT_STORAGE_KEY, urlClientId);
    return urlClientId;
  }

  const storedClientId = getClientIdFromStorage();

  if (storedClientId) {
    return storedClientId;
  }

  return DEFAULT_CLIENT_ID;
}
