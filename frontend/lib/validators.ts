import { z } from "zod/v4";

// ─── Claims Form ────────────────────────────────────────────────────────────
export const claimFormSchema = z.object({
  policy_id: z
    .string()
    .min(1, "Please select a policy"),
  incident_date: z
    .string()
    .min(1, "Incident date is required")
    .refine(
      (val) => {
        const d = new Date(val);
        return !isNaN(d.getTime()) && d <= new Date();
      },
      { message: "Incident date must be today or earlier" }
    ),
  claim_amount: z
    .string()
    .min(1, "Claim amount is required")
    .refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
      message: "Claim amount must be a positive number",
    }),
});

export type ClaimFormValues = z.infer<typeof claimFormSchema>;

// ─── Admin Policy-Type Creation ─────────────────────────────────────────────
export const policyTypeFormSchema = z.object({
  type_name: z.enum(["Health", "Car", "Home"], {
    message: "Please select a valid policy category",
  }),
  base_premium: z
    .string()
    .min(1, "Base premium is required")
    .refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
      message: "Base premium must be a positive number",
    }),
  max_coverage: z
    .string()
    .min(1, "Maximum coverage is required")
    .refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
      message: "Maximum coverage must be a positive number",
    }),
});

export type PolicyTypeFormValues = z.infer<typeof policyTypeFormSchema>;

// ─── Premium Calculator ─────────────────────────────────────────────────────
export const premiumCalcSchema = z.object({
  type_id: z
    .string()
    .min(1, "Please select a policy type"),
});

export type PremiumCalcValues = z.infer<typeof premiumCalcSchema>;
