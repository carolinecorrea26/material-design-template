import { z } from "zod";

export const CoverageCat = z.enum(["LI", "AD", "DI", "OO", "SH"]);
export type CoverageCat = z.infer<typeof CoverageCat>;

const optionalString = z.preprocess(
  (val) => (val === "" ? undefined : val),
  z.string().optional(),
);

const US_ZIP_REGEX = /^\d{5}$/;
const CA_POSTAL_REGEX =
  /^[ABCEGHJ-NPRSTVXY]\d[ABCEGHJ-NPRSTV-Z]\s?\d[ABCEGHJ-NPRSTV-Z]\d$/i;

export const EligibilitySchema = z.object({
  isMember: optionalString,

  // Name fields - title, MI, suffix are optional
  title: z.string().optional(),
  firstName: z.string().optional(),
  middleInitial: z.string().optional(),
  lastName: z.string().optional(),
  suffix: z.string().optional(),
  birthday: z
    .string()
    .min(1, "Birthday is required")
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Please select a valid date"),
  gender: z.string().optional(),
  email: z.string().optional(),
  zipCode: z
    .string()
    .min(3, "Valid postal code is required")
    .refine(
      (val) => US_ZIP_REGEX.test(val) || CA_POSTAL_REGEX.test(val),
      "Valid postal code is required",
    ),
  state: z.string().min(1, "State is required"),

  applicants: z.object({
    self: z.boolean().default(false),
    spouse: z.boolean().default(false),
    child: z.boolean().default(false),
  }),

  coverageProductSelections: z.array(z.string()).default([]),

  // Self coverages (LI/AD/DI/OO/SH) — required when Self is applying
  selfCoverages: z.array(CoverageCat).default([]),

  // Spouse membership
  spouseIsMember: z.string().optional(),

  // Spouse personal information
  spouseTitle: z.string().optional(),
  spouseFirstName: z.string().optional(),
  spouseMiddleInitial: z.string().optional(),
  spouseLastName: z.string().optional(),
  spouseSuffix: z.string().optional(),
  spouseBirthday: z.string().optional(),
  spouseGender: z.string().optional(),

  // Spouse coverages (LI/AD/DI/SH) — required when Spouse is applying
  spouseCoverages: z.array(CoverageCat).default([]),

  // Children information
  children: z
    .array(
      z.object({
        firstName: z.string().optional(),
        lastName: z.string().optional(),
        birthday: z.string().optional(),
        gender: z.string().optional(),
        militaryDischarge: z.string().optional(),
      }),
    )
    .default([]),

  // Nicotine questions (required if LI or SH selected for that applicant)
  smokerSelf: z.string().optional(),
  smokerSpouse: z.string().optional(),

  // Tobacco use details (required if smoker = "yes")
  selfTobaccoLastUsed: z.string().optional(),
  selfTobaccoProducts: z.array(z.string()).optional(),
  spouseTobaccoLastUsed: z.string().optional(),
  spouseTobaccoProducts: z.array(z.string()).optional(),

  // DI/OO conditionals
  selfAvgIncome: z.string().optional(), // DI
  selfHoursPerWeek: z.string().optional(), // DI
  selfMonthlyExpenses: z.string().optional(), // OO
  selfRespPct: z.string().optional(), // OO

  spouseAvgIncome: z.string().optional(), // DI
  spouseHoursPerWeek: z.string().optional(), // DI
});

export type EligibilityForm = z.infer<typeof EligibilitySchema>;
