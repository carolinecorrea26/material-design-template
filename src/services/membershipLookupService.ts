import { mockRequest } from "../mock/client";
import type { MembershipLookupResult } from "../domain/membershipLookup";
export const lookupMockMembership = (siteKey: string, identity: MembershipLookupResult["identity"]) => mockRequest<MembershipLookupResult>("/membership/ama-lookup", { siteKey, ...identity });
