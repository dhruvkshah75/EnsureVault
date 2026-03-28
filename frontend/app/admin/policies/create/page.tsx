"use client";

import { useState } from "react";
import { ShieldAlert } from "lucide-react";

export default function CreatePolicy() {
  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-slide-up">
      <div>
        <h1 className="text-4xl font-bold tracking-tight">Create Insurance Plan</h1>
        <p className="text-muted-foreground mt-2">Define new policy rules, base premiums, and coverage limits.</p>
      </div>

      <div className="bg-secondary/10 border border-secondary/20 p-4 rounded-xl flex items-start gap-4">
        <ShieldAlert className="w-6 h-6 text-secondary mt-1 shrink-0" />
        <div>
          <h3 className="font-semibold text-secondary">Admin & Agent Access Only</h3>
          <p className="text-sm text-foreground/80 mt-1">
            Modifications to base premiums and coverage limits are strictly monitored and logged for auditing purposes.
          </p>
        </div>
      </div>

      <form className="glass-card p-8 space-y-8" onSubmit={(e) => e.preventDefault()}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-medium">Plan Name</label>
            <input type="text" placeholder="e.g. Platinum Health Plus" required className="w-full bg-white/5 border border-white/10 rounded-lg p-3 outline-none focus:ring-2 focus:ring-secondary transition-all" />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Policy Category</label>
            <select className="w-full bg-white/5 border border-white/10 rounded-lg p-3 outline-none focus:ring-2 focus:ring-secondary transition-all">
              <option className="text-black dark:text-white bg-background">Health Insurance</option>
              <option className="text-black dark:text-white bg-background">Car Insurance</option>
              <option className="text-black dark:text-white bg-background">Home Insurance</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Base Premium ($)</label>
            <input type="number" min="0" placeholder="500.00" required className="w-full bg-white/5 border border-white/10 rounded-lg p-3 outline-none focus:ring-2 focus:ring-secondary transition-all" />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Maximum Coverage ($)</label>
            <input type="number" min="0" placeholder="100000.00" required className="w-full bg-white/5 border border-white/10 rounded-lg p-3 outline-none focus:ring-2 focus:ring-secondary transition-all" />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Deductible ($)</label>
            <input type="number" min="0" placeholder="1000.00" required className="w-full bg-white/5 border border-white/10 rounded-lg p-3 outline-none focus:ring-2 focus:ring-secondary transition-all" />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Coverage Rules & Conditions</label>
          <textarea 
            required 
            rows={4} 
            className="w-full bg-white/5 border border-white/10 rounded-lg p-3 outline-none focus:ring-2 focus:ring-secondary transition-all placeholder:text-muted-foreground"
            placeholder="Define the specific rules and exclusions for this policy..."
          />
        </div>

        <button type="submit" className="w-full py-4 rounded-xl bg-gradient-to-r from-secondary to-accent text-white font-bold hover:opacity-90 transition-opacity shadow-lg shadow-secondary/20">
          Publish New Plan
        </button>
      </form>
    </div>
  );
}
