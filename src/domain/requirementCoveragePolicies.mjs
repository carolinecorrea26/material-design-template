const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const strings = value => Array.isArray(value) && value.length > 0 && value.every(item => typeof item === 'string' && item) && new Set(value).size === value.length;

/** Declarative, site-owned policies shared by authoring checks and both compilers. */
export function parseCoveragePolicies(document, siteKey) {
  const fail = message => { throw new Error(`Invalid coverage policies for ${siteKey}: ${message}`); };
  if (!object(document) || document.site !== siteKey || Object.keys(document).some(key => !['site', 'lifeMaximum', 'residency'].includes(key))) fail('invalid document');
  const life = document.lifeMaximum;
  if (life && (!object(life) || !Number.isSafeInteger(life.maximum) || life.maximum <= 0 || !strings(life.products) || !strings(life.applicants) || life.applicants.some(person => !['member', 'spouse', 'child'].includes(person)) || typeof life.source !== 'string' || !life.source.trim())) fail('invalid Life maximum');
  if (document.residency !== undefined && !object(document.residency)) fail('invalid residency');
  for (const policy of Object.values(document.residency ?? {})) {
    if (!object(policy) || !strings(policy.allowedJurisdictions) || policy.allowedJurisdictions.some(code => !/^(US|CA)-[A-Z]{2}$/.test(code)) || typeof policy.excludeActiveMilitary !== 'boolean' || typeof policy.source !== 'string' || !policy.source.trim()) fail('invalid residency policy');
    for (const [person, codes] of Object.entries(policy.applicantExcludedJurisdictions ?? {})) if (!['member', 'spouse', 'child'].includes(person) || !strings(codes) || codes.some(code => !/^(US|CA)-[A-Z]{2}$/.test(code))) fail('invalid applicant residency exclusions');
  }
  return document;
}

