"use client";

import { useAuth } from "@/context/AuthContext";
import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, AlertCircle, FileText } from "lucide-react";
import { useToast } from "@/components/Toast";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

interface Claim {
  claim_id: number;
  policy_type: string;
  claim_amount: number;
  status: string;
  incident_date: string;
  description?: string;
}

const statusColor: Record<string, string> = {
  "Under Review": "bg-blue-500/10 text-blue-500 border-blue-500/20",
  Approved: "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20",
  Rejected: "bg-red-500/10 text-red-500 border-red-500/20",
  Pending: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20",
  Paid: "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20",
};

export default function ClaimsHistoryPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const customerId = user?.customer_id;

  useEffect(() => {
    if (!user) return;

    const fetchId = customerId ?? 1;

    const fetchClaims = async () => {
      try {
        const res = await fetch(`${API}/claims/?customer_id=${fetchId}`);
        if (!res.ok) throw new Error("Failed to load claims");

        const json = await res.json();
        setClaims(json.data ?? []);
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : "Unknown error";
        setError(message);
        toast("Could not load your claims. Please try again.", "error");
      } finally {
        setLoading(false);
      }
    };

    fetchClaims();
  }, [user, customerId, toast]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-40 gap-3 text-muted-foreground">
        <Loader2 className="w-6 h-6 animate-spin" />
        <span>Loading claims history...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-40 gap-2 text-red-500">
        <AlertCircle className="w-8 h-8" />
        <p className="font-medium">Could not load claims</p>
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b">
        <div className="max-w-6xl mx-auto px-6 py-6">
          <div className="flex items-center gap-3 mb-2">
            <Link
              href="/customer/dashboard"
              className="text-accent hover:underline flex items-center gap-1"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Link>
          </div>
          <h1 className="text-3xl font-bold">Claims History</h1>
          <p className="text-muted-foreground mt-2">
            View all your filed insurance claims and their status
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        {claims.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground">
            <FileText className="w-12 h-12 opacity-50" />
            <p className="font-medium">No claims found</p>
            <p className="text-sm">You haven't filed any claims yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {claims.map((claim) => (
              <div
                key={claim.claim_id}
                className="border rounded-lg p-6 hover:bg-accent/5 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <FileText className="w-5 h-5 text-accent" />
                      <h3 className="text-lg font-semibold">{claim.policy_type} Claim</h3>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">
                      Claim ID: #{claim.claim_id}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Incident Date: {new Date(claim.incident_date).toLocaleDateString()}
                    </p>
                    {claim.description && (
                      <p className="text-sm text-muted-foreground mt-2">{claim.description}</p>
                    )}
                  </div>

                  <div className="text-right">
                    <p className="text-2xl font-bold text-accent mb-3">
                      ₹{claim.claim_amount.toLocaleString()}
                    </p>
                    <div
                      className={`inline-block px-3 py-1 rounded-full text-sm font-medium border ${
                        statusColor[claim.status] ||
                        "bg-gray-500/10 text-gray-500 border-gray-500/20"
                      }`}
                    >
                      {claim.status}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
