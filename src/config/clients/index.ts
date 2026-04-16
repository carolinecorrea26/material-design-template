import type { ClientConfig } from "./types";
import { abeClient } from "./abe";
import { amaClient } from "./ama";
import { demoClient } from "./demo";
import { waepaClient } from "./waepa";

export const clients = {
  demo: demoClient,
  abe: abeClient,
  ama: amaClient,
  waepa: waepaClient,
} satisfies Record<string, ClientConfig>;
