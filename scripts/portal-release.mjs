import { execFileSync, spawnSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { setTimeout as delay } from 'node:timers/promises';
import { gunzipSync } from 'node:zlib';
import { connectPortalDatabase, digest } from './portal-db.mjs';
import { processTemplateRelease } from './template-editor-release.mjs';
import { checkPortalCatalog, preparePortalDatabase } from './seed-portal-db.mjs';

const branch = 'redesignv6';
const hostedReleaseLock = 8615916;
const repository = 'https://github.com/carolinecorrea26/material-design-template';
const portal = {
  name: 'material-design-template', id: '86159baa-204c-4672-b586-00f5b8caa786',
  url: 'https://redesignv6--material-design-template.netlify.app', context: 'branch-deploy',
};
const storybook = {
  name: 'material-design-template-storybook', id: '49d9c526-f0b6-4834-9934-005794d987cb',
  url: 'https://material-design-template-storybook.netlify.app', context: 'production',
};
const targets = [portal, storybook];
const catalogPath = 'catalog/portal.json';
const catalogText = await readFile(new URL(`../public/${catalogPath}`, import.meta.url), 'utf8');
const hash = digest(catalogText);
const revisionFor = hash => `postgres:v1:sha256:${hash}`;

function output(command, args, env = process.env) {
  try {
    return execFileSync(command, args, {
      env, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], timeout: 60_000,
    }).trim();
  } catch (error) {
    // In particular, database status output can contain a connection string.
    throw new Error(`${command} ${args.slice(0, 2).join(' ')} failed (${error.code ?? error.status ?? 'unknown'}). Check CLI authentication and access.`);
  }
}

function run(command, args) {
  const { status, error } = spawnSync(command, args, { stdio: 'inherit' });
  if (status !== 0) throw new Error(`${command} ${args.join(' ')} failed (${error?.code ?? status}).`);
}

function netlifyApi(method, data) {
  return JSON.parse(output('netlify', ['api', method, '--data', JSON.stringify(data)]));
}

async function withHostedDatabase(work) {
  const localState = await readFile('.netlify/state.json', 'utf8').catch(error => {
    if (error.code !== 'ENOENT') throw error;
    return '{}';
  });
  const linkedSite = JSON.parse(localState).siteId;
  if (linkedSite && linkedSite !== portal.id) {
    throw new Error(`The checkout is linked to a different Netlify project. Link it to ${portal.name} before connecting to the database.`);
  }
  const result = JSON.parse(output('netlify', ['database', 'status', '--branch', branch, '--json', '--show-credentials'], {
    ...process.env, NETLIFY_SITE_ID: portal.id,
  }));
  const connection = result.database?.connectionString;
  if (!result.enabled || result.target !== branch || !connection) throw new Error(`No hosted database found for ${portal.name}/${branch}.`);
  const url = new URL(connection);
  if (!['postgres:', 'postgresql:'].includes(url.protocol) || !url.hostname.endsWith('.db.netlify.com')) {
    throw new Error('Expected a Netlify-hosted PostgreSQL endpoint.');
  }
  url.searchParams.set('sslmode', 'verify-full');
  const pool = connectPortalDatabase(url.toString());
  try {
    const client = await pool.connect();
    try {
      if (!client.connection.stream.encrypted || !client.connection.stream.authorized) {
        throw new Error('The hosted PostgreSQL connection did not verify TLS.');
      }
    } finally {
      client.release();
    }
    return await work(pool, result);
  } catch (error) {
    if (error.code) throw new Error(`Hosted PostgreSQL operation failed (${error.code}). Check database access and migration state.`);
    throw error;
  } finally {
    await pool.end();
  }
}

async function checkArtifacts() {
  for (const folder of ['dist', 'storybook-static']) {
    if (digest(await readFile(`${folder}/${catalogPath}`)) !== hash) throw new Error(`Stale catalog in ${folder}. Run npm run build:release.`);
  }
  const standalone = await readFile('dist/standalone/admin-center.html', 'utf8');
  if (!standalone.includes(`<meta name="portal-catalog-sha256" content="${hash}">`)) {
    throw new Error('The standalone Admin Center catalog is stale. Run npm run build:release.');
  }
  console.log(`Prototype, Storybook and standalone Admin Center match catalog ${hash}.`);
}

