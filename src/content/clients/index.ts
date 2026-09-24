import type { SiteId } from "../../data/model";
import type { DeepPartial } from "../types-util";
import type { SiteContent } from "../types";
import { abeContentOverrides } from "./abe";
import { amaContentOverrides } from "./ama";
import { asceContentOverrides } from "./asce";
import { avmaContentOverrides } from "./avma";
import { cseaContentOverrides } from "./csea";
import { demoContentOverrides } from "./demo";
import { isitrustContentOverrides } from "./isitrust";
import { nsoContentOverrides } from "./nso";
import { waepaContentOverrides } from "./waepa";
import { waepagiContentOverrides } from "./waepagi";

export const siteContentOverrides: Record<SiteId, DeepPartial<SiteContent>> = {
  "abe-default": abeContentOverrides,
  "ama-default": amaContentOverrides,
  "asce-default": asceContentOverrides,
  "avma-default": avmaContentOverrides,
  "csea-default": cseaContentOverrides,
  "demo-default": demoContentOverrides,
  "isitrust-default": isitrustContentOverrides,
  "nso-default": nsoContentOverrides,
  "waepa-standard": waepaContentOverrides,
  "waepa-gi": waepagiContentOverrides,
};
