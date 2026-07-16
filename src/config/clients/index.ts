import type { ClientConfig } from "./types";
import { abeClient } from "./abe";
import { amaClient } from "./ama";
import { avmaClient } from "./avma";
import { cseaClient } from "./csea";
import { demoClient } from "./demo";
import { isitrustClient } from "./isitrust";
import { nsoClient } from "./nso";
import { waepaClient } from "./waepa";

export const clients = {
  demo: demoClient,
  abe: abeClient,
  ama: amaClient,
  avma: avmaClient,
  csea: cseaClient,
  nso: nsoClient,
  waepa: waepaClient,
  isitrust: isitrustClient,
} satisfies Record<string, ClientConfig>;
