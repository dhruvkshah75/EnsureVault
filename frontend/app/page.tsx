import Link from "next/link";
import { ShieldCheck, Activity, Users } from "lucide-react";

export default function Home() {
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl mt-10">
        <Link href="/customer/dashboard" className="glass-card p-6 flex flex-col items-center text-center space-y-4 hover:scale-105 transition-transform cursor-pointer">
          <div className="p-4 bg-primary/10 rounded-full">
            <Users className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-2xl font-semibold">Customer Portal</h2>
          <p className="text-muted-foreground">Manage your policies, view history, and submit claims effortlessly.</p>
        </Link>
        <Link href="/admin/policies/create" className="glass-card p-6 flex flex-col items-center text-center space-y-4 hover:scale-105 transition-transform cursor-pointer">
          <div className="p-4 bg-secondary/10 rounded-full">
            <ShieldCheck className="h-8 w-8 text-secondary" />
          </div>
          <h2 className="text-2xl font-semibold">Admin & Agents</h2>
          <p className="text-muted-foreground">Design new insurance plans, adjust rules, and overview the system.</p>
        </Link>
        <Link href="/premium-calculator" className="glass-card p-6 flex flex-col items-center text-center space-y-4 hover:scale-105 transition-transform cursor-pointer">
          <div className="p-4 bg-accent/10 rounded-full">
            <Activity className="h-8 w-8 text-accent" />
          </div>
          <h2 className="text-2xl font-semibold">Risk Engine</h2>
          <p className="text-muted-foreground">Dynamically calculate premiums incorporating multi-factor risk logic.</p>
        </Link>
      </div>
    </div>
  );
}
