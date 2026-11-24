/** Pure fresh-start field resolver shared by deployment generation and browser consumers. */
const inputTypes = new Set(["text", "number", "date", "radio", "dropdown", "searchable-select", "checkbox", "checkbox-group", "multi-select", "percent"]);
const optionTypes = new Set(["radio", "dropdown", "searchable-select", "checkbox-group", "multi-select"]);
const formats = new Set(["email", "phone", "ssn", "currency", "percent", "month-year", "digits", "postal-code", "alphanumeric"]);
const inputModes = new Set(["text", "email", "tel", "numeric", "decimal"]);
const supportedKeys = new Set(["id", "name", "type", "label", "required", "people", "options", "format", "inputMode", "placeholder", "helperText", "autoComplete", "allowDecimal", "multiline", "configurations", "defaultValue", "tooltip", "minLength", "maxLength", "minimum", "maximum", "helperTextWhen", "underwritingVariants", "labelVariant", "minRows", "disabled", "phoneTypeFieldId", "showPhoneTypeSelector", "visibilityConditionId", "optionExclusions", "coverageCategories", "optionalForProducts"]);
const configurationKeys = new Set(["default", "type", "label", "options", "placeholder", "labelVariant", "optionOutcome"]);
const overrideKeys = new Set(["configuration", "label", "required", "options", "format", "inputMode", "minLength", "maxLength", "optionalForProducts"]);
const object = (value) => value !== null && typeof value === "object" && !Array.isArray(value);
/** A page can preserve its established saved-answer naming without duplicating fields. */
export function resolveAnswerKey(field, person, patterns = {}) {
    if (!object(patterns) || Object.entries(patterns).some(([key, value]) => !['self', 'spouse', 'child', 'beneficiary'].includes(key) || typeof value !== 'string' || !/^(?:[a-z][a-z0-9-]*-)?\{field\}(?:-[a-z][a-z0-9-]*)?$/.test(value))) throw new Error('Invalid fresh-start answer key pattern');
    return (patterns[person] ?? (person === 'self' ? '{field}' : `${person}-{field}`)).replace('{field}', field);
}
const text = (value) => typeof value === "string" && value.trim().length > 0;
const mappingName = (mapping) => "component" in mapping ? `component ${mapping.component}` : `page ${mapping.page}`;
function resolveOptions(id, value, lists) {
    const options = object(value) ? (typeof value.list === "string" ? lists[value.list] : undefined) : value;
    if (!Array.isArray(options) || !options.length)
        throw new Error(`Invalid field options: ${id}`);
    const resolved = options.map((option) => {
        if (!object(option) || !text(option.value) || !text(option.label) || option.outcome !== undefined && !text(option.outcome))
            throw new Error(`Invalid field options: ${id}`);
        return { value: option.value, label: option.label, ...(option.outcome ? { outcome: option.outcome } : {}) };
    });
    if (new Set(resolved.map(option => option.value)).size !== resolved.length)
        throw new Error(`Duplicate field option: ${id}`);
    return resolved;
}
// Labels, required and helper text may vary by page, by person, or both; the most specific key wins.
const pick = (value, keys) => object(value) ? keys.map(key => value[key]).find(entry => entry !== undefined) : value;
// A contextual Site override changes that context, while all other contexts
// retain the shared scalar or contextual default.
const overlay = (base, override) => object(override) ? { ...(object(base) ? base : { default: base }), ...override } : override;
/** Constraints belong to a shared placement, so other uses of a field retain their own contract. */
export function validateFieldMappingConstraints(mapping) {
    if (mapping.constraints === undefined) return;
    if (!object(mapping.constraints)) throw new Error(`Invalid field mapping constraints: ${mappingName(mapping)}`);
    for (const [id, constraint] of Object.entries(mapping.constraints)) {
        const row = mapping.fields?.find(row => row.field === id);
        if (!row || !object(constraint) || Object.keys(constraint).some(key => !['included', 'required', 'fixedProperties'].includes(key)) ||
            ['included', 'required'].some(key => constraint[key] !== undefined && constraint[key] !== true &&
                (!Array.isArray(constraint[key]) || !constraint[key].length || new Set(constraint[key]).size !== constraint[key].length || constraint[key].some(person => !row.people.includes(person)))) ||
            constraint.included && row.default === 'off' || constraint.fixedProperties !== undefined &&
            (!Array.isArray(constraint.fixedProperties) || !constraint.fixedProperties.length || new Set(constraint.fixedProperties).size !== constraint.fixedProperties.length || constraint.fixedProperties.some(key => !overrideKeys.has(key))))
            throw new Error(`Invalid field mapping constraints: ${mappingName(mapping)}/${id}`);
    }
}
function scopedFieldParticipation(sitePage, mapping, person) {
    const scopes = sitePage?.fieldParticipation;
    if (scopes === undefined) return {};
    if (!object(scopes)) throw new Error('Invalid scoped field participation');
    for (const [scope, selection] of Object.entries(scopes)) {
        if (!['self', 'spouse', 'child', 'beneficiary'].includes(scope) || !object(selection) || Object.keys(selection).some(key => !['include', 'hide'].includes(key)))
            throw new Error('Invalid scoped field participation');
        for (const key of ['include', 'hide']) if (selection[key] !== undefined) {
            if (!Array.isArray(selection[key]) || new Set(selection[key]).size !== selection[key].length || selection[key].some(id => {
                const row = mapping.fields.find(row => row.field === id && row.people.includes(scope));
                return !row || (row.default === 'off') !== (key === 'include');
            })) throw new Error(`Invalid scoped field participation: ${scope}/${key}`);
        }
    }
    return scopes[person] ?? {};
}
/**
 * Resolve every field a page or component mapping lists for one person:
 * global definition + field details + option lists, then the site's overrides.
 */
