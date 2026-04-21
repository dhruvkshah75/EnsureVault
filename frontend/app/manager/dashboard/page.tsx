"use client";

import { useAuth } from "@/context/AuthContext";
import { useState, useEffect } from "react";
import { ShieldCheck, Loader2, CheckCircle2, XCircle, Eye, FileText, AlertCircle } from "lucide-react";
import { useToast } from "@/components/Toast";
import { useRouter } from "next/navigation";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

interface Claim {
    claim_id: number;
    policy_id: number;
    customer_name: string;
    policy_type: string;
    incident_date: string;
    claim_amount: number;
    status: string;
}

interface Document {
    doc_id: number;
    claim_id: number;
    doc_type: string;
    file_url: string;
}

export default function ClaimsManagerDashboard() {
    const { user } = useAuth();
    const { toast } = useToast();
    const router = useRouter();

    const [claims, setClaims] = useState<Claim[]>([]);
    const [loading, setLoading] = useState(true);

    // Filter state
    const [regionFilter, setRegionFilter] = useState("");
    const [typeFilter, setTypeFilter] = useState("");
    const [dateRange, setDateRange] = useState({ start: "", end: "" });

    // Modal / Review state
    const [selectedClaim, setSelectedClaim] = useState<Claim | null>(null);
    const [documents, setDocuments] = useState<Document[]>([]);
    const [docsLoading, setDocsLoading] = useState(false);
    const [rejectionReason, setRejectionReason] = useState("");
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (user && user.role !== "claims_manager") {
            router.push("/");
            return;
        }
        fetchFilteredClaims();
    }, [user, router, regionFilter, typeFilter, dateRange]);

    const fetchFilteredClaims = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                status: "Pending", // Default for the queue
            });
            if (regionFilter) params.append("region", regionFilter);
            if (typeFilter) params.append("policy_type", typeFilter);
            if (dateRange.start) params.append("start_date", dateRange.start);
            if (dateRange.end) params.append("end_date", dateRange.end);

            const res = await fetch(`${API}/claims/?${params.toString()}`);
            const json = await res.json();
            if (res.ok) {
                setClaims(json.data || []);
            }
        } catch (err) {
            console.error(err);
            toast("Failed to fetch pending claims.", "error");
        } finally {
            setLoading(false);
        }
    };

    const openReview = async (claim: Claim) => {
        setSelectedClaim(claim);
        setDocuments([]);
        setRejectionReason("");
        setDocsLoading(true);

        try {
            const res = await fetch(`${API}/claims/${claim.claim_id}/documents`);
            const json = await res.json();
            if (res.ok) {
                setDocuments(json.data || []);
            }
        } catch (err) {
            console.error(err);
            toast("Failed to load documents.", "error");
        } finally {
            setDocsLoading(false);
        }
    };

    const handleDecision = async (status: "Approved" | "Rejected") => {
        if (!selectedClaim) return;
        if (status === "Rejected" && !rejectionReason.trim()) {
            toast("A rejection reason is required.", "error");
            return;
        }

        setSubmitting(true);
        try {
            const res = await fetch(`${API}/claims/${selectedClaim.claim_id}/decision`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    status,
                    rejection_reason: status === "Rejected" ? rejectionReason : null,
                }),
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.detail || "Failed to submit decision.");

            toast(`Claim #${selectedClaim.claim_id} has been ${status.toLowerCase()}`, "success");
            setSelectedClaim(null); // close modal
            fetchFilteredClaims(); // refresh queue
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : "Error deciding claim.";
            toast(msg, "error");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
            </div>
        );
    }

    // Calculate KPIs
    const totalPending = claims.length;
    const totalValue = claims.reduce((acc, c) => acc + c.claim_amount, 0);

    return (
        <div className="max-w-6xl mx-auto space-y-8 animate-slide-up pb-20">

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
                        <ShieldCheck className="w-8 h-8 text-purple-500" />
                        Claims Adjudication Queue
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Review pending claims, verify supporting evidence, and issue final decisions.
                    </p>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="glass-card p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="space-y-2">
                        <label className="block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Region</label>
                        <select
                            value={regionFilter}
                            onChange={(e) => setRegionFilter(e.target.value)}
                            className="form-input text-sm h-10 w-full"
                        >
                            <option value="">All Regions</option>
                            <option value="North">North</option>
                            <option value="South">South</option>
                            <option value="East">East</option>
                            <option value="West">West</option>
                            <option value="Central">Central</option>
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Policy Type</label>
                        <select
                            value={typeFilter}
                            onChange={(e) => setTypeFilter(e.target.value)}
                            className="form-input text-sm h-10 w-full"
                        >
                            <option value="">All Types</option>
                            <option value="Health">Health</option>
                            <option value="Car">Car</option>
                            <option value="Home">Home</option>
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Incident Date From</label>
                        <input
                            type="date"
                            value={dateRange.start}
                            onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                            className="form-input text-sm h-10 w-full"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="block text-xs font-semibold uppercase tracking-wide text-muted-foreground">To</label>
                        <input
                            type="date"
                            value={dateRange.end}
                            onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                            className="form-input text-sm h-10 w-full"
                        />
                    </div>
                </div>

                <button
                    onClick={() => { setRegionFilter(""); setTypeFilter(""); setDateRange({ start: "", end: "" }); }}
                    className="text-xs font-semibold text-muted-foreground hover:text-primary transition-colors"
                >
                    Reset Filters
                </button>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="glass-card p-6 flex items-center justify-between border-l-4 border-l-purple-500">
                    <div>
                        <p className="text-sm font-medium text-muted-foreground">Pending Claims</p>
                        <p className="text-3xl font-bold text-foreground mt-1">{totalPending}</p>
                    </div>
                    <div className="p-3 bg-purple-500/10 rounded-full">
                        <FileText className="w-6 h-6 text-purple-500" />
                    </div>
                </div>
                <div className="glass-card p-6 flex items-center justify-between border-l-4 border-l-amber-500">
                    <div>
                        <p className="text-sm font-medium text-muted-foreground">Total Claim Value</p>
                        <p className="text-3xl font-bold text-foreground mt-1">₹{totalValue.toLocaleString()}</p>
                    </div>
                    <div className="p-3 bg-amber-500/10 rounded-full">
                        <AlertCircle className="w-6 h-6 text-amber-500" />
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex flex-col lg:flex-row gap-8 items-start">

                {/* Queue Table */}
                <div className="glass p-1 rounded-2xl w-full lg:w-2/3">
                    <div className="bg-background rounded-xl p-6">
                        <h2 className="text-lg font-semibold mb-4">Pending Review Queue</h2>
                        {claims.length === 0 ? (
                            <div className="text-center py-10 bg-white/5 rounded-lg border border-dashed border-white/10">
                                <ShieldCheck className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-50" />
                                <p className="text-muted-foreground">Queue is empty. Great job!</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {claims.map((c) => (
                                    <div key={c.claim_id} className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border transition-colors ${selectedClaim?.claim_id === c.claim_id ? "border-purple-500/50 bg-purple-500/5" : "border-border hover:bg-muted"}`}>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="font-semibold text-foreground">Claim #{c.claim_id}</span>
                                                <span className="px-2 py-0.5 bg-amber-500/10 text-amber-500 rounded text-xs font-medium border border-amber-500/20">
                                                    {c.status}
                                                </span>
                                            </div>
                                            <p className="text-sm text-muted-foreground mt-1">
                                                {c.customer_name} • {c.policy_type} Policy #{c.policy_id}
                                            </p>
                                            <p className="text-sm text-foreground font-medium mt-1">
                                                Requested: ₹{c.claim_amount.toLocaleString()} on {new Date(c.incident_date).toLocaleDateString()}
                                            </p>
                                        </div>

                                        <button
                                            onClick={() => openReview(c)}
                                            className="mt-4 sm:mt-0 flex items-center justify-center gap-2 btn bg-secondary/10 hover:bg-secondary/20 text-secondary border border-secondary/20 rounded-lg px-4 py-2 text-sm font-medium transition-colors"
                                        >
                                            <Eye className="w-4 h-4" /> Review
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Verification Portal (Sticky column) */}
                <div className="w-full lg:w-1/3 sticky top-6">
                    {selectedClaim ? (
                        <div className="glass-card rounded-2xl overflow-hidden border-2 border-purple-500/20 shadow-xl shadow-purple-500/5 animate-fade-in">
                            <div className="bg-purple-500 text-white p-4">
                                <h2 className="font-bold flex items-center gap-2">
                                    <ShieldCheck className="w-5 h-5" /> Evidence Verification
                                </h2>
                                <p className="text-sm opacity-90 mt-1">Claim #{selectedClaim.claim_id} • {selectedClaim.customer_name}</p>
                            </div>

                            <div className="p-6 space-y-6">

                                {/* Documents Section */}
                                <div>
                                    <h3 className="text-sm font-medium text-muted-foreground mb-3">Attached Documents</h3>

                                    {docsLoading ? (
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground p-4 bg-muted/50 rounded-lg">
                                            <Loader2 className="w-4 h-4 animate-spin" /> Fetching evidence...
                                        </div>
                                    ) : documents.length === 0 ? (
                                        <div className="p-4 bg-red-500/10 text-red-500 rounded-lg border border-red-500/20 text-sm flex items-start gap-2">
                                            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                                            No documents provided! This is highly suspicious.
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {documents.map((doc) => (
                                                <div key={doc.doc_id} className="border border-border rounded-lg overflow-hidden relative group">
                                                    {/* Image preview */}
                                                    <div className="aspect-video bg-muted relative">
                                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                                        <img
                                                            src={doc.file_url}
                                                            alt={doc.doc_type}
                                                            className="w-full h-full object-cover"
                                                            onError={(e) => {
                                                                // fallback if purely a mock url that doesn't resolve
                                                                (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=400&q=80";
                                                            }}
                                                        />
                                                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                            <a href={doc.file_url} target="_blank" rel="noreferrer" className="text-white text-sm bg-white/20 px-3 py-1 rounded-full backdrop-blur-md hover:bg-white/30">
                                                                View Full Source
                                                            </a>
                                                        </div>
                                                    </div>
                                                    <div className="p-2 text-xs font-medium truncate flex items-center gap-2 bg-background">
                                                        <FileText className="w-3 h-3 text-purple-500" />
                                                        {doc.doc_type}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Decision Engine */}
                                <div className="pt-4 border-t border-border space-y-4">
                                    <h3 className="text-sm font-medium text-foreground">Decision Engine</h3>

                                    <div className="space-y-2">
                                        <label className="text-xs text-muted-foreground">Rejection Reason (required if denying)</label>
                                        <textarea
                                            value={rejectionReason}
                                            onChange={(e) => setRejectionReason(e.target.value)}
                                            placeholder="Explain why this claim is invalid..."
                                            className="form-input text-sm w-full min-h-[80px]"
                                        />
                                    </div>

                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => handleDecision("Approved")}
                                            disabled={submitting}
                                            className="flex-1 btn bg-emerald-500 hover:bg-emerald-600 text-white flex items-center justify-center gap-2"
                                        >
                                            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                                            Approve
                                        </button>

                                        <button
                                            onClick={() => handleDecision("Rejected")}
                                            disabled={submitting}
                                            className="flex-1 btn bg-rose-500 hover:bg-rose-600 text-white flex items-center justify-center gap-2"
                                        >
                                            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                                            Reject
                                        </button>
                                    </div>
                                </div>

                            </div>
                        </div>
                    ) : (
                        <div className="glass-card p-10 text-center rounded-2xl border border-dashed border-muted-foreground/30 text-muted-foreground flex flex-col items-center">
                            <Eye className="w-12 h-12 mb-4 opacity-50" />
                            <p>Select a claim from the queue to verify evidence and make a decision.</p>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}
