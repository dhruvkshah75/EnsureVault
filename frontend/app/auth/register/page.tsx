"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ShieldCheck, User, Mail, Lock, Loader2, AlertCircle } from "lucide-react";
import { useToast } from "@/components/Toast";

export default function RegisterPage() {
    const { toast } = useToast();
    const router = useRouter();

    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        confirmPassword: ""
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (formData.password !== formData.confirmPassword) {
            toast("Passwords do not match", "error");
            return;
        }

        setLoading(true);
        // Mock registration logic
        setTimeout(() => {
            setLoading(false);
            toast("Account created successfully! You can now log in.", "success");
            router.push("/auth/login");
        }, 1500);
    };

    return (
        <div className="min-h-[85vh] flex items-center justify-center animate-fade-in p-4">
            <div className="w-full max-w-md">
                {/* Header card */}
                <div className="bg-primary text-primary-foreground rounded-t-2xl px-8 py-6 shadow-xl border-x border-t border-white/10">
                    <div className="flex items-center gap-3">
                        <ShieldCheck className="w-8 h-8 text-secondary" />
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight">Join EnsureVault</h1>
                            <p className="text-sm text-primary-foreground/70">Create your secure insurance portal</p>
                        </div>
                    </div>
                </div>

                {/* Form card */}
                <div className="glass-card rounded-b-2xl rounded-t-none border-t-0 px-8 py-8 space-y-6 shadow-2xl relative overflow-hidden">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium">Full Name</label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <input
                                    type="text"
                                    required
                                    className="form-input pl-10"
                                    placeholder="Amit Patel"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-sm font-medium">Email Address</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <input
                                    type="email"
                                    required
                                    className="form-input pl-10"
                                    placeholder="amit.patel@email.com"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium">Password</label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <input
                                        type="password"
                                        required
                                        className="form-input pl-10"
                                        placeholder="••••••••"
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-sm font-medium">Confirm</label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <input
                                        type="password"
                                        required
                                        className="form-input pl-10"
                                        placeholder="••••••••"
                                        value={formData.confirmPassword}
                                        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="bg-primary hover:bg-primary/95 text-primary-foreground w-full py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-primary/20 hover:-translate-y-0.5"
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ShieldCheck className="w-5 h-5" />}
                            {loading ? "Creating Account..." : "Register Securely"}
                        </button>
                    </form>

                    <div className="text-center pt-4 border-t border-white/5">
                        <p className="text-sm text-muted-foreground">
                            Already have an account?{" "}
                            <Link href="/auth/login" className="text-secondary font-semibold hover:underline">
                                Sign In
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
