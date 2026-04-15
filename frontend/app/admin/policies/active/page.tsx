"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { FileText, Loader2, AlertCircle, ArrowLeft, Filter } from "lucide-react";
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
  created_at: string;
}

export default function ActivePoliciesPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [policies, setPolicies] = useState<Policy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      try {
        const res = await fetch(`${API}/policies/?status=Active`);
        if (!res.ok) throw new Error("Failed to load policies");

        const json = await res.json();
        setPolicies(json.data ?? []);
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : "Unknown error";
        setError(message);
        toast("Could not load active policies.", "error");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, toast]);

  const insuranceTypes = Array.from(new Set(policies.map(p => p.type_name)));
  
  const filteredPolicies = policies.filter(p => {
    const matchType = filterType === "all" || p.type_name === filterType;
    const matchSearch = 
      searchTerm === "" ||
      p.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.agent_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.policy_id.toString().includes(searchTerm);
    return matchType && matchSearch;
  });

  const totalPremium = filteredPolicies.reduce((sum, p) => sum + p.premium_amount, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-40 gap-3 text-muted-foreground">
        <Loader2 className="w-6 h-6 animate-spin" />
        <span>Loading active policies...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-40 gap-2 text-red-500">
        <AlertCircle className="w-8 h-8" />
        <p className="font-medium">Error Loading Policies</p>
        <p className="text-sm text-muted-foreground">{error}</p>
        <Link href="/admin/dashboard" className="mt-4 text-primary hover:underline">
          Back to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-slide-up pb-20">
      <div className="flex items-center gap-3">
        <Link href="/admin/dashboard" className="text-primary hover:underline">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-4xl font-bold tracking-tight">Active Policies</h1>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-xl border border-border bg-background">
          <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest mb-2">
            Total Active Policies
          </p>
          <p className="text-3xl font-bold">{filteredPolicies.length}</p>
        </div>
        <div className="p-6 rounded-xl border border-border bg-background">
          <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest mb-2">
            Total Premium Value
          </p>
          <p className="text-3xl font-bold text-primary">₹{totalPremium.toLocaleString()}</p>
        </div>
        <div className="p-6 rounded-xl border border-border bg-background">
          <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest mb-2">
            Insurance Types
          </p>
          <p className="text-3xl font-bold">{insuranceTypes.length}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 p-6 rounded-xl border border-border bg-background/50">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search by customer, agent, or policy ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div className="flex gap-2">
          <Filter className="w-5 h-5 text-muted-foreground" />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="all">All Types</option>
            {insuranceTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Policies Table */}
      {filteredPolicies.length === 0 ? (
        <div className="py-20 text-center border-2 border-dashed border-border rounded-2xl">
          <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground text-lg">No policies found.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-background/50 border-b border-border">
                <tr>
                  <th className="px-6 py-4 text-left font-semibold">Policy ID</th>
                  <th className="px-6 py-4 text-left font-semibold">Customer</th>
                  <th className="px-6 py-4 text-left font-semibold">Type</th>
                  <th className="px-6 py-4 text-left font-semibold">Agent</th>
                  <th className="px-6 py-4 text-left font-semibold">Start Date</th>
                  <th className="px-6 py-4 text-left font-semibold">End Date</th>
                  <th className="px-6 py-4 text-right font-semibold">Premium</th>
                  <th className="px-6 py-4 text-center font-semibold">Days Left</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredPolicies.map((policy) => {
                  const today = new Date();
                  const endDate = new Date(policy.end_date);
                  const daysLeft = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                  const isExpiring = daysLeft < 30 && daysLeft > 0;
                  const isExpired = daysLeft <= 0;

                  return (
                    <tr
                      key={policy.policy_id}
                      className="hover:bg-background/50 transition-colors cursor-pointer group"
                    >
                      <td className="px-6 py-4 font-mono font-bold text-primary">
                        EV-{policy.policy_id}
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-semibold">{policy.customer_name}</p>
                          <p className="text-[10px] text-muted-foreground">ID: {policy.customer_id}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 bg-primary/10 text-primary rounded text-xs font-semibold">
                          {policy.type_name}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-semibold">{policy.agent_name}</p>
                          <p className="text-[10px] text-muted-foreground">ID: {policy.agent_id}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs">
                        {new Date(policy.start_date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-xs">
                        {new Date(policy.end_date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right font-bold">
                        ₹{policy.premium_amount.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span
                          className={`px-2 py-1 rounded text-xs font-bold ${
                            isExpired
                              ? "bg-red-500/10 text-red-600"
                              : isExpiring
                              ? "bg-yellow-500/10 text-yellow-600"
                              : "bg-green-500/10 text-green-600"
                          }`}
                        >
                          {isExpired ? "Expired" : `${daysLeft}d`}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
