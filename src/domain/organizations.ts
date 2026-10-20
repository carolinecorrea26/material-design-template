import type { ClientConfig, ClientBranding, ClientSupport } from "./configuration";

export type ClientEntityId = string;
export type TpaId = string;
export type ClientConfigurationDefaults = Omit<
  ClientConfig,
  "id" | "branding" | "support"
>;
export type Client = {
  id: ClientEntityId;
  tpaId: TpaId;
  name: string;
  acronym: string;
  branding: ClientBranding;
  support: ClientSupport;
  configurationDefaults: ClientConfigurationDefaults;
};
export type Tpa = {
  id: TpaId;
  name: string;
  acronym?: string;
  branding?: Partial<ClientBranding>;
  support?: ClientSupport & { contactName?: string };
  administrationContacts?: { clientKey: string; details: string; source: string }[];
  /** Compatibility TPAs require confirmation from the business data owner. */
  provisional?: boolean;
};

import type { ClientId } from "./identities";
export type LegacyClientSummary = {
  id: ClientId;
  name: string;
  acronym: string;
  logo: string;
  logoAlt: string;
  support: {
    phone?: string;
    email?: string;
    website?: string;
    address?: string;
  };
};

