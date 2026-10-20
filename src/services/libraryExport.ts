/** Shared contract: callers pass the filtered/sorted dataset, before pagination. */
export interface ExportRelation { table: string; key: string; displayId?: number; label: string }
export interface ExportColumn<T> { id: string; label: string; value: (row: T) => string; relations?: (row: T) => ExportRelation[] }
export interface ExportTable<T> { name: string; columns: ExportColumn<T>[]; rows: T[] }
const xml = (s: string) => s.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&apos;");
const csv = (s: string) => `"${(/^[\s]*[=+@-]/.test(s) ? "'" : "") + s.replaceAll('"', '""')}"`;

export function exportLibraryCsv<T>(table: ExportTable<T>): string {
  return "\uFEFF" + [table.columns.map(c => csv(c.label)).join(","), ...table.rows.map(row => table.columns.map(c => csv(c.value(row))).join(","))].join("\r\n");
}
export function exportLibraryXml<T>(table: ExportTable<T>): string {
  return `<?xml version="1.0" encoding="UTF-8"?>\n<table name="${xml(table.name)}">\n${table.rows.map(row => `  <row>${table.columns.map(c => `<cell key="${xml(c.id)}" label="${xml(c.label)}"><value>${xml(c.value(row))}</value>${(c.relations?.(row) ?? []).map(r => `<relation table="${xml(r.table)}" key="${xml(r.key)}"${r.displayId === undefined ? "" : ` displayId="${r.displayId}"`}>${xml(r.label)}</relation>`).join("")}</cell>`).join("")}</row>`).join("\n")}\n</table>`;
}
export function downloadLibraryExport<T>(table: ExportTable<T>, format: "csv" | "xml") {
  const data = format === "csv" ? exportLibraryCsv(table) : exportLibraryXml(table);
  const url = URL.createObjectURL(new Blob([data], { type: format === "csv" ? "text/csv;charset=utf-8" : "application/xml;charset=utf-8" }));
  const anchor = document.createElement("a"); anchor.href = url; anchor.download = `${table.name.replace(/[^\w.-]/g, "-")}.${format}`; anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}
