import { randomUUID } from 'node:crypto';
const fail = (status, message) => { throw Object.assign(new Error(message), { status }); };
/** Prototype release records deliberately have no access to the production activation pointer. */
export async function builderRelease({ path, body, state, commit, clock, drafts, quotes, analyticsTags, validatePayload, actor }) {
  state.prototypeReleases ??= {}; state.prototypeHeads ??= {}; state.buildReviews ??= {}; state.launchQueue ??= {};
  state.builderDrafts ??= {};
  const hydrate = row => { const library = drafts[row.libraryDraftId]; return { ...row, canEdit: row.ownerId === actor, draftDataJson: library ? { ...library.payload, mockTransport: { id: library.id, version: library.version, baseReleaseId: library.baseReleaseId } } : null }; };
  if (path === '/builder/catalog') {
    const payloads = Object.values(drafts).map(d => d.payload.data);
    const clients = payloads.flatMap(d => d.clients.filter(c => c.id.startsWith('build-client-')));
    const keys = new Set(clients.map(c => c.key));
    const unique = rows => [...new Map(rows.map(r => [r.id, r])).values()];
    return { organizations: unique(payloads.flatMap(d => (d.organizations ?? []).filter(o => o.id.startsWith('build-org-')))), organizationProfiles: unique(payloads.flatMap(d => (d.organizationProfiles ?? []).filter(p => (d.organizations ?? []).some(o => o.key === p.organizationKey && o.id.startsWith('build-org-'))))), clients: unique(clients), configurationValues: unique(payloads.flatMap(d => d.configurationValues.filter(r => r.scope === 'client' && keys.has(r.clientKey)))), brandingProfiles: unique(payloads.flatMap(d => d.brandingProfiles.filter(r => r.scope === 'client' && keys.has(r.clientKey)))), supportProfiles: unique(payloads.flatMap(d => d.supportProfiles.filter(r => r.scope === 'client' && keys.has(r.clientKey)))) };
  }
  if (path === '/builder/drafts') return Object.values(state.builderDrafts).map(hydrate);
  if (path === '/builder/draft/create') {
    if (!drafts[body.libraryDraftId] || drafts[body.libraryDraftId].siteKey !== body.siteKey) fail(400, 'Save the Site Library before creating its builder record');
    const existing = Object.values(state.builderDrafts).find(r => r.siteKey === body.siteKey);
    if (existing) { if (existing.ownerId !== actor) fail(403, 'Only the user who started this Site can edit it'); return hydrate(existing); }
    const row = { id: randomUUID(), clientId: body.clientId, siteKey: body.siteKey, siteName: body.siteName, status: 'Draft', currentStep: 'Library configuration', libraryDraftId: body.libraryDraftId, ownerId: actor, createdAt: new Date(clock()).toISOString(), updatedAt: new Date(clock()).toISOString(), deletedAt: null };
    commit(() => { state.builderDrafts[row.id] = row; }); return hydrate(row);
  }
  if (path === '/builder/draft/update') {
    const row = state.builderDrafts[body.id]; if (!row) fail(404, 'Builder draft unavailable');
    if (row.ownerId !== actor) fail(403, 'Only the user who started this Site can edit it');
    const allowed = ['siteName', 'status', 'currentStep', 'deletedAt', 'libraryDraftId'];
    if (!body.patch || Object.keys(body.patch).some(k => !allowed.includes(k))) fail(400, 'Invalid builder update');
    if (body.patch.libraryDraftId && drafts[body.patch.libraryDraftId]?.siteKey !== row.siteKey) fail(400, 'Site Library mismatch');
    commit(() => { Object.assign(row, body.patch, { updatedAt: new Date(clock()).toISOString() }); }); return hydrate(row);
  }
  const targetSite = drafts[body.id]?.siteKey ?? state.launchQueue[body.queueId]?.siteKey ?? body.siteKey;
  const owner = Object.values(state.builderDrafts).find(r => r.siteKey === targetSite);
  if (!['/builder/status', '/builder/queue'].includes(path) && owner && owner.ownerId !== actor) fail(403, 'Only the user who started this Site can edit it');
  const draft = drafts[body.id];
  const current = () => {
    if (!draft || draft.version !== body.expectedVersion || draft.payloadHash !== body.payloadHash) fail(409, 'Save the draft and reload its current revision before review or launch.');
    return draft;
  };
  const strict = keys => { if (Object.keys(body).some(k => !keys.includes(k))) fail(400, 'Unexpected builder properties'); };
  if (path === '/builder/status') {
    strict(['siteKey']);
    return { heads: state.prototypeHeads[body.siteKey] ?? {}, releases: Object.values(state.prototypeReleases).filter(r => r.siteKey === body.siteKey).map(({ payload, ...r }) => r), queue: Object.values(state.launchQueue).filter(r => r.siteKey === body.siteKey), review: state.buildReviews[body.siteKey] ?? null };
  }
  if (path === '/builder/queue') { strict([]); return Object.values(state.launchQueue); }
  if (path === '/builder/review') {
    strict(['id','expectedVersion','payloadHash','visualChecks','serviceChecks']); current();
    const blockers = [];
    if (!validatePayload) blockers.push('Executable Library validator unavailable');
    else { try { await validatePayload(draft.payload); } catch (e) { blockers.push(`Library validation: ${e.message}`); } }
    const applicableTag = t => t.sites.some(key => key === draft.siteKey || !!draft.payload.data.sites.find(s => s.key === draft.siteKey)?.legacyClientId && draft.payload.data.sites.find(s => s.key === key)?.legacyClientId === draft.payload.data.sites.find(s => s.key === draft.siteKey)?.legacyClientId);
    const applicablePages = new Set(analyticsTags.filter(t => applicableTag(t) && t.kind === 'page').map(t => t.pageId));
    const pages = draft.payload.data.sitePages.filter(p => { const page = draft.payload.data.pages?.find(d => d.key === p.pageKey)?.definition; return p.siteKey === draft.siteKey && p.requirement !== 'none' && page?.type !== 'internal' && (!page?.healthGate || applicablePages.has(p.pageKey)); }).map(p => p.pageKey);
    if (!Array.isArray(body.visualChecks) || pages.some(page => !body.visualChecks.some(c => c.page === page && c.desktop === true && c.mobile === true && typeof c.notes === 'string' && c.notes.trim()))) blockers.push('Record desktop and mobile visual acceptance with notes for every included page');
    const revision = `prototype:${draft.payloadHash}`;
    const checks = body.serviceChecks ?? [];
    const products = draft.payload.data.siteProducts.filter(p => p.enabled && p.siteId === draft.payload.data.sites.find(s => s.key === draft.siteKey)?.id).map(p => p.productKey);
    for (const product of products) {
      const check = checks.find(c => c.productKey === product);
      const approved = check && Object.values(state.payments).map(p => p.response).find(p => p.paymentId === check.approvedPaymentId);
      const declined = check && Object.values(state.payments).map(p => p.response).find(p => p.paymentId === check.declinedPaymentId);
      const valid = (p, status) => { const q = p && quotes.get(p.quoteId); return p?.status === status && q?.revision === revision && q.siteKey === draft.siteKey && q.productKey === product && q.expiresAt > clock(); };
      const rates = draft.payload.data.configurationDefinitions.filter(d => d.definition.target?.kind === 'site-rate-presentation').map(d => d.key);
      const policy = draft.payload.data.configurationValues.find(v => v.scope === 'site' && v.siteKey === draft.siteKey && rates.includes(v.configurationKey))?.value;
      if (policy?.praseConfigured === false) { if (check?.referenceOnly !== true) blockers.push(`${product}: confirm reference-only/no-PRASE preview`); }
      else if (!valid(approved, 'authorized') || !valid(declined, 'declined')) blockers.push(`${product}: run approved and declined mock payment scenarios on this revision`);
    }
    const events = state.analytics.filter(e => e.properties.siteKey === draft.siteKey && e.properties.revision === revision);
    const expectedTags = analyticsTags.filter(t => applicableTag(t) && t.kind === 'page' && t.events.includes('view') && pages.includes(t.pageId));
    if (!expectedTags.length || expectedTags.some(t => !events.some(e => e.tagId === t.id && e.event === 'view'))) blockers.push('Open every included journey page to verify revision-matched analytics');
    if (drafts[body.id]?.version !== body.expectedVersion || drafts[body.id]?.payloadHash !== body.payloadHash) fail(409, 'Draft changed during review');
    const review = { id: randomUUID(), siteKey: draft.siteKey, draftId: draft.id, version: draft.version, payloadHash: draft.payloadHash, revision, blockers, visualChecks: body.visualChecks, serviceChecks: checks, analyticsCount: events.length, reviewedAt: clock(), scope: 'provisional-prototype' };
    commit(() => { state.buildReviews[draft.siteKey] = review; }); return review;
  }
  if (path === '/builder/stage') {
    strict(['id','expectedVersion','payloadHash','expectedHead']); current();
    const review = state.buildReviews[draft.siteKey];
    if (!review || review.payloadHash !== draft.payloadHash || review.version !== draft.version || review.blockers.length) fail(409, 'Complete review for this saved revision before staging UAT');
    const heads = state.prototypeHeads[draft.siteKey] ?? {};
    if ((heads.uat ?? null) !== body.expectedHead) fail(409, 'UAT head changed');
    const release = { id: randomUUID(), siteKey: draft.siteKey, payloadHash: draft.payloadHash, revision: review.revision, payload: structuredClone(draft.payload), reviewId: review.id, createdAt: clock(), scope: 'prototype', environment: 'uat' };
    commit(() => { state.prototypeReleases[release.id] = release; state.prototypeHeads[draft.siteKey] = { ...heads, uat: release.id }; state.audit.push({ action: 'prototype-uat', releaseId: release.id, at: clock() }); });
    return { ...release, payload: undefined };
  }
  if (path === '/builder/schedule') {
    strict(['id','expectedVersion','payloadHash','releaseKey','releaseName','releaseDate']); current();
    const head = state.prototypeReleases[state.prototypeHeads[draft.siteKey]?.uat];
    if (!head || head.payloadHash !== draft.payloadHash) fail(409, 'Stage the reviewed revision in UAT first');
    const today = new Date(clock()).toLocaleDateString('en-CA', { timeZone: 'America/New_York' });
    if (!/^\d{4}-\d{2}-\d{2}$/.test(body.releaseDate) || Number.isNaN(Date.parse(body.releaseDate)) || new Date(body.releaseDate).toISOString().slice(0,10) !== body.releaseDate || body.releaseDate < today || !body.releaseKey || !body.releaseName) fail(400, 'Choose the next scheduled release with a valid date');
    if (Object.values(state.launchQueue).some(q => q.siteKey === draft.siteKey && q.status === 'Scheduled')) fail(409, 'This Site already has a scheduled launch');
    const entry = { id: randomUUID(), siteKey: draft.siteKey, snapshotId: head.id, revision: head.revision, releaseKey: body.releaseKey, releaseName: body.releaseName, releaseDate: body.releaseDate, status: 'Scheduled', expectedHead: state.prototypeHeads[draft.siteKey]?.production ?? null };
    commit(() => { state.launchQueue[entry.id] = entry; state.audit.push({ action: 'prototype-schedule', queueId: entry.id, at: clock() }); }); return entry;
  }
  if (path === '/builder/launch') {
    strict(['queueId']); const entry = state.launchQueue[body.queueId];
    if (!entry || entry.status !== 'Scheduled') fail(409, 'Launch is no longer scheduled');
    const today = new Date(clock()).toLocaleDateString('en-CA', { timeZone: 'America/New_York' });
    if (entry.releaseDate > today) fail(409, 'This release is scheduled for a later date');
    const heads = state.prototypeHeads[entry.siteKey];
    if ((heads.production ?? null) !== entry.expectedHead || heads.uat !== entry.snapshotId) fail(409, 'Environment revision changed; cancel and review a new launch');
    commit(() => { heads.production = entry.snapshotId; entry.status = 'Released'; entry.launchedAt = clock(); state.audit.push({ action: 'prototype-launch', queueId: entry.id, at: clock() }); }); return entry;
  }
  if (path === '/builder/cancel') {
    strict(['queueId']); const entry = state.launchQueue[body.queueId]; if (!entry || entry.status !== 'Scheduled') fail(409, 'No scheduled launch to cancel');
    commit(() => { entry.status = 'Cancelled'; state.audit.push({ action: 'prototype-cancel', queueId: entry.id, at: clock() }); }); return entry;
  }
  if (path === '/builder/rollback') {
    strict(['siteKey','releaseId','expectedHead']); const release = state.prototypeReleases[body.releaseId]; const heads = state.prototypeHeads[body.siteKey];
    if (!release || release.siteKey !== body.siteKey || !heads || heads.production !== body.expectedHead) fail(409, 'Rollback revision conflict');
    if (!Object.values(state.launchQueue).some(q => q.siteKey === body.siteKey && q.snapshotId === release.id && q.status === 'Released')) fail(409, 'Rollback requires a previously launched prototype revision');
    commit(() => { heads.production = release.id; state.audit.push({ action: 'prototype-rollback', releaseId: release.id, previousReleaseId: body.expectedHead, at: clock() }); }); return { head: release.id };
  }
  fail(404, 'Unknown builder operation');
}
