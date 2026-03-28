import Link from "next/link";
import { ShieldCheck, User, PlusCircle, Calculator } from "lucide-react";

export default function Navbar() {
  return (
    <nav className="sticky top-0 z-50 w-full glass border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-8 w-8 text-primary animate-pulse" />
            <Link href="/" className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
              EnsureVault
            </Link>
          </div>
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-8">
              <Link href="/customer/dashboard" className="flex items-center gap-2 text-foreground/80 hover:text-primary transition-colors">
                <User className="h-4 w-4" /> Dashboard
              </Link>
              <Link href="/customer/claims/new" className="flex items-center gap-2 text-foreground/80 hover:text-primary transition-colors">
                <PlusCircle className="h-4 w-4" /> New Claim
              </Link>
              <Link href="/admin/policies/create" className="flex items-center gap-2 text-foreground/80 hover:text-primary transition-colors">
                <ShieldCheck className="h-4 w-4" /> Management
              </Link>
              <Link href="/premium-calculator" className="flex items-center gap-2 text-foreground/80 hover:text-primary transition-colors">
                <Calculator className="h-4 w-4" /> Calculator
              </Link>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
