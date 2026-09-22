import { isValidElement } from "react";
import type { ClientId } from "../../types";
import { buildContent, type SiteContent } from "../index";
import {
  homeDefaults,
  coverageDefaults,
  navigationDefaults,
  footerDefaults,
  reviewDefaults,
  receiptDefaults,
  helpDefaults,
  sharedDefaults,
  pagesDefaults,
  beneficiaryDefaults,
  dialogsDefaults,
  statusMessagesDefaults,
} from "../defaults";
import { clientContentOverrides } from "../clients";

export type FlatContentRow = {
  path: string;
  /** null indicates a non-string leaf (number, boolean, React node, etc.). */
  value: string | null;
  defaultsFile: string;
  /** True when this path is overridden by the given client's content overrides. */
  clientOverridden: boolean;
};

export const contentKeys: Array<{ key: keyof SiteContent; defaultsFile: string }> = [
  { key: "home", defaultsFile: "src/content/defaults/home.ts" },
  { key: "coverage", defaultsFile: "src/content/defaults/coverage.ts" },
  { key: "navigation", defaultsFile: "src/content/defaults/navigation.ts" },
  { key: "pages", defaultsFile: "src/content/defaults/pages.ts" },
  { key: "footer", defaultsFile: "src/content/defaults/footer.ts" },
  { key: "review", defaultsFile: "src/content/defaults/review.ts" },
  { key: "receipt", defaultsFile: "src/content/defaults/receipt.ts" },
  { key: "help", defaultsFile: "src/content/defaults/help.ts" },
  { key: "shared", defaultsFile: "src/content/defaults/shared.ts" },
  { key: "beneficiary", defaultsFile: "src/content/defaults/beneficiary.ts" },
  { key: "dialogs", defaultsFile: "src/content/defaults/dialogs.ts" },
  { key: "statusMessages", defaultsFile: "src/content/defaults/statusMessages.ts" },
];

// Terms of Use / Privacy Notice are large legal document trees rendered
// elsewhere — excluded here to avoid documenting them in this flat table.
function stripLegalDocs(footer: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(footer).filter(
      ([k]) => k !== "termsOfUseContent" && k !== "privacyNoticeContent",
    ),
  );
}

// These content paths are error copy already cataloged in the Error Messages
// section — excluded here to avoid documenting them twice.
const ERROR_MESSAGE_CONTENT_PATHS = new Set([
  "coverage.selectAtLeastOneCategoryError",
  "coverage.correctErrorsMessage",
  "beneficiary.missingBeneficiaryError",
]);

type FlatContentRowDraft = Omit<FlatContentRow, "clientOverridden">;

function flattenContent(
  value: unknown,
  path: string,
  defaultsFile: string,
  rows: FlatContentRowDraft[],
): void {
  if (typeof value === "string") {
    rows.push({ path, value, defaultsFile });
    return;
  }

  if (Array.isArray(value)) {
    value.forEach((item, i) => flattenContent(item, `${path}[${i}]`, defaultsFile, rows));
    return;
  }

  if (value !== null && typeof value === "object" && !isValidElement(value)) {
    for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
      flattenContent(val, path ? `${path}.${key}` : key, defaultsFile, rows);
    }
    return;
  }

  // Non-string leaf: number, boolean, null, undefined, React node, function, etc.
  rows.push({ path, value: null, defaultsFile });
}

/** Reads a `flattenContent`-style path (e.g. "footer.additionalLegalLines[0]") off an object. */
function getValueAtContentPath(root: unknown, path: string): boolean {
  const segments = path.match(/[^.[\]]+/g) ?? [];
  let current: unknown = root;
  for (const segment of segments) {
    if (current == null || typeof current !== "object") return false;
    current = (current as Record<string, unknown>)[segment];
  }
  return current !== undefined;
}

/** Path → global default value (pre-client-override), for the Global Default column. Computed once — the defaults don't depend on client. */
export const defaultContentByPath: Map<string, string | null> = (() => {
  const defaultsByKey: Record<string, unknown> = {
    home: homeDefaults,
    coverage: coverageDefaults,
    navigation: navigationDefaults,
    pages: pagesDefaults,
    footer: footerDefaults,
    review: reviewDefaults,
    receipt: receiptDefaults,
    help: helpDefaults,
    shared: sharedDefaults,
    beneficiary: beneficiaryDefaults,
    dialogs: dialogsDefaults,
    statusMessages: statusMessagesDefaults,
  };
  const rows: FlatContentRowDraft[] = [];
  for (const { key, defaultsFile } of contentKeys) {
    const value =
      key === "footer"
        ? stripLegalDocs(defaultsByKey[key] as Record<string, unknown>)
        : defaultsByKey[key];
    flattenContent(value, key, defaultsFile, rows);
  }
  return new Map(rows.map((row) => [row.path, row.value]));
})();

/**
 * Flattens the given client's resolved content into rows, marking which
 * paths that client overrides. Used by the CMS page — independent of the
 * session-resolved "active client" so any client can be inspected without
 * navigating/reloading.
 */
export function getFlatContentRows(clientId: ClientId): FlatContentRow[] {
  const content = buildContent(clientId);
  const clientOverrides = clientContentOverrides[clientId];

  const rows: FlatContentRowDraft[] = [];
  for (const { key, defaultsFile } of contentKeys) {
    const value =
      key === "footer"
        ? stripLegalDocs(content[key] as Record<string, unknown>)
        : content[key];
    flattenContent(value, key, defaultsFile, rows);
  }

  return rows
    .filter((row) => !ERROR_MESSAGE_CONTENT_PATHS.has(row.path))
    .map((row) => ({
      ...row,
      clientOverridden: getValueAtContentPath(clientOverrides, row.path),
    }));
}
