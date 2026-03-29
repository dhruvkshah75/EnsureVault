import Link from 'next/link';
import { FileText, Clock, AlertCircle } from 'lucide-react';

export default function CustomerDashboard() {
  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Customer Dashboard</h1>
          <p className="text-muted-foreground mt-2">Welcome back. Here&apos;s an overview of your portfolio.</p>
        </div>
        <Link
          href="/customer/claims/new"
          className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-3 rounded-full font-medium transition-colors shadow-lg shadow-primary/25 flex items-center gap-2"
        >
          <AlertCircle className="w-5 h-5" /> Report Incident
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass-card p-6 border-t-4 border-t-primary">
          <div className="flex items-center gap-3 mb-6">
            <FileText className="w-6 h-6 text-primary" />
            <h2 className="text-2xl font-semibold">Active Policies</h2>
          </div>
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="p-4 rounded-xl border border-white/10 bg-white/5 dark:bg-black/20 hover:bg-white/10 transition-colors">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-lg">{i === 1 ? 'Comprehensive Health Care' : 'Auto Insurance Plus'}</h3>
                    <p className="text-sm text-muted-foreground">Policy #EV-{84392 + i}</p>
                  </div>
                  <span className="px-3 py-1 bg-green-500/10 text-green-600 dark:text-green-400 rounded-full text-xs font-medium border border-green-500/20">
                    Active
                  </span>
                </div>
                <div className="mt-4 flex justify-between text-sm">
                  <span className="text-muted-foreground">Coverage: $100,000</span>
                  <Link href={`/customer/policies/${i}`} className="text-primary font-medium hover:underline">View details &rarr;</Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-card p-6 border-t-4 border-t-secondary">
          <div className="flex items-center gap-3 mb-6">
            <Clock className="w-6 h-6 text-secondary" />
            <h2 className="text-2xl font-semibold">Recent Claims</h2>
          </div>
          <div className="space-y-4">
            <div className="p-4 rounded-xl border border-white/10 bg-white/5 dark:bg-black/20 hover:bg-white/10 transition-colors">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-lg">Minor Fender Bender</h3>
                  <p className="text-sm text-muted-foreground">Claim #CLM-9921</p>
                </div>
                <span className="px-3 py-1 bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 rounded-full text-xs font-medium border border-yellow-500/20">
                  Processing
                </span>
              </div>
              <div className="mt-4 pt-4 border-t border-white/10">
                <p className="text-sm text-muted-foreground">Submitted 2 days ago. Awaiting adjuster review.</p>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-white/10 bg-white/5 dark:bg-black/20 opacity-70">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-lg">Annual Checkup</h3>
                  <p className="text-sm text-muted-foreground">Claim #CLM-8834</p>
                </div>
                <span className="px-3 py-1 bg-gray-500/10 text-gray-600 dark:text-gray-400 rounded-full text-xs font-medium border border-gray-500/20">
                  Closed
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
