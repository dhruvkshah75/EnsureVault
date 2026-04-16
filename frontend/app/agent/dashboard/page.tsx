"use client";

import { useAuth } from "@/context/AuthContext";
import { useState, useEffect } from "react";
import { Briefcase, Users, UserPlus, Mail, ShieldCheck, AlertCircle, Loader2, CheckCircle, XCircle, Clock } from "lucide-react";
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

interface PolicyRequest {
    request_id: number;
    customer_id: number;
    customer_name: string;
    customer_email: string;
    agent_id: number;
    type_id: number;
    type_name: string;
    start_date: string;
    end_date: string;
    premium_amount: string;
    status: string;
    requested_at: string;
}

export default function AgentDashboard() {
    const { user } = useAuth();
    const { toast } = useToast();

    const [agent, setAgent] = useState<Agent | null>(null);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [pendingRequests, setPendingRequests] = useState<PolicyRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [approving, setApproving] = useState<number | null>(null);
    const [rejecting, setRejecting] = useState<number | null>(null);
    const [rejectionReason, setRejectionReason] = useState<{ [key: number]: string }>({});
    const [showRejectForm, setShowRejectForm] = useState<number | null>(null);

    // Onboarding form state
    const [newName, setNewName] = useState("");
    const [newEmail, setNewEmail] = useState("");
    const [onboarding, setOnboarding] = useState(false);

    useEffect(() => {
        if (!user || user.role !== "agent") return;

        const fetchData = async () => {
            try {
                const [aRes, custRes, reqRes] = await Promise.all([
                    fetch(`${API}/agents/${user.user_id}`),
                    fetch(`${API}/agents/${user.user_id}/customers`),
                    fetch(`${API}/policies/requests/pending?agent_id=${user.user_id}`)
                ]);

                if (!aRes.ok) throw new Error("Failed to fetch agent profile.");
                if (!custRes.ok) throw new Error("Failed to fetch customers.");

                const aData = await aRes.json();
                const custData = await custRes.json();
                const reqData = reqRes.ok ? await reqRes.json() : { data: [] };

                setAgent(aData.data);
                setCustomers(custData.data ?? []);
                setPendingRequests(reqData.data ?? []);
            } catch (err: unknown) {
                const message = err instanceof Error ? err.message : "Unknown error";
                setError(message);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [user]);

    const handleApprove = async (requestId: number) => {
        if (!user) return;
        setApproving(requestId);
        try {
            const res = await fetch(`${API}/policies/requests/${requestId}/approve`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ reviewed_by: user.user_id })
            });

            if (!res.ok) throw new Error("Failed to approve");
            
            const json = await res.json();
            toast(`Policy approved! New Policy ID: ${json.data.created_policy_id}`, "success");
            setPendingRequests(p => p.filter(r => r.request_id !== requestId));
        } catch (e: unknown) {
            const message = e instanceof Error ? e.message : "Unknown error";
            toast(message, "error");
        } finally {
            setApproving(null);
        }
    };

    const handleReject = async (requestId: number) => {
        if (!user) return;
        const rejectionReason_ = rejectionReason[requestId] || "No reason provided";
        setRejecting(requestId);
        try {
            const res = await fetch(`${API}/policies/requests/${requestId}/reject`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ reviewed_by: user.user_id, rejection_reason: rejectionReason_ })
            });

            if (!res.ok) throw new Error("Failed to reject");
            
            toast("Policy request rejected.", "success");
            setPendingRequests(p => p.filter(r => r.request_id !== requestId));
            setShowRejectForm(null);
            setRejectionReason(r => ({ ...r, [requestId]: "" }));
        } catch (e: unknown) {
            const message = e instanceof Error ? e.message : "Unknown error";
            toast(message, "error");
        } finally {
            setRejecting(null);
        }
    };

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

            {/* Pending Policy Requests Section */}
            {pendingRequests.length > 0 && (
                <div className="glass-card p-8 border-t-4 border-t-amber-500">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-3 bg-amber-500/10 rounded-xl">
                            <Clock className="w-6 h-6 text-amber-500" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold">Policy Requests Pending Review</h2>
                            <p className="text-sm text-muted-foreground">{pendingRequests.length} customer{pendingRequests.length !== 1 ? 's' : ''} waiting for approval.</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {pendingRequests.map((req) => (
                            <div
                                key={req.request_id}
                                className="p-6 rounded-xl border border-amber-500/20 bg-amber-500/5 hover:bg-amber-500/10 transition-all"
                            >
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                    <div>
                                        <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest mb-1">Customer</p>
                                        <p className="text-lg font-bold">{req.customer_name}</p>
                                        <p className="text-xs text-muted-foreground">{req.customer_email}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest mb-1">Insurance Type</p>
                                        <p className="text-lg font-bold">{req.type_name}</p>
                                        <p className="text-sm text-amber-600">Requested: {new Date(req.requested_at).toLocaleDateString()}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest mb-1">Coverage Period</p>
                                        <p className="text-sm font-semibold">{new Date(req.start_date).toLocaleDateString()} to {new Date(req.end_date).toLocaleDateString()}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest mb-1">Annual Premium</p>
                                        <p className="text-2xl font-bold text-primary">₹{Number(req.premium_amount).toLocaleString()}</p>
                                    </div>
                                </div>

                                <div className="flex gap-3 pt-4 border-t border-amber-500/10">
                                    <button
                                        onClick={() => handleApprove(req.request_id)}
                                        disabled={approving === req.request_id}
                                        className="flex-1 px-4 py-2 bg-green-500/20 text-green-600 border border-green-500/30 rounded-lg hover:bg-green-500/30 transition-all flex items-center justify-center gap-2 font-medium disabled:opacity-50"
                                    >
                                        {approving === req.request_id ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <CheckCircle className="w-4 h-4" />
                                        )}
                                        {approving === req.request_id ? "Approving..." : "Approve & Create Policy"}
                                    </button>

                                    {showRejectForm === req.request_id ? (
                                        <div className="flex-1 flex gap-2">
                                            <input
                                                type="text"
                                                placeholder="Reason for rejection..."
                                                value={rejectionReason[req.request_id] || ""}
                                                onChange={(e) => setRejectionReason(r => ({ ...r, [req.request_id]: e.target.value }))}
                                                className="flex-1 px-3 py-2 bg-background border border-red-500/30 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                                            />
                                            <button
                                                onClick={() => handleReject(req.request_id)}
                                                disabled={rejecting === req.request_id}
                                                className="px-4 py-2 bg-red-500/20 text-red-600 border border-red-500/30 rounded-lg hover:bg-red-500/30 transition-all flex items-center gap-2 font-medium disabled:opacity-50"
                                            >
                                                {rejecting === req.request_id ? (
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                ) : (
                                                    <XCircle className="w-4 h-4" />
                                                )}
                                                {rejecting === req.request_id ? "Rejecting..." : "Reject"}
                                            </button>
                                            <button
                                                onClick={() => setShowRejectForm(null)}
                                                className="px-3 py-2 border border-border rounded-lg hover:bg-background/80 transition-all"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => setShowRejectForm(req.request_id)}
                                            className="flex-1 px-4 py-2 bg-red-500/20 text-red-600 border border-red-500/30 rounded-lg hover:bg-red-500/30 transition-all flex items-center justify-center gap-2 font-medium"
                                        >
                                            <XCircle className="w-4 h-4" />
                                            Reject
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

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
