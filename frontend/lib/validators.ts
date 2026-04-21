import { z } from "zod";

// ─── Claims Form ────────────────────────────────────────────────────────────
export const claimFormSchema = z.object({
  policy_id: z
    .string()
    .min(1, "Please select a policy"),
  incident_date: z
    .string()
    .min(1, "Incident date is required")
    .refine(
      (val: string) => {
        const d = new Date(val);
        return !isNaN(d.getTime()) && d <= new Date();
      },
      { message: "Incident date must be today or earlier" }
    ),
  claim_amount: z
    .string()
    .min(1, "Claim amount is required")
    .refine((val: string) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
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
    .refine((val: string) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
      message: "Base premium must be a positive number",
    }),
  max_coverage: z
    .string()
    .min(1, "Maximum coverage is required")
    .refine((val: string) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
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

// ─── Admin Agent Creation ───────────────────────────────────────────────────
export const agentFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  region: z.string().min(2, "Region must be at least 2 characters"),
  commission_rate: z
    .string()
    .min(1, "Commission rate is required")
    .refine((val: string) => !isNaN(parseFloat(val)) && parseFloat(val) >= 0 && parseFloat(val) <= 100, {
      message: "Commission rate must be between 0 and 100",
    }),
});

export type AgentFormValues = z.infer<typeof agentFormSchema>;
