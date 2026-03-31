"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShieldCheck, User, PlusCircle, Calculator, LogOut, LogIn, Briefcase } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push("/auth/login");
  };

  return (
    <nav className="sticky top-0 z-50 w-full glass border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-8 w-8 text-primary animate-pulse" />
            <Link href="/" className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
              EnsureVault
            </Link>
          </div>

          {/* Nav Links — role-based */}
          <div className="hidden md:flex items-baseline space-x-6">
            {/* Customer links */}
            {(user?.role === "customer") && (
              <>
                <Link href="/customer/dashboard" className="flex items-center gap-2 text-foreground/80 hover:text-primary transition-colors">
                  <User className="h-4 w-4" /> Dashboard
                </Link>
                <Link href="/customer/claims/new" className="flex items-center gap-2 text-foreground/80 hover:text-primary transition-colors">
                  <PlusCircle className="h-4 w-4" /> New Claim
                </Link>
                <Link href="/customer/profile" className="flex items-center gap-2 text-foreground/80 hover:text-primary transition-colors">
                  <User className="h-4 w-4" /> Profile
                </Link>
                <Link href="/premium-calculator" className="flex items-center gap-2 text-foreground/80 hover:text-primary transition-colors">
                  <Calculator className="h-4 w-4" /> Calculator
                </Link>
              </>
            )}

            {/* Agent links */}
            {user?.role === "agent" && (
              <>
                <Link href="/customer/dashboard" className="flex items-center gap-2 text-foreground/80 hover:text-accent transition-colors">
                  <Briefcase className="h-4 w-4" /> Portfolios
                </Link>
                <Link href="/premium-calculator" className="flex items-center gap-2 text-foreground/80 hover:text-accent transition-colors">
                  <Calculator className="h-4 w-4" /> Calculator
                </Link>
              </>
            )}

            {/* Admin links */}
            {user?.role === "admin" && (
              <>
                <Link href="/customer/dashboard" className="flex items-center gap-2 text-foreground/80 hover:text-secondary transition-colors">
                  <User className="h-4 w-4" /> Customers
                </Link>
                <Link href="/admin/policies/create" className="flex items-center gap-2 text-foreground/80 hover:text-secondary transition-colors">
                  <ShieldCheck className="h-4 w-4" /> Management
                </Link>
                <Link href="/premium-calculator" className="flex items-center gap-2 text-foreground/80 hover:text-secondary transition-colors">
                  <Calculator className="h-4 w-4" /> Calculator
                </Link>
              </>
            )}
          </div>

          {/* Auth button + Role Badge */}
          <div className="flex items-center gap-3">
            {user ? (
              <>
                <div className="hidden md:flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">{user.name}</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${user.role === "admin" ? "bg-secondary/10 text-secondary border-secondary/30" :
                    user.role === "agent" ? "bg-accent/10 text-accent border-accent/30" :
                      "bg-primary/10 text-primary border-primary/30"
                    }`}>
                    {user.role}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1.5 text-sm text-foreground/60 hover:text-red-500 transition-colors"
                >
                  <LogOut className="h-4 w-4" /> Sign out
                </button>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/auth/register"
                  className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-full border border-primary/30 text-primary text-sm font-medium hover:bg-primary/5 transition-colors"
                >
                  Sign Up
                </Link>
                <Link
                  href="/auth/login"
                  className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
                >
                  <LogIn className="h-4 w-4" /> Sign In
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
