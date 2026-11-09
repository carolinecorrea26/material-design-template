/** Pure fresh-start field resolver shared by deployment generation and browser consumers. */
const inputTypes = new Set(["text", "number", "date", "radio", "dropdown", "searchable-select", "checkbox", "checkbox-group", "multi-select", "percent"]);
const optionTypes = new Set(["radio", "dropdown", "searchable-select", "checkbox-group", "multi-select"]);
const formats = new Set(["email", "phone", "ssn", "currency", "percent", "month-year", "digits", "postal-code"]);
const inputModes = new Set(["text", "email", "tel", "numeric", "decimal"]);
const supportedKeys = new Set(["id", "name", "type", "label", "required", "people", "options", "format", "inputMode", "placeholder", "helperText", "autoComplete", "allowDecimal", "multiline", "configurations", "defaultValue", "tooltip", "minLength", "maxLength", "labelVariant", "minRows", "disabled", "phoneTypeFieldId", "showPhoneTypeSelector", "visibilityConditionId", "optionExclusions"]);
const configurationKeys = new Set(["default", "type", "label", "options", "placeholder"]);
const overrideKeys = new Set(["configuration", "label", "required", "options", "format", "inputMode", "minLength", "maxLength"]);
const object = (value) => value !== null && typeof value === "object" && !Array.isArray(value);
const text = (value) => typeof value === "string" && value.trim().length > 0;
const mappingName = (mapping) => "component" in mapping ? `component ${mapping.component}` : `page ${mapping.page}`;
function resolveOptions(id, value, lists) {
    const options = object(value) ? (typeof value.list === "string" ? lists[value.list] : undefined) : value;
    if (!Array.isArray(options) || !options.length)
        throw new Error(`Invalid field options: ${id}`);
    const resolved = options.map((option) => {
        if (!object(option) || !text(option.value) || !text(option.label))
            throw new Error(`Invalid field options: ${id}`);
        return { value: option.value, label: option.label };
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
    const included = new Set(object(sitePage) && Array.isArray(sitePage.include) ? sitePage.include : []);
    const hidden = new Set(object(sitePage) && Array.isArray(sitePage.hide) ? sitePage.hide : []);
    const keys = "page" in mapping ? [mapping.page, person, "default"] : [person, "default"];
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
        let field = found[0];
        if (field.configurations !== undefined) {
            if (!object(field.configurations))
                throw new Error(`Invalid field configurations: ${id}`);
            const configurations = field.configurations;
            const key = object(override) && override.configuration !== undefined
                ? override.configuration
                : Object.keys(configurations).find(name => object(configurations[name]) && configurations[name].default === true);
            const configuration = typeof key === "string" ? configurations[key] : undefined;
            if (!object(configuration) || Object.keys(configuration).some(name => !configurationKeys.has(name)))
                throw new Error(`Unknown configuration for ${id}: ${String(key)}`);
            const chosen = { ...field, ...configuration };
            delete chosen.configurations;
            delete chosen.default;
            field = chosen;
        }
        else if (object(override) && override.configuration !== undefined)
            throw new Error(`Unknown configuration for ${id}: ${String(override.configuration)}`);
        if (object(override)) {
            if (override.label !== undefined)
                field = { ...field, label: overlay(field.label, override.label) };
            if (override.required !== undefined)
                field = { ...field, required: overlay(field.required, override.required) };
            for (const property of ['format', 'inputMode', 'minLength', 'maxLength']) {
                if (override[property] !== undefined) field = { ...field, [property]: override[property] };
            }
        }
        const inputType = field.type;
        const label = pick(field.label, keys), required = pick(field.required, keys), helperText = pick(field.helperText, keys);
        if (!inputTypes.has(inputType) || !text(label) || (required !== undefined && typeof required !== "boolean") ||
            (field.helperText !== undefined && !object(field.helperText) && !text(field.helperText)) || (helperText !== undefined && !text(helperText)) ||
            (field.people !== undefined && (!Array.isArray(field.people) || !field.people.includes(person))) ||
            (field.name !== undefined && !text(field.name)) ||
            (field.format !== undefined && !formats.has(String(field.format))) ||
            (field.inputMode !== undefined && !inputModes.has(String(field.inputMode))) ||
            (field.allowDecimal !== undefined && typeof field.allowDecimal !== "boolean") ||
            (field.multiline !== undefined && typeof field.multiline !== "boolean") ||
            ["placeholder", "autoComplete"].some(key => field[key] !== undefined && !text(field[key]))) {
            throw new Error(`Invalid field requirement: ${id}`);
        }
        const definition = { id, label, inputType };
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
        for (const property of ['defaultValue', 'tooltip', 'minLength', 'maxLength', 'labelVariant', 'minRows', 'disabled', 'phoneTypeFieldId', 'showPhoneTypeSelector', 'visibilityConditionId', 'optionExclusions']) {
            if (field[property] === undefined) continue;
            const value = property === 'defaultValue' ? pick(field[property], keys) : field[property];
            if (value === undefined) continue;
            if (property === 'defaultValue' && typeof value !== 'string' && typeof value !== 'boolean' && !(Array.isArray(value) && value.every(item => typeof item === 'string'))) throw new Error(`Invalid field requirement: ${id}/${property}`);
            if (['minLength', 'maxLength', 'minRows'].includes(property) && (!Number.isSafeInteger(value) || value < 1) ||
                ['disabled', 'showPhoneTypeSelector'].includes(property) && typeof value !== 'boolean' ||
                ['tooltip', 'phoneTypeFieldId', 'visibilityConditionId'].includes(property) && !text(value) ||
                property === 'labelVariant' && !['floating', 'standard'].includes(value) ||
                property === 'optionExclusions' && !Array.isArray(value)) throw new Error(`Invalid field requirement: ${id}/${property}`);
            definition[property] = structuredClone(value);
        }
        if (definition.minLength !== undefined && definition.maxLength !== undefined && definition.minLength > definition.maxLength)
            throw new Error(`Invalid field length range: ${id}`);
        const needsOptions = optionTypes.has(inputType);
        if (needsOptions !== (field.options !== undefined))
            throw new Error(`Invalid field options: ${id}`);
        // A plain string names a runtime source (for example product amounts); the page supplies those options.
        if (needsOptions && typeof field.options !== "string") {
            let options = resolveOptions(id, field.options, lists);
            if (object(override) && override.options !== undefined) {
                const allowed = override.options;
                if (!Array.isArray(allowed) || !allowed.length || allowed.some(value => !options.some(option => option.value === value)))
                    throw new Error(`Invalid site option override: ${siteId}/${id}`);
                options = options.filter(option => allowed.includes(option.value));
            }
            definition.options = options;
        }
        else if (object(override) && override.options !== undefined)
            throw new Error(`Invalid site option override: ${siteId}/${id}`);
        if (definition.options && typeof definition.defaultValue === 'string' && !definition.options.some(option => option.value === definition.defaultValue))
            throw new Error(`Unavailable field default: ${id}`);
        return [definition];
    });
}
