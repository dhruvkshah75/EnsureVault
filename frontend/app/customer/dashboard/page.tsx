"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { FileText, Clock, AlertCircle, Loader2 } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

interface Policy {
  policy_id: number;
  type_name: string;
  status: string;
  premium_amount: number;
  end_date: string;
}

interface Claim {
  claim_id: number;
  policy_type: string;
  claim_amount: number;
  status: string;
  incident_date: string;
}

const statusColor: Record<string, string> = {
  Active: "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20",
  Expired: "bg-gray-500/10 text-gray-500 border-gray-500/20",
  Cancelled: "bg-red-500/10 text-red-500 border-red-500/20",
  Pending: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20",
  "Under Review": "bg-blue-500/10 text-blue-500 border-blue-500/20",
  Approved: "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20",
  Rejected: "bg-red-500/10 text-red-500 border-red-500/20",
};

// Demo: using customer_id=1 (Amit Patel from seed data)
const DEMO_CUSTOMER_ID = 1;

export default function CustomerDashboard() {
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [pRes, cRes] = await Promise.all([
          fetch(`${API}/policies/?customer_id=${DEMO_CUSTOMER_ID}`),
          fetch(`${API}/claims/?customer_id=${DEMO_CUSTOMER_ID}`),
        ]);

        if (!pRes.ok || !cRes.ok) throw new Error("Failed to load data from server.");

        const pJson = await pRes.json();
        const cJson = await cRes.json();

        setPolicies(pJson.data ?? []);
        setClaims(cJson.data ?? []);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-40 gap-3 text-muted-foreground">
        <Loader2 className="w-6 h-6 animate-spin" />
        <span>Loading your portfolio...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-40 gap-2 text-red-500">
        <AlertCircle className="w-8 h-8" />
        <p className="font-medium">Could not connect to server</p>
        <p className="text-sm text-muted-foreground">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Customer Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Welcome back. Here&apos;s an overview of your portfolio.
          </p>
        </div>
        <Link
          href="/customer/claims/new"
          className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-3 rounded-full font-medium transition-colors shadow-lg shadow-primary/25 flex items-center gap-2"
        >
          <AlertCircle className="w-5 h-5" /> Report Incident
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Policies */}
        <div className="glass-card p-6 border-t-4 border-t-primary">
          <div className="flex items-center gap-3 mb-6">
            <FileText className="w-6 h-6 text-primary" />
            <h2 className="text-2xl font-semibold">Active Policies</h2>
          </div>
          <div className="space-y-4">
            {policies.length === 0 && (
              <p className="text-muted-foreground text-sm">No policies found.</p>
            )}
            {policies.map((p) => (
              <div
                key={p.policy_id}
                className="p-4 rounded-xl border border-white/10 bg-white/5 dark:bg-black/20 hover:bg-white/10 transition-colors"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-lg">{p.type_name} Insurance</h3>
                    <p className="text-sm text-muted-foreground">Policy #EV-{p.policy_id}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium border ${statusColor[p.status] ?? "bg-gray-500/10"}`}>
                    {p.status}
                  </span>
                </div>
                <div className="mt-4 flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    Premium: ₹{p.premium_amount.toLocaleString()}
                  </span>
                  <Link href={`/customer/policies/${p.policy_id}`} className="text-primary font-medium hover:underline">
                    View details →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Claims */}
        <div className="glass-card p-6 border-t-4 border-t-secondary">
          <div className="flex items-center gap-3 mb-6">
            <Clock className="w-6 h-6 text-secondary" />
            <h2 className="text-2xl font-semibold">Recent Claims</h2>
          </div>
          <div className="space-y-4">
            {claims.length === 0 && (
              <p className="text-muted-foreground text-sm">No claims filed yet.</p>
            )}
            {claims.slice(0, 4).map((c) => (
              <div
                key={c.claim_id}
                className="p-4 rounded-xl border border-white/10 bg-white/5 dark:bg-black/20 hover:bg-white/10 transition-colors"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-lg">{c.policy_type} Claim</h3>
                    <p className="text-sm text-muted-foreground">Claim #CLM-{c.claim_id}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium border ${statusColor[c.status] ?? "bg-gray-500/10"}`}>
                    {c.status}
                  </span>
                </div>
                <div className="mt-4 pt-4 border-t border-white/10 flex justify-between text-sm text-muted-foreground">
                  <span>Incident: {new Date(c.incident_date).toLocaleDateString()}</span>
                  <span className="font-medium text-foreground">₹{c.claim_amount.toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
