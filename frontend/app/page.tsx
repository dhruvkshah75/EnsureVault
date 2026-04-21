"use client";

import Link from "next/link";
import { ShieldCheck, Activity, Users, LogIn } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function Home() {
  const { user } = useAuth();

  return (
    <div className="flex flex-col items-center justify-center py-20 animate-slide-up space-y-8">
      <div className="text-center space-y-6 max-w-4xl">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/5 border border-primary/10 text-primary text-sm font-medium mb-4">
          <ShieldCheck className="w-4 h-4" />
          Trusted • Secure • Professional
        </div>
        <h1 className="text-5xl md:text-6xl font-bold tracking-tight text-foreground">
          Secure Your Future with <br />
          <span className="text-primary">EnsureVault</span>
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          Enterprise-grade insurance platform with robust data handling, seamless claims processing, and instant premium calculations.
        </p>
      </div>

      {/* Not logged in — show login CTA only */}
      {!user && (
        <Link
          href="/auth/login"
          className="flex items-center gap-2 px-8 py-3.5 rounded-md bg-primary text-primary-foreground font-semibold text-base hover:bg-primary/90 transition-all shadow-md hover:shadow-lg"
        >
          <LogIn className="w-5 h-5" /> Sign in to EnsureVault
        </Link>
      )}

      {/* Customer — can only see Customer Portal + Risk Engine */}
      {user?.role === "customer" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-3xl mt-8">
          <Link href="/customer/dashboard" className="group glass-card p-8 flex flex-col items-start text-left space-y-4 hover:scale-[1.02] transition-all cursor-pointer">
            <div className="p-3 bg-primary/10 rounded-lg group-hover:bg-primary/15 transition-colors">
              <Users className="h-7 w-7 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-foreground mb-2">My Portfolio</h2>
              <p className="text-sm text-muted-foreground">Manage your policies, view history, and submit claims effortlessly.</p>
            </div>
          </Link>
          <Link href="/premium-calculator" className="group glass-card p-8 flex flex-col items-start text-left space-y-4 hover:scale-[1.02] transition-all cursor-pointer">
            <div className="p-3 bg-accent/10 rounded-lg group-hover:bg-accent/15 transition-colors">
              <Activity className="h-7 w-7 text-accent" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-foreground mb-2">Premium Calculator</h2>
              <p className="text-sm text-muted-foreground">Get an instant premium estimate based on your risk profile.</p>
            </div>
          </Link>
        </div>
      )}

      {/* Admin / Agent / Manager — see all three */}
      {(user?.role === "admin" || user?.role === "agent" || user?.role === "claims_manager") && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-6xl mt-8">
          {user?.role === "admin" ? (
            <Link href="/admin/dashboard" className="group glass-card p-8 flex flex-col items-start text-left space-y-4 hover:scale-[1.02] transition-all cursor-pointer">
              <div className="p-3 bg-primary/10 rounded-lg group-hover:bg-primary/15 transition-colors">
                <Users className="h-7 w-7 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-foreground mb-2">Admin Panel</h2>
                <p className="text-sm text-muted-foreground">Manage policy types and agent workforce.</p>
              </div>
            </Link>
          ) : user?.role === "claims_manager" ? (
            <Link href="/manager/dashboard" className="group glass-card p-8 flex flex-col items-start text-left space-y-4 hover:scale-[1.02] transition-all cursor-pointer">
              <div className="p-3 bg-purple-100 rounded-lg group-hover:bg-purple-200 transition-colors">
                <ShieldCheck className="h-7 w-7 text-purple-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-foreground mb-2">Claims Portal</h2>
                <p className="text-sm text-muted-foreground">Verify evidence and adjudicate claims.</p>
              </div>
            </Link>
          ) : (
            <Link href="/agent/dashboard" className="group glass-card p-8 flex flex-col items-start text-left space-y-4 hover:scale-[1.02] transition-all cursor-pointer">
              <div className="p-3 bg-primary/10 rounded-lg group-hover:bg-primary/15 transition-colors">
                <Users className="h-7 w-7 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-foreground mb-2">Agent Portal</h2>
                <p className="text-sm text-muted-foreground">Onboard your clients and issue policies.</p>
              </div>
            </Link>
          )}
          <Link href="/admin/policies/create" className="group glass-card p-8 flex flex-col items-start text-left space-y-4 hover:scale-[1.02] transition-all cursor-pointer">
            <div className="p-3 bg-blue-50 rounded-lg group-hover:bg-blue-100 transition-colors">
              <ShieldCheck className="h-7 w-7 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-foreground mb-2">Policy Management</h2>
              <p className="text-sm text-muted-foreground">Design new insurance plans and adjust system rules.</p>
            </div>
          </Link>
          <Link href="/premium-calculator" className="group glass-card p-8 flex flex-col items-start text-left space-y-4 hover:scale-[1.02] transition-all cursor-pointer">
            <div className="p-3 bg-accent/10 rounded-lg group-hover:bg-accent/15 transition-colors">
              <Activity className="h-7 w-7 text-accent" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-foreground mb-2">Risk Engine</h2>
              <p className="text-sm text-muted-foreground">Calculate premiums with multi-factor risk logic.</p>
            </div>
          </Link>
        </div>
      )}
    </div>
  );
}
