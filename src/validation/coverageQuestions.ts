import { z } from "zod";

export type CoverageQuestionsFlags = {
  needsSelfGender: boolean;
  needsSpouseGender: boolean;
  needsSelfSmoker: boolean;
  needsSpouseSmoker: boolean;
  needsSelfDI: boolean;
  needsSpouseDI: boolean;
  needsSelfOO: boolean;
  needsSelfHours: boolean;
  needsSpouseHours: boolean;
};

export const buildCoverageQuestionsSchema = (flags: CoverageQuestionsFlags) =>
  z
    .object({
      gender: z
        .enum(["male", "female"], { message: "Please select an option" })
        .optional(),
      spouseGender: z
        .enum(["male", "female"], { message: "Please select an option" })
        .optional(),

      smokerSelf: z
        .enum(["yes", "no"], { message: "Please select an option" })
        .optional(),
      smokerSpouse: z
        .enum(["yes", "no"], { message: "Please select an option" })
        .optional(),

      selfTobaccoLastUsed: z.string().optional(),
      selfTobaccoProducts: z.array(z.string()).optional(),
      spouseTobaccoLastUsed: z.string().optional(),
      spouseTobaccoProducts: z.array(z.string()).optional(),

      selfAvgIncome: z.string().optional(),
      selfHoursPerWeek: z.string().optional(),
      selfMonthlyExpenses: z.string().optional(),
      selfRespPct: z.string().optional(),

      spouseAvgIncome: z.string().optional(),
      spouseHoursPerWeek: z.string().optional(),
    })
    .superRefine((val, ctx) => {
      if (flags.needsSelfGender && !val.gender) {
        ctx.addIssue({
          code: "custom",
          path: ["gender"],
          message: "Please select an option",
        });
      }
      if (flags.needsSpouseGender && !val.spouseGender) {
        ctx.addIssue({
          code: "custom",
          path: ["spouseGender"],
          message: "Please select an option",
        });
      }

      if (flags.needsSelfSmoker && !val.smokerSelf) {
        ctx.addIssue({
          code: "custom",
          path: ["smokerSelf"],
          message: "Please select an option",
        });
      }
      if (flags.needsSpouseSmoker && !val.smokerSpouse) {
        ctx.addIssue({
          code: "custom",
          path: ["smokerSpouse"],
          message: "Please select an option",
        });
      }

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

      if (flags.needsSelfDI && !val.selfAvgIncome) {
        ctx.addIssue({
          code: "custom",
          path: ["selfAvgIncome"],
          message: "Average Monthly Income is required",
        });
      }
      if (flags.needsSelfHours && !val.selfHoursPerWeek) {
        ctx.addIssue({
          code: "custom",
          path: ["selfHoursPerWeek"],
          message: "Hours per week is required",
        });
      }
      if (flags.needsSelfOO && !val.selfMonthlyExpenses) {
        ctx.addIssue({
          code: "custom",
          path: ["selfMonthlyExpenses"],
          message: "Monthly Business Expenses is required",
        });
      }
      if (flags.needsSelfOO && !val.selfRespPct) {
        ctx.addIssue({
          code: "custom",
          path: ["selfRespPct"],
          message: "Percentage is required",
        });
      }

      if (flags.needsSpouseDI && !val.spouseAvgIncome) {
        ctx.addIssue({
          code: "custom",
          path: ["spouseAvgIncome"],
          message: "Average Monthly Income is required",
        });
      }
      if (flags.needsSpouseHours && !val.spouseHoursPerWeek) {
        ctx.addIssue({
          code: "custom",
          path: ["spouseHoursPerWeek"],
          message: "Hours per week is required",
        });
      }
    });

export type CoverageQuestionsForm = z.infer<
  ReturnType<typeof buildCoverageQuestionsSchema>
>;
