"use client";

import { useAuth } from "@/context/AuthContext";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { UploadCloud, CheckCircle2, Loader2, AlertCircle } from "lucide-react";
import { claimFormSchema, type ClaimFormValues } from "@/lib/validators";
import { useToast } from "@/components/Toast";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

interface Policy {
  policy_id: number;
  type_name: string;
}

interface SubmittedClaim {
  claim_id: number;
}

export default function NewClaim() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [loadingPolicies, setLoadingPolicies] = useState(true);
  const [submitted, setSubmitted] = useState<SubmittedClaim | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const customerId = user?.customer_id ?? 1;

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ClaimFormValues>({
    resolver: zodResolver(claimFormSchema),
    defaultValues: {
      policy_id: "",
      incident_date: "",
      claim_amount: "",
    },
  });

  useEffect(() => {
    fetch(`${API}/policies/?customer_id=${customerId}&status=Active`)
      .then((r) => r.json())
      .then((json) => {
        const data = json.data ?? [];
        setPolicies(data);
        if (data.length > 0) setValue("policy_id", String(data[0].policy_id));
      })
      .catch(() => {
        setFetchError("Could not load your policies.");
        toast("Could not load your policies from the server.", "error");
      })
      .finally(() => setLoadingPolicies(false));
  }, [setValue, toast]);

  const onSubmit = async (data: ClaimFormValues) => {
    setFetchError(null);

    try {
      const res = await fetch(`${API}/claims/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          policy_id: parseInt(data.policy_id),
          incident_date: data.incident_date,
          claim_amount: parseFloat(data.claim_amount),
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.detail ?? "Failed to submit claim.");

      toast("Claim submitted successfully!", "success");
      setSubmitted(json.data);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Submission failed.";
      setFetchError(message);
      toast(message, "error");
    }
  };

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center py-20 animate-fade-in space-y-6">
        <div className="p-6 bg-green-500/10 rounded-full">
          <CheckCircle2 className="w-16 h-16 text-green-500" />
        </div>
        <h2 className="text-3xl font-bold">Claim Submitted Successfully</h2>
        <p className="text-muted-foreground text-lg max-w-md text-center">
          Your claim <span className="font-semibold text-foreground">#CLM-{submitted.claim_id}</span> has been received and is under review by our adjusters.
        </p>
        <button
          className="px-6 py-2 bg-primary text-primary-foreground rounded-full hover:bg-primary/90 transition mt-4"
          onClick={() => (window.location.href = "/customer/dashboard")}
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-slide-up">
      <div>
        <h1 className="text-4xl font-bold tracking-tight">Report an Incident</h1>
        <p className="text-muted-foreground mt-2">
          Please provide details about the incident to initiate a new claim.
        </p>
      </div>

      <form className="glass-card p-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
        <div className="space-y-2">
          <label htmlFor="policy_id" className="text-sm font-medium">Select Policy</label>
          {loadingPolicies ? (
            <div className="flex items-center gap-2 text-muted-foreground text-sm p-3">
              <Loader2 className="w-4 h-4 animate-spin" /> Loading your policies...
            </div>
          ) : (
            <select
              id="policy_id"
              {...register("policy_id")}
              className="w-full bg-white/5 border border-white/10 rounded-lg p-3 outline-none focus:ring-2 focus:ring-primary transition-all"
            >
              {policies.map((p) => (
                <option key={p.policy_id} value={String(p.policy_id)} className="text-black dark:text-white bg-background">
                  {p.type_name} Insurance (EV-{p.policy_id})
                </option>
              ))}
            </select>
          )}
          {errors.policy_id && (
            <p className="text-xs text-red-500">{errors.policy_id.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <label htmlFor="incident_date" className="text-sm font-medium">Incident Date</label>
          <input
            id="incident_date"
            type="date"
            max={new Date().toISOString().split("T")[0]}
            {...register("incident_date")}
            className="w-full bg-white/5 border border-white/10 rounded-lg p-3 outline-none focus:ring-2 focus:ring-primary transition-all dark:[color-scheme:dark]"
          />
          {errors.incident_date && (
            <p className="text-xs text-red-500">{errors.incident_date.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <label htmlFor="claim_amount" className="text-sm font-medium">Claim Amount (₹)</label>
          <input
            id="claim_amount"
            type="number"
            min="1"
            step="0.01"
            placeholder="e.g. 25000"
            {...register("claim_amount")}
            className="w-full bg-white/5 border border-white/10 rounded-lg p-3 outline-none focus:ring-2 focus:ring-primary transition-all"
          />
          {errors.claim_amount && (
            <p className="text-xs text-red-500">{errors.claim_amount.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Supporting Documents</label>
          <div className="border-2 border-dashed border-white/20 rounded-xl p-8 text-center hover:bg-white/5 transition-colors cursor-pointer group">
            <UploadCloud className="w-10 h-10 mx-auto text-muted-foreground group-hover:text-primary transition-colors mb-4" />
            <p className="text-sm text-foreground font-medium">Click to upload or drag and drop</p>
            <p className="text-xs text-muted-foreground mt-1">SVG, PNG, JPG, PDF (max. 10MB)</p>
          </div>
        </div>

        {fetchError && (
          <div className="flex items-center gap-2 text-red-500 text-sm bg-red-500/10 p-3 rounded-lg border border-red-500/20">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {fetchError}
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting || loadingPolicies}
          className="w-full py-4 rounded-xl bg-gradient-to-r from-primary to-secondary text-white font-bold hover:opacity-90 transition-opacity shadow-lg shadow-primary/20 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {isSubmitting && <Loader2 className="w-5 h-5 animate-spin" />}
          {isSubmitting ? "Submitting..." : "Submit Claim"}
        </button>
      </form>
    </div>
  );
}
