export type ClientId = "demo" | "abe" | "ama" | "waepa";

export type ClientConfig = {
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
