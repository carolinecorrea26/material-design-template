import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { validateIdentityCatalog } from '../src/persistence/identityCatalog.ts';
import { connectPortalDatabase, digest, hashPassword, inTransaction } from './portal-db.mjs';

export async function preparePortalDatabase(pool, { catalogText, adminPassword, managerPassword }) {
  const catalog = JSON.parse(catalogText);
  if (catalog.formatVersion !== 1 || !Array.isArray(catalog.analyticsTags)) throw new Error('Invalid published Library catalog.');
  const { data } = catalog;
  validateIdentityCatalog(data);
  const ruleKeys = new Set(data.rules.map(rule => rule.key));
  if (data.ruleActions.some(action => !ruleKeys.has(action.ruleKey))) throw new Error('The Library catalog contains actions for missing rules.');
  const sites = data.sites.filter(site => site.status === 'active' && !site.deletedAt);
  if (!sites.length) throw new Error('The Library catalog contains no active Sites.');
  const revision = `postgres:v1:sha256:${digest(catalogText)}`;
  const schema = await readFile(new URL('../netlify/database/migrations/0001_portal.sql', import.meta.url), 'utf8');

  await inTransaction(pool, async db => {
    await db.query(schema);
    await db.query('UPDATE portal_sites SET active = false WHERE NOT (site_key = ANY($1::text[]))', [sites.map(site => site.key)]);
    for (const site of sites) {
      const client = data.clients.find(row => row.id === site.clientId);
      const organization = data.organizations.find(row => row.id === client.organizationId);
      const association = data.associationEntities.find(row => row.id === site.hostingAssociationId);
      const identity = { ...site, organizationId: organization.id, organizationName: organization.name, associationName: association?.name ?? 'Association unassigned' };
      await db.query(`INSERT INTO portal_sites (site_key, identity, migration_stage, migration_status)
        VALUES ($1, $2, $3, $4) ON CONFLICT (site_key) DO UPDATE SET identity = EXCLUDED.identity, active = true`,
      [site.key, JSON.stringify(identity), site.key === 'asce' ? 'Requirements' : null, site.key === 'asce' ? 'In progress' : 'Not started']);
    }
    await db.query(`INSERT INTO portal_catalog (id, revision, payload) VALUES (1, $1, $2)
      ON CONFLICT (id) DO UPDATE SET revision = EXCLUDED.revision, payload = EXCLUDED.payload`, [revision, catalogText]);

    const users = [
      ['user-demo-admin', 'portal.admin@example.test', 'Portal Admin', 'portal-admin', adminPassword],
      ['user-demo-manager', 'account.manager@example.test', 'Account Manager', 'account-manager', managerPassword],
    ];
    for (const [id, email, name, role, password] of users) {
      if (!password) continue;
      if (password.length < 12 || password.length > 128) throw new Error(`Set a 12–128 character demo password for ${email}.`);
      await db.query(`INSERT INTO portal_users (id, email, display_name, role_key, password_hash) VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (id) DO UPDATE SET password_hash = EXCLUDED.password_hash`, [id, email, name, role, hashPassword(password)]);
      if (role === 'account-manager' && sites.some(site => site.key === 'asce')) {
        await db.query('INSERT INTO portal_user_sites (user_id, site_key) VALUES ($1, $2) ON CONFLICT DO NOTHING', [id, 'asce']);
      }
    }
  });
  return { revision, siteCount: sites.length };
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  const pool = connectPortalDatabase();
  try {
    const result = await preparePortalDatabase(pool, {
      catalogText: await readFile(new URL('../public/catalog/portal.json', import.meta.url), 'utf8'),
      adminPassword: process.env.PORTAL_DEMO_ADMIN_PASSWORD,
      managerPassword: process.env.PORTAL_DEMO_MANAGER_PASSWORD,
    });
    console.log(`Loaded Library revision ${result.revision} with ${result.siteCount} Sites.`);
  } finally {
    await pool.end();
  }
}
