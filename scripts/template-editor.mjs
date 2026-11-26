import { randomUUID } from 'node:crypto';
import { inTransaction } from './portal-db.mjs';
import { templateImpact, templateProperties, templateTarget, templateValue, validateTemplateChanges } from '../src/domain/templateEdits.mjs';

export const editorColumns = 'id, base_revision AS "baseRevision", version, status, changes, reason, updated_by AS "updatedBy", updated_at AS "updatedAt", target_revision AS "targetRevision", release_error AS "releaseError", reverts_id AS "revertsId"';
const fail = (status, message) => { throw Object.assign(new Error(message), { status }); };

async function readEditorCatalog(db) {
  const { rows: [result] } = await db.query(`SELECT revision,
    (SELECT jsonb_agg(value) FROM json_array_elements(payload->'data'->'contentValues') AS record(value)
      WHERE value->>'contentKey' = ANY($1::text[])) AS "contentValues",
    (SELECT jsonb_agg(jsonb_build_object('key', site_key, 'name', identity->>'name') ORDER BY identity->>'name')
      FROM portal_sites WHERE active) AS sites
    FROM portal_catalog WHERE id = 1`, [templateProperties.map(property => property.projection)]);
  if (!result?.contentValues) fail(503, 'The published editor values are unavailable.');
  const { sites, ...catalog } = result;
  return { catalog, sites: sites ?? [], keys: (sites ?? []).map(site => site.key) };
}

function capturedChanges(changes, before, keys) {
  let edits;
  try { edits = validateTemplateChanges(changes, keys); }
  catch (error) { fail(400, error.message); }
  return edits.map(edit => ({ ...edit, previous: templateValue(before, edit).assigned }));
}

function assertUnchanged(changes, catalog) {
  if (changes.some(edit => templateValue(catalog, edit).assigned !== edit.previous)) fail(409, 'A published value changed since this draft was saved. Open a new draft to review the latest values.');
}

function describe(draft, catalog, keys) {
  const conflict = draft.status === 'draft' && draft.changes.some(edit => templateValue(catalog, edit).assigned !== edit.previous);
  const impact = draft.status === 'draft' && !conflict ? templateImpact(catalog, draft.changes, keys) : [];
  return { ...draft, conflict, impact };
}

async function saveDraft(db, user, body) {
  return inTransaction(db, async client => {
    const { catalog, keys } = await readEditorCatalog(client);
    let old;
    if (body.id) {
      old = (await client.query(`SELECT ${editorColumns} FROM portal_template_drafts WHERE id = $1 FOR UPDATE`, [body.id])).rows[0];
      if (!old || old.status !== 'draft' || old.version !== body.expectedVersion) fail(409, 'This draft changed. Reopen it before saving.');
      assertUnchanged(old.changes, catalog);
    } else if (body.baseRevision !== catalog.revision) {
      fail(409, 'The published Library changed. Refresh the editor before saving.');
    }
    const reason = typeof body.reason === 'string' ? body.reason.trim() : '';
    if (!reason || reason.length > 1000) fail(400, 'Enter a reason of 1–1,000 characters.');
    const pending = new Map((old?.changes ?? []).map(edit => [templateTarget(edit), edit]));
    for (const edit of capturedChanges(body.changes, catalog, keys)) {
      if (edit.previous === edit.value) pending.delete(templateTarget(edit));
      else pending.set(templateTarget(edit), edit);
    }
    if (!pending.size) fail(400, 'The draft needs at least one change from the published value. To abandon it, choose Discard draft.');
    const payload = JSON.stringify([...pending.values()]);
    const result = old
      ? await client.query(`UPDATE portal_template_drafts SET changes = $1, reason = $2, updated_by = $3,
          base_revision = $4, version = version + 1, updated_at = now() WHERE id = $5 RETURNING ${editorColumns}`,
          [payload, reason, user.id, catalog.revision, old.id])
      : await client.query(`INSERT INTO portal_template_drafts (id, base_revision, changes, reason, updated_by)
          VALUES ($1, $2, $3, $4, $5) RETURNING ${editorColumns}`, [randomUUID(), catalog.revision, payload, reason, user.id]);
    return describe(result.rows[0], catalog, keys);
  });
}

export async function templateEditor(db, user, body) {
  if (body.action === 'list') {
    const { catalog, sites, keys } = await readEditorCatalog(db);
    const { rows } = await db.query(`SELECT ${editorColumns} FROM portal_template_drafts WHERE status <> 'discarded' ORDER BY updated_at DESC`);
    const values = Object.fromEntries(templateProperties.map(property => [property.id,
      Object.fromEntries([null, ...keys].map(site => [site ?? 'global', templateValue(catalog, { property: property.id, site })]))]));
    return { revision: catalog.revision, sites, values, drafts: rows.map(draft => describe(draft, catalog, keys)) };
  }
  if (body.action === 'save') return saveDraft(db, user, body);
  if (typeof body.id !== 'string') fail(400, 'Choose a draft.');
  if (body.action === 'preview') {
    const { catalog, keys } = await readEditorCatalog(db);
    const { rows: [draft] } = await db.query(`SELECT ${editorColumns} FROM portal_template_drafts WHERE id = $1 AND status = 'draft'`, [body.id]);
    if (!draft || draft.version !== body.expectedVersion || !keys.includes(body.site)) fail(404, 'This draft preview is unavailable.');
    assertUnchanged(draft.changes, catalog);
    return { ...draft, previewRevision: catalog.revision };
  }
  try {
    return await inTransaction(db, async client => {
      const { catalog, keys } = await readEditorCatalog(client);
      const { rows: [draft] } = await client.query(`SELECT ${editorColumns} FROM portal_template_drafts WHERE id = $1 FOR UPDATE`, [body.id]);
      if (!draft || draft.version !== body.expectedVersion) fail(409, 'This draft changed. Reopen it before continuing.');
      if (body.action === 'revert' && draft.status === 'published') {
        if (draft.changes.some(edit => templateValue(catalog, edit).assigned !== edit.value)) fail(409, 'A later change replaced one of these values. Review the current value before reverting.');
        const changes = draft.changes.map(edit => ({ ...edit, value: edit.previous, previous: edit.value }));
        const { rows: [revert] } = await client.query(`INSERT INTO portal_template_drafts (id, base_revision, changes, reason, updated_by, reverts_id)
          VALUES ($1, $2, $3, $4, $5, $6) RETURNING ${editorColumns}`,
          [randomUUID(), catalog.revision, JSON.stringify(changes), `Revert: ${draft.reason}`.slice(0, 1000), user.id, draft.id]);
        return describe(revert, catalog, keys);
      }
      const actions = {
        'draft:queue': 'queued',
        'draft:discard': 'discarded',
        'queued:discard': 'discarded',
        'failed:retry': 'queued',
        'failed:discard': draft.targetRevision ? undefined : 'discarded',
      };
      const status = actions[`${draft.status}:${body.action}`];
      if (!status) fail(409, 'This action is unavailable for the current draft status.');
      if (draft.status === 'draft' && status === 'queued') assertUnchanged(draft.changes, catalog);
      const { rows: [saved] } = await client.query(`UPDATE portal_template_drafts SET status = $1, version = version + 1,
        updated_by = $2, updated_at = now(), release_error = NULL WHERE id = $3 RETURNING ${editorColumns}`, [status, user.id, draft.id]);
      return describe(saved, catalog, keys);
    });
  } catch (error) {
    if (error.code === '23505') fail(409, 'A release is already in progress. Finish it before publishing another.');
    throw error;
  }
}
