"use client";

import { useAuth } from "@/context/AuthContext";
import { useState, useEffect } from "react";
import Link from "next/link";
import { ShoppingCart, Loader2, CheckCircle2, ArrowLeft, AlertCircle } from "lucide-react";
import { useToast } from "@/components/Toast";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

interface PolicyType {
  type_id: number;
  type_name: string;
  base_premium: number;
  max_coverage: number;
}

export default function RequestPolicyPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [policyTypes, setPolicyTypes] = useState<PolicyType[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Form state
  const [selectedType, setSelectedType] = useState<number | null>(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [calculatedPremium, setCalculatedPremium] = useState<number | null>(null);

  useEffect(() => {
    const fetchPolicyTypes = async () => {
      try {
        const res = await fetch(`${API}/policy-types/`);
        const json = await res.json();
        if (!res.ok) throw new Error(json.detail ?? "Failed to load policy types");
        setPolicyTypes(json.data ?? []);
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : "Failed to load policies";
        toast(message, "error");
      } finally {
        setLoading(false);
      }
    };

    fetchPolicyTypes();
  }, [toast]);

  // Calculate premium when dates change (simplified calculation)
  useEffect(() => {
    if (selectedType && startDate && endDate) {
      const selected = policyTypes.find(t => t.type_id === selectedType);
      if (selected) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        const daysInYears = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 365);
        const estimated = selected.base_premium * Math.max(1, daysInYears);
        setCalculatedPremium(Math.round(estimated * 100) / 100);
      }
    } else {
      setCalculatedPremium(null);
    }
  }, [selectedType, startDate, endDate, policyTypes]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedType || !startDate || !endDate) {
      toast("Please fill all fields", "error");
      return;
    }

    if (new Date(endDate) <= new Date(startDate)) {
      toast("End date must be after start date", "error");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`${API}/policies/requests/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type_id: selectedType,
          start_date: startDate,
          end_date: endDate,
          premium_amount: null, // Let server calculate
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.detail ?? "Failed to submit request");

      toast("Policy request submitted! Your agent will review shortly.", "success");
      setSubmitted(true);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Submission failed";
      toast(message, "error");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-40 gap-3 text-muted-foreground">
        <Loader2 className="w-6 h-6 animate-spin" />
        <span>Loading policy options...</span>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center py-20 animate-fade-in space-y-6 max-w-2xl mx-auto">
        <div className="p-6 bg-green-500/10 rounded-full">
          <CheckCircle2 className="w-16 h-16 text-green-500" />
        </div>
        <h2 className="text-3xl font-bold">Request Submitted!</h2>
        <p className="text-muted-foreground text-lg max-w-md text-center">
          Your policy request has been submitted successfully. Your assigned agent will review it shortly and contact you to confirm.
        </p>
        <div className="grid grid-cols-2 gap-4 w-full mt-6">
          <Link
            href="/customer/dashboard"
            className="px-6 py-2 bg-secondary text-secondary-foreground rounded-full hover:bg-secondary/90 transition font-medium text-center"
          >
            Back to Dashboard
          </Link>
          <button
            onClick={() => {
              setSubmitted(false);
              setSelectedType(null);
              setStartDate("");
              setEndDate("");
            }}
            className="px-6 py-2 bg-primary text-primary-foreground rounded-full hover:bg-primary/90 transition font-medium"
          >
            Request Another Policy
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-slide-up">
      <Link href="/customer/dashboard" className="flex items-center gap-2 text-primary hover:underline text-sm font-medium mb-4">
        <ArrowLeft className="w-4 h-4" />
        Back to Dashboard
      </Link>

      <div>
        <h1 className="text-4xl font-bold tracking-tight">Request Insurance Policy</h1>
        <p className="text-muted-foreground mt-2">Choose a policy type, set your coverage dates, and submit for approval.</p>
      </div>

      <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-xl flex items-start gap-4">
        <AlertCircle className="w-6 h-6 text-blue-500 mt-1 shrink-0" />
        <div>
          <h3 className="font-semibold text-blue-600 dark:text-blue-400">How It Works</h3>
          <p className="text-sm text-foreground/80 mt-1">
            Submit your policy request → Agent reviews and approves → Policy becomes active → You can start using it
          </p>
        </div>
      </div>

      <form className="glass-card p-8 space-y-8" onSubmit={handleSubmit}>
        {/* Policy Type Selection */}
        <div className="space-y-4">
          <label className="text-lg font-semibold">Select Insurance Type</label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {policyTypes.map((type) => (
              <button
                key={type.type_id}
                type="button"
                onClick={() => setSelectedType(type.type_id)}
                className={`p-4 rounded-lg border-2 transition-all ${
                  selectedType === type.type_id
                    ? "border-primary bg-primary/10"
                    : "border-border bg-background hover:border-primary/50"
                }`}
              >
                <h3 className="font-bold text-lg mb-2">{type.type_name}</h3>
                <p className="text-sm text-muted-foreground">
                  From ₹{(type.base_premium / 12).toLocaleString()}/month
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  Max coverage: ₹{type.max_coverage.toLocaleString()}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Coverage Dates */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label htmlFor="start-date" className="text-sm font-medium">
              Coverage Start Date
            </label>
            <input
              id="start-date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="w-full bg-white/5 border border-white/10 rounded-lg p-3 outline-none focus:ring-2 focus:ring-primary transition-all"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="end-date" className="text-sm font-medium">
              Coverage End Date
            </label>
            <input
              id="end-date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              min={startDate || new Date().toISOString().split('T')[0]}
              className="w-full bg-white/5 border border-white/10 rounded-lg p-3 outline-none focus:ring-2 focus:ring-primary transition-all"
            />
          </div>
        </div>

        {/* Premium Preview */}
        {calculatedPremium && (
          <div className="bg-primary/10 border border-primary/20 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Estimated Annual Premium</p>
                <p className="text-3xl font-bold text-primary">₹{calculatedPremium.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Server will calculate exact premium based on your profile
                </p>
              </div>
              <ShoppingCart className="w-12 h-12 text-primary opacity-20" />
            </div>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={submitting || !selectedType || !startDate || !endDate}
          className="w-full py-4 rounded-xl bg-gradient-to-r from-primary to-accent text-white font-bold hover:opacity-90 transition-opacity shadow-lg shadow-primary/20 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {submitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Submitting Request...
            </>
          ) : (
            <>
              <ShoppingCart className="w-5 h-5" />
              Request Policy
            </>
          )}
        </button>
      </form>
    </div>
  );
}
