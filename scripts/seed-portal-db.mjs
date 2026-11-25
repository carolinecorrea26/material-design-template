import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { isDeepStrictEqual } from 'node:util';
import { validateIdentityCatalog } from '../src/persistence/identityCatalog.ts';
import { upgradeLegacyAssociationData } from '../src/persistence/legacyAssociationMigration.ts';
import { connectPortalDatabase, digest, hashPassword, inTransaction } from './portal-db.mjs';

const revisionOf = catalogText => `postgres:v1:sha256:${digest(catalogText)}`;

export async function checkPortalCatalog(db, catalogText) {
  const { rows: [published] } = await db.query('SELECT revision, payload::text FROM portal_catalog WHERE id = 1');
  const revision = revisionOf(catalogText);
  if (!published || published.revision !== revision || published.payload !== catalogText) {
    throw new Error('The Portal database catalog differs from public/catalog/portal.json. Use the same release checkout to publish it.');
  }
  return revision;
}

export async function preparePortalDatabase(pool, { catalogText, adminPassword, managerPassword, expectedRevision }) {
  const catalog = JSON.parse(catalogText);
  if (catalog.formatVersion !== 1 || !Array.isArray(catalog.analyticsTags)) throw new Error('Invalid published Library catalog.');
  const { data } = catalog;
  validateIdentityCatalog(data);
  const ruleKeys = new Set(data.rules.map(rule => rule.key));
  if (data.ruleActions.some(action => !ruleKeys.has(action.ruleKey))) throw new Error('The Library catalog contains actions for missing rules.');
  const sites = data.sites.filter(site => site.status === 'active' && !site.deletedAt);
  if (!sites.length) throw new Error('The Library catalog contains no active Sites.');
  const revision = revisionOf(catalogText);
  const schema = await Promise.all(['0001_portal.sql', '0002_association_identity.sql'].map(file =>
    readFile(new URL(`../netlify/database/migrations/${file}`, import.meta.url), 'utf8')));

  await inTransaction(pool, async db => {
    for (const migration of schema) await db.query(migration);
    const { rows: [previous] } = await db.query('SELECT revision, payload FROM portal_catalog WHERE id = 1 FOR UPDATE', []);
    if (expectedRevision !== undefined && previous && previous.revision !== expectedRevision && previous.revision !== revision) {
      throw new Error('The hosted database revision differs from both the live Portal and this release. Check the last release before retrying.');
    }
    const { rows: savedOwners } = await db.query(`SELECT DISTINCT COALESCE(hosting_association_id, identity->>'hostingAssociationId', identity->>'clientId') AS id
      FROM portal_sites`, []);
    const hostingIds = new Set([...sites.map(site => site.hostingAssociationId), ...savedOwners.map(row => row.id)]);
    const associationIds = new Set([...hostingIds, ...data.associationAffiliations.filter(link => hostingIds.has(link.hostingAssociationId)).map(link => link.memberAssociationId)]);
    const associations = data.associationEntities.filter(association => associationIds.has(association.id));
    const tpaIds = new Set(associations.map(association => association.organizationId));
    for (const tpa of data.organizations.filter(row => tpaIds.has(row.id))) {
      await db.query(`INSERT INTO portal_tpas (id, tpa_key, name) VALUES ($1, $2, $3)
        ON CONFLICT (id) DO UPDATE SET tpa_key = EXCLUDED.tpa_key, name = EXCLUDED.name`, [tpa.id, tpa.key, tpa.name]);
    }
    for (const association of associations) {
      await db.query(`INSERT INTO portal_associations (id, association_key, tpa_id, name) VALUES ($1, $2, $3, $4)
        ON CONFLICT (id) DO UPDATE SET association_key = EXCLUDED.association_key, tpa_id = EXCLUDED.tpa_id, name = EXCLUDED.name`,
      [association.id, association.key, association.organizationId, association.name]);
    }
    await db.query('UPDATE portal_sites SET active = false WHERE NOT (site_key = ANY($1::text[]))', [sites.map(site => site.key)]);
    for (const site of sites) {
      const { hostingAssociationId, ...identity } = site;
      await db.query(`INSERT INTO portal_sites (site_key, hosting_association_id, identity, migration_stage, migration_status)
        VALUES ($1, $2, $3, $4, $5) ON CONFLICT (site_key) DO UPDATE SET hosting_association_id = EXCLUDED.hosting_association_id, identity = EXCLUDED.identity, active = true`,
      [site.key, hostingAssociationId, JSON.stringify(identity), site.key === 'asce' ? 'Requirements' : null, site.key === 'asce' ? 'In progress' : 'Not started']);
    }
    await db.query(`UPDATE portal_sites SET hosting_association_id = COALESCE(identity->>'hostingAssociationId', identity->>'clientId'),
      identity = identity - ARRAY['clientId','hostingAssociationId','organizationId','organizationName','associationName']
      WHERE hosting_association_id IS NULL`);
    await db.query('ALTER TABLE portal_sites ALTER COLUMN hosting_association_id SET NOT NULL');
    const previousData = previous?.payload?.data;
    if (previous && previous.revision !== revision && isDeepStrictEqual({
      ...previous.payload,
      data: Array.isArray(previousData?.clients) ? upgradeLegacyAssociationData(previousData) : previousData,
    }, catalog)) {
      await db.query(`UPDATE portal_site_drafts AS draft SET base_revision = $1 WHERE base_revision = $2
        AND NOT EXISTS (SELECT 1 FROM portal_site_drafts current WHERE current.site_key = draft.site_key AND current.base_revision = $1)`,
      [revision, previous.revision]);
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
    const catalogText = await readFile(new URL('../public/catalog/portal.json', import.meta.url), 'utf8');
    if (process.argv.includes('--check')) {
      console.log(`Portal database matches Library revision ${await checkPortalCatalog(pool, catalogText)}.`);
    } else {
      const result = await preparePortalDatabase(pool, {
        catalogText,
        adminPassword: process.env.PORTAL_DEMO_ADMIN_PASSWORD,
        managerPassword: process.env.PORTAL_DEMO_MANAGER_PASSWORD,
      });
      console.log(`Loaded Library revision ${result.revision} with ${result.siteCount} Sites.`);
    }
  } finally {
    await pool.end();
  }
}
