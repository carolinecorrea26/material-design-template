import { persistence } from "./client";
import { createSeedDatabase } from "./seed";

/** Developer-only reset hook; intentionally not exposed in the normal portal UI. */
export async function resetLocalDemoData() {
  if (!persistence.reset) throw new Error("This persistence adapter does not support a local demo reset.");
  await persistence.reset(createSeedDatabase());
}