async function fetchArtifact(target, path) {
  const response = await fetch(`${target.url}/${path}`, {
    cache: 'no-cache', signal: AbortSignal.timeout(25_000),
  });
  if (!response.ok) throw new Error(`${target.name}/${path} returned HTTP ${response.status}.`);
  return response;
}

async function staticHash(target) {
  return digest(Buffer.from(await (await fetchArtifact(target, catalogPath)).arrayBuffer()));
}

function preflight() {
  for (const target of targets) {
    const site = netlifyApi('getSite', { site_id: target.id });
    const settings = site.build_settings;
    const productionBranch = target === portal ? 'main' : branch;
    if (site.name !== target.name || settings?.repo_url?.replace(/\.git$/, '') !== repository ||
        settings.repo_branch !== productionBranch || settings.stop_builds || settings.skip_automatic_builds ||
        (target === storybook && settings.package_path?.replace(/^\//, '') !== 'netlify/storybook') ||
        (target === portal && settings.allowed_branches?.length && !settings.allowed_branches.includes(branch))) {
      throw new Error(`Check the Git-connected build settings for ${target.name} before publishing.`);
    }
  }
}

function assertReleaseCheckout() {
  if (output('git', ['branch', '--show-current']) !== branch || output('git', ['status', '--porcelain', '--untracked-files=all'])) {
    throw new Error(`Publishing requires a clean, committed ${branch} checkout.`);
  }
  const remote = output('git', ['remote', 'get-url', '--push', 'origin']).replace(/\.git$/, '')
    .replace(/^git@github\.com:/, 'https://github.com/').replace(/^ssh:\/\/git@github\.com\//, 'https://github.com/');
  if (remote !== repository) throw new Error('The origin push URL does not match the Netlify repository.');
  return output('git', ['rev-parse', 'HEAD']);
}

async function verifyRelease(commit) {
  const announced = new Set();
  for (let attempt = 0; attempt < 60; attempt++) {
    for (const target of targets.filter(target => !announced.has(target.id))) {
      const deploys = netlifyApi('listSiteDeploys', { site_id: target.id, per_page: 20 });
      const deploy = deploys.find(row => row.branch === branch && row.context === target.context && row.commit_ref === commit);
      if (deploy?.state === 'error') throw new Error(`${target.name} failed to deploy ${commit}. See ${deploy.admin_url}.`);
      if (deploy?.state === 'ready' && (target === portal || deploy.published_at)) {
        console.log(`${target.name} deployed ${commit.slice(0, 12)} (${deploy.id}).`);
        announced.add(target.id);
      }
    }
    if (announced.size === targets.length) {
      try {
        const [portalHash, storybookHash, api] = await Promise.all([
          staticHash(portal), staticHash(storybook), fetchArtifact(portal, 'api/portal/catalog'),
        ]);
        const apiHash = digest(gunzipSync(Buffer.from(await api.arrayBuffer())));
        if (portalHash === hash && storybookHash === hash && apiHash === hash &&
            api.headers.get('X-Portal-Catalog-Revision') === revisionFor(hash)) {
          console.log(`Both live deploys and the Portal API match catalog ${hash}.`);
          return;
        }
      } catch (error) {
        if (attempt === 59) throw error;
      }
    }
    await delay(15_000);
  }
  throw new Error('Release did not converge. Check the Netlify deploy logs and rerun npm run release:verify from the release checkout.');
}

async function publish() {
  const commit = assertReleaseCheckout();
  preflight();
  const refspec = `${commit}:refs/heads/${branch}`;
  run('git', ['push', '--dry-run', 'origin', refspec]);
  run('npm', ['run', 'build:release']);
  if (assertReleaseCheckout() !== commit) throw new Error('The release checkout changed during the build.');
  await withHostedDatabase(async db => {
    const lock = await db.connect();
    try {
      const { rows: [result] } = await lock.query('SELECT pg_try_advisory_lock($1) AS held', [hostedReleaseLock]);
      if (!result.held) throw new Error('Another coordinated release is running. Wait for it before retrying.');
      const expectedRevision = revisionFor(await staticHash(portal));
      // Recheck the remote while holding the release lock.
      run('git', ['push', '--dry-run', 'origin', refspec]);
      const imported = await preparePortalDatabase(db, { catalogText, expectedRevision });
      await checkPortalCatalog(db, catalogText);
      console.log(`Synchronized ${imported.siteCount} Sites to the hosted database at ${imported.revision}.`);
      run('git', ['push', 'origin', refspec]);
      await verifyRelease(commit);
    } finally {
      await lock.query('SELECT pg_advisory_unlock($1)', [hostedReleaseLock]).finally(() => lock.release());
    }
  });
}

async function runEditorQueue(db, hosted) {
  const watch = process.argv.includes('--watch');
  const options = {
    refresh: () => run('npm', ['run', 'catalog:refresh']),
    buildLocal: () => run('npm', ['run', 'build:release']),
    prepare: (catalogText, expectedRevision) => preparePortalDatabase(db, { catalogText, expectedRevision }),
  };
  if (hosted) Object.assign(options, {
    inspectCheckout: assertReleaseCheckout,
    // The draft ID is recorded in the commit so a restarted worker can identify it.
    recoverCommit: id => {
      const marker = `Template Editor draft ${id}`;
      return output('git', ['log', '-1', '--format=%s']) === marker ? output('git', ['rev-parse', 'HEAD']) : null;
    },
    resetStaged: () => run('git', ['restore', '--staged', '--', 'requirements', 'public/catalog', 'docs']),
    commit: id => {
      run('git', ['add', '--update', '--', 'requirements', 'public/catalog', 'docs']);
      // A Site override may create a new Contact assignment file.
      run('git', ['add', '--', 'requirements/parked/sites']);
      run('git', ['commit', '-m', `Template Editor draft ${id}`]);
      return output('git', ['rev-parse', 'HEAD']);
    },
    publishHosted: () => run('npm', ['run', 'release:publish']),
  });
  do {
    try {
      const published = await processTemplateRelease(db, options);
      if (published) console.log('Template & Site Editor release published.');
      else if (!watch) console.log('No editor release is queued.');
    } catch (error) {
      if (!watch) throw error;
      console.error(error.message);
    }
    if (watch) await delay(5000);
  } while (watch);
}

function localEditorDatabase() {
  const url = new URL(process.env.DATABASE_URL ?? 'postgresql://invalid');
  if (!['postgres:', 'postgresql:'].includes(url.protocol) || !['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)) {
    throw new Error('Set DATABASE_URL for the dedicated local PostgreSQL instance.');
  }
  return url.toString();
}

try {
  switch (process.argv[2]) {
    case 'editor-dev':
      localEditorDatabase();
      process.env.VITE_PORTAL_DATABASE_ENABLED = 'true';
      run('netlify', ['dev', '--offline', '--command', 'npm run dev:catalog -- --port 5173 --strictPort', '--target-port', '5173', '--no-open']);
      break;
    case 'editor-hosted':
      await withHostedDatabase(db => runEditorQueue(db, true));
      break;
    case 'editor-local': {
      // A local Editor worker must not pick up a hosted pilot credential.
      const db = connectPortalDatabase(localEditorDatabase());
      try { await runEditorQueue(db, false); }
      finally { await db.end(); }
      break;
    }
    case 'db-status':
      await withHostedDatabase(async (db, result) => {
        const { rows: [server] } = await db.query("SELECT current_database() AS database, to_regclass('portal_catalog') AS catalog_table");
        const published = server.catalog_table && (await db.query('SELECT revision FROM portal_catalog WHERE id = 1')).rows[0]?.revision;
        console.log(JSON.stringify({
          project: portal.name, branch, database: server.database, tls: true,
          revision: published || null, applied: result.applied, pending: result.pending,
        }, null, 2));
      });
      break;
    case 'db-check':
      await withHostedDatabase(async db => console.log(`Hosted database matches ${await checkPortalCatalog(db, catalogText)}.`));
      break;
    case 'check-artifacts':
      await checkArtifacts();
      break;
    case 'verify':
      await verifyRelease(assertReleaseCheckout());
      break;
    case 'publish':
      await publish();
      break;
    default:
      throw new Error('Expected db-status, db-check, check-artifacts, verify, publish, editor-dev, editor-local or editor-hosted.');
  }
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
