"use client";

import { useAuth } from "@/context/AuthContext";
import { useState, useEffect } from "react";
import Link from "next/link";
import { FileText, Clock, AlertCircle, Loader2, X, CreditCard, Lock, CheckCircle, Users } from "lucide-react";
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
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

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

  const handlePayment = async () => {
    setPaymentProcessing(true);
    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 2000));
    setPaymentProcessing(false);
    setPaymentSuccess(true);
    toast("Payment processed successfully!", "success");
    setTimeout(() => {
      setShowPaymentModal(false);
      setPaymentSuccess(false);
    }, 2000);
  };

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
    <div className="space-y-8 animate-premium-fade pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">Customer Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Welcome back, <span className="text-foreground font-semibold">{user?.name}</span>. Here&apos;s an overview of your insurance portfolio.
          </p>
        </div>
        <Link
          href="/customer/claims/new"
          className="btn-primary flex items-center gap-2 shadow-lg shadow-primary/20 hover:-translate-y-0.5"
        >
          <AlertCircle className="w-5 h-5" /> Report Incident
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Left Column: Policies & Claims */}
        <div className="lg:col-span-2 space-y-8">

          {/* Policies */}
          <div className="glass-card p-6 border-l-4 border-l-primary">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-primary/10 rounded-lg">
                  <FileText className="w-6 h-6 text-primary" />
                </div>
                <h2 className="text-2xl font-bold">Active Policies</h2>
              </div>
              <Link href="/customer/policies" className="text-sm font-medium text-primary hover:underline">View All</Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {policies.length === 0 && (
                <div className="col-span-full py-12 text-center border-2 border-dashed border-border rounded-2xl">
                  <p className="text-muted-foreground">No active policies found.</p>
                </div>
              )}
              {policies.map((p) => (
                <div
                  key={p.policy_id}
                  className="p-5 rounded-2xl border border-border/50 bg-background/40 hover:bg-background/80 transition-all group relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full -mr-12 -mt-12 transition-transform group-hover:scale-150 duration-500" />

                  <div className="flex justify-between items-start relative">
                    <div>
                      <h3 className="font-bold text-lg">{p.type_name} Insurance</h3>
                      <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-widest mt-1">ID: EV-{p.policy_id}</p>
                    </div>
                    <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold border ${statusColor[p.status] ?? "bg-gray-500/10"}`}>
                      {p.status}
                    </span>
                  </div>

                  <div className="mt-8 flex justify-between items-end relative">
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Annual Premium</p>
                      <p className="text-2xl font-bold text-foreground">₹{p.premium_amount.toLocaleString()}</p>
                    </div>
                    <Link href={`/customer/policies/${p.policy_id}`} className="p-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-all shadow-md">
                      <FileText className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Claims */}
          <div className="glass-card p-6 border-l-4 border-l-accent">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-accent/10 rounded-lg">
                  <Clock className="w-6 h-6 text-accent" />
                </div>
                <h2 className="text-2xl font-bold">Recent Claims</h2>
              </div>
              <Link href="/customer/claims" className="text-sm font-medium text-accent hover:underline">History</Link>
            </div>
            <div className="space-y-4">
              {claims.length === 0 && (
                <div className="py-12 text-center border-2 border-dashed border-border rounded-2xl">
                  <p className="text-muted-foreground text-sm">No insurance claims filed yet.</p>
                </div>
              )}
              {claims.slice(0, 3).map((c) => (
                <div
                  key={c.claim_id}
                  className="p-4 rounded-xl border border-border/50 bg-background/40 hover:bg-background/60 transition-colors flex items-center justify-between group"
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-2.5 rounded-lg transition-transform group-hover:scale-110 ${c.status === 'Approved' ? 'bg-green-500/20' : c.status === 'Rejected' ? 'bg-red-500/20' : 'bg-yellow-500/20'}`}>
                      <AlertCircle className={`w-5 h-5 ${c.status === 'Approved' ? 'text-green-500' : c.status === 'Rejected' ? 'text-red-500' : 'text-yellow-500'}`} />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm">{c.policy_type} Claim</h3>
                      <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-widest mt-0.5">#CLM-{c.claim_id} • {new Date(c.incident_date).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-base">₹{c.claim_amount.toLocaleString()}</p>
                    <div className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded border inline-block mt-1 ${c.status === 'Approved' ? 'bg-green-500/10 text-green-500 border-green-500/20' :
                        c.status === 'Rejected' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                          'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
                      }`}>
                      {c.status}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Nominees & Payments */}
        <div className="space-y-8">

          {/* Nominees Section */}
          <div className="glass-card p-6 border-l-4 border-l-purple-500">
            <div className="flex items-center gap-3 mb-8">
              <div className="p-2.5 bg-purple-500/10 rounded-lg">
                <Users className="w-6 h-6 text-purple-500" />
              </div>
              <h2 className="text-xl font-bold">Beneficiaries</h2>
            </div>

            <div className="space-y-4">
              {nominees.length === 0 ? (
                <p className="text-muted-foreground text-xs text-center py-10 border border-dashed border-border rounded-xl">
                  No nominees assigned.
                </p>
              ) : (
                nominees.map((n) => (
                  <div key={n.nom_id} className="p-4 rounded-xl bg-purple-500/[0.03] border border-purple-500/10 hover:bg-purple-500/[0.06] transition-colors">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-bold text-sm text-foreground">{n.nominee_name}</span>
                      <span className="text-[10px] bg-purple-500/10 text-purple-600 dark:text-purple-400 px-2 py-0.5 rounded font-bold border border-purple-500/20">
                        {n.share_percent}%
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground">{n.relation} • {n.policy_type}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Quick Pay / Billing */}
          <div className="glass-card p-6 bg-gradient-to-br from-primary/10 to-accent/5 border border-primary/20">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-primary" />
              Premium Billing
            </h2>
            <div className="space-y-6">
              <div className="flex justify-between items-center p-4 bg-background/60 rounded-xl border border-border/50">
                <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Next Due</span>
                <span className="text-sm font-bold text-primary">15 Apr 2026</span>
              </div>
              <button
                onClick={() => setShowPaymentModal(true)}
                className="btn-primary w-full shadow-xl shadow-primary/20"
              >
                Make a Payment
              </button>
              <div className="pt-2 border-t border-border/50 mt-4">
                <p className="text-[9px] text-center text-muted-foreground font-medium uppercase tracking-tighter opacity-80">
                  Secure PCI-DSS Compliant Payments
                </p>
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-card border border-border rounded-lg shadow-2xl w-full max-w-md mx-4 animate-slide-up">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-border">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <CreditCard className="w-5 h-5 text-primary" />
                </div>
                <h2 className="text-xl font-bold text-foreground">Premium Payment</h2>
              </div>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="p-1 hover:bg-muted rounded-md transition-colors"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6">
              {!paymentSuccess ? (
                <>
                  {/* Payment Amount */}
                  <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                    <p className="text-sm text-muted-foreground mb-1">Amount Due</p>
                    <p className="text-3xl font-bold text-primary">₹{(policies.reduce((sum, p) => sum + p.premium_amount, 0)).toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground mt-1">Due Date: 15 Apr 2026</p>
                  </div>

                  {/* Payment Method */}
                  <div className="space-y-3">
                    <label className="block text-sm font-semibold text-foreground">Payment Method</label>
                    <div className="space-y-2">
                      <button className="w-full flex items-center gap-3 p-4 border-2 border-primary bg-primary/5 rounded-lg hover:bg-primary/10 transition-colors">
                        <CreditCard className="w-5 h-5 text-primary" />
                        <div className="text-left flex-1">
                          <p className="font-semibold text-foreground">Credit/Debit Card</p>
                          <p className="text-xs text-muted-foreground">Visa, Mastercard, RuPay</p>
                        </div>
                      </button>
                      <button className="w-full flex items-center gap-3 p-4 border border-border rounded-lg hover:bg-muted transition-colors opacity-50 cursor-not-allowed">
                        <div className="w-5 h-5 bg-muted-foreground/20 rounded" />
                        <div className="text-left flex-1">
                          <p className="font-semibold text-muted-foreground">UPI Payment</p>
                          <p className="text-xs text-muted-foreground">Coming Soon</p>
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Card Details */}
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-foreground">Card Number</label>
                      <input
                        type="text"
                        placeholder="1234 5678 9012 3456"
                        className="form-input"
                        maxLength={19}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-foreground">Expiry Date</label>
                        <input
                          type="text"
                          placeholder="MM/YY"
                          className="form-input"
                          maxLength={5}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-foreground">CVV</label>
                        <input
                          type="password"
                          placeholder="123"
                          className="form-input"
                          maxLength={3}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Security Notice */}
                  <div className="flex items-start gap-2 p-3 bg-accent/5 border border-accent/20 rounded-lg">
                    <Lock className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-muted-foreground">
                      Your payment is secured with 256-bit SSL encryption. We never store your card details.
                    </p>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowPaymentModal(false)}
                      className="btn-outline flex-1"
                      disabled={paymentProcessing}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handlePayment}
                      disabled={paymentProcessing}
                      className="btn-primary flex-1 flex items-center justify-center gap-2"
                    >
                      {paymentProcessing ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <Lock className="w-4 h-4" />
                          Pay Now
                        </>
                      )}
                    </button>
                  </div>
                </>
              ) : (
                <div className="text-center py-8 space-y-4">
                  <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle className="w-8 h-8 text-accent" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-foreground mb-2">Payment Successful!</h3>
                    <p className="text-sm text-muted-foreground">Your premium payment has been processed successfully.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
