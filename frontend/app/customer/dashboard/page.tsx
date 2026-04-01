"use client";

import { useAuth } from "@/context/AuthContext";
import { useState, useEffect } from "react";
import Link from "next/link";
import { FileText, Clock, AlertCircle, Loader2 } from "lucide-react";
import { useToast } from "@/components/Toast";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

interface Policy {
  policy_id: number;
  type_name: string;
  status: string;
  premium_amount: number;
  end_date: string;
}

interface Nominee {
  nom_id: number;
  nominee_name: string;
  relation: string;
  share_percent: number;
  policy_type: string;
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

export default function CustomerDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [nominees, setNominees] = useState<Nominee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const customerId = user?.customer_id;

  useEffect(() => {
    if (!user) return;

    const fetchId = customerId ?? 1;

    const fetchData = async () => {
      try {
        const [pRes, cRes, nRes] = await Promise.all([
          fetch(`${API}/policies/?customer_id=${fetchId}`),
          fetch(`${API}/claims/?customer_id=${fetchId}`),
          fetch(`${API}/policies/nominees/all?customer_id=${fetchId}`),
        ]);

        if (!pRes.ok || !cRes.ok || !nRes.ok) throw new Error("Failed to load data from server.");

        const pJson = await pRes.json();
        const cJson = await cRes.json();
        const nJson = await nRes.json();

        setPolicies(pJson.data ?? []);
        setClaims(cJson.data ?? []);
        setNominees(nJson.data ?? []);
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : "Unknown error";
        setError(message);
        toast("Could not load your portfolio. Please check that the server is running.", "error");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, customerId, toast]);

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
    <div className="space-y-8 animate-fade-in pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Customer Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Welcome back, {user?.name}. Here&apos;s an overview of your active insurance portfolio.
          </p>
        </div>
        <Link
          href="/customer/claims/new"
          className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-3 rounded-full font-bold transition-all shadow-xl shadow-primary/25 flex items-center justify-center gap-2 hover:scale-105"
        >
          <AlertCircle className="w-5 h-5" /> Report Incident
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Left Column: Policies & Claims */}
        <div className="lg:col-span-2 space-y-8">

          {/* Policies */}
          <div className="glass-card p-6 border-t-4 border-t-primary shadow-xl shadow-primary/5">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-primary/10 rounded-xl">
                <FileText className="w-6 h-6 text-primary" />
              </div>
              <h2 className="text-2xl font-bold text-foreground">Active Policies</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {policies.length === 0 && (
                <p className="text-muted-foreground text-sm py-10 text-center col-span-full">No active policies found.</p>
              )}
              {policies.map((p) => (
                <div
                  key={p.policy_id}
                  className="p-5 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all group"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-lg group-hover:text-primary transition-colors">{p.type_name} Insurance</h3>
                      <p className="text-xs text-muted-foreground font-mono">ID: EV-{p.policy_id}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wider ${statusColor[p.status] ?? "bg-gray-500/10"}`}>
                      {p.status}
                    </span>
                  </div>
                  <div className="mt-6 flex justify-between items-end">
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Premium</p>
                      <p className="text-xl font-bold text-foreground">₹{p.premium_amount.toLocaleString()}</p>
                    </div>
                    <Link href={`/customer/policies/${p.policy_id}`} className="p-2 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors">
                      <FileText className="w-5 h-5" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Claims */}
          <div className="glass-card p-6 border-t-4 border-t-secondary shadow-xl shadow-secondary/5">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-secondary/10 rounded-xl">
                <Clock className="w-6 h-6 text-secondary" />
              </div>
              <h2 className="text-2xl font-bold">Recent Claims</h2>
            </div>
            <div className="space-y-4">
              {claims.length === 0 && (
                <p className="text-muted-foreground text-sm text-center py-10">No insurance claims filed yet.</p>
              )}
              {claims.slice(0, 3).map((c) => (
                <div
                  key={c.claim_id}
                  className="p-4 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 transition-colors flex items-center justify-between"
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-lg ${c.status === 'Approved' ? 'bg-green-500/20' : c.status === 'Rejected' ? 'bg-red-500/20' : 'bg-yellow-500/20'}`}>
                      <AlertCircle className={`w-5 h-5 ${c.status === 'Approved' ? 'text-green-500' : c.status === 'Rejected' ? 'text-red-500' : 'text-yellow-500'}`} />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm">{c.policy_type} Claim</h3>
                      <p className="text-xs text-muted-foreground">#CLM-{c.claim_id} • {new Date(c.incident_date).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">₹{c.claim_amount.toLocaleString()}</p>
                    <p className={`text-[10px] font-bold uppercase tracking-tighter ${c.status === 'Approved' ? 'text-green-500' : c.status === 'Rejected' ? 'text-red-500' : 'text-yellow-500'}`}>
                      {c.status}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Nominees & Payments */}
        <div className="space-y-8">

          {/* Nominees Section */}
          <div className="glass-card p-6 border-t-4 border-t-purple-500 shadow-xl shadow-purple-500/5">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-purple-500/10 rounded-xl">
                <Users className="w-6 h-6 text-purple-500" />
              </div>
              <h2 className="text-xl font-bold">My Beneficiaries</h2>
            </div>

            <div className="space-y-4">
              {nominees.length === 0 ? (
                <p className="text-muted-foreground text-xs text-center py-6 border border-dashed border-white/10 rounded-xl">
                  No nominees assigned to your policies.
                </p>
              ) : (
                nominees.map((n) => (
                  <div key={n.nom_id} className="p-4 rounded-xl bg-purple-500/[0.03] border border-purple-500/10">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-bold text-sm text-foreground">{n.nominee_name}</span>
                      <span className="text-[10px] bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded-full font-bold">
                        {n.share_percent}% Share
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">{n.relation} • {n.policy_type} Policy</p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Quick Pay / Billing */}
          <div className="glass-card p-6 bg-gradient-to-br from-primary/5 to-secondary/5 border-2 border-primary/20">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-primary" />
              Premium Billing
            </h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-background/50 rounded-xl border border-white/5">
                <span className="text-sm font-medium">Next Due</span>
                <span className="text-sm font-bold text-primary">15 Apr 2026</span>
              </div>
              <button
                onClick={() => toast("Redirecting to EnsureVault Payment Gateway...", "info")}
                className="w-full py-3 bg-primary text-white rounded-xl font-bold text-sm shadow-lg shadow-primary/30 hover:shadow-primary/50 transition-all active:scale-95"
              >
                Make a Payment
              </button>
              <p className="text-[10px] text-center text-muted-foreground opacity-70">
                Secure PCI-DSS Compliant Payments via EnsureVault Pay
              </p>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}

import { CreditCard, Users } from "lucide-react";
