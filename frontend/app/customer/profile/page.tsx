"use client";

import { useAuth } from "@/context/AuthContext";
import { useState, useEffect } from "react";
import { User, Mail, ShieldCheck, UploadCloud, CheckCircle2, ShieldAlert, FileText, Loader2, Activity } from "lucide-react";
import { useToast } from "@/components/Toast";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

export default function ProfilePage() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [uploading, setUploading] = useState(false);
    const [kycStatus, setKycStatus] = useState<"Pending" | "Verified" | "Rejected">("Pending");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user?.customer_id) return;

        const fetchKycStatus = async () => {
            try {
                const res = await fetch(`${API}/policies/?customer_id=${user.customer_id}`);
                if (res.ok) {
                    const json = await res.json();
                    // Get customer info from policies endpoint (includes customer data)
                    // For now, we'll just set it based on user data
                    setKycStatus(user.kyc_status || "Pending");
                } else {
                    setKycStatus(user.kyc_status || "Pending");
                }
            } catch (e) {
                setKycStatus(user.kyc_status || "Pending");
            } finally {
                setLoading(false);
            }
        };

        fetchKycStatus();
    }, [user]);

    const handleUpload = async () => {
        if (!user?.customer_id) {
            toast("Customer ID not found", "error");
            return;
        }

        setUploading(true);
        try {
            // Simulated upload - in production, would use real file upload
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Update KYC status in backend
            const res = await fetch(`${API}/customers/${user.customer_id}/kyc-upload`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: "Pending" })
            });

            if (res.ok) {
                setKycStatus("Pending");
                toast("KYC documents uploaded successfully. Verification in progress.", "success");
            } else {
                toast("Failed to upload documents", "error");
            }
        } catch (e) {
            toast("Upload failed", "error");
        } finally {
            setUploading(false);
        }
    };

    if (!user) return null;
    if (loading) {
        return (
            <div className="flex items-center justify-center py-40 gap-3 text-muted-foreground">
                <Loader2 className="w-6 h-6 animate-spin" />
                <span>Loading profile...</span>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-slide-up">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-4xl font-bold tracking-tight">Your Profile</h1>
                    <p className="text-muted-foreground mt-2">Manage your personal information and security settings.</p>
                </div>
                <div className={`flex items-center gap-2 px-4 py-2 rounded-full border ${kycStatus === "Verified" ? "bg-green-500/10 text-green-500 border-green-500/20" :
                    kycStatus === "Pending" ? "bg-yellow-500/10 text-yellow-500 border-yellow-500/20" :
                        "bg-red-500/10 text-red-500 border-red-500/20"
                    }`}>
                    {kycStatus === "Verified" ? <CheckCircle2 className="w-5 h-5" /> :
                        kycStatus === "Pending" ? <Loader2 className="w-5 h-5 animate-spin" /> :
                            <ShieldAlert className="w-5 h-5" />}
                    <span className="font-semibold">{kycStatus}</span>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Account Details */}
                <div className="md:col-span-1 space-y-6">
                    <div className="glass-card p-6 border-t-4 border-t-primary flex flex-col items-center text-center">
                        <div className="w-24 h-24 bg-primary/20 rounded-full flex items-center justify-center mb-4 border-2 border-primary/30">
                            <User className="w-12 h-12 text-primary" />
                        </div>
                        <h2 className="text-xl font-bold">{user.name}</h2>
                        <p className="text-sm text-muted-foreground capitalize">{user.role}</p>
                        <div className="w-full border-t border-white/5 my-6"></div>
                        <div className="w-full space-y-4 text-left">
                            <div className="flex items-center gap-3 text-sm">
                                <Mail className="w-4 h-4 text-primary" />
                                <span className="truncate">{user.email || "Not available"}</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm">
                                <ShieldCheck className="w-4 h-4 text-primary" />
                                <span>ID: EV-USR-{user.user_id}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Portfolio Analytics */}
                <div className="md:col-span-3">
                    <div className="glass-card p-8">
                        <div className="flex items-center gap-3 mb-8">
                            <Activity className="w-6 h-6 text-primary" />
                            <h2 className="text-2xl font-bold">Portfolio Performance</h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                            {/* Claims Statistics (SVG Bar Chart) */}
                            <div className="space-y-4">
                                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Claim Statistics (Last 6 Months)</h3>
                                <div className="h-48 w-full flex items-end gap-4 px-4 pt-8 border-b border-l border-white/10 italic">
                                    {[30, 65, 45, 90, 55, 80].map((h, i) => (
                                        <div key={i} className="flex-1 group relative">
                                            <div
                                                className="bg-secondary rounded-t-md transition-all duration-500 group-hover:bg-secondary/80 cursor-pointer"
                                                style={{ height: `${h}%` }}
                                            >
                                                <div className="hidden group-hover:block absolute -top-8 left-1/2 -translate-x-1/2 bg-popover text-popover-foreground text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap z-10">
                                                    ₹{(h * 1000).toLocaleString()}
                                                </div>
                                            </div>
                                            <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] text-muted-foreground">
                                                {['Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'][i]}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Policy Coverage Mix (SVG Donut Chart) */}
                            <div className="space-y-4">
                                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Coverage Distribution</h3>
                                <div className="flex items-center gap-8 py-4">
                                    <div className="relative w-32 h-32">
                                        <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                                            <circle cx="18" cy="18" r="15.9" fill="transparent" stroke="currentColor" strokeWidth="3" className="text-white/5"></circle>
                                            <circle cx="18" cy="18" r="15.9" fill="transparent" strokeDasharray="60 40" strokeDashoffset="0" strokeWidth="3.5" className="text-primary"></circle>
                                            <circle cx="18" cy="18" r="15.9" fill="transparent" strokeDasharray="40 60" strokeDashoffset="-60" strokeWidth="3.5" className="text-secondary"></circle>
                                        </svg>
                                        <div className="absolute inset-0 flex items-center justify-center flex-col">
                                            <span className="text-lg font-bold">100%</span>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2 text-xs">
                                            <div className="w-3 h-3 rounded-full bg-primary"></div>
                                            <span className="text-muted-foreground">Life Insurance (60%)</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs">
                                            <div className="w-3 h-3 rounded-full bg-secondary"></div>
                                            <span className="text-muted-foreground">Vehicle Policy (40%)</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* KYC Upload */}
                <div className="md:col-span-2 space-y-6">
                    <div className="glass-card p-8">
                        <div className="flex items-center gap-3 mb-6">
                            <FileText className="w-6 h-6 text-secondary" />
                            <h2 className="text-2xl font-bold">Identity Verification (KYC)</h2>
                        </div>

                        <p className="text-muted-foreground mb-8">
                            To comply with banking regulations and access higher insurance coverage, please provide a valid government-issued ID (Aadhar, PAN, or Passport).
                        </p>

                        <div className="border-2 border-dashed border-white/10 rounded-2xl p-12 text-center hover:bg-white/5 transition-all group relative overflow-hidden">
                            {uploading ? (
                                <div className="space-y-4">
                                    <Loader2 className="w-12 h-12 text-secondary animate-spin mx-auto" />
                                    <p className="font-medium">Encrypting and uploading...</p>
                                </div>
                            ) : kycStatus === "Pending" ? (
                                <div className="space-y-4">
                                    <Loader2 className="w-12 h-12 text-yellow-500 mx-auto animate-spin" />
                                    <p className="font-medium">Documents under review</p>
                                    <p className="text-sm text-muted-foreground">Our compliance team is reviewing your files (est. 24-48h).</p>
                                </div>
                            ) : kycStatus === "Verified" ? (
                                <div className="space-y-4">
                                    <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto" />
                                    <p className="font-medium">Verification Complete!</p>
                                    <p className="text-sm text-muted-foreground">Your identity has been verified.</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="p-4 bg-secondary/10 rounded-full w-fit mx-auto group-hover:bg-secondary/20 transition-colors">
                                        <UploadCloud className="w-10 h-10 text-secondary" />
                                    </div>
                                    <div className="space-y-1">
                                        <p className="font-bold text-lg">Upload Identity Document</p>
                                        <p className="text-sm text-muted-foreground">Drag and drop or click to browse</p>
                                    </div>
                                    <button
                                        onClick={handleUpload}
                                        disabled={uploading}
                                        className="mt-4 px-6 py-2 bg-secondary text-secondary-foreground rounded-full font-bold shadow-lg shadow-secondary/20 hover:opacity-90 transition-all disabled:opacity-50"
                                    >
                                        Select Files
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="mt-8 p-4 bg-primary/5 rounded-xl border border-primary/10 flex gap-4">
                            <ShieldCheck className="w-6 h-6 text-primary shrink-0" />
                            <p className="text-xs text-muted-foreground">
                                Your documents are encrypted end-to-end and stored in compliance with the RBI Data Localization guidelines.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
