"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../context/AuthContext";
import { ShieldCheck, Mail, Eye, EyeOff, Loader2, AlertCircle, Lock } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

// Demo credential hints shown below the form
const hints = [
    { label: "Customer", value: "amit.patel@email.com" },
    { label: "Customer", value: "sneha.iyer@email.com" },
    { label: "Agent", value: "rajesh.sharma@ensurevault.com" },
    { label: "Manager", value: "manager@ensurevault.com" },
    { label: "Admin", value: "admin@ensurevault.com" },
];

export default function LoginPage() {
    const { login } = useAuth();
    const router = useRouter();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPwd, setShowPwd] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            const res: Response = await fetch(`${API}/auth/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.detail ?? "Invalid credentials.");

            const { name, role, user_id, customer_id, email, kyc_status } = json.data;
            login(role, { name, user_id, customer_id, email, kyc_status });

            if (role === "customer") router.push("/customer/dashboard");
            else if (role === "agent") router.push("/agent/dashboard");
            else if (role === "claims_manager") router.push("/manager/dashboard");
            else router.push("/admin/policies/create");
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Login failed.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-[80vh] flex items-center justify-center animate-fade-in">
            <div className="w-full max-w-md">

                {/* Header card */}
                <div className="bg-primary text-primary-foreground rounded-t-lg px-8 py-6">
                    <div className="flex items-center gap-3">
                        <ShieldCheck className="w-8 h-8 text-secondary" />
                        <div>
                            <h1 className="text-xl font-bold tracking-tight">EnsureVault</h1>
                            <p className="text-sm text-primary-foreground/70">Secure Insurance Portal</p>
                        </div>
                    </div>
                </div>

                {/* Form card */}
                <div className="glass-card rounded-t-none border-t-0 px-8 py-8 space-y-5">
                    <div>
                        <h2 className="text-xl font-semibold text-foreground">Sign in to your account</h2>
                        <p className="text-sm text-muted-foreground mt-1">
                            Enter your registered email address to continue.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Email */}
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-foreground">Email Address</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="yourname@email.com"
                                    className="form-input pl-10"
                                />
                            </div>
                        </div>

                        {/* Password (UI only — no backend auth yet) */}
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-foreground">Password</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <input
                                    type={showPwd ? "text" : "password"}
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Enter your password"
                                    className="form-input pl-10 pr-10"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPwd(!showPwd)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        {/* Error */}
                        {error && (
                            <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/8 border border-destructive/20 p-3 rounded-md">
                                <AlertCircle className="w-4 h-4 shrink-0" />
                                {error}
                            </div>
                        )}

                        {/* Submit */}
                        <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2 mt-1">
                            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                            {loading ? "Verifying..." : "Sign In"}
                        </button>
                    </form>

                    {/* Divider */}
                    <div className="border-t border-border pt-4">
                        <p className="text-xs text-muted-foreground mb-2 font-medium uppercase tracking-wider">Demo Accounts</p>
                        <div className="space-y-1.5">
                            {hints.map((h) => (
                                <button
                                    key={h.value}
                                    type="button"
                                    onClick={() => setEmail(h.value)}
                                    className="w-full flex items-center justify-between text-xs px-3 py-2 rounded-md bg-muted hover:bg-muted/80 transition-colors text-foreground/80"
                                >
                                    <span className="font-mono">{h.value}</span>
                                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${h.label === "Admin" ? "bg-red-100 text-red-700" :
                                        h.label === "Agent" ? "bg-amber-100 text-amber-700" :
                                            "bg-blue-100 text-blue-700"
                                        }`}>{h.label}</span>
                                </button>
                            ))}
                        </div>
                        <p className="text-xs text-muted-foreground mt-3">Any password works in demo mode.</p>
                    </div>
                </div>

                {/* Footer */}
                <p className="text-center text-xs text-muted-foreground mt-4">
                    © 2026 EnsureVault Financial Services. All rights reserved.
                </p>
            </div>
        </div>
    );
}
