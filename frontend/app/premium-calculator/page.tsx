"use client";

import { useState } from "react";
import { Activity, ShieldCheck, Zap } from "lucide-react";

export default function PremiumCalculator() {
  const [premium, setPremium] = useState<number | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  const calculatePremium = (e: React.FormEvent) => {
    e.preventDefault();
    setIsCalculating(true);
    setPremium(null);
    
    // Simulate database calculation based on risk factors
    setTimeout(() => {
      setPremium(1250.00); // Mock risk-based premium calculation
      setIsCalculating(false);
    }, 1500);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-slide-up">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold tracking-tight">Risk & Premium Engine</h1>
        <p className="text-muted-foreground mt-2 max-w-2xl mx-auto">
          Dynamically calculate insurance premiums using our multi-factor risk assessment algorithm.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-10">
        <div className="glass-card p-8">
          <form className="space-y-6" onSubmit={calculatePremium}>
            <div className="space-y-2">
              <label className="text-sm font-medium">Insurance Type</label>
              <select className="w-full bg-white/5 border border-white/10 rounded-lg p-3 outline-none focus:ring-2 focus:ring-accent transition-all">
                <option className="text-black dark:text-white bg-background">Auto Insurance</option>
                <option className="text-black dark:text-white bg-background">Health Insurance</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Applicant Age</label>
              <input type="number" min="18" max="100" defaultValue="30" className="w-full bg-white/5 border border-white/10 rounded-lg p-3 outline-none focus:ring-2 focus:ring-accent transition-all" />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Risk Factors</label>
              <div className="space-y-3 mt-2">
                <label className="flex items-center gap-3 p-3 border border-white/10 rounded-lg hover:bg-white/5 cursor-pointer transition">
                  <input type="checkbox" className="w-5 h-5 accent-accent" />
                  <span className="text-sm">Previous Claims History (High Risk)</span>
                </label>
                <label className="flex items-center gap-3 p-3 border border-white/10 rounded-lg hover:bg-white/5 cursor-pointer transition">
                  <input type="checkbox" className="w-5 h-5 accent-accent" />
                  <span className="text-sm">High Value Asset / Sports Car</span>
                </label>
                <label className="flex items-center gap-3 p-3 border border-white/10 rounded-lg hover:bg-white/5 cursor-pointer transition opacity-50">
                  <input type="checkbox" className="w-5 h-5 accent-accent" disabled />
                  <span className="text-sm">Pre-existing Medical (Health Only)</span>
                </label>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={isCalculating}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-accent to-primary text-white font-bold hover:opacity-90 transition-opacity shadow-lg shadow-accent/20 flex justify-center items-center gap-2 disabled:opacity-50"
            >
              <Zap className="w-5 h-5" />
              {isCalculating ? "Running Risk Model..." : "Calculate Premium"}
            </button>
          </form>
        </div>

        <div className="flex flex-col justify-center">
          {isCalculating ? (
            <div className="text-center space-y-4 animate-pulse">
              <Activity className="w-16 h-16 text-accent mx-auto" />
              <h3 className="text-2xl font-semibold">Analyzing Risk Factors</h3>
              <p className="text-muted-foreground">Executing database stored procedures...</p>
            </div>
          ) : premium !== null ? (
            <div className="glass p-8 rounded-3xl text-center space-y-6 animate-fade-in border-accent/20 shadow-2xl shadow-accent/10">
              <ShieldCheck className="w-16 h-16 text-accent mx-auto" />
              <h3 className="text-xl font-medium text-muted-foreground">Estimated Annual Premium</h3>
              <div className="text-6xl font-extrabold bg-clip-text text-transparent bg-gradient-to-br from-black to-gray-500 dark:from-white dark:to-gray-400">
                ${premium.toFixed(2)}
              </div>
              <p className="text-sm text-accent bg-accent/10 px-4 py-2 rounded-full inline-block">
                Risk Adjusted Calculation Completed
              </p>
            </div>
          ) : (
            <div className="text-center space-y-4 opacity-50">
              <Activity className="w-16 h-16 text-muted-foreground mx-auto" />
              <p className="text-muted-foreground">Enter applicant details to calculate premium instantly.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
