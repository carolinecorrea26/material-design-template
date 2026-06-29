import type { ClientConfig } from "./types";
import { abeClient } from "./abe";
import { amaClient } from "./ama";
import { demoClient } from "./demo";
import { nsoClient } from "./nso";
import { waepaClient } from "./waepa";

export const clients = {
  demo: demoClient,
  abe: abeClient,
  ama: amaClient,
  nso: nsoClient,
  waepa: waepaClient,
} satisfies Record<string, ClientConfig>;
