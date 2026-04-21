"use client";

import { useAuth } from "@/context/AuthContext";
import { useState, useEffect } from "react";
import Link from "next/link";
import { FileText, Loader2, AlertCircle, ArrowLeft } from "lucide-react";
import { useToast } from "@/components/Toast";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

interface Policy {
  policy_id: number;
  customer_id: number;
  customer_name: string;
  type_id: number;
  type_name: string;
  agent_id: number;
  agent_name: string;
  start_date: string;
  end_date: string;
  status: string;
  premium_amount: number;
}

const statusColor: Record<string, string> = {
  Active: "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20",
  Expired: "bg-gray-500/10 text-gray-500 border-gray-500/20",
  Cancelled: "bg-red-500/10 text-red-500 border-red-500/20",
  Pending: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20",
};

export default function PoliciesPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [policies, setPolicies] = useState<Policy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const customerId = user?.customer_id;

  useEffect(() => {
    if (!user) return;

    const fetchId = customerId ?? 1;

    const fetchData = async () => {
      try {
        const res = await fetch(`${API}/policies/?customer_id=${fetchId}`);
        if (!res.ok) throw new Error("Failed to load policies");

        const json = await res.json();
        setPolicies(json.data ?? []);
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : "Unknown error";
        setError(message);
        toast("Could not load your policies. Please refresh.", "error");
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
        <span>Loading your policies...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-40 gap-2 text-red-500">
        <AlertCircle className="w-8 h-8" />
        <p className="font-medium">Error Loading Policies</p>
        <p className="text-sm text-muted-foreground">{error}</p>
        <Link href="/customer/dashboard" className="mt-4 text-primary hover:underline">
          Back to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-slide-up pb-20">
      <div className="flex items-center gap-3">
        <Link href="/customer/dashboard" className="text-primary hover:underline">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-4xl font-bold tracking-tight">All Policies</h1>
      </div>

      {policies.length === 0 ? (
        <div className="py-20 text-center border-2 border-dashed border-border rounded-2xl">
          <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground text-lg">No policies found.</p>
          <Link
            href="/customer/policies/request"
            className="mt-4 inline-block px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition"
          >
            Request Your First Policy
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {policies.map((policy) => (
            <Link
              key={policy.policy_id}
              href={`/customer/policies/${policy.policy_id}`}
              className="group"
            >
              <div className="p-6 rounded-xl border border-border bg-background hover:bg-background/80 transition-all hover:shadow-lg cursor-pointer relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full -mr-12 -mt-12 transition-transform group-hover:scale-150 duration-500" />

                <div className="flex justify-between items-start relative mb-4">
                  <div>
                    <h3 className="font-bold text-xl">{policy.type_name} Insurance</h3>
                    <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-widest mt-1">
                      ID: EV-{policy.policy_id}
                    </p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-md text-[10px] font-bold border whitespace-nowrap ${
                      statusColor[policy.status] ?? "bg-gray-500/10"
                    }`}
                  >
                    {policy.status}
                  </span>
                </div>

                <div className="space-y-3 relative">
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">
                      Agent
                    </p>
                    <p className="text-sm font-semibold">{policy.agent_name}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">
                        Coverage Start
                      </p>
                      <p className="text-sm font-semibold">{new Date(policy.start_date).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">
                        Coverage End
                      </p>
                      <p className="text-sm font-semibold">{new Date(policy.end_date).toLocaleDateString()}</p>
                    </div>
                  </div>

                  <div className="border-t border-border pt-4 flex justify-between items-center">
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">
                        Annual Premium
                      </p>
                      <p className="text-2xl font-bold text-primary">₹{policy.premium_amount.toLocaleString()}</p>
                    </div>
                    <FileText className="w-8 h-8 text-primary/20 group-hover:text-primary/50 transition" />
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
