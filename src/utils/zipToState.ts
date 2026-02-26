type ZipRange = {
  start: number;
  end: number;
  state: string;
};

const ZIP_RANGES: ZipRange[] = [
  { start: 350, end: 369, state: "Alabama" },
  { start: 995, end: 999, state: "Alaska" },
  { start: 850, end: 865, state: "Arizona" },
  { start: 716, end: 729, state: "Arkansas" },
  { start: 900, end: 961, state: "California" },
  { start: 800, end: 816, state: "Colorado" },
  { start: 60, end: 69, state: "Connecticut" },
  { start: 197, end: 199, state: "Delaware" },
  { start: 320, end: 349, state: "Florida" },
  { start: 300, end: 319, state: "Georgia" },
  { start: 967, end: 968, state: "Hawaii" },
  { start: 832, end: 838, state: "Idaho" },
  { start: 600, end: 629, state: "Illinois" },
  { start: 460, end: 479, state: "Indiana" },
  { start: 500, end: 528, state: "Iowa" },
  { start: 660, end: 679, state: "Kansas" },
  { start: 400, end: 427, state: "Kentucky" },
  { start: 700, end: 715, state: "Louisiana" },
  { start: 39, end: 49, state: "Maine" },
  { start: 206, end: 219, state: "Maryland" },
  { start: 10, end: 27, state: "Massachusetts" },
  { start: 480, end: 499, state: "Michigan" },
  { start: 550, end: 567, state: "Minnesota" },
  { start: 386, end: 397, state: "Mississippi" },
  { start: 630, end: 658, state: "Missouri" },
  { start: 590, end: 599, state: "Montana" },
  { start: 680, end: 693, state: "Nebraska" },
  { start: 889, end: 898, state: "Nevada" },
  { start: 30, end: 38, state: "New Hampshire" },
  { start: 70, end: 89, state: "New Jersey" },
  { start: 870, end: 884, state: "New Mexico" },
  { start: 5, end: 5, state: "New York" },
  { start: 100, end: 149, state: "New York" },
  { start: 270, end: 289, state: "North Carolina" },
  { start: 580, end: 588, state: "North Dakota" },
  { start: 430, end: 459, state: "Ohio" },
  { start: 730, end: 749, state: "Oklahoma" },
  { start: 970, end: 979, state: "Oregon" },
  { start: 150, end: 196, state: "Pennsylvania" },
  { start: 28, end: 29, state: "Rhode Island" },
  { start: 290, end: 299, state: "South Carolina" },
  { start: 570, end: 577, state: "South Dakota" },
  { start: 370, end: 385, state: "Tennessee" },
  { start: 750, end: 799, state: "Texas" },
  { start: 840, end: 847, state: "Utah" },
  { start: 50, end: 59, state: "Vermont" },
  { start: 201, end: 201, state: "Virginia" },
  { start: 220, end: 246, state: "Virginia" },
  { start: 980, end: 994, state: "Washington" },
  { start: 247, end: 268, state: "West Virginia" },
  { start: 530, end: 549, state: "Wisconsin" },
  { start: 820, end: 831, state: "Wyoming" },
];

export const getStateFromZip = (zipCode?: string): string | undefined => {
  if (!zipCode) return undefined;
  const digits = zipCode.replace(/\D/g, "");
  if (digits.length < 3) return undefined;
  const prefix = parseInt(digits.slice(0, 3), 10);
  if (Number.isNaN(prefix)) return undefined;

  const match = ZIP_RANGES.find(
    (range) => prefix >= range.start && prefix <= range.end,
  );
  return match?.state;
};
