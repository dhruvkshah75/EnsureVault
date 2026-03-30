"use client";

import { useState, useEffect } from "react";
import { UploadCloud, CheckCircle2, Loader2, AlertCircle } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

// Demo: using customer_id=1 (Amit Patel from seed data)
const DEMO_CUSTOMER_ID = 1;

interface Policy {
  policy_id: number;
  type_name: string;
  status: string;
}

interface SubmittedClaim {
  claim_id: number;
}

export default function NewClaim() {
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [loadingPolicies, setLoadingPolicies] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState<SubmittedClaim | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [selectedPolicy, setSelectedPolicy] = useState<string>("");
  const [incidentDate, setIncidentDate] = useState<string>("");
  const [claimAmount, setClaimAmount] = useState<string>("");

  useEffect(() => {
    fetch(`${API}/policies/?customer_id=${DEMO_CUSTOMER_ID}&status=Active`)
      .then((r) => r.json())
      .then((json) => {
        setPolicies(json.data ?? []);
        if (json.data?.length > 0) setSelectedPolicy(String(json.data[0].policy_id));
      })
      .catch(() => setError("Could not load your policies."))
      .finally(() => setLoadingPolicies(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const res = await fetch(`${API}/claims/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          policy_id: parseInt(selectedPolicy),
          incident_date: incidentDate,
          claim_amount: parseFloat(claimAmount),
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.detail ?? "Failed to submit claim.");
      setSubmitted(json.data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Submission failed.");
    } finally {
      setSubmitting(false);
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

      <form className="glass-card p-8 space-y-6" onSubmit={handleSubmit}>
        <div className="space-y-2">
          <label className="text-sm font-medium">Select Policy</label>
          {loadingPolicies ? (
            <div className="flex items-center gap-2 text-muted-foreground text-sm p-3">
              <Loader2 className="w-4 h-4 animate-spin" /> Loading your policies...
            </div>
          ) : (
            <select
              required
              value={selectedPolicy}
              onChange={(e) => setSelectedPolicy(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg p-3 outline-none focus:ring-2 focus:ring-primary transition-all"
            >
              {policies.map((p) => (
                <option key={p.policy_id} value={String(p.policy_id)} className="text-black dark:text-white bg-background">
                  {p.type_name} Insurance (EV-{p.policy_id})
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Incident Date</label>
          <input
            type="date"
            required
            value={incidentDate}
            onChange={(e) => setIncidentDate(e.target.value)}
            max={new Date().toISOString().split("T")[0]}
            className="w-full bg-white/5 border border-white/10 rounded-lg p-3 outline-none focus:ring-2 focus:ring-primary transition-all dark:[color-scheme:dark]"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Claim Amount (₹)</label>
          <input
            type="number"
            required
            min="1"
            step="0.01"
            placeholder="e.g. 25000"
            value={claimAmount}
            onChange={(e) => setClaimAmount(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-lg p-3 outline-none focus:ring-2 focus:ring-primary transition-all"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Supporting Documents</label>
          <div className="border-2 border-dashed border-white/20 rounded-xl p-8 text-center hover:bg-white/5 transition-colors cursor-pointer group">
            <UploadCloud className="w-10 h-10 mx-auto text-muted-foreground group-hover:text-primary transition-colors mb-4" />
            <p className="text-sm text-foreground font-medium">Click to upload or drag and drop</p>
            <p className="text-xs text-muted-foreground mt-1">SVG, PNG, JPG, PDF (max. 10MB)</p>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 text-red-500 text-sm bg-red-500/10 p-3 rounded-lg border border-red-500/20">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting || loadingPolicies}
          className="w-full py-4 rounded-xl bg-gradient-to-r from-primary to-secondary text-white font-bold hover:opacity-90 transition-opacity shadow-lg shadow-primary/20 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {submitting && <Loader2 className="w-5 h-5 animate-spin" />}
          {submitting ? "Submitting..." : "Submit Claim"}
        </button>
      </form>
    </div>
  );
}
