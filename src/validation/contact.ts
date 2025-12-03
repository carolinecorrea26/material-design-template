import { z } from "zod";

export const ContactSchema = z.object({
  // Your Contact Information
  streetAddress: z.string().min(1, "Street address is required"),
  aptSuite: z.string().optional(),
  city: z.string().min(1, "City is required"),
  state: z.string().min(2, "State is required"),
  zipCode: z.string().min(5, "Valid zip code is required"),
  phoneNumber: z.string().min(10, "Valid phone number is required"),
  phoneType: z.enum(["home", "business", "mobile"], { 
    message: "Phone type is required" 
  }),
  correspondenceTo: z.enum(["residential", "business"], { 
    message: "Correspondence preference is required" 
  }),
  
  // Business Information (conditional)
  businessName: z.string().optional(),
  businessType: z.enum(["sole_proprietor", "corporation", "partnership"], {
    message: "Please select a business type"
  }).optional(),
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
