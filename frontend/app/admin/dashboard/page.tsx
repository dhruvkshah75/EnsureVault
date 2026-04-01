"use client";

import { useAuth } from "@/context/AuthContext";
import { useState, useEffect } from "react";
import {
    TrendingUp,
    ShieldCheck,
    Users,
    CreditCard,
    ArrowUpRight,
    ArrowDownRight,
    TrendingDown,
    Loader2,
    AlertCircle,
    Trophy,
    Activity
} from "lucide-react";
import { useToast } from "@/components/Toast";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

interface KPI {
    total_revenue: number;
    active_policies: number;
    total_payouts: number;
    approved_claims_count: number;
    rejected_claims_count: number;
    reserve_balance: number;
}

interface LeaderboardEntry {
    agent_id: number;
    agent_name: string;
    region: string;
    total_policies_sold: number;
    total_premium_value: number;
    total_commission_earned: number;
}

export default function AdminDashboard() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [data, setData] = useState<{ kpis: KPI; leaderboard: LeaderboardEntry[] } | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await fetch(`${API}/admin/dashboard`);
                if (!res.ok) throw new Error("Could not fetch admin metrics.");
                const json = await res.json();
                setData(json.data);
            } catch (e: unknown) {
                const message = e instanceof Error ? e.message : "Dashboard failed to load";
                setError(message);
                toast(message, "error");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [toast]);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-40 gap-3 text-muted-foreground">
                <Loader2 className="w-6 h-6 animate-spin" />
                <span>Loading system analytics...</span>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="flex flex-col items-center justify-center py-40 gap-2 text-red-500">
                <AlertCircle className="w-8 h-8" />
                <p className="font-medium">Admin Access Restricted or Server Offline</p>
                <p className="text-sm text-muted-foreground">{error}</p>
            </div>
        );
    }

    const kpis = data.kpis;

    return (
        <div className="space-y-8 animate-fade-in pb-20">
            <div>
                <h1 className="text-4xl font-bold tracking-tight">System Overview</h1>
                <p className="text-muted-foreground mt-2">
                    Real-time performance metrics and workforce analytics for EnsureVault.
                </p>
            </div>

            {/* Main KPI Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

                {/* Total Revenue */}
                <div className="glass-card p-6 border-l-4 border-l-green-500 shadow-xl shadow-green-500/5 hover:bg-white/5 transition-colors">
                    <div className="flex justify-between items-start">
                        <div className="p-2 bg-green-500/10 rounded-lg">
                            <TrendingUp className="w-6 h-6 text-green-500" />
                        </div>
                        <span className="flex items-center text-[10px] font-bold text-green-500 bg-green-500/10 px-2 py-0.5 rounded-full">
                            <ArrowUpRight className="w-3 h-3 mr-1" /> ONLINE
                        </span>
                    </div>
                    <div className="mt-4">
                        <p className="text-sm font-medium text-muted-foreground">Cumulative Revenue</p>
                        <p className="text-3xl font-bold">₹{kpis.total_revenue.toLocaleString()}</p>
                    </div>
                </div>

                {/* Company Reserve */}
                <div className="glass-card p-6 border-l-4 border-l-blue-500 shadow-xl shadow-blue-500/5 hover:bg-white/5 transition-colors">
                    <div className="flex justify-between items-start">
                        <div className="p-2 bg-blue-500/10 rounded-lg">
                            <ShieldCheck className="w-6 h-6 text-blue-500" />
                        </div>
                    </div>
                    <div className="mt-4">
                        <p className="text-sm font-medium text-muted-foreground">Company Reserve</p>
                        <p className="text-3xl font-bold text-blue-500">₹{kpis.reserve_balance.toLocaleString()}</p>
                    </div>
                </div>

                {/* Active Policies */}
                <div className="glass-card p-6 border-l-4 border-l-primary shadow-xl shadow-primary/5 hover:bg-white/5 transition-colors">
                    <div className="flex justify-between items-start">
                        <div className="p-2 bg-primary/10 rounded-lg">
                            <Users className="w-6 h-6 text-primary" />
                        </div>
                    </div>
                    <div className="mt-4">
                        <p className="text-sm font-medium text-muted-foreground">Active Policies</p>
                        <p className="text-3xl font-bold">{kpis.active_policies}</p>
                    </div>
                </div>

                {/* Total Payouts */}
                <div className="glass-card p-6 border-l-4 border-l-red-500 shadow-xl shadow-red-500/5 hover:bg-white/5 transition-colors">
                    <div className="flex justify-between items-start">
                        <div className="p-2 bg-red-500/10 rounded-lg">
                            <TrendingDown className="w-6 h-6 text-red-500" />
                        </div>
                    </div>
                    <div className="mt-4">
                        <p className="text-sm font-medium text-muted-foreground">Claims Payouts</p>
                        <p className="text-3xl font-bold">₹{kpis.total_payouts.toLocaleString()}</p>
                    </div>
                </div>

            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Agent Leaderboard */}
                <div className="lg:col-span-2 glass-card p-0 overflow-hidden shadow-2xl">
                    <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/[0.02]">
                        <div className="flex items-center gap-3">
                            <Trophy className="w-6 h-6 text-yellow-500" />
                            <h2 className="text-xl font-bold text-foreground">Top Performing Agents</h2>
                        </div>
                        <span className="text-xs text-muted-foreground">Ranked by Premium Value</span>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-white/[0.03] text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                    <th className="px-6 py-4">Agent Name</th>
                                    <th className="px-6 py-4 text-center">Policies</th>
                                    <th className="px-6 py-4">Premium Volume</th>
                                    <th className="px-6 py-4">Commission</th>
                                    <th className="px-6 py-4">Region</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {data.leaderboard.map((a, idx) => (
                                    <tr key={a.agent_id} className="hover:bg-white/[0.02] transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <span className={`w-6 h-6 flex items-center justify-center rounded-full text-[10px] font-bold ${idx === 0 ? 'bg-yellow-500/20 text-yellow-500' :
                                                    idx === 1 ? 'bg-gray-400/20 text-gray-400' :
                                                        idx === 2 ? 'bg-orange-500/20 text-orange-500' :
                                                            'bg-white/10 text-muted-foreground'
                                                    }`}>
                                                    {idx + 1}
                                                </span>
                                                <span className="font-semibold group-hover:text-primary transition-colors">{a.agent_name}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center font-mono text-sm">{a.total_policies_sold}</td>
                                        <td className="px-6 py-4 font-bold">₹{a.total_premium_value.toLocaleString()}</td>
                                        <td className="px-6 py-4 text-muted-foreground text-sm">₹{a.total_commission_earned.toLocaleString()}</td>
                                        <td className="px-6 py-4">
                                            <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px]">
                                                {a.region}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Claim Breakdown & Audits */}
                <div className="space-y-6">
                    <div className="glass-card p-6 shadow-xl space-y-6">
                        <h3 className="font-bold text-lg flex items-center gap-2">
                            <Activity className="w-5 h-5 text-accent" />
                            Claim Adjudication Rate
                        </h3>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <div className="flex justify-between text-xs font-medium">
                                    <span>Approved Claims</span>
                                    <span className="text-green-500">{kpis.approved_claims_count}</span>
                                </div>
                                <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-green-500 transition-all duration-1000"
                                        style={{ width: `${(kpis.approved_claims_count / (kpis.approved_claims_count + kpis.rejected_claims_count || 1)) * 100}%` }}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between text-xs font-medium">
                                    <span>Rejected Claims</span>
                                    <span className="text-red-500">{kpis.rejected_claims_count}</span>
                                </div>
                                <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-red-500 transition-all duration-1000"
                                        style={{ width: `${(kpis.rejected_claims_count / (kpis.approved_claims_count + kpis.rejected_claims_count || 1)) * 100}%` }}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="mt-8 pt-6 border-t border-white/10">
                            <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">Quick Actions</h4>
                            <div className="grid grid-cols-2 gap-3">
                                <button onClick={() => window.location.href = '/admin/agents/create'} className="p-3 bg-white/5 border border-white/10 rounded-xl text-[10px] font-bold hover:bg-primary hover:text-white transition-all">
                                    Add Agent
                                </button>
                                <button onClick={() => window.location.href = '/admin/policies/create'} className="p-3 bg-white/5 border border-white/10 rounded-xl text-[10px] font-bold hover:bg-secondary hover:text-white transition-all">
                                    New Policy
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="glass-card p-6 bg-gradient-to-br from-primary/5 to-accent/5 border border-primary/20">
                        <h3 className="text-sm font-bold flex items-center gap-2 mb-2">
                            <ShieldCheck className="w-4 h-4 text-primary" />
                            System Integrity
                        </h3>
                        <p className="text-[10px] text-muted-foreground leading-relaxed">
                            All claim adjudications are wrapped in atomic database transactions. Commissions are calculated via real-time MySQL triggers upon payment validation.
                        </p>
                    </div>
                </div>

            </div>
        </div>
    );
}
