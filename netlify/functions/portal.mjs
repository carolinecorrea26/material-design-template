import { randomBytes, randomUUID } from 'node:crypto';
import { promisify } from 'node:util';
import { gzip } from 'node:zlib';
import { getDatabase } from '@netlify/database';
import { templateEditor } from '../../scripts/template-editor.mjs';
import { createApplicantSaves } from '../../scripts/applicant-saves.mjs';
import { connectPortalDatabase, digest, inTransaction, verifyPassword } from '../../scripts/portal-db.mjs';

export const config = { path: '/api/portal/*' };
const reply = (data, status = 200, headers = {}) => Response.json(data, { status, headers: { 'Cache-Control': 'no-store', ...headers } });
const fail = (status, message) => { throw Object.assign(new Error(message), { status }); };
const sessionCookie = 'portal_poc_session';
const cookie = (token, maxAge, url) => `${sessionCookie}=${token}; HttpOnly; SameSite=Strict; Path=/api/portal; Max-Age=${maxAge}${url.protocol === 'https:' ? '; Secure' : ''}`;
const projection = `SELECT u.id, u.email, u.display_name AS "displayName", u.role_key AS "roleKey",
  ARRAY(SELECT site_key FROM portal_user_sites WHERE user_id = u.id ORDER BY site_key) AS "siteKeys" FROM portal_users u`;
const draftColumns = 'id, site_key AS "siteKey", base_revision AS "baseRevision", version, form_template AS "formTemplate", updated_at AS "updatedAt"';
const compressCatalog = promisify(gzip);

async function readCatalog(db, includePayload = false, expectedRevision) {
  if (expectedRevision) {
    const columns = includePayload ? 'revision, payload::text' : 'revision';
    const { rows: [matching] } = await db.query(`SELECT ${columns} FROM portal_catalog WHERE revision = $1
      UNION ALL SELECT ${columns} FROM portal_catalog_revisions WHERE revision = $1 LIMIT 1`, [expectedRevision]);
    return matching ?? fail(409, 'The published Library catalog does not match this Portal build.');
  }
  const { rows: [catalog] } = await db.query(includePayload ? 'SELECT revision, payload::text FROM portal_catalog WHERE id = 1' : 'SELECT revision FROM portal_catalog WHERE id = 1');
  return catalog ?? fail(503, 'Load the published Library catalog into the Portal database.');
}

function readToken(request) {
  const token = request.headers.get('cookie')?.split(';').map(value => value.trim()).find(value => value.startsWith(`${sessionCookie}=`))?.slice(sessionCookie.length + 1);
  return token && /^[a-f0-9]{64}$/.test(token) ? digest(token) : null;
}

async function getUser(db, request) {
  const token = readToken(request);
  if (!token) return null;
  const { rows: [user] } = await db.query(`${projection} JOIN portal_sessions s ON s.user_id = u.id WHERE s.token_hash = $1 AND s.expires_at > now()`, [token]);
  return user ?? null;
}

async function session(db, request, body, url) {
  if (request.method === 'GET') return reply(await getUser(db, request));
  if (body.action === 'logout') {
    const token = readToken(request);
    if (token) await db.query('DELETE FROM portal_sessions WHERE token_hash = $1', [token]);
    return reply(null, 200, { 'Set-Cookie': cookie('', 0, url) });
  }
  if (body.action !== 'login' || typeof body.email !== 'string' || body.email.length > 254 || typeof body.password !== 'string' || body.password.length > 128) fail(400, 'Enter a valid email and password.');
  const { rows: [account] } = await db.query('SELECT id, password_hash FROM portal_users WHERE email = $1', [body.email.trim().toLowerCase()]);
  if (!verifyPassword(body.password, account?.password_hash) || !account) fail(401, 'Email or password is incorrect.');
  const token = randomBytes(32).toString('hex');
  await inTransaction(db, async client => {
    await client.query('DELETE FROM portal_sessions WHERE expires_at <= now() OR token_hash = $1', [readToken(request)]);
    await client.query("INSERT INTO portal_sessions (token_hash, user_id, expires_at) VALUES ($1, $2, now() + interval '8 hours')", [digest(token), account.id]);
  });
  const { rows: [user] } = await db.query(`${projection} WHERE u.id = $1`, [account.id]);
  return reply(user, 200, { 'Set-Cookie': cookie(token, 8 * 60 * 60, url) });
}

const isAdmin = user => user.roleKey === 'portal-admin';
const canRead = (user, site) => isAdmin(user) || user.siteKeys.includes(site);
const requireAdmin = user => { if (!isAdmin(user)) fail(403, 'Portal Admin access is required.'); };

