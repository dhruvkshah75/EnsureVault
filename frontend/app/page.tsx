"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShieldCheck, Activity, Users, LogIn } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useEffect } from "react";

export default function Home() {
  const { user } = useAuth();
  const router = useRouter();

  // If not logged in, redirect to login
  useEffect(() => {
    if (user === null) {
      // Give a small delay for localStorage hydration
    }
  }, [user]);

  return (
    <div className="flex flex-col items-center justify-center py-20 animate-slide-up space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight">
          Secure Your Future with <br />
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary via-accent to-secondary">
            EnsureVault
          </span>
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          The next-generation insurance platform powered by robust data handling, seamless claims processing, and instantly calculated premiums.
        </p>
      </div>

      {/* Not logged in — show login CTA only */}
      {!user && (
        <Link
          href="/auth/login"
          className="flex items-center gap-3 px-8 py-4 rounded-2xl bg-gradient-to-r from-primary to-secondary text-white font-bold text-lg hover:opacity-90 transition-opacity shadow-xl"
        >
          <LogIn className="w-5 h-5" /> Sign in to EnsureVault
        </Link>
      )}

      {/* Customer — can only see Customer Portal + Risk Engine */}
      {user?.role === "customer" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-3xl mt-6">
          <Link href="/customer/dashboard" className="glass-card p-6 flex flex-col items-center text-center space-y-4 hover:scale-105 transition-transform cursor-pointer">
            <div className="p-4 bg-primary/10 rounded-full">
              <Users className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-2xl font-semibold">My Portfolio</h2>
            <p className="text-muted-foreground">Manage your policies, view history, and submit claims effortlessly.</p>
          </Link>
          <Link href="/premium-calculator" className="glass-card p-6 flex flex-col items-center text-center space-y-4 hover:scale-105 transition-transform cursor-pointer">
            <div className="p-4 bg-accent/10 rounded-full">
              <Activity className="h-8 w-8 text-accent" />
            </div>
            <h2 className="text-2xl font-semibold">Premium Calculator</h2>
            <p className="text-muted-foreground">Get an instant premium estimate based on your risk profile.</p>
          </Link>
        </div>
      )}

      {/* Admin / Agent — see all three */}
      {(user?.role === "admin" || user?.role === "agent") && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl mt-6">
          <Link href="/customer/dashboard" className="glass-card p-6 flex flex-col items-center text-center space-y-4 hover:scale-105 transition-transform cursor-pointer">
            <div className="p-4 bg-primary/10 rounded-full">
              <Users className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-2xl font-semibold">Customer Portal</h2>
            <p className="text-muted-foreground">View customer policies and claim histories.</p>
          </Link>
          <Link href="/admin/policies/create" className="glass-card p-6 flex flex-col items-center text-center space-y-4 hover:scale-105 transition-transform cursor-pointer">
            <div className="p-4 bg-secondary/10 rounded-full">
              <ShieldCheck className="h-8 w-8 text-secondary" />
            </div>
            <h2 className="text-2xl font-semibold">Admin &amp; Agents</h2>
            <p className="text-muted-foreground">Design new insurance plans, adjust rules, and overview the system.</p>
          </Link>
          <Link href="/premium-calculator" className="glass-card p-6 flex flex-col items-center text-center space-y-4 hover:scale-105 transition-transform cursor-pointer">
            <div className="p-4 bg-accent/10 rounded-full">
              <Activity className="h-8 w-8 text-accent" />
            </div>
            <h2 className="text-2xl font-semibold">Risk Engine</h2>
            <p className="text-muted-foreground">Dynamically calculate premiums with multi-factor risk logic.</p>
          </Link>
        </div>
      )}
    </div>
  );
}
