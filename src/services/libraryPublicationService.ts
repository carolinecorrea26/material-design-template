import type { SupabaseClient } from "@supabase/supabase-js";
import { isLibraryDraft, type LibraryDraft } from "../domain/libraryDraft";

export type ServerLibraryDraft = { id: string; site_key: string; edit_version: number; base_release_id: string | null; payload_hash: string; payload: LibraryDraft };
/** The SQL transaction verifies AAL2/admin identity, optimistic versions and
 * service-written readiness evidence. Browser code cannot certify publication. */
export class LibraryPublicationService {
  private readonly client: SupabaseClient;
  constructor(client: SupabaseClient) { this.client = client; }
  async save(draft: LibraryDraft, existing?: ServerLibraryDraft): Promise<ServerLibraryDraft> {
    if (!isLibraryDraft(draft)) throw new Error("Invalid Library draft");
    const { data, error } = await this.client.rpc("portal_save_library_draft", { p_site_key: draft.siteKey, p_payload: draft, p_draft_id: existing?.id ?? null, p_expected_version: existing?.edit_version ?? 0 });
    if (error) throw error;
    if (!data || !isLibraryDraft(data.payload) || data.site_key !== draft.siteKey || typeof data.id !== "string" || !Number.isSafeInteger(data.edit_version)) throw new Error("Invalid saved draft response");
    return data as ServerLibraryDraft;
  }
  async publish(draft: ServerLibraryDraft) {
    const { data, error } = await this.client.rpc("portal_publish_library_draft", { p_draft_id: draft.id, p_expected_version: draft.edit_version, p_expected_release_id: draft.base_release_id });
    if (error) throw error;
    return data;
  }
  async rollback(siteKey: string, releaseId: string, expectedReleaseId: string) {
    const { data, error } = await this.client.rpc("portal_rollback_library", { p_site_key: siteKey, p_release_id: releaseId, p_expected_release_id: expectedReleaseId });
    if (error) throw error;
    return data;
  }
  async readPublished(siteKey: string) {
    const { data, error } = await this.client.rpc("portal_read_published_library", { p_site_key: siteKey });
    if (error) throw error;
    if (!data) return null;
    if (!isLibraryDraft(data.payload) || data.payload.siteKey !== siteKey || typeof data.releaseId !== "string" || !Number.isSafeInteger(data.version) || !/^[a-f0-9]{64}$/.test(data.payloadHash)) throw new Error("Invalid published Library response");
    return data as { releaseId: string; version: number; payloadHash: string; payload: LibraryDraft };
  }
}
