"use client";

import { useAuth } from "@/context/AuthContext";
import { useState, useEffect } from "react";
import { Briefcase, Users, UserPlus, Mail, ShieldCheck, AlertCircle, Loader2 } from "lucide-react";
import { useToast } from "@/components/Toast";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

interface Agent {
    agent_id: number;
    name: string;
    region: string;
    commission_rate: number;
    total_commission_earned: number;
}

interface Customer {
    customer_id: number;
    full_name: string;
    email: string;
    kyc_status: string;
}

export default function AgentDashboard() {
    const { user } = useAuth();
    const { toast } = useToast();

    const [agent, setAgent] = useState<Agent | null>(null);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Onboarding form state
    const [newName, setNewName] = useState("");
    const [newEmail, setNewEmail] = useState("");
    const [onboarding, setOnboarding] = useState(false);

    useEffect(() => {
        if (!user || user.role !== "agent") return;

        const fetchData = async () => {
            try {
                const [aRes, custRes] = await Promise.all([
                    fetch(`${API}/agents/${user.user_id}`),
                    fetch(`${API}/agents/${user.user_id}/customers`)
                ]);

                if (!aRes.ok) throw new Error("Failed to fetch agent profile.");

                const aJson = await aRes.json();
                const custJson = await custRes.json();

                setAgent(aJson.data);
                setCustomers(custJson.data ?? []);
            } catch (e: unknown) {
                const message = e instanceof Error ? e.message : "Unknown error";
                setError(message);
                toast("Could not load your agent dashboard.", "error");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [user, toast]);

    const handleOnboard = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!agent) return;

        setOnboarding(true);
        try {
            const res = await fetch(`${API}/auth/register`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: newName,
                    email: newEmail,
                    agent_id: agent.agent_id
                }),
            });

            const json = await res.json();
            if (!res.ok) throw new Error(json.detail ?? "Onboarding failed.");

            toast("Customer onboarded successfully!", "success");
            setNewName("");
            setNewEmail("");

            // Refresh customer list
            const custRes = await fetch(`${API}/agents/${user!.user_id}/customers`);
            const custJson = await custRes.json();
            setCustomers(custJson.data ?? []);
        } catch (err: unknown) {
            toast(err instanceof Error ? err.message : "Failed to onboard customer", "error");
        } finally {
            setOnboarding(false);
        }
    };

    if (!user || user.role !== "agent") return null;

    if (loading) {
        return (
            <div className="flex items-center justify-center py-40 gap-3 text-muted-foreground">
                <Loader2 className="w-6 h-6 animate-spin" />
                <span>Loading your agent portal...</span>
            </div>
        );
    }

    if (error || !agent) {
        return (
            <div className="flex flex-col items-center justify-center py-40 gap-2 text-red-500">
                <AlertCircle className="w-8 h-8" />
                <p className="font-medium">Could not connect to server</p>
                <p className="text-sm text-muted-foreground">{error}</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-fade-in max-w-6xl mx-auto pb-20">
            {/* Header */}
            <div className="glass-card p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 border-t-4 border-t-accent">
                <div>
                    <h1 className="text-4xl font-bold tracking-tight">Agent Portal</h1>
                    <p className="text-muted-foreground mt-2">
                        Welcome back, {agent.name}. Managing the {agent.region} region.
                    </p>
                </div>
                <div className="flex gap-4">
                    <div className="bg-accent/10 px-6 py-4 rounded-xl border border-accent/20 flex flex-col items-center justify-center min-w-[120px]">
                        <span className="text-xs text-accent font-semibold uppercase tracking-wider mb-1">Commission Rate</span>
                        <span className="text-2xl font-bold text-accent">{agent.commission_rate}%</span>
                    </div>
                    <div className="bg-primary/10 px-6 py-4 rounded-xl border border-primary/20 flex flex-col items-center justify-center min-w-[140px]">
                        <span className="text-xs text-primary font-semibold uppercase tracking-wider mb-1">Total Earned</span>
                        <span className="text-2xl font-bold text-primary">₹{Number(agent.total_commission_earned).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Onboarding Panel */}
                <div className="lg:col-span-2 glass-card p-8 border-t-4 border-t-secondary">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-3 bg-secondary/10 rounded-xl">
                            <UserPlus className="w-6 h-6 text-secondary" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold">Onboard New Customer</h2>
                            <p className="text-sm text-muted-foreground">Register a new client directly to your portfolio.</p>
                        </div>
                    </div>

                    <form onSubmit={handleOnboard} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium ml-1">Full Name</label>
                                <div className="relative">
                                    <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <input
                                        type="text"
                                        required
                                        value={newName}
                                        onChange={(e) => setNewName(e.target.value)}
                                        placeholder="Enter customer's full name"
                                        className="form-input pl-10"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium ml-1">Email Address</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <input
                                        type="email"
                                        required
                                        value={newEmail}
                                        onChange={(e) => setNewEmail(e.target.value)}
                                        placeholder="customer@email.com"
                                        className="form-input pl-10"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="bg-secondary/5 border border-secondary/10 rounded-xl p-4 flex gap-3 items-start">
                            <ShieldCheck className="w-5 h-5 text-secondary mt-0.5 shrink-0" />
                            <p className="text-xs text-muted-foreground leading-relaxed">
                                By onboarding this customer, they will be automatically assigned to your agent ID.
                                Their initial KYC status will be set to <span className="font-bold text-secondary">Pending</span>.
                                They will receive a notification to complete their profile verification.
                            </p>
                        </div>

                        <button
                            type="submit"
                            disabled={onboarding}
                            className="btn-secondary w-full md:w-auto px-10 py-3 flex items-center justify-center gap-2"
                        >
                            {onboarding ? <Loader2 className="w-5 h-5 animate-spin" /> : <UserPlus className="w-5 h-5" />}
                            {onboarding ? "Creating Account..." : "Onboard Customer"}
                        </button>
                    </form>
                </div>

                {/* Customers Panel */}
                <div className="glass-card p-6 border-t-4 border-t-primary h-fit">
                    <div className="flex items-center gap-3 mb-6">
                        <Users className="w-6 h-6 text-primary" />
                        <h2 className="text-2xl font-semibold">Your Portfolio</h2>
                    </div>

                    <div className="space-y-3">
                        {customers.length === 0 && (
                            <p className="text-muted-foreground text-sm text-center py-10 bg-white/5 rounded-xl border border-dashed border-white/10">
                                No customers in your portfolio yet.
                            </p>
                        )}

                        {customers.map((cust) => (
                            <div key={cust.customer_id} className="p-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all group">
                                <div className="flex justify-between items-start mb-1">
                                    <span className="font-bold text-foreground group-hover:text-primary transition-colors">{cust.full_name}</span>
                                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${cust.kyc_status === 'Verified' ? 'bg-green-500/10 text-green-500 border-green-500/20' :
                                            cust.kyc_status === 'Rejected' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                                                'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
                                        }`}>
                                        {cust.kyc_status.toUpperCase()}
                                    </span>
                                </div>
                                <span className="text-xs text-muted-foreground font-mono">{cust.email}</span>
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </div>
    );
}
