"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ShieldAlert, Loader2, CheckCircle2 } from "lucide-react";
import { z } from "zod";
import { useToast } from "@/components/Toast";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

const claimsManagerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100, "Name must not exceed 100 characters"),
  region: z.string().min(2, "Region must be at least 2 characters"),
  specialization: z.string().min(2, "Specialization must be at least 2 characters"),
});

type ClaimsManagerFormValues = z.infer<typeof claimsManagerSchema>;

export default function CreateClaimsManager() {
  const { toast } = useToast();
  const [submitted, setSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<ClaimsManagerFormValues>({
    resolver: zodResolver(claimsManagerSchema),
    defaultValues: {
      name: "",
      region: "",
      specialization: "",
    },
  });

  const onSubmit = async (data: ClaimsManagerFormValues) => {
    try {
      const res = await fetch(`${API}/admin/claims-managers/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.name,
          region: data.region,
          specialization: data.specialization,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.detail ?? "Failed to create claims manager.");

      toast(`Claims Manager created successfully!`, "success");
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
        <h2 className="text-3xl font-bold">Claims Manager Onboarded Successfully</h2>
        <p className="text-muted-foreground text-lg max-w-md text-center">
          The new claims manager can now log in using their derived email domain (@ensurevault.com).
        </p>
        <button
          className="px-6 py-2 bg-secondary text-secondary-foreground rounded-full hover:bg-secondary/90 transition mt-4 font-medium"
          onClick={() => {
            reset();
            setSubmitted(false);
          }}
        >
          Add Another Claims Manager
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-slide-up">
      <div>
        <h1 className="text-4xl font-bold tracking-tight">Add New Claims Manager</h1>
        <p className="text-muted-foreground mt-2">Onboard a new claims manager to review and approve insurance claims.</p>
      </div>

      <div className="bg-secondary/10 border border-secondary/20 p-4 rounded-xl flex items-start gap-4">
        <ShieldAlert className="w-6 h-6 text-secondary mt-1 shrink-0" />
        <div>
          <h3 className="font-semibold text-secondary">Admin Access Only</h3>
          <p className="text-sm text-foreground/80 mt-1">
            Claims Managers are responsible for reviewing and processing insurance claims. They have specialized access to claims data. Their login email will automatically be derived from their name (e.g., <strong>Jane Smith</strong> becomes <strong>jane.smith@ensurevault.com</strong>).
          </p>
        </div>
      </div>

      <form className="glass-card p-8 space-y-8" onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 gap-6">
          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-medium">Claims Manager Full Name</label>
            <input
              id="name"
              type="text"
              placeholder="Jane Smith"
              {...register("name")}
              className="w-full bg-white/5 border border-white/10 rounded-lg p-3 outline-none focus:ring-2 focus:ring-secondary transition-all"
            />
            {errors.name && (
              <p className="text-xs text-red-500">{errors.name.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label htmlFor="region" className="text-sm font-medium">Operating Region</label>
              <input
                id="region"
                type="text"
                placeholder="Southern India"
                {...register("region")}
                className="w-full bg-white/5 border border-white/10 rounded-lg p-3 outline-none focus:ring-2 focus:ring-secondary transition-all"
              />
              {errors.region && (
                <p className="text-xs text-red-500">{errors.region.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="specialization" className="text-sm font-medium">Claim Specialization</label>
              <input
                id="specialization"
                type="text"
                placeholder="Health Insurance Claims"
                {...register("specialization")}
                className="w-full bg-white/5 border border-white/10 rounded-lg p-3 outline-none focus:ring-2 focus:ring-secondary transition-all"
              />
              {errors.specialization && (
                <p className="text-xs text-red-500">{errors.specialization.message}</p>
              )}
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-4 rounded-xl bg-gradient-to-r from-secondary to-accent text-white font-bold hover:opacity-90 transition-opacity shadow-lg shadow-secondary/20 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {isSubmitting && <Loader2 className="w-5 h-5 animate-spin" />}
          {isSubmitting ? "Creating Claims Manager..." : "Create Claims Manager"}
        </button>
      </form>
    </div>
  );
}