export function compileCoveragePolicies(output, source, site, row, setConfiguration) {
  const document = source.siteCoveragePolicies?.[site.key];
  if (!document) return;
  const policies = parseCoveragePolicies(document, site.key);
  const reference = `requirements/parked/sites/${site.key}/coverage-policies.json`;
  const setTarget = (target, path, value) => {
    const matches = output.configurationDefinitions.filter(row => Object.entries(target).every(([key, value]) => row.definition.target?.[key] === value));
    const keys = new Set(matches.map(row => row.key));
    const clientKey = output.clients.find(client => client.id === site.clientId)?.key;
    output.configurationValues = output.configurationValues.filter(row => !keys.has(row.configurationKey) || !(row.scope === 'global' || row.siteKey === site.key || row.scope === 'client' && row.clientKey === clientKey));
    const definitions = source.products.catalog.configurationDefinitions.filter(row => Object.entries(target).every(([key, value]) => row.definition.target?.[key] === value));
    if (definitions.length !== 1 || !definitions[0].definition.path) throw new Error(`Missing shared fresh-start policy definition: ${path}`);
    const definition = definitions[0];
    const ownedPath = definition.definition.path.join('.');
    output.configurationDefinitions = output.configurationDefinitions.filter(row => !keys.has(row.key) || row.key === definition.key || output.configurationValues.some(value => value.configurationKey === row.key));
    setConfiguration(site, ownedPath, value, reference);
  };
  const life = policies.lifeMaximum;
  if (life) {
    if (life.products.some(id => !output.products.some(product => product.key === id && product.categoryKey === 'LI'))) throw new Error('Life maximum references an unavailable Life product');
    setTarget({ kind: 'site-life-aggregate' }, 'coveragePolicy.lifeAggregate', { version: 1, groups: [{ key: `${site.key}.life-per-person`, applicantKeys: life.applicants, productKeys: life.products, maximum: life.maximum }] });
    setTarget({ kind: 'site-life-aggregate-participation' }, 'coveragePolicy.lifeAggregateParticipation', { version: 1, mode: 'configured', provisional: false, reason: 'Confirmed MCR maximum, checked on Coverage Next' });
    const maximum = `$${life.maximum.toLocaleString('en-US')}`;
    setConfiguration(site, 'coveragePolicy.categoryMaxAggregate', { LI: maximum, AD: null, DI: null, OO: null, SH: null }, reference);
    setConfiguration(site, 'coveragePolicy.aggregateNotes.LI', Object.fromEntries(['member', 'spouse'].map(person => {
      const key = `coverage.note.life-${person}-maximum`;
      if (typeof source.content[key] !== 'string') throw new Error(`Missing fresh-start content: ${key}`);
      return [person, source.content[key].replaceAll('{{maximum}}', maximum)];
    })), reference);
    for (const product of source.products.products.filter(product => product.amounts && life.products.includes(product.id))) {
      const legacyUnderwriting = new Set(output.configurationDefinitions.filter(row => row.definition.target?.kind === 'product-presentation' && row.definition.target.productKey === product.id && row.definition.target.property === 'underwritingBands').map(row => row.key));
      const clientKey = output.clients.find(client => client.id === site.clientId)?.key;
      output.configurationValues = output.configurationValues.filter(row => !legacyUnderwriting.has(row.configurationKey) || !(row.scope === 'global' || row.siteKey === site.key || row.scope === 'client' && row.clientKey === clientKey));
      const obsolete = new Set(output.productAmountRules.filter(rule => rule.siteKey === site.key && rule.productKey === product.id).map(rule => rule.amountPatternKey));
      output.productAmountRules = output.productAmountRules.filter(rule => rule.siteKey !== site.key || rule.productKey !== product.id);
      const unused = new Set([...obsolete].filter(key => !output.productAmountRules.some(rule => rule.amountPatternKey === key)));
      output.coverageAmountPatterns = output.coverageAmountPatterns.filter(pattern => !unused.has(pattern.key));
      output.amountBands = output.amountBands.filter(band => !unused.has(band.amountPatternKey));
      output.amountOptions = output.amountOptions.filter(option => !unused.has(option.amountPatternKey));
      let position = 0;
      for (const [group, amount] of Object.entries(product.amounts)) {
        const maximum = amount.maximum === 'combined-life-maximum' ? life.maximum : amount.maximum;
        if (!Number.isSafeInteger(amount.minimum) || !Number.isSafeInteger(maximum) || maximum < amount.minimum || !strings(amount.applicants) || amount.applicants.some(person => !life.applicants.includes(person)) || amount.increment !== null && (!Number.isSafeInteger(amount.increment) || amount.increment <= 0)) throw new Error(`Invalid fresh Life amount: ${product.id}/${group}`);
        const key = `requirements.${site.key}.${product.id}.amount.${group}`;
        // A fresh Site product assignment replaces the prior amount-rule set
        // before this compiler runs; remove its generated pattern independently
        // so compiling an already projected snapshot remains idempotent.
        output.coverageAmountPatterns = output.coverageAmountPatterns.filter(row => row.key !== key);
        output.amountBands = output.amountBands.filter(row => row.amountPatternKey !== key);
        output.amountOptions = output.amountOptions.filter(row => row.amountPatternKey !== key);
        const fixed = amount.increment === null;
        output.coverageAmountPatterns.push(row('coverageAmountPatterns', key, 'requirements/global/products.json', { patternKey: 'coverage-amount-options', amountType: fixed ? 'fixed' : 'range', minimum: amount.minimum, maximum, increment: amount.increment, formula: null, baseProductKey: null, baseApplicantKey: null, baseApplicantClass: null, multiplier: null }));
        if (!fixed) output.amountBands.push(row('amountBands', `${key}.band`, 'requirements/global/products.json', { amountPatternKey: key, minimum: amount.minimum, maximum, increment: amount.increment, conditionKey: null, position: 0 }));
        for (const applicant of amount.applicants) {
          output.productAmountRules.push(row('productAmountRules', `${key}.${applicant}`, 'requirements/global/products.json', { productKey: product.id, applicantTypeKey: applicant, applicantClass: null, amountPatternKey: key, conditionKey: null, clientKey: null, siteKey: site.key, position: position++ }));
          if (applicant === 'child') continue;
          // A terminal FUW interval ends at the product ceiling, not a second
          // independently authored coverage maximum. QD thresholds stay intact.
          const scoped = rule => rule.siteKey === site.key && rule.productKey === product.id && rule.applicantTypeKey === applicant;
          const highest = Math.max(...output.underwritingBands.filter(scoped).map(rule => rule.maximumAmount ?? 0));
          output.underwritingBands = output.underwritingBands.flatMap(rule => {
            if (!scoped(rule)) return [rule];
            const upper = rule.pathway === 'FUW' && rule.maximumAmount === highest ? maximum : Math.min(rule.maximumAmount ?? Infinity, maximum);
            if (rule.minimumAmount !== null && rule.minimumAmount > upper) return [];
            return [{ ...rule, maximumAmount: upper }];
          });
        }
      }
    }
  }
  for (const [productKey, { source: evidence, ...policy }] of Object.entries(policies.residency ?? {})) {
    if (!output.products.some(product => product.key === productKey)) throw new Error(`Unknown residency product: ${productKey}`);
    setTarget({ kind: 'product-residency-policy', productKey }, `coveragePolicy.residency.${productKey}`, { version: 1, ...policy, provisional: false, revisit: [] });
  }
}
