import type { Json, Scope } from "../persistence/types";
import type { ProductRow } from "../persistence/types";
import type { CoverageDefinition } from "../domain/coverage";

/** Catalog inclusion is not runtime authorization. Reject unsupported category assignments. */
export function prototypeProductDefinition(product: ProductRow): Omit<CoverageDefinition, "riders" | "gNumber" | "planCode"> {
  const categoryId = product.definition.categoryId;
  const code = product.definition.code;
  if (code === null) throw new Error(`Unconfirmed runtime product code: ${product.key}`);
  if (categoryId !== "LI" && categoryId !== "AD" && categoryId !== "DI" && categoryId !== "OO" && categoryId !== "SH") throw new Error(`Unreconciled runtime coverage category: ${product.key}/${categoryId}`);
  return { ...product.definition, categoryId, code };
}

/** Reject accidental functions, symbols, cycles and non-finite numbers instead of losing data. */
export function jsonValue(value: unknown): Json {
  if (value === null || typeof value === "string" || typeof value === "boolean") return value;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (Array.isArray(value)) return value.map(jsonValue);
  if (typeof value === "object" && value && Object.getPrototypeOf(value) === Object.prototype) {
    return Object.fromEntries(Object.entries(value).filter(([, v]) => v !== undefined).map(([k, v]) => [k, jsonValue(v)]));
  }
  throw new Error(`Non-JSON migration value: ${typeof value}`);
}
export function leaves(value: unknown, path: string[] = []): { path: string[]; value: Json }[] {
  if (value === undefined) return [];
  if (value && typeof value === "object" && !Array.isArray(value) && Object.keys(value).length) {
    return Object.entries(value).flatMap(([key, child]) => leaves(child, [...path, key]));
  }
  return path.length ? [{ path, value: jsonValue(value) }] : [];
}
export function put(root: Record<string, unknown>, path: string[], value: unknown) {
  let cursor = root;
  for (const part of path.slice(0, -1)) {
    if (["__proto__", "constructor", "prototype"].includes(part)) throw new Error("Unsafe configuration path");
    if (!cursor[part] || typeof cursor[part] !== "object" || Array.isArray(cursor[part])) cursor[part] = {};
    cursor = cursor[part] as Record<string, unknown>;
  }
  const last = path.at(-1);
  if (!last || ["__proto__", "constructor", "prototype"].includes(last)) throw new Error("Invalid configuration path");
  cursor[last] = structuredClone(value);
}
export function merge<T>(base: T, override: unknown): T {
  if (override === undefined) return structuredClone(base);
  if (!isObject(base) || !isObject(override)) return structuredClone(override) as T;
  const result: Record<string, unknown> = { ...base };
  for (const [key, value] of Object.entries(override)) if (value !== undefined) result[key] = merge(result[key], value);
  return result as T;
}
function isObject(v: unknown): v is Record<string, unknown> { return !!v && typeof v === "object" && !Array.isArray(v); }
export const globalScope: Scope = { scope: "global", clientKey: null, siteKey: null };
export const clientScope = (clientKey: string): Scope => ({ scope: "client", clientKey, siteKey: null });
export const siteScope = (siteKey: string): Scope => ({ scope: "site", clientKey: null, siteKey });
export const scopeKey = (scope: Scope) => `${scope.scope}:${scope.clientKey ?? scope.siteKey ?? "*"}`;
export const identity = (key: string) => ({ id: key, key });
export const pathKey = (path: string[]) => path.map(encodeURIComponent).join(".");
export const scopeRank = { global: 0, client: 1, site: 2 };
export function applicable(scope: Scope, siteKey: string, clientKey: string) {
  return scope.scope === "global" || (scope.scope === "client" ? scope.clientKey === clientKey : scope.siteKey === siteKey);
}
