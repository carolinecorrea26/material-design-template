import type { ClientId } from "../../types";
import type { DeepPartial } from "../types-util";
import type { SiteContent } from "../types";
import { abeContentOverrides } from "./abe";
import { amaContentOverrides } from "./ama";
import { avmaContentOverrides } from "./avma";
import { cseaContentOverrides } from "./csea";
import { demoContentOverrides } from "./demo";
import { isitrustContentOverrides } from "./isitrust";
import { nsoContentOverrides } from "./nso";
import { waepaContentOverrides } from "./waepa";
import { waepagiContentOverrides } from "./waepagi";

export const clientContentOverrides: Record<
  ClientId,
  DeepPartial<SiteContent>
> = {
  abe: abeContentOverrides,
  ama: amaContentOverrides,
  avma: avmaContentOverrides,
  csea: cseaContentOverrides,
  demo: demoContentOverrides,
  isitrust: isitrustContentOverrides,
  nso: nsoContentOverrides,
  waepa: waepaContentOverrides,
  waepagi: waepagiContentOverrides,
};