export function resolveMappedFields(mapping, { siteId, person = "self", page, includeAll = false, source } = {}) {
    if (!object(source.fieldIds) || !Array.isArray(source.fieldIds.fields) ||
        !object(source.fieldDetails) || !Array.isArray(source.fieldDetails.fields) || !object(source.optionLists))
        throw new Error("Invalid field requirements");
    const matches = source.mappings.filter(entry => object(entry) && ("component" in mapping ? entry.component === mapping.component : entry.page === mapping.page));
    if (matches.length !== 1 || !object(matches[0]) || !Array.isArray(matches[0].fields))
        throw new Error(`Missing or ambiguous field mapping: ${mappingName(mapping)}`);
    validateFieldMappingConstraints(matches[0]);
    const siteFile = siteId === undefined ? undefined : source.sites[siteId];
    if (siteFile !== undefined && (!object(siteFile) || (siteFile.fields !== undefined && !object(siteFile.fields))))
        throw new Error(`Invalid site field overrides: ${siteId}`);
    const overrides = (object(siteFile) && object(siteFile.fields) ? siteFile.fields : {});
    const registered = source.fieldIds.fields;
    const details = source.fieldDetails.fields;
    const lists = source.optionLists;
    const rows = matches[0].fields;
    const pageKey = page ?? ("page" in mapping ? mapping.page : undefined);
    const sitePage = siteId === undefined || pageKey === undefined ? undefined : source.sitePages?.[siteId]?.[pageKey];
    if (sitePage !== undefined && (!object(sitePage) || ["include", "hide"].some(key => sitePage[key] !== undefined && !(Array.isArray(sitePage[key]) && sitePage[key].every(text)))))
        throw new Error(`Invalid site page file: ${siteId}/${pageKey}`);
    const primary = source.pageMappings?.[pageKey];
    const scopeMapping = primary ? source.mappings.find(entry => 'component' in primary ? entry.component === primary.component : entry.page === primary.page) : matches[0];
    const selection = scopedFieldParticipation(sitePage, scopeMapping ?? matches[0], person);
    const included = new Set([...(sitePage?.include ?? []), ...(selection.include ?? [])]);
    const hidden = new Set([...(sitePage?.hide ?? []), ...(selection.hide ?? [])]);
    const keys = pageKey ? [pageKey, person, "default"] : [person, "default"];
    if (new Set(rows.map(row => object(row) ? row.field : undefined)).size !== rows.length)
        throw new Error(`Duplicate field in ${mappingName(mapping)}`);
    return rows.flatMap(row => {
        if (!object(row) || !text(row.field) || !Array.isArray(row.people))
            throw new Error(`Invalid field mapping row in ${mappingName(mapping)}`);
        if (row.default !== undefined && row.default !== "off")
            throw new Error(`Invalid field default in ${mappingName(mapping)}: ${row.field}`);
        if (!row.people.includes(person))
            return [];
        const id = row.field;
        const constraint = matches[0].constraints?.[id];
        const applies = value => value === true || Array.isArray(value) && value.includes(person);
        if (applies(constraint?.included) && hidden.has(id)) throw new Error(`Required mapped field cannot be hidden: ${siteId}/${pageKey ?? mappingName(mapping)}/${id}`);
        if (!includeAll && (row.default === "off" ? !included.has(id) : hidden.has(id)))
            return [];
        const listed = registered.filter(entry => object(entry) && entry.id === id);
        const found = details.filter(entry => object(entry) && entry.id === id);
        if (listed.length !== 1 || found.length !== 1 || !object(found[0]))
            throw new Error(`Missing or ambiguous field requirement: ${id}`);
        const unsupported = Object.keys(found[0]).filter(key => !supportedKeys.has(key));
        if (unsupported.length)
            throw new Error(`Unsupported field properties for ${id}: ${unsupported.join(", ")}`);
        const override = overrides[id];
        if (override !== undefined && (!object(override) || Object.keys(override).some(key => !overrideKeys.has(key))))
            throw new Error(`Invalid site override: ${siteId}/${id}`);
        for (const property of ['configuration', 'options']) if (object(override?.[property])) {
            const contexts = new Set(['default', 'self', 'spouse', 'child', 'beneficiary', ...Object.keys(source.pageMappings ?? {})]);
            if (Object.entries(override[property]).some(([context, value]) => !contexts.has(context) || (property === 'configuration' ? !text(value) : !Array.isArray(value))))
                throw new Error(`Invalid contextual site override: ${siteId}/${id}/${property}`);
        }
        const optionOverride = pick(override?.options, keys);
        let field = found[0];
        let configurationKey;
        let configurationDefinitions;
        if (field.configurations !== undefined) {
            if (!object(field.configurations))
                throw new Error(`Invalid field configurations: ${id}`);
            const configurations = field.configurations;
            configurationDefinitions = Object.fromEntries(Object.entries(configurations).map(([name, variant]) => {
                const label = pick(variant?.label, keys);
                if (!object(variant) || Object.keys(variant).some(key => !configurationKeys.has(key)) || !inputTypes.has(variant.type) || !text(label) || variant.labelVariant !== undefined && !['floating', 'standard'].includes(variant.labelVariant) || variant.optionOutcome !== undefined && !text(variant.optionOutcome)) throw new Error(`Invalid field configuration: ${id}/${name}`);
                return [name, { inputType: variant.type, label, ...(variant.placeholder ? { placeholder: variant.placeholder } : {}), ...(variant.labelVariant ? { labelVariant: variant.labelVariant } : {}), ...(variant.optionOutcome ? { optionOutcome: variant.optionOutcome } : {}), ...(typeof variant.options === 'string' ? { optionSource: variant.options } : variant.options ? { options: resolveOptions(id, variant.options, lists) } : {}) }];
            }));
            const key = pick(override?.configuration, keys)
                ?? Object.keys(configurations).find(name => object(configurations[name]) && configurations[name].default === true);
            const configuration = typeof key === "string" ? configurations[key] : undefined;
            if (!object(configuration) || Object.keys(configuration).some(name => !configurationKeys.has(name)))
                throw new Error(`Unknown configuration for ${id}: ${String(key)}`);
            const chosen = { ...field, ...configuration };
            delete chosen.configurations;
            delete chosen.default;
            field = chosen;
            configurationKey = key;
        }
        else if (object(override) && override.configuration !== undefined)
            throw new Error(`Unknown configuration for ${id}: ${String(override.configuration)}`);
        if (object(override)) {
            if (override.label !== undefined)
                field = { ...field, label: overlay(field.label, override.label) };
            if (override.required !== undefined)
                field = { ...field, required: overlay(field.required, override.required) };
            for (const property of ['format', 'inputMode', 'minLength', 'maxLength', 'optionalForProducts']) {
                if (override[property] !== undefined) field = { ...field, [property]: override[property] };
            }
        }
        const inputType = field.type;
        const label = pick(field.label, keys), required = pick(field.required, keys), helperText = pick(field.helperText, keys);
        if (applies(constraint?.required) && (required !== true || pick(field.optionalForProducts, keys) !== undefined))
            throw new Error(`Required mapped field cannot be optional: ${siteId ?? 'global'}/${pageKey ?? mappingName(mapping)}/${id}`);
        for (const property of constraint?.fixedProperties ?? []) {
            if (property === 'options' && optionOverride !== undefined)
                throw new Error(`Fixed mapped field property: ${siteId ?? 'global'}/${pageKey ?? mappingName(mapping)}/${id}/options`);
            if (JSON.stringify(field[property]) !== JSON.stringify(found[0][property]))
                throw new Error(`Fixed mapped field property: ${siteId ?? 'global'}/${pageKey ?? mappingName(mapping)}/${id}/${property}`);
        }
        if (!inputTypes.has(inputType) || !text(label) || (required !== undefined && typeof required !== "boolean") ||
            (field.helperText !== undefined && !object(field.helperText) && !text(field.helperText)) || (helperText !== undefined && !text(helperText)) ||
            (field.people !== undefined && (!Array.isArray(field.people) || !field.people.includes(person))) ||
            (field.name !== undefined && !text(field.name)) ||
            (field.format !== undefined && !formats.has(String(field.format))) ||
            (field.inputMode !== undefined && !inputModes.has(String(field.inputMode))) ||
            (field.allowDecimal !== undefined && typeof field.allowDecimal !== "boolean") ||
            (field.multiline !== undefined && typeof field.multiline !== "boolean") ||
            ["placeholder", "autoComplete"].some(key => field[key] !== undefined && !text(field[key]))) {
            throw new Error(`Invalid field requirement: ${siteId ?? 'global'}/${pageKey ?? mappingName(mapping)}/${person}/${id}`);
        }
        const definition = { id, label, inputType, ...(configurationKey ? { configuration: configurationKey, configurations: configurationDefinitions } : {}) };
        if (typeof required === "boolean")
            definition.required = required;
        if (text(field.name))
            definition.displayName = field.name;
        if (field.format !== undefined)
            definition.format = field.format;
        if (field.inputMode !== undefined)
            definition.inputMode = field.inputMode;
        if (typeof field.allowDecimal === "boolean")
            definition.allowDecimal = field.allowDecimal;
        if (typeof field.multiline === "boolean")
            definition.multiline = field.multiline;
        if (text(field.placeholder))
            definition.placeholder = field.placeholder;
        if (text(helperText))
            definition.helperText = helperText;
        if (text(field.autoComplete))
            definition.autoComplete = person === "self" ? field.autoComplete : "off";
        for (const property of ['defaultValue', 'tooltip', 'minLength', 'maxLength', 'minimum', 'maximum', 'helperTextWhen', 'underwritingVariants', 'labelVariant', 'minRows', 'disabled', 'phoneTypeFieldId', 'showPhoneTypeSelector', 'visibilityConditionId', 'optionExclusions', 'coverageCategories', 'optionalForProducts']) {
            if (field[property] === undefined) continue;
            const value = ['defaultValue', 'optionalForProducts'].includes(property) ? pick(field[property], keys) : field[property];
            if (value === undefined) continue;
            if (property === 'defaultValue' && typeof value !== 'string' && typeof value !== 'boolean' && !(Array.isArray(value) && value.every(item => typeof item === 'string'))) throw new Error(`Invalid field requirement: ${id}/${property}`);
            if (['minLength', 'maxLength', 'minRows'].includes(property) && (!Number.isSafeInteger(value) || value < 1) ||
                ['disabled', 'showPhoneTypeSelector'].includes(property) && typeof value !== 'boolean' ||
                ['tooltip', 'phoneTypeFieldId', 'visibilityConditionId'].includes(property) && !text(value) ||
                property === 'labelVariant' && !['floating', 'standard'].includes(value) ||
                property === 'optionExclusions' && !Array.isArray(value)) throw new Error(`Invalid field requirement: ${id}/${property}`);
            if (['minimum', 'maximum'].includes(property) && !Number.isFinite(value) ||
                property === 'helperTextWhen' && (!object(value) || !Array.isArray(value.values) || !value.values.length || !value.values.every(text) || !text(value.text) || value.marker !== undefined && !text(value.marker))) throw new Error(`Invalid field requirement: ${id}/${property}`);
            if (property === 'underwritingVariants' && (!object(value) || Object.entries(value).some(([kind, variant]) => !['default', 'QD'].includes(kind) || !object(variant) || Object.keys(variant).some(key => !['label', 'hidden'].includes(key)) || variant.label !== undefined && !text(variant.label) || variant.hidden !== undefined && typeof variant.hidden !== 'boolean'))) throw new Error(`Invalid field requirement: ${id}/${property}`);
            if (property === 'coverageCategories' && (!Array.isArray(value) || !value.length || new Set(value).size !== value.length || value.some(category => !['LI', 'AD', 'DI', 'OO', 'SH'].includes(category)))) throw new Error(`Invalid field requirement: ${id}/${property}`);
            if (property === 'optionalForProducts' && (!Array.isArray(value) || !value.length || value.some(key => !text(key)) || new Set(value).size !== value.length)) throw new Error(`Invalid field requirement: ${id}/${property}`);
            definition[property] = structuredClone(value);
        }
        if (definition.minLength !== undefined && definition.maxLength !== undefined && definition.minLength > definition.maxLength)
            throw new Error(`Invalid field length range: ${id}`);
        if (definition.minimum !== undefined && definition.maximum !== undefined && definition.minimum > definition.maximum)
            throw new Error(`Invalid field numeric range: ${id}`);
        const needsOptions = optionTypes.has(inputType);
        if (needsOptions !== (field.options !== undefined))
            throw new Error(`Invalid field options: ${id}`);
        if (typeof field.options === 'string') definition.optionSource = field.options;
        if (field.optionOutcome) definition.optionOutcome = field.optionOutcome;
        // A plain string names a runtime source (for example product amounts); the page supplies those options.
        if (needsOptions && typeof field.options !== "string") {
            let options = resolveOptions(id, field.options, lists);
            if (optionOverride !== undefined) {
                const allowed = optionOverride;
                if (!Array.isArray(allowed) || !allowed.length || allowed.some(value => !options.some(option => option.value === value)))
                    throw new Error(`Invalid site option override: ${siteId}/${id}`);
                options = options.filter(option => allowed.includes(option.value));
            }
            definition.options = options;
        }
        else if (optionOverride !== undefined) {
            if (field.options !== 'site-defined') throw new Error(`Invalid site option override: ${siteId}/${id}`);
            definition.options = resolveOptions(id, optionOverride, lists);
            if (definition.options.some(option => !option.outcome)) throw new Error(`Missing site option outcome: ${siteId}/${id}`);
            const declaredOutcomes = new Set(Object.values(configurationDefinitions ?? {}).flatMap(configuration =>
                [configuration.optionOutcome, ...(configuration.options ?? []).map(option => option.outcome)].filter(text)));
            if (declaredOutcomes.size && definition.options.some(option => !declaredOutcomes.has(option.outcome)))
                throw new Error(`Invalid site option outcome: ${siteId}/${id}`);
        }
        if (definition.options && typeof definition.defaultValue === 'string' && !definition.options.some(option => option.value === definition.defaultValue))
            throw new Error(`Unavailable field default: ${id}`);
        return [definition];
    });
}
