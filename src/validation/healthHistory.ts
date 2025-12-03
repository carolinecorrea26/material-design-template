import { z } from "zod";

const healthDetailsSchema = z.object({
  onsetDate: z.string().optional(),
  conditionDetails: z.string().optional(),
  physicianInfo: z.string().optional()
});

const healthDetailsRequiredSchema = z.object({
  onsetDate: z.string().min(1, "Month/Year of Onset is required"),
  conditionDetails: z.string().min(1, "Condition/Medication & Details is required"),
  physicianInfo: z.string().min(1, "Physician information is required")
});

export const HealthHistorySchema = z.object({
  question1: z.enum(["yes", "no"]),
  question1Details: healthDetailsSchema.optional(),
  question2: z.enum(["yes", "no"]),
  question2Details: healthDetailsSchema.optional(),
  question3: z.enum(["yes", "no"]),
  question3Details: healthDetailsSchema.optional(),
  question4: z.enum(["yes", "no"]),
  question4Details: healthDetailsSchema.optional(),
  question5: z.enum(["yes", "no"]),
  question5Details: healthDetailsSchema.optional(),
  question6: z.enum(["yes", "no"]),
  question6Details: healthDetailsSchema.optional(),
  question7: z.enum(["yes", "no"]),
  question7Details: healthDetailsSchema.optional(),
  question8: z.enum(["yes", "no"]),
  question8Details: healthDetailsSchema.optional(),
  question9: z.enum(["yes", "no"]),
  question9Details: healthDetailsSchema.optional(),
  question10: z.enum(["yes", "no"]),
  question10Details: healthDetailsSchema.optional(),
  question11: z.enum(["yes", "no"]),
  question11Details: healthDetailsSchema.optional(),
  question12: z.enum(["yes", "no"]),
  question12Details: healthDetailsSchema.optional(),
  question13: z.enum(["yes", "no"]),
  question13Details: healthDetailsSchema.optional(),
  question14: z.enum(["yes", "no"]),
  question14Details: healthDetailsSchema.optional(),
  question15: z.enum(["yes", "no"]),
  question15Details: healthDetailsSchema.optional()
}).superRefine((data, ctx) => {
  // Validate that if any question is "yes", the corresponding details are filled
  for (let i = 1; i <= 15; i++) {
    const questionKey = `question${i}` as keyof typeof data;
    const detailsKey = `question${i}Details` as keyof typeof data;
    
    if (data[questionKey] === "yes") {
      const details = data[detailsKey] as { onsetDate?: string; conditionDetails?: string; physicianInfo?: string } | undefined;
      
      if (!details?.onsetDate) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Month/Year of Onset is required",
          path: [`${detailsKey}.onsetDate`]
        });
      }
      
      if (!details?.conditionDetails) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Condition/Medication & Details is required",
          path: [`${detailsKey}.conditionDetails`]
        });
      }
      
      if (!details?.physicianInfo) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Physician information is required",
          path: [`${detailsKey}.physicianInfo`]
        });
      }
    }
  }
});

export type HealthHistoryForm = z.infer<typeof HealthHistorySchema>;

