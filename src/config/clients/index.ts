import type { ClientConfig } from "./types";
import { abeClient } from "./abe";
import { amaClient } from "./ama";
import { avmaClient } from "./avma";
import { demoClient } from "./demo";
import { nsoClient } from "./nso";
import { waepaClient } from "./waepa";

export const clients = {
  demo: demoClient,
  abe: abeClient,
  ama: amaClient,
  avma: avmaClient,
  nso: nsoClient,
  waepa: waepaClient,
} satisfies Record<string, ClientConfig>;