async function drafts(db, user, body) {
  if (body.action === 'list') {
    const { revision } = await readCatalog(db);
    const { rows } = await db.query(`SELECT ${draftColumns} FROM portal_site_drafts WHERE base_revision = $1 ORDER BY updated_at DESC`, [revision]);
    return rows.filter(row => canRead(user, row.siteKey));
  }
  if (body.action === 'create') {
    requireAdmin(user);
    const { revision } = await readCatalog(db);
    if (body.baseRevision !== revision) fail(409, 'The published Library changed. Reload to start a draft.');
    const { rows: [draft] } = await db.query(`INSERT INTO portal_site_drafts (id, site_key, base_revision)
      SELECT $1, site_key, $3 FROM portal_sites WHERE site_key = $2 AND active
      ON CONFLICT (site_key, base_revision) DO UPDATE SET site_key = EXCLUDED.site_key RETURNING ${draftColumns}`, [randomUUID(), body.siteKey, revision]);
    return draft ?? fail(404, 'Site unavailable.');
  }
  if (typeof body.id !== 'string') fail(400, 'Choose a draft.');
  const { rows: [draft] } = await db.query(`SELECT ${draftColumns} FROM portal_site_drafts WHERE id = $1`, [body.id]);
  if (!draft || !canRead(user, draft.siteKey)) fail(404, 'Draft unavailable.');
  const { revision } = await readCatalog(db);
  if (draft.baseRevision !== revision) fail(409, 'This draft is based on a superseded Library revision.');
  if (body.action === 'get') return draft;
  if (body.action !== 'save' || !Number.isSafeInteger(body.expectedVersion) || ![null, 'single', 'multi'].includes(body.formTemplate)) fail(400, 'Choose a supported layout and draft version.');
  requireAdmin(user);
  const { rows: [saved] } = await db.query(`UPDATE portal_site_drafts SET form_template = $1, version = version + 1, updated_at = now()
    WHERE id = $2 AND version = $3 RETURNING ${draftColumns}`, [body.formTemplate, body.id, body.expectedVersion]);
  return saved ?? fail(409, 'This draft changed. Reopen it before saving.');
}

async function applications(db, user, body) {
  if (body.action === 'list') {
    const scope = isAdmin(user) ? null : user.siteKeys;
    const { rows } = await db.query(`SELECT a.record, (SELECT jsonb_agg(e.event ORDER BY e.event->>'createdAt')
      FROM portal_application_events e WHERE e.application_id = a.id) AS events FROM portal_applications a
      WHERE ($1::text[] IS NULL OR a.site_key = ANY($1::text[])) ORDER BY a.submitted_at DESC`, [scope]);
    return { applications: rows.map(row => row.record), events: rows.flatMap(row => row.events ?? []) };
  }
  requireAdmin(user);
  const transitions = {
    approve: ['Underwriting', 'NYL', 'Approved by TPA'],
    reject: ['Rejected', 'None', 'Rejected by TPA'],
    advisor: ['Waiting for Advisor', 'Advisor', 'Advisor follow-up requested'],
  };
  const transition = Object.hasOwn(transitions, body.action) && transitions[body.action];
  if (!transition || typeof body.id !== 'string') fail(400, 'Unsupported application action.');
  return inTransaction(db, async client => {
    const { rows: [row] } = await client.query('SELECT record FROM portal_applications WHERE id = $1 FOR UPDATE', [body.id]);
    if (!row) fail(404, 'Application unavailable.');
    const previous = row.record;
    if (previous.status !== 'Pending TPA Review') fail(409, 'The application is no longer pending TPA review.');
    const [status, currentActionOwnerType, notes] = transition;
    const updatedAt = new Date().toISOString();
    const record = { ...previous, status, currentActionOwnerType, updatedAt };
    const event = { id: randomUUID(), applicationId: body.id, eventType: 'workflow_transition', fromStatus: previous.status, toStatus: status, fromOwnerType: previous.currentActionOwnerType, toOwnerType: currentActionOwnerType, notes, performedBy: user.id, createdAt: updatedAt };
    await client.query('UPDATE portal_applications SET record = $1 WHERE id = $2', [JSON.stringify(record), body.id]);
    await client.query('INSERT INTO portal_application_events (id, application_id, event) VALUES ($1, $2, $3)', [event.id, body.id, JSON.stringify(event)]);
    return record;
  });
}

