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
    <nav className="sticky top-0 z-50 w-full bg-card/95 backdrop-blur-md border-b border-border shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="bg-primary p-2 rounded-lg shadow-sm">
              <ShieldCheck className="h-5 w-5 text-white" />
            </div>
            <Link href="/" className="text-xl font-bold text-foreground hover:text-primary transition-colors">
              EnsureVault
            </Link>
          </div>

          {/* Nav Links — role-based */}
          <div className="hidden md:flex items-center space-x-1">
            {/* Customer links */}
            {(user?.role === "customer") && (
              <>
                <Link href="/customer/dashboard" className="flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:text-primary hover:bg-primary/5 transition-colors">
                  <User className="h-4 w-4" /> Dashboard
                </Link>
                <Link href="/customer/claims/new" className="flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:text-primary hover:bg-primary/5 transition-colors">
                  <PlusCircle className="h-4 w-4" /> New Claim
                </Link>
                <Link href="/customer/profile" className="flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:text-primary hover:bg-primary/5 transition-colors">
                  <User className="h-4 w-4" /> Profile
                </Link>
                <Link href="/premium-calculator" className="flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:text-primary hover:bg-primary/5 transition-colors">
                  <Calculator className="h-4 w-4" /> Calculator
                </Link>
              </>
            )}

            {/* Agent links */}
            {user?.role === "agent" && (
              <>
                <Link href="/agent/dashboard" className="flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:text-primary hover:bg-primary/5 transition-colors">
                  <Briefcase className="h-4 w-4" /> Portfolios
                </Link>
                <Link href="/premium-calculator" className="flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:text-primary hover:bg-primary/5 transition-colors">
                  <Calculator className="h-4 w-4" /> Calculator
                </Link>
              </>
            )}

            {/* Claims Manager links */}
            {user?.role === "claims_manager" && (
              <>
                <Link href="/manager/dashboard" className="flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:text-primary hover:bg-primary/5 transition-colors">
                  <ShieldCheck className="h-4 w-4" /> Dashboard
                </Link>
              </>
            )}

            {/* Admin links */}
            {user?.role === "admin" && (
              <>
                <Link href="/admin/dashboard" className="flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:text-primary hover:bg-primary/5 transition-colors">
                  <User className="h-4 w-4" /> Dashboard
                </Link>
                <Link href="/admin/policies/create" className="flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:text-primary hover:bg-primary/5 transition-colors">
                  <ShieldCheck className="h-4 w-4" /> Management
                </Link>
                <Link href="/admin/agents/create" className="flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:text-primary hover:bg-primary/5 transition-colors">
                  <PlusCircle className="h-4 w-4" /> Add Agent
                </Link>
                <Link href="/premium-calculator" className="flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:text-primary hover:bg-primary/5 transition-colors">
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
                  <span className="text-foreground font-medium">{user.name}</span>
                  <span className={`px-2.5 py-1 rounded-md text-xs font-semibold ${user.role === "admin" ? "bg-blue-50 text-blue-700 border border-blue-200" :
                    user.role === "agent" ? "bg-green-50 text-green-700 border border-green-200" :
                      user.role === "claims_manager" ? "bg-purple-50 text-purple-700 border border-purple-200" :
                        "bg-gray-50 text-gray-700 border border-gray-200"
                    }`}>
                    {user.role?.replace('_', ' ') ?? 'User'}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-colors"
                >
                  <LogOut className="h-4 w-4" /> Sign out
                </button>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/auth/register"
                  className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-md border border-border text-foreground text-sm font-medium hover:bg-muted transition-colors"
                >
                  Sign Up
                </Link>
                <Link
                  href="/auth/login"
                  className="flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors shadow-sm"
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
