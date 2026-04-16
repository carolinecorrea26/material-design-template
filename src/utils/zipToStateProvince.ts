type SelectOption = {
  value: string;
  label: string;
};

type ZipPrefixRange = {
  start: number;
  end: number;
  stateName: string;
};

const canadianPrefixToProvince: Record<string, string> = {
  A: "Newfoundland and Labrador",
  B: "Nova Scotia",
  C: "Prince Edward Island",
  E: "New Brunswick",
  G: "Quebec",
  H: "Quebec",
  J: "Quebec",
  K: "Ontario",
  L: "Ontario",
  M: "Ontario",
  N: "Ontario",
  P: "Ontario",
  R: "Manitoba",
  S: "Saskatchewan",
  T: "Alberta",
  V: "British Columbia",
  X: "Northwest Territories / Nunavut",
  Y: "Yukon Territory",
};

const usExactPrefixToState: Record<string, string> = {
  "005": "New York",
  "006": "Puerto Rico",
  "007": "Puerto Rico",
  "008": "Virgin Islands",
  "009": "Puerto Rico",
  "063": "New York",
  "102": "New York",
  "203": "District of Columbia",
  "205": "District of Columbia",
  "569": "District of Columbia",
};

const usZipPrefixRanges: ZipPrefixRange[] = [
  { start: 10, end: 27, stateName: "Massachusetts" },
  { start: 28, end: 29, stateName: "Rhode Island" },
  { start: 30, end: 38, stateName: "New Hampshire" },
  { start: 39, end: 49, stateName: "Maine" },
  { start: 50, end: 59, stateName: "Vermont" },
  { start: 60, end: 69, stateName: "Connecticut" },
  { start: 70, end: 89, stateName: "New Jersey" },
  { start: 100, end: 149, stateName: "New York" },
  { start: 150, end: 196, stateName: "Pennsylvania" },
  { start: 197, end: 199, stateName: "Delaware" },
  { start: 201, end: 201, stateName: "Virginia" },
  { start: 206, end: 219, stateName: "Maryland" },
  { start: 220, end: 246, stateName: "Virginia" },
  { start: 247, end: 268, stateName: "West Virginia" },
  { start: 270, end: 289, stateName: "North Carolina" },
  { start: 290, end: 299, stateName: "South Carolina" },
  { start: 300, end: 319, stateName: "Georgia" },
  { start: 320, end: 349, stateName: "Florida" },
  { start: 350, end: 369, stateName: "Alabama" },
  { start: 370, end: 385, stateName: "Tennessee" },
  { start: 386, end: 397, stateName: "Mississippi" },
  { start: 400, end: 427, stateName: "Kentucky" },
  { start: 430, end: 459, stateName: "Ohio" },
  { start: 460, end: 479, stateName: "Indiana" },
  { start: 480, end: 499, stateName: "Michigan" },
  { start: 500, end: 528, stateName: "Iowa" },
  { start: 530, end: 549, stateName: "Wisconsin" },
  { start: 550, end: 567, stateName: "Minnesota" },
  { start: 570, end: 577, stateName: "South Dakota" },
  { start: 580, end: 588, stateName: "North Dakota" },
  { start: 590, end: 599, stateName: "Montana" },
  { start: 600, end: 629, stateName: "Illinois" },
  { start: 630, end: 658, stateName: "Missouri" },
  { start: 660, end: 679, stateName: "Kansas" },
  { start: 680, end: 693, stateName: "Nebraska" },
  { start: 700, end: 715, stateName: "Louisiana" },
  { start: 716, end: 729, stateName: "Arkansas" },
  { start: 730, end: 749, stateName: "Oklahoma" },
  { start: 750, end: 799, stateName: "Texas" },
  { start: 800, end: 816, stateName: "Colorado" },
  { start: 820, end: 831, stateName: "Wyoming" },
  { start: 832, end: 838, stateName: "Idaho" },
  { start: 840, end: 847, stateName: "Utah" },
  { start: 850, end: 865, stateName: "Arizona" },
  { start: 870, end: 884, stateName: "New Mexico" },
  { start: 889, end: 898, stateName: "Nevada" },
  { start: 900, end: 961, stateName: "California" },
  { start: 967, end: 968, stateName: "Hawaii" },
  { start: 970, end: 979, stateName: "Oregon" },
  { start: 980, end: 994, stateName: "Washington" },
  { start: 995, end: 999, stateName: "Alaska" },
];

export function formatZipOrPostalCode(value: string): string {
  const cleaned = value.toUpperCase().replace(/[^A-Z0-9]/g, "");

  if (!cleaned) {
    return "";
  }

  if (/^[A-Z]/.test(cleaned)) {
    const postalRaw = cleaned.slice(0, 6);
    if (postalRaw.length <= 3) {
      return postalRaw;
    }

    return `${postalRaw.slice(0, 3)} ${postalRaw.slice(3)}`;
  }

  return cleaned.replace(/\D/g, "").slice(0, 5);
}

function isCanadianPostalCode(value: string): boolean {
  const compact = value.toUpperCase().replace(/\s/g, "");
  return /^[A-Z]\d[A-Z]\d[A-Z]\d$/.test(compact);
}

function getCanadianProvince(value: string): string | null {
  if (!isCanadianPostalCode(value)) {
    return null;
  }

  const compact = value.toUpperCase().replace(/\s/g, "");
  const prefix = compact.charAt(0);

  return canadianPrefixToProvince[prefix] ?? null;
}

function getUsState(value: string): string | null {
  const digits = value.replace(/\D/g, "");

  if (digits.length < 3) {
    return null;
  }

  const prefix = digits.slice(0, 3);

  if (usExactPrefixToState[prefix]) {
    return usExactPrefixToState[prefix];
  }

  const prefixNumber = Number(prefix);
  const matchingRange = usZipPrefixRanges.find(
    (range) => prefixNumber >= range.start && prefixNumber <= range.end,
  );

  return matchingRange?.stateName ?? null;
}

function resolveOptionValueByLabel(
  options: SelectOption[],
  stateOrProvinceName: string,
): string | null {
  const option = options.find(
    (entry) => entry.label.toLowerCase() === stateOrProvinceName.toLowerCase(),
  );

  if (option) {
    return option.value;
  }

  // Preserve X-prefix behavior when options separate NT and Nunavut.
  if (stateOrProvinceName === "Northwest Territories / Nunavut") {
    return (
      resolveOptionValueByLabel(options, "Northwest Territories") ??
      resolveOptionValueByLabel(options, "Nunavut")
    );
  }

  return null;
}

export function deriveStateProvinceFromZipOrPostalCode(
  value: string,
  stateProvinceOptions: SelectOption[],
): string | null {
  const cleaned = value.toUpperCase().replace(/[^A-Z0-9]/g, "");

  if (!cleaned) {
    return null;
  }

  const isCanadian = /^[A-Z]/.test(cleaned);
  const stateOrProvinceName = isCanadian
    ? getCanadianProvince(cleaned)
    : getUsState(cleaned);

  if (!stateOrProvinceName) {
    return null;
  }

  return resolveOptionValueByLabel(stateProvinceOptions, stateOrProvinceName);
}
