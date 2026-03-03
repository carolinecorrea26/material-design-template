import { z } from "zod";

export const CoverageCat = z.enum(["LI", "AD", "DI", "OO", "SH"]);
export type CoverageCat = z.infer<typeof CoverageCat>;

const optionalString = z.preprocess(
  (val) => (val === "" ? undefined : val),
  z.string().optional(),
);

export const EligibilitySchema = z
  .object({
    isMember: optionalString,

    // Name fields - title, MI, suffix are optional
    title: z.string().optional(),
    firstName: z.preprocess(
      (val) => (val === "" ? undefined : val),
      z.string().min(1, "First Name is required").optional(),
    ),
    middleInitial: z.string().max(1).optional(),
    lastName: z.preprocess(
      (val) => (val === "" ? undefined : val),
      z.string().min(1, "Last Name is required").optional(),
    ),
    suffix: z.string().optional(),
    birthday: z
      .string()
      .min(1, "Birthday is required")
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Please select a valid date"),
    gender: z.enum(["male", "female"], { message: "Please select an option" }),
    email: z.preprocess(
      (val) => (val === "" ? undefined : val),
      z.string().email("Please enter a valid email address").optional(),
    ),
    zipCode: z
      .string()
      .min(5, "Valid zip code is required")
      .regex(/^\d{5}$/, "Valid zip code is required"),
    state: z.string().min(1, "State is required"),

    applicants: z
      .object({
        self: z.boolean().default(false),
        spouse: z.boolean().default(false),
        child: z.boolean().default(false),
      })
      .refine((data) => data.self || data.spouse || data.child, {
        message: "You must select at least one person to insure.",
      }),

    coverageProductSelections: z.array(z.string()).default([]),

    // Self coverages (LI/AD/DI/OO/SH) — required when Self is applying
    selfCoverages: z.array(CoverageCat).default([]),

    // Spouse membership
    spouseIsMember: z.string().optional(),

    // Spouse personal information
    spouseTitle: z.string().optional(),
    spouseFirstName: z.string().optional(),
    spouseMiddleInitial: z.string().max(1).optional(),
    spouseLastName: z.string().optional(),
    spouseSuffix: z.string().optional(),
    spouseBirthday: z.string().optional(),
    spouseGender: z
      .enum(["male", "female"], { message: "Please select an option" })
      .optional(),
    spouseEmail: z.string().optional(),

    // Spouse coverages (LI/AD/DI/SH) — required when Spouse is applying
    spouseCoverages: z.array(CoverageCat).default([]),

    // Children information
    children: z
      .array(
        z.object({
          firstName: z.string().optional(),
          lastName: z.string().optional(),
          birthday: z.string().optional(),
          gender: z
            .enum(["male", "female"], { message: "Please select an option" })
            .optional(),
          militaryDischarge: z
            .enum(["yes", "no"], { message: "Please select an option" })
            .optional(),
        }),
      )
      .default([]),

    // Nicotine questions (required if LI or SH selected for that applicant)
    smokerSelf: z
      .enum(["yes", "no"], { message: "Please select an option" })
      .optional(),
    smokerSpouse: z
      .enum(["yes", "no"], { message: "Please select an option" })
      .optional(),

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
  })
  .superRefine((val, ctx) => {
    const hasCoverageSelections =
      (val.coverageProductSelections ?? []).length > 0;

    // Require at least one coverage for self if self is applying and coverage selections exist
    if (
      hasCoverageSelections &&
      val.applicants.self &&
      val.selfCoverages.length === 0
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["selfCoverages"],
        message: "Please select a coverage option.",
      });
    }

    // Spouse personal information required if spouse applies
    if (val.applicants.spouse) {
      if (!val.spouseFirstName || val.spouseFirstName.trim().length === 0) {
        ctx.addIssue({
          code: "custom",
          path: ["spouseFirstName"],
          message: "First Name is required",
        });
      }
      if (!val.spouseLastName || val.spouseLastName.trim().length === 0) {
        ctx.addIssue({
          code: "custom",
          path: ["spouseLastName"],
          message: "Last Name is required",
        });
      }
      if (!val.spouseBirthday) {
        ctx.addIssue({
          code: "custom",
          path: ["spouseBirthday"],
          message: "Birthday is required",
        });
      } else if (!/^\d{4}-\d{2}-\d{2}$/.test(val.spouseBirthday)) {
        ctx.addIssue({
          code: "custom",
          path: ["spouseBirthday"],
          message: "Please select a valid date",
        });
      }
      if (!val.spouseGender) {
        ctx.addIssue({
          code: "custom",
          path: ["spouseGender"],
          message: "Please select an option",
        });
      }
      if (!val.spouseEmail || val.spouseEmail.trim().length === 0) {
        ctx.addIssue({
          code: "custom",
          path: ["spouseEmail"],
          message: "Email is required",
        });
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.spouseEmail)) {
        ctx.addIssue({
          code: "custom",
          path: ["spouseEmail"],
          message: "Please enter a valid email address",
        });
      }
    }

    // Spouse coverages required if spouse applies and coverage selections exist
    if (
      hasCoverageSelections &&
      val.applicants.spouse &&
      val.spouseCoverages.length === 0
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["spouseCoverages"],
        message: "Please select a coverage option.",
      });
    }

    // Children validation
    if (val.applicants.child) {
      if (val.children.length === 0) {
        ctx.addIssue({
          code: "custom",
          path: ["children"],
          message: "Add at least one child",
        });
      } else {
        val.children.forEach((child, index) => {
          if (!child.firstName || child.firstName.trim().length === 0) {
            ctx.addIssue({
              code: "custom",
              path: ["children", index, "firstName"],
              message: "First Name is required",
            });
          }
          if (!child.lastName || child.lastName.trim().length === 0) {
            ctx.addIssue({
              code: "custom",
              path: ["children", index, "lastName"],
              message: "Last Name is required",
            });
          }
          if (!child.birthday) {
            ctx.addIssue({
              code: "custom",
              path: ["children", index, "birthday"],
              message: "Birthday is required",
            });
          } else if (!/^\d{4}-\d{2}-\d{2}$/.test(child.birthday)) {
            ctx.addIssue({
              code: "custom",
              path: ["children", index, "birthday"],
              message: "Please select a valid date",
            });
          }
          if (!child.gender) {
            ctx.addIssue({
              code: "custom",
              path: ["children", index, "gender"],
              message: "Please select an option",
            });
          }
          if (!child.militaryDischarge) {
            ctx.addIssue({
              code: "custom",
              path: ["children", index, "militaryDischarge"],
              message: "Please select an option",
            });
          }
        });
      }
    }

    // Nicotine required if LI or SH chosen
    const needsSelfSmoker = val.selfCoverages.some(
      (c) => c === "LI" || c === "SH",
    );
    if (val.applicants.self && needsSelfSmoker && !val.smokerSelf) {
      ctx.addIssue({
        code: "custom",
        path: ["smokerSelf"],
        message: "Please select an option",
      });
    }
    const needsSpouseSmoker = val.spouseCoverages.some(
      (c) => c === "LI" || c === "SH",
    );
    if (val.applicants.spouse && needsSpouseSmoker && !val.smokerSpouse) {
      ctx.addIssue({
        code: "custom",
        path: ["smokerSpouse"],
        message: "Please select an option",
      });
    }

    // Tobacco use details required if smoker = "yes"
    if (val.smokerSelf === "yes") {
      if (!val.selfTobaccoLastUsed) {
        ctx.addIssue({
          code: "custom",
          path: ["selfTobaccoLastUsed"],
          message: "Last Used date is required",
        });
      } else if (!/^\d{4}-\d{2}-\d{2}$/.test(val.selfTobaccoLastUsed)) {
        ctx.addIssue({
          code: "custom",
          path: ["selfTobaccoLastUsed"],
          message: "Please select a valid date",
        });
      }
      if (!val.selfTobaccoProducts || val.selfTobaccoProducts.length === 0) {
        ctx.addIssue({
          code: "custom",
          path: ["selfTobaccoProducts"],
          message: "Select at least one product",
        });
      }
    }
    if (val.smokerSpouse === "yes") {
      if (!val.spouseTobaccoLastUsed) {
        ctx.addIssue({
          code: "custom",
          path: ["spouseTobaccoLastUsed"],
          message: "Last Used date is required",
        });
      } else if (!/^\d{4}-\d{2}-\d{2}$/.test(val.spouseTobaccoLastUsed)) {
        ctx.addIssue({
          code: "custom",
          path: ["spouseTobaccoLastUsed"],
          message: "Please select a valid date",
        });
      }
      if (
        !val.spouseTobaccoProducts ||
        val.spouseTobaccoProducts.length === 0
      ) {
        ctx.addIssue({
          code: "custom",
          path: ["spouseTobaccoProducts"],
          message: "Select at least one product",
        });
      }
    }

    // DI requires income + hours
    if (val.selfCoverages.includes("DI")) {
      if (!val.selfAvgIncome) {
        ctx.addIssue({
          code: "custom",
          path: ["selfAvgIncome"],
          message: "Average Monthly Income is required",
        });
      }
      if (!val.selfHoursPerWeek) {
        ctx.addIssue({
          code: "custom",
          path: ["selfHoursPerWeek"],
          message: "Hours per week is required",
        });
      }
    }
    if (val.spouseCoverages.includes("DI")) {
      if (!val.spouseAvgIncome) {
        ctx.addIssue({
          code: "custom",
          path: ["spouseAvgIncome"],
          message: "Average Monthly Income is required",
        });
      }
      if (!val.spouseHoursPerWeek) {
        ctx.addIssue({
          code: "custom",
          path: ["spouseHoursPerWeek"],
          message: "Hours per week is required",
        });
      }
    }
    // OO requires expenses + responsibility %
    if (val.selfCoverages.includes("OO")) {
      if (!val.selfMonthlyExpenses) {
        ctx.addIssue({
          code: "custom",
          path: ["selfMonthlyExpenses"],
          message: "Monthly Business Expenses is required",
        });
      }
      if (!val.selfRespPct) {
        ctx.addIssue({
          code: "custom",
          path: ["selfRespPct"],
          message: "Percentage is required",
        });
      }
    }
  });

export type EligibilityForm = z.infer<typeof EligibilitySchema>;