async function publishApplication(db, application, identity) {
  const { id, siteKey, revision, values } = application;
  const { rows: [catalog] } = await db.query(`SELECT (payload->'data'->'siteProducts') AS products,
    (payload->'data'->'siteProductApplicants') AS applicants FROM portal_catalog WHERE id = 1 AND revision = $1`, [revision]);
  if (!catalog) fail(409, 'Library changed. Reload and review before signing.');
  const elected = Array.isArray(values.coverageSelections) ? [...new Set(values.coverageSelections)] : [];
  const coverages = elected.flatMap(productKey => {
    if (!catalog.products.some(row => row.siteId === identity.id && row.productKey === productKey && row.enabled)) fail(400, 'A submitted product is unavailable.');
    const applicants = values.productApplicants?.[productKey];
    if (!Array.isArray(applicants) || !applicants.length) fail(400, 'Choose the applicants for each submitted product.');
    return [...new Set(applicants)].map(applicant => {
      if (!catalog.applicants.some(row => row.siteKey === siteKey && row.productKey === productKey && row.applicantKey === applicant)) fail(400, 'A submitted applicant is unavailable for this product.');
      const amount = values.coverageAmounts?.[`${productKey}:${applicant}`] ?? null;
      if (amount !== null && (!Number.isFinite(amount) || amount < 0)) fail(400, 'Invalid submitted amount.');
      return { productKey, applicant, amount };
    });
  });
  if (!coverages.length) fail(400, 'Select coverage before submitting.');
  const timestamp = new Date(application.submittedAt ?? application.updatedAt).toISOString();
  const applicationNumber = `APP-${id.replaceAll('-', '').slice(0, 12).toUpperCase()}`;
  const record = { id, applicationNumber, siteId: identity.id, siteKey, productKey: coverages[0].productKey, coverages, catalogRevision: revision,
    status: 'Pending TPA Review', currentActionOwnerType: 'TPA', currentActionOwnerId: null, submittedAt: timestamp, createdAt: timestamp, updatedAt: timestamp, deletedAt: null };
  await db.query(`INSERT INTO portal_applications (id, site_key, catalog_revision, submitted_at, record)
    VALUES ($1, $2, $3, $4, $5) ON CONFLICT (id) DO NOTHING`, [id, siteKey, revision, timestamp, JSON.stringify(record)]);
  const event = { id: `${id}:submitted`, applicationId: id, eventType: 'submitted', fromStatus: 'In Progress', toStatus: record.status, fromOwnerType: 'Applicant', toOwnerType: 'TPA', performedBy: 'Applicant', notes: null, createdAt: timestamp };
  await db.query('INSERT INTO portal_application_events (id, application_id, event) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING', [event.id, id, JSON.stringify(event)]);
  return applicationNumber;
}

async function applicant(db, path, body) {
  if (typeof body.siteKey !== 'string') fail(400, 'Choose a Site.');
  if (path === '/applicant/save') {
    if (!body.values || typeof body.values !== 'object' || Array.isArray(body.values)) fail(400, 'Invalid application values.');
    const { email, coverageSelections, productApplicants, coverageAmounts } = body.values;
    // The hosted submission demo only requires product elections and a recipient for save authorization.
    body = { ...body, values: { email, coverageSelections, productApplicants, coverageAmounts } };
  } else if (!['start-signing', 'complete-signing'].includes(body.event)) {
    fail(400, 'Unsupported hosted prototype workflow action.');
  }
  return inTransaction(db, async client => {
    const { rows: [site] } = await client.query('SELECT identity FROM portal_sites WHERE site_key = $1 AND active', [body.siteKey]);
    if (!site) fail(404, 'Site unavailable.');
    const { revision } = await readCatalog(client);
    await client.query("INSERT INTO portal_applicant_workflow (site_key, state) VALUES ($1, 'null'::jsonb) ON CONFLICT DO NOTHING", [body.siteKey]);
    const { rows: [stored] } = await client.query('SELECT state FROM portal_applicant_workflow WHERE site_key = $1 FOR UPDATE', [body.siteKey]);
    const workflow = createApplicantSaves({ initialState: stored.state, availableSite: key => key === body.siteKey, revisionFor: () => revision });
    if (!workflow.handles(path)) fail(404, 'Unknown applicant action.');
    const result = workflow.request(path, body);
    const state = workflow.snapshot();
    if (path === '/applicant/workflow' && result.stage === 'submitted') {
      const { rows: [saved] } = await client.query('SELECT record FROM portal_applications WHERE id = $1', [body.applicationId]);
      result.applicationNumber = saved?.record.applicationNumber ?? await publishApplication(client, state.applications[body.applicationId], site.identity);
    }
    await client.query('UPDATE portal_applicant_workflow SET state = $1 WHERE site_key = $2', [JSON.stringify(state), body.siteKey]);
    return result;
  });
}

