import { persistence } from "./client";
import { createSeedDatabase } from "./seed";

/** Developer-only reset hook; intentionally not exposed in the normal portal UI. */
export async function resetLocalDemoData() {
  if (persistence.kind !== "local" || !persistence.reset) throw new Error("Local demo reset is only available when Supabase is not configured.");
  await persistence.reset(createSeedDatabase());
}
