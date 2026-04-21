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

  // Mock document state
  const [docType, setDocType] = useState("Medical Bill");
  const [docUrl, setDocUrl] = useState("");
  const [isUploading, setIsUploading] = useState(false);

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
  }, [setValue, toast, customerId]);

  const onSubmit = async (data: ClaimFormValues) => {
    setFetchError(null);
    setIsUploading(true);

    try {
      // 1. Create Claim
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

      const claimId = json.data.claim_id;

      // 2. Attach Document (if URL provided or use a default mock)
      const finalDocUrl = docUrl || "https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=800&q=80";

      const docRes = await fetch(`${API}/claims/${claimId}/documents`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          doc_type: docType,
          file_url: finalDocUrl
        }),
      });

      if (!docRes.ok) {
        toast("Claim created, but evidence upload failed.", "info");
      }

      toast("Claim submitted with evidence!", "success");
      setSubmitted(json.data);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Submission failed.";
      setFetchError(message);
      toast(message, "error");
    } finally {
      setIsUploading(false);
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
          Your claim <span className="font-semibold text-foreground">#CLM-{submitted.claim_id}</span> has been received with supporting evidence and is under review.
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
    <div className="max-w-2xl mx-auto space-y-8 animate-slide-up pb-20">
      <div>
        <h1 className="text-4xl font-bold tracking-tight">Report an Incident</h1>
        <p className="text-muted-foreground mt-2">
          Please provide details about the incident and attach evidence (Photos/Bills) for faster processing.
        </p>
      </div>

      <form className="glass-card p-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label htmlFor="policy_id" className="text-sm font-medium">Select Policy</label>
            {loadingPolicies ? (
              <div className="flex items-center gap-2 text-muted-foreground text-sm p-3 bg-white/5 rounded-lg">
                <Loader2 className="w-4 h-4 animate-spin" /> Loading...
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
        </div>

        <div className="space-y-2">
          <label htmlFor="claim_amount" className="text-sm font-medium">Estimated Claim Amount (₹)</label>
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

        {/* Mock Document Section */}
        <div className="pt-4 border-t border-white/10 space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <UploadCloud className="w-5 h-5 text-primary" />
            Attach Evidence
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Document Type</label>
              <select
                value={docType}
                onChange={(e) => setDocType(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg p-3 outline-none focus:ring-2 focus:ring-primary transition-all"
              >
                <option value="Medical Bill" className="bg-background">Medical Bill</option>
                <option value="ID Proof" className="bg-background">ID Proof</option>
                <option value="Incident Photo" className="bg-background">Incident Photo</option>
                <option value="Police Report" className="bg-background">Police Report</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">File / Link (Mock)</label>
              <input
                type="text"
                placeholder="Paste an image URL (optional)"
                value={docUrl}
                onChange={(e) => setDocUrl(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg p-3 outline-none focus:ring-2 focus:ring-primary transition-all"
              />
            </div>
          </div>

          <div className="p-4 bg-primary/5 border border-primary/20 rounded-xl text-xs text-muted-foreground flex gap-3">
            <AlertCircle className="w-4 h-4 text-primary shrink-0" />
            <p>Our Claims Manager will verify these documents. Providing clear evidence significantly speeds up the adjudication process.</p>
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
          disabled={isSubmitting || isUploading || loadingPolicies}
          className="w-full py-4 rounded-xl bg-gradient-to-r from-primary to-secondary text-white font-bold hover:opacity-90 transition-opacity shadow-lg shadow-primary/20 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {(isSubmitting || isUploading) && <Loader2 className="w-5 h-5 animate-spin" />}
          {(isSubmitting || isUploading) ? "Processing Claim..." : "Submit Claim with Evidence"}
        </button>
      </form>
    </div>
  );
}
