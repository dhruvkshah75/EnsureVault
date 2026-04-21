"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ShieldAlert, Loader2, CheckCircle2 } from "lucide-react";
import { policyTypeFormSchema, type PolicyTypeFormValues } from "@/lib/validators";
import { useToast } from "@/components/Toast";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

export default function CreatePolicy() {
  const { toast } = useToast();
  const [submitted, setSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<PolicyTypeFormValues>({
    resolver: zodResolver(policyTypeFormSchema),
    defaultValues: {
      type_name: "Health",
      base_premium: "",
      max_coverage: "",
    },
  });

  const onSubmit = async (data: PolicyTypeFormValues) => {
    try {
      const res = await fetch(`${API}/policy-types/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type_name: data.type_name,
          base_premium: parseFloat(data.base_premium),
          max_coverage: parseFloat(data.max_coverage),
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.detail ?? "Failed to create policy type.");

      toast(`Policy type created successfully (ID: ${json.data?.type_id})`, "success");
      setSubmitted(true);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Submission failed.";
      toast(message, "error");
    }
  };

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center py-20 animate-fade-in space-y-6">
        <div className="p-6 bg-green-500/10 rounded-full">
          <CheckCircle2 className="w-16 h-16 text-green-500" />
        </div>
        <h2 className="text-3xl font-bold">Plan Published Successfully</h2>
        <p className="text-muted-foreground text-lg max-w-md text-center">
          The new insurance plan is now available for agents to assign to customers.
        </p>
        <button
          className="px-6 py-2 bg-secondary text-secondary-foreground rounded-full hover:bg-secondary/90 transition mt-4 font-medium"
          onClick={() => {
            reset();
            setSubmitted(false);
          }}
        >
          Create Another Plan
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-slide-up">
      <div>
        <h1 className="text-4xl font-bold tracking-tight">Create Insurance Plan</h1>
        <p className="text-muted-foreground mt-2">Define new policy rules, base premiums, and coverage limits.</p>
      </div>

      <div className="bg-secondary/10 border border-secondary/20 p-4 rounded-xl flex items-start gap-4">
        <ShieldAlert className="w-6 h-6 text-secondary mt-1 shrink-0" />
        <div>
          <h3 className="font-semibold text-secondary">Admin &amp; Agent Access Only</h3>
          <p className="text-sm text-foreground/80 mt-1">
            Modifications to base premiums and coverage limits are strictly monitored and logged for auditing purposes.
          </p>
        </div>
      </div>

      <form className="glass-card p-8 space-y-8" onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2 md:col-span-2">
            <label htmlFor="type_name" className="text-sm font-medium">Policy Category</label>
            <select
              id="type_name"
              {...register("type_name")}
              className="w-full bg-white/5 border border-white/10 rounded-lg p-3 outline-none focus:ring-2 focus:ring-secondary transition-all"
            >
              <option className="text-black dark:text-white bg-background" value="Health">Health Insurance</option>
              <option className="text-black dark:text-white bg-background" value="Car">Car Insurance</option>
              <option className="text-black dark:text-white bg-background" value="Home">Home Insurance</option>
            </select>
            {errors.type_name && (
              <p className="text-xs text-red-500">{errors.type_name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="base_premium" className="text-sm font-medium">Base Premium (₹)</label>
            <input
              id="base_premium"
              type="number"
              min="0"
              step="0.01"
              placeholder="5000.00"
              {...register("base_premium")}
              className="w-full bg-white/5 border border-white/10 rounded-lg p-3 outline-none focus:ring-2 focus:ring-secondary transition-all"
            />
            {errors.base_premium && (
              <p className="text-xs text-red-500">{errors.base_premium.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="max_coverage" className="text-sm font-medium">Maximum Coverage (₹)</label>
            <input
              id="max_coverage"
              type="number"
              min="0"
              step="0.01"
              placeholder="500000.00"
              {...register("max_coverage")}
              className="w-full bg-white/5 border border-white/10 rounded-lg p-3 outline-none focus:ring-2 focus:ring-secondary transition-all"
            />
            {errors.max_coverage && (
              <p className="text-xs text-red-500">{errors.max_coverage.message}</p>
            )}
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-4 rounded-xl bg-gradient-to-r from-secondary to-accent text-white font-bold hover:opacity-90 transition-opacity shadow-lg shadow-secondary/20 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {isSubmitting && <Loader2 className="w-5 h-5 animate-spin" />}
          {isSubmitting ? "Publishing..." : "Publish New Plan"}
        </button>
      </form>
    </div>
  );
}
