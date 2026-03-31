"use client";

import { useState, useEffect } from "react";
import { Activity, ShieldCheck, Zap, Loader2, AlertCircle } from "lucide-react";
import { useToast } from "@/components/Toast";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

interface PolicyType {
  type_id: number;
  type_name: string;
  base_premium: number;
  max_coverage: number;
}

interface PremiumResult {
  type_name: string;
  base_premium: number;
  risk_multiplier: number;
  calculated_premium: number;
}

// Demo: using customer_id=1 (Amit Patel from seed data — Verified KYC)
const DEMO_CUSTOMER_ID = 1;

export default function PremiumCalculator() {
  const { toast } = useToast();
  const [policyTypes, setPolicyTypes] = useState<PolicyType[]>([]);
  const [selectedType, setSelectedType] = useState<string>("");
  const [result, setResult] = useState<PremiumResult | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [loadingTypes, setLoadingTypes] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${API}/policy-types/`)
      .then((r) => r.json())
      .then((json) => {
        setPolicyTypes(json.data ?? []);
        if (json.data?.length > 0) setSelectedType(String(json.data[0].type_id));
      })
      .catch(() => {
        setError("Could not load policy types.");
        toast("Could not load policy types from the server.", "error");
      })
      .finally(() => setLoadingTypes(false));
  }, [toast]);

  const calculatePremium = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCalculating(true);
    setResult(null);
    setError(null);

    try {
      const res = await fetch(`${API}/premium/calculate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_id: DEMO_CUSTOMER_ID,
          type_id: parseInt(selectedType),
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.detail ?? "Calculation failed.");

      setResult(json.data);
      toast("Premium calculated successfully!", "success");
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "An error occurred.";
      setError(message);
      toast(message, "error");
    } finally {
      setIsCalculating(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-slide-up">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold tracking-tight">Risk &amp; Premium Engine</h1>
        <p className="text-muted-foreground mt-2 max-w-2xl mx-auto">
          Dynamically calculate insurance premiums using our multi-factor risk assessment stored procedure.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-10">
        <div className="glass-card p-8">
          <form className="space-y-6" onSubmit={calculatePremium}>
            <div className="space-y-2">
              <label htmlFor="insurance_type" className="text-sm font-medium">Insurance Type</label>
              {loadingTypes ? (
                <div className="flex items-center gap-2 text-muted-foreground text-sm p-3">
                  <Loader2 className="w-4 h-4 animate-spin" /> Loading types...
                </div>
              ) : (
                <select
                  id="insurance_type"
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg p-3 outline-none focus:ring-2 focus:ring-accent transition-all"
                >
                  {policyTypes.map((pt) => (
                    <option key={pt.type_id} value={String(pt.type_id)} className="text-black dark:text-white bg-background">
                      {pt.type_name} Insurance — Base ₹{pt.base_premium.toLocaleString()}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {policyTypes.find((pt) => String(pt.type_id) === selectedType) && (
              <div className="text-sm text-muted-foreground bg-white/5 rounded-lg p-3 border border-white/10">
                Max Coverage:{" "}
                <span className="font-semibold text-foreground">
                  ₹{policyTypes.find((pt) => String(pt.type_id) === selectedType)!.max_coverage.toLocaleString()}
                </span>
              </div>
            )}

            {error && (
              <div className="flex items-center gap-2 text-red-500 text-sm bg-red-500/10 p-3 rounded-lg border border-red-500/20">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isCalculating || loadingTypes}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-accent to-primary text-white font-bold hover:opacity-90 transition-opacity shadow-lg shadow-accent/20 flex justify-center items-center gap-2 disabled:opacity-50"
            >
              {isCalculating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Zap className="w-5 h-5" />}
              {isCalculating ? "Running Risk Model..." : "Calculate Premium"}
            </button>
          </form>
        </div>

        <div className="flex flex-col justify-center">
          {isCalculating ? (
            <div className="text-center space-y-4 animate-pulse">
              <Activity className="w-16 h-16 text-accent mx-auto" />
              <h3 className="text-2xl font-semibold">Analyzing Risk Factors</h3>
              <p className="text-muted-foreground">Executing database stored procedure...</p>
            </div>
          ) : result ? (
            <div className="glass p-8 rounded-3xl text-center space-y-6 animate-fade-in border-accent/20 shadow-2xl shadow-accent/10">
              <ShieldCheck className="w-16 h-16 text-accent mx-auto" />
              <h3 className="text-xl font-medium text-muted-foreground">Estimated Annual Premium</h3>
              <div className="text-6xl font-extrabold bg-clip-text text-transparent bg-gradient-to-br from-black to-gray-500 dark:from-white dark:to-gray-400">
                ₹{result.calculated_premium.toFixed(2)}
              </div>
              <div className="text-sm text-muted-foreground space-y-1">
                <p>Base Premium: ₹{result.base_premium.toLocaleString()}</p>
                <p>Risk Multiplier: ×{result.risk_multiplier}</p>
              </div>
              <p className="text-sm text-accent bg-accent/10 px-4 py-2 rounded-full inline-block">
                ✓ Risk Adjusted Calculation Completed
              </p>
            </div>
          ) : (
            <div className="text-center space-y-4 opacity-50">
              <Activity className="w-16 h-16 text-muted-foreground mx-auto" />
              <p className="text-muted-foreground">Select a policy type and click Calculate to run the stored procedure.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