export function createPortalHandler(db) {
  let compressed;

  async function catalogResponse(request, url) {
    const expectedRevision = url.searchParams.get('revision');
    if (expectedRevision !== null && !/^postgres:v1:sha256:[a-f0-9]{64}$/.test(expectedRevision)) fail(400, 'Invalid catalog revision.');
    const ifNoneMatch = request.headers.get('If-None-Match');
    const matches = etag => ifNoneMatch?.split(',').some(tag => {
      const value = tag.trim();
      return value === '*' || value.replace(/^W\//, '') === etag.slice(2);
    });
    const headers = revision => ({
      'Content-Type': 'application/gzip',
      'Cache-Control': 'no-cache',
      'X-Portal-Catalog-Revision': revision,
      ETag: `W/"${revision}"`,
    });
    const cached = compressed;
    if (cached || ifNoneMatch) {
      const { revision } = await readCatalog(db, false, expectedRevision);
      const metadata = headers(revision);
      if (matches(metadata.ETag)) return new Response(null, { status: 304, headers: metadata });
      if (cached?.revision === revision) return new Response(await cached.body, { headers: metadata });
    }
    // Read the revision and payload together when a new catalog is published.
    const { revision, payload } = await readCatalog(db, true, expectedRevision);
    const metadata = headers(revision);
    if (matches(metadata.ETag)) return new Response(null, { status: 304, headers: metadata });
    if (compressed?.revision !== revision) {
      const entry = { revision, body: compressCatalog(payload) };
      compressed = entry;
      void entry.body.catch(() => { if (compressed === entry) compressed = undefined; });
    }
    const { body } = compressed;
    return new Response(await body, { headers: metadata });
  }

  return async request => {
    try {
      const url = new URL(request.url);
      const path = url.pathname.replace(/^\/api\/portal|^\/\.netlify\/functions\/portal/, '');
      if (path === '/catalog' && request.method === 'GET') {
        return await catalogResponse(request, url);
      }
      if (!['GET', 'POST'].includes(request.method)) fail(405, 'Unsupported request method.');
      let body = {};
      if (request.method === 'POST') {
        if (request.headers.has('origin') && request.headers.get('origin') !== url.origin) fail(403, 'Use this portal to submit requests.');
        if (!request.headers.get('content-type')?.startsWith('application/json')) fail(415, 'Send a JSON request.');
        body = await request.json().catch(() => fail(400, 'Invalid JSON request.'));
        if (!body || typeof body !== 'object' || Array.isArray(body)) fail(400, 'Send a JSON object.');
      }
      if (path === '/session') return await session(db, request, body, url);
      if (['/applicant/save', '/applicant/workflow'].includes(path) && request.method === 'POST') return reply(await applicant(db, path, body));
      const user = await getUser(db, request);
      if (!user) fail(401, 'Sign in to Portal Admin.');
      if (path === '/sites' && request.method === 'GET') {
        const { rows } = await db.query(`SELECT s.site_key, s.identity, a.id AS "hostingAssociationId", t.id AS "organizationId",
          a.name AS "associationName", t.name AS "organizationName", s.migration_stage AS "migrationStage", s.migration_status AS "migrationStatus"
          FROM portal_sites s JOIN portal_associations a ON a.id = s.hosting_association_id JOIN portal_tpas t ON t.id = a.tpa_id
          WHERE s.active ORDER BY t.name, a.name, s.identity->>'name'`);
        return reply(rows.filter(row => canRead(user, row.site_key)).map(({ site_key: _siteKey, identity, ...relationships }) => ({ ...identity, ...relationships })));
      }
      if (path === '/users' && request.method === 'GET') {
        requireAdmin(user);
        return reply((await db.query(`${projection} ORDER BY u.display_name`)).rows);
      }
      if (path === '/template-editor' && request.method === 'POST') {
        requireAdmin(user);
        return reply(await templateEditor(db, user, body));
      }
      if (path === '/drafts' && request.method === 'POST') return reply(await drafts(db, user, body));
      if (path === '/applications' && request.method === 'POST') return reply(await applications(db, user, body));
      return reply({ error: 'Unknown Portal action.' }, 404);
    } catch (error) {
      if (!error.status) console.error('Portal database request failed', error.code ?? error.name);
      return reply({ error: error.status ? error.message : 'Portal database request failed.', ...(error.code && error.status ? { code: error.code, retryAt: error.retryAt } : {}) }, error.status ?? 500);
    }
  };
}

let handler;
export default async request => {
  if (!handler) {
    try {
      const pool = process.env.DATABASE_URL ? connectPortalDatabase() : getDatabase().pool;
      handler = createPortalHandler(pool);
    } catch (error) {
      if (error.name !== 'MissingDatabaseConnectionError') console.error('Portal database initialization failed', error.name);
      return reply({ error: 'Portal database connection is not configured.' }, 503);
    }
  }
  return handler(request);
};
