"use client";

import { useAuth } from "@/context/AuthContext";
import { useState, useEffect } from "react";
import Link from "next/link";
import { FileText, Loader2, AlertCircle, ArrowLeft, Download, Phone, Mail } from "lucide-react";
import { useToast } from "@/components/Toast";
import { useParams } from "next/navigation";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

interface Policy {
  policy_id: number;
  customer_id: number;
  customer_name: string;
  type_id: number;
  type_name: string;
  agent_id: number;
  agent_name: string;
  agent_email: string;
  agent_phone: string;
  start_date: string;
  end_date: string;
  status: string;
  premium_amount: number;
  created_at: string;
}

const statusColor: Record<string, string> = {
  Active: "bg-green-500/10 text-green-600 dark:text-green-400",
  Expired: "bg-gray-500/10 text-gray-500",
  Cancelled: "bg-red-500/10 text-red-500",
  Pending: "bg-yellow-500/10 text-yellow-600",
};

export default function PolicyDetailPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const params = useParams();
  const policyId = params?.id as string;

  const [policy, setPolicy] = useState<Policy | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!policyId) return;

    const fetchData = async () => {
      try {
        const res = await fetch(`${API}/policies/${policyId}`);
        if (!res.ok) throw new Error("Policy not found");

        const json = await res.json();
        setPolicy(json.data);
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : "Unknown error";
        setError(message);
        toast("Could not load policy details.", "error");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [policyId, toast]);

  const handleDownloadPDF = () => {
    if (!policy) return;
    toast("PDF download feature coming soon.", "info");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-40 gap-3 text-muted-foreground">
        <Loader2 className="w-6 h-6 animate-spin" />
        <span>Loading policy details...</span>
      </div>
    );
  }

  if (error || !policy) {
    return (
      <div className="flex flex-col items-center justify-center py-40 gap-2 text-red-500">
        <AlertCircle className="w-8 h-8" />
        <p className="font-medium">Error Loading Policy</p>
        <p className="text-sm text-muted-foreground">{error}</p>
        <Link href="/customer/policies" className="mt-4 text-primary hover:underline">
          Back to All Policies
        </Link>
      </div>
    );
  }

  const today = new Date();
  const startDate = new Date(policy.start_date);
  const endDate = new Date(policy.end_date);
  const daysRemaining = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  const percentComplete = Math.max(0, Math.min(100, ((totalDays - daysRemaining) / totalDays) * 100));

  return (
    <div className="space-y-8 animate-slide-up pb-20">
      <div className="flex items-center gap-3">
        <Link href="/customer/policies" className="text-primary hover:underline">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-4xl font-bold tracking-tight">{policy.type_name} Insurance Policy</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="p-8 rounded-2xl border border-border bg-gradient-to-br from-background to-background/50 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-primary/5 rounded-full -mr-20 -mt-20" />

            <div className="flex justify-between items-start mb-8 relative">
              <div>
                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest mb-2">
                  Policy Number
                </p>
                <p className="text-3xl font-bold">EV-{policy.policy_id}</p>
              </div>
              <span
                className={`px-4 py-2 rounded-lg text-sm font-bold ${statusColor[policy.status] ?? "bg-gray-500/10"}`}
              >
                {policy.status}
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-6 relative">
              <div>
                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest mb-2">
                  Coverage Start
                </p>
                <p className="text-lg font-semibold">{startDate.toLocaleDateString()}</p>
              </div>

              <div>
                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest mb-2">
                  Coverage End
                </p>
                <p className="text-lg font-semibold">{endDate.toLocaleDateString()}</p>
              </div>

              <div>
                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest mb-2">
                  Days Remaining
                </p>
                <p className="text-lg font-semibold text-primary">
                  {daysRemaining > 0 ? daysRemaining : "Expired"}
                </p>
              </div>

              <div>
                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest mb-2">
                  Annual Premium
                </p>
                <p className="text-2xl font-bold text-primary">₹{policy.premium_amount.toLocaleString()}</p>
              </div>

              <div>
                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest mb-2">
                  Created Date
                </p>
                <p className="text-lg font-semibold">{new Date(policy.created_at).toLocaleDateString()}</p>
              </div>
            </div>

            {policy.status === "Active" && daysRemaining > 0 && (
              <div className="mt-8 pt-6 border-t border-border">
                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest mb-2">
                  Coverage Progress
                </p>
                <div className="flex items-center gap-4">
                  <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-primary h-full transition-all duration-300"
                      style={{ width: `${percentComplete}%` }}
                    />
                  </div>
                  <span className="text-sm font-semibold text-muted-foreground min-w-fit">{Math.round(percentComplete)}%</span>
                </div>
              </div>
            )}
          </div>

          <button
            onClick={handleDownloadPDF}
            className="w-full px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all flex items-center justify-center gap-2 font-medium"
          >
            <Download className="w-5 h-5" />
            Download Policy Document
          </button>
        </div>

        <div className="space-y-6">
          <div className="p-6 rounded-2xl border border-border bg-background hover:shadow-lg transition-shadow">
            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest mb-4">
              Your Agent
            </p>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Name</p>
                <p className="font-bold text-lg">{policy.agent_name}</p>
              </div>

              <a
                href={`mailto:${policy.agent_email}`}
                className="flex items-center gap-2 text-sm text-primary hover:underline"
              >
                <Mail className="w-4 h-4" />
                {policy.agent_email}
              </a>

              <a
                href={`tel:${policy.agent_phone}`}
                className="flex items-center gap-2 text-sm text-primary hover:underline"
              >
                <Phone className="w-4 h-4" />
                {policy.agent_phone}
              </a>

              <button className="w-full mt-4 px-4 py-2 border border-primary text-primary rounded-lg hover:bg-primary/10 transition-all font-medium text-sm">
                Contact Agent
              </button>
            </div>
          </div>

          <div className="p-6 rounded-2xl border border-border bg-background">
            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest mb-4">
              Quick Actions
            </p>
            <div className="space-y-2">
              <button className="w-full px-4 py-2 text-sm font-medium border border-border rounded-lg hover:bg-background/80 transition-all">
                File a Claim
              </button>
              <button className="w-full px-4 py-2 text-sm font-medium border border-border rounded-lg hover:bg-background/80 transition-all">
                Renew Policy
              </button>
              <button className="w-full px-4 py-2 text-sm font-medium border border-border rounded-lg hover:bg-background/80 transition-all">
                Request Changes
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
