"use client";

import { useState } from "react";
import { UploadCloud, CheckCircle2 } from "lucide-react";

export default function NewClaim() {
  const [submitted, setSubmitted] = useState(false);

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center py-20 animate-fade-in space-y-6">
        <div className="p-6 bg-green-500/10 rounded-full">
          <CheckCircle2 className="w-16 h-16 text-green-500" />
        </div>
        <h2 className="text-3xl font-bold">Claim Submitted Successfully</h2>
        <p className="text-muted-foreground text-lg max-w-md text-center">
          Your claim #CLM-10492 has been received and is under review by our adjusters.
        </p>
        <button className="px-6 py-2 bg-primary text-primary-foreground rounded-full hover:bg-primary/90 transition mt-4" onClick={() => window.location.href = '/customer/dashboard'}>
          Return to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-slide-up">
      <div>
        <h1 className="text-4xl font-bold tracking-tight">Report an Incident</h1>
        <p className="text-muted-foreground mt-2">Please provide details about the incident to initiate a new claim.</p>
      </div>

      <form 
        className="glass-card p-8 space-y-6"
        onSubmit={(e) => { e.preventDefault(); setSubmitted(true); }}
      >
        <div className="space-y-2">
          <label className="text-sm font-medium">Select Policy</label>
          <select className="w-full bg-white/5 border border-white/10 rounded-lg p-3 outline-none focus:ring-2 focus:ring-primary transition-all">
            <option value="1" className="text-black dark:text-white bg-background">Comprehensive Health Care (EV-84393)</option>
            <option value="2" className="text-black dark:text-white bg-background">Auto Insurance Plus (EV-84394)</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Incident Date</label>
          <input type="date" required className="w-full bg-white/5 border border-white/10 rounded-lg p-3 outline-none focus:ring-2 focus:ring-primary transition-all dark:[color-scheme:dark]" />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Description of Incident</label>
          <textarea 
            required 
            rows={4} 
            className="w-full bg-white/5 border border-white/10 rounded-lg p-3 outline-none focus:ring-2 focus:ring-primary transition-all placeholder:text-muted-foreground"
            placeholder="Please describe what happened in detail..."
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Supporting Documents</label>
          <div className="border-2 border-dashed border-white/20 rounded-xl p-8 text-center hover:bg-white/5 transition-colors cursor-pointer group">
            <UploadCloud className="w-10 h-10 mx-auto text-muted-foreground group-hover:text-primary transition-colors mb-4" />
            <p className="text-sm text-foreground font-medium">Click to upload or drag and drop</p>
            <p className="text-xs text-muted-foreground mt-1">SVG, PNG, JPG, PDF (max. 10MB)</p>
          </div>
        </div>

        <button type="submit" className="w-full py-4 rounded-xl bg-gradient-to-r from-primary to-secondary text-white font-bold hover:opacity-90 transition-opacity shadow-lg shadow-primary/20">
          Submit Claim
        </button>
      </form>
    </div>
  );
}
