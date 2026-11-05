import type { FieldOption } from "../../domain/fields";

/** Shared source list. Retain existing stored values where only display casing
 * or the source's singular Cigar label differs from earlier saved answers. */
export const tobaccoProductOptions: FieldOption[] = [
  { label: "Cigarettes", value: "Cigarettes" },
  { label: "Nicotine patch", value: "Nicotine Patch" },
  { label: "Nicotine inhaler", value: "Nicotine Inhaler" },
  { label: "Nasal spray", value: "Nasal Spray" },
  { label: "Nicotine gum", value: "Nicotine Gum" },
  { label: "Nicotine lozenge", value: "Nicotine Lozenge" },
  { label: "E-Cigarettes", value: "E-Cigarettes" },
  { label: "Cigar", value: "Cigars" },
  { label: "Pipe", value: "Pipe" },
  { label: "Chewing tobacco", value: "Chewing Tobacco" },
  { label: "Snuff", value: "Snuff" },
  { label: "Betel nut", value: "Betel Nut" },
];
