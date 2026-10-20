import { createContext } from "react";
import type { ClientBranding } from "../../config/clients/types";

/** An embedded preview can supply branding independently of the active Site. */
export const ClientIconContext = createContext<ClientBranding | null>(null);
