import { z } from "zod";

const US_ZIP_REGEX = /^\d{5}$/;
const CA_POSTAL_REGEX =
  /^[ABCEGHJ-NPRSTVXY]\d[ABCEGHJ-NPRSTV-Z]\s?\d[ABCEGHJ-NPRSTV-Z]\d$/i;

export const ContactSchema = z.object({
  // Your Contact Information
  streetAddress: z.string().min(1, "Street address is required"),
  aptSuite: z.string().optional(),
  city: z.string().min(1, "City is required"),
  state: z.string().min(2, "State is required"),
  zipCode: z
    .string()
    .min(3, "Valid postal code is required")
    .refine(
      (val) => US_ZIP_REGEX.test(val) || CA_POSTAL_REGEX.test(val),
      "Valid postal code is required",
    ),
  phoneNumber: z.string().min(10, "Valid phone number is required"),
  phoneType: z.enum(["home", "business", "mobile"], {
    message: "Phone type is required",
  }),
  correspondenceTo: z.enum(["residential", "business"], {
    message: "Correspondence preference is required",
  }),

  // Business Information (conditional)
  businessName: z.string().optional(),
  businessType: z
    .enum(["sole_proprietor", "corporation", "partnership"], {
      message: "Please select a business type",
    })
    .optional(),
  businessAddressSameAsHome: z.boolean().optional(),
  businessStreetAddress: z.string().optional(),
  businessAptSuite: z.string().optional(),
  businessCity: z.string().optional(),
  businessState: z.string().optional(),
  businessZipCode: z.string().optional(),
  businessPhoneNumber: z.string().optional(),

  // Spouse Contact Information (conditional)
  spousePhoneNumber: z.string().optional(),
  spousePhoneType: z.enum(["home", "business", "mobile"]).optional(),
  spouseEmail: z.string().email("Valid email is required").optional(),
});

export type ContactForm = z.infer<typeof ContactSchema>;
