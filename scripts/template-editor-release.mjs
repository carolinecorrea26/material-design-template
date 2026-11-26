import { readFile, writeFile, mkdir, rm } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { digest } from './portal-db.mjs';
import { templateAssignmentPath, templateProperty, validateTemplateChanges } from '../src/domain/templateEdits.mjs';

const catalogPath = 'public/catalog/portal.json';
const revisionFor = text => `postgres:v1:sha256:${digest(text)}`;
const releaseLock = 1902674981;

export async function templateSourceWrites(changes, readDocument) {
  const files = new Map();
  for (const edit of changes) {
    const definition = templateProperty(edit.property);
    if (!definition || (edit.site !== null && (!definition.siteOverride || !/^[a-z][a-z0-9-]*$/.test(edit.site)))) throw new Error('Unsupported release property or scope.');
    const path = edit.site === null ? definition.source : templateAssignmentPath(edit.site);
    if (!files.has(path)) {
      const original = await readDocument(path);
      files.set(path, { original, document: original === null ? { page: 'contact' } : JSON.parse(original) });
    }
    const file = files.get(path);
    const values = edit.site === null ? file.document : { ...file.document.content };
    const assigned = values[definition.key] ?? null;
    if (assigned !== edit.previous) throw new Error('A requirement changed since staging. Review the current source before publishing.');
    if (edit.value === null) delete values[definition.key];
    else values[definition.key] = edit.value;
    if (edit.site !== null) {
      if (Object.keys(values).length) file.document.content = values;
      else delete file.document.content;
    }
  }
  return files;
}

const readDocument = path => readFile(path, 'utf8').catch(error => {
  if (error.code === 'ENOENT') return null;
  throw error;
});

async function restoreSources(files, checkout) {
  for (const [relative, file] of files) {
    const path = resolve(checkout, relative);
    if (file.original === null) await rm(path, { force: true });
    else await writeFile(path, file.original);
  }
}

/** Process the Editor queue from a dedicated release checkout. */
export async function processTemplateRelease(pool, { prepare, refresh, buildLocal, publishHosted, commit, inspectCheckout, recoverCommit, resetStaged, checkout = process.cwd() }) {
  const db = await pool.connect();
  const catalog = resolve(checkout, catalogPath);
  let job;
  let files;
  let recorded = false;
  try {
    const { rows: [lock] } = await db.query('SELECT pg_try_advisory_lock($1) AS held', [releaseLock]);
    if (!lock.held) return false;
    ({ rows: [job] } = await db.query(`UPDATE portal_template_drafts SET status = 'publishing', version = version + 1, updated_at = now()
      WHERE id = (SELECT id FROM portal_template_drafts WHERE status IN ('queued', 'publishing') FOR UPDATE)
      RETURNING id, changes, target_revision AS target, release_commit AS commit`));
    if (!job) return false;
    const { rows: [published] } = await db.query('SELECT revision FROM portal_catalog WHERE id = 1');
    const sites = (await db.query('SELECT site_key FROM portal_sites WHERE active')).rows.map(site => site.site_key);
    validateTemplateChanges(job.changes, sites);
    inspectCheckout?.();
    const current = revisionFor(await readFile(catalog));

    const checkoutCommit = recoverCommit?.(job.id);
    if (!job.target && checkoutCommit) {
      job.target = current;
      job.commit = checkoutCommit;
      await db.query('UPDATE portal_template_drafts SET target_revision = $2, release_commit = $3 WHERE id = $1', [job.id, job.target, job.commit]);
    }
    if (job.target) {
      recorded = true;
      if (current !== job.target || job.commit && job.commit !== checkoutCommit) throw new Error('Use the original release checkout to resume this publication.');
    } else {
      if (current !== published?.revision) throw new Error('The release checkout catalog differs from the active database. Synchronize the checkout before retrying.');
      files = await templateSourceWrites(job.changes, path => readDocument(resolve(checkout, path)));
      for (const [relative, file] of files) {
        const path = resolve(checkout, relative);
        await mkdir(dirname(path), { recursive: true });
        await writeFile(path, JSON.stringify(file.document, null, 2) + '\n');
      }
      await refresh();
      job.target = revisionFor(await readFile(catalog));
      if (published.revision === job.target) throw new Error('The staged changes produced the current catalog.');
      job.commit = commit?.(job.id) ?? null;
      recorded = Boolean(job.commit);
      await db.query('UPDATE portal_template_drafts SET target_revision = $2, release_commit = $3 WHERE id = $1', [job.id, job.target, job.commit]);
      recorded = true;
    }
    if (publishHosted) {
      await publishHosted();
    } else {
      await buildLocal();
      await prepare(await readFile(catalog, 'utf8'), published?.revision);
    }
    await db.query(`UPDATE portal_template_drafts SET status = 'published', version = version + 1, release_error = NULL, updated_at = now()
      WHERE id = $1 AND target_revision = (SELECT revision FROM portal_catalog WHERE id = 1)`, [job.id]).then(result => {
      if (result.rowCount !== 1) throw new Error('The released catalog does not match this draft.');
    });
    return true;
  } catch (error) {
    let message = error.message;
    if (files && !recorded) {
      try { await restoreSources(files, checkout); await refresh(); resetStaged?.(); }
      catch { message += ' Restoring local source failed. Inspect the release checkout before retrying.'; }
    }
    if (job) await db.query(`UPDATE portal_template_drafts SET status = 'failed', version = version + 1, release_error = $2, updated_at = now()
      WHERE id = $1`, [job.id, message.slice(0, 500)]);
    throw error;
  } finally {
    await db.query('SELECT pg_advisory_unlock($1)', [releaseLock]).finally(() => db.release());
  }
}
