export type PageNote = { id: string; text: string; productKeys: string[] };
export function validatePageNotes(value: unknown, productKeys?: string[]): PageNote[];
export function pageNotesFor(notes: PageNote[], productKey?: string): PageNote[];
