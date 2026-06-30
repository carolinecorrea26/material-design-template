import type { ClientId } from "../../types";
import type { DeepPartial } from "../types-util";
import type { SiteContent } from "../types";
import { abeContentOverrides } from "./abe";
import { amaContentOverrides } from "./ama";
import { avmaContentOverrides } from "./avma";
import { demoContentOverrides } from "./demo";
import { nsoContentOverrides } from "./nso";
import { waepaContentOverrides } from "./waepa";

export const clientContentOverrides: Record<
  ClientId,
  DeepPartial<SiteContent>
> = {
  abe: abeContentOverrides,
  ama: amaContentOverrides,
  avma: avmaContentOverrides,
  demo: demoContentOverrides,
  nso: nsoContentOverrides,
  waepa: waepaContentOverrides,
};
