"use client";

import { useAuth } from "@/context/AuthContext";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Users, Plus, Trash2, Loader2, AlertCircle, CheckCircle } from "lucide-react";
import { useToast } from "@/components/Toast";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

interface Nominee {
  nom_id: number;
  policy_id: number;
  nominee_name: string;
  relation: string;
  share_percent: number;
}

interface Policy {
  policy_id: number;
  type_name: string;
  status: string;
}

export default function BeneficiariesPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [nominees, setNominees] = useState<Nominee[]>([]);
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);

  // Form state
  const [selectedPolicy, setSelectedPolicy] = useState<number | null>(null);
  const [nomineeName, setNomineeName] = useState("");
  const [relation, setRelation] = useState("");
  const [sharePercent, setSharePercent] = useState<number | null>(null);

  const customerId = user?.customer_id ?? 1;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [nomRes, polRes] = await Promise.all([
          fetch(`${API}/policies/nominees/all?customer_id=${customerId}`),
          fetch(`${API}/policies/?customer_id=${customerId}`),
        ]);

        const nomJson = await nomRes.json();
        const polJson = await polRes.json();

        setNominees(nomJson.data ?? []);
        setPolicies(polJson.data ?? []);
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : "Failed to load data";
        toast(message, "error");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [customerId, toast]);

  const handleAddNominee = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedPolicy || !nomineeName || !relation || sharePercent === null) {
      toast("Please fill all fields", "error");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`${API}/policies/nominees/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          policy_id: selectedPolicy,
          nominee_name: nomineeName,
          relation: relation,
          share_percent: sharePercent,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.detail ?? "Failed to add beneficiary");

      toast("Beneficiary added successfully!", "success");
      setNominees([
        ...nominees,
        {
          nom_id: json.data.nom_id,
          policy_id: selectedPolicy,
          nominee_name: nomineeName,
          relation: relation,
          share_percent: sharePercent,
        },
      ]);

      // Reset form
      setShowForm(false);
      setSelectedPolicy(null);
      setNomineeName("");
      setRelation("");
      setSharePercent(null);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Failed to add beneficiary";
      toast(message, "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteNominee = async (nomId: number) => {
    if (!confirm("Are you sure you want to remove this beneficiary?")) return;

    setDeleting(nomId);
    try {
      const res = await fetch(`${API}/policies/nominees/${nomId}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete beneficiary");

      toast("Beneficiary removed successfully!", "success");
      setNominees(nominees.filter((n) => n.nom_id !== nomId));
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Failed to delete";
      toast(message, "error");
    } finally {
      setDeleting(null);
    }
  };

  // Calculate remaining share percentage
  const totalShare = nominees.reduce((sum, n) => sum + n.share_percent, 0);
  const remainingShare = 100 - totalShare;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-40 gap-3 text-muted-foreground">
        <Loader2 className="w-6 h-6 animate-spin" />
        <span>Loading beneficiaries...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-premium-fade pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
            Beneficiaries
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage beneficiaries (nominees) for your insurance policies.
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="btn-primary flex items-center gap-2 shadow-lg shadow-primary/20 hover:-translate-y-0.5"
        >
          <Plus className="w-5 h-5" /> Add Beneficiary
        </button>
      </div>

      {/* Add Nominee Form */}
      {showForm && (
        <div className="glass-card p-6 border-l-4 border-l-primary animate-in fade-in slide-in-from-top-2">
          <h2 className="text-2xl font-bold mb-6">Add New Beneficiary</h2>
          <form onSubmit={handleAddNominee} className="space-y-6">
            {/* Policy Selection */}
            <div>
              <label className="block text-sm font-semibold mb-2">Select Policy</label>
              <select
                value={selectedPolicy ?? ""}
                onChange={(e) => setSelectedPolicy(parseInt(e.target.value))}
                className="form-input"
                disabled={submitting}
              >
                <option value="">Choose a policy...</option>
                {policies.map((p) => (
                  <option key={p.policy_id} value={p.policy_id}>
                    {p.type_name} (ID: {p.policy_id})
                  </option>
                ))}
              </select>
            </div>

            {/* Beneficiary Name */}
            <div>
              <label className="block text-sm font-semibold mb-2">Beneficiary Name</label>
              <input
                type="text"
                placeholder="Full name"
                value={nomineeName}
                onChange={(e) => setNomineeName(e.target.value)}
                className="form-input"
                disabled={submitting}
              />
            </div>

            {/* Relation */}
            <div>
              <label className="block text-sm font-semibold mb-2">Relation to Policyholder</label>
              <input
                type="text"
                placeholder="e.g., Spouse, Child, Parent, Sibling"
                value={relation}
                onChange={(e) => setRelation(e.target.value)}
                className="form-input"
                disabled={submitting}
              />
            </div>

            {/* Share Percentage */}
            <div>
              <label className="block text-sm font-semibold mb-2">
                Payout Share (%)
                {remainingShare < 100 && (
                  <span className="text-xs text-muted-foreground ml-2">
                    Available: {remainingShare}%
                  </span>
                )}
              </label>
              <input
                type="number"
                placeholder="1-100"
                min="1"
                max={remainingShare}
                value={sharePercent ?? ""}
                onChange={(e) => setSharePercent(e.target.value ? parseFloat(e.target.value) : null)}
                className="form-input"
                disabled={submitting || remainingShare === 0}
              />
              {remainingShare === 0 && (
                <p className="text-xs text-red-500 mt-1">
                  100% of shares already allocated. Remove a beneficiary first.
                </p>
              )}
            </div>

            {/* Buttons */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="btn-outline flex-1"
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary flex-1 flex items-center justify-center gap-2"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Adding...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    Add Beneficiary
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Nominees by Policy */}
      <div className="space-y-6">
        {policies.length === 0 ? (
          <div className="glass-card p-8 text-center border-l-4 border-l-muted">
            <AlertCircle className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-muted-foreground">
              No active policies found. You need at least one policy to add beneficiaries.
            </p>
            <Link href="/customer/policies/request" className="text-primary hover:underline mt-2 inline-block">
              Request a Policy
            </Link>
          </div>
        ) : (
          policies.map((policy) => {
            const policyNominees = nominees.filter((n) => n.policy_id === policy.policy_id);
            const policyShare = policyNominees.reduce((sum, n) => sum + n.share_percent, 0);

            return (
              <div key={policy.policy_id} className="glass-card p-6 border-l-4 border-l-primary">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-primary/10 rounded-lg">
                      <Users className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">{policy.type_name} Insurance</h3>
                      <p className="text-xs text-muted-foreground">Policy ID: {policy.policy_id}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold">
                      {policyShare}% <span className="text-xs text-muted-foreground">allocated</span>
                    </p>
                  </div>
                </div>

                {policyNominees.length === 0 ? (
                  <p className="text-muted-foreground text-sm py-4 text-center border border-dashed border-border rounded-lg">
                    No beneficiaries added yet
                  </p>
                ) : (
                  <div className="space-y-3">
                    {policyNominees.map((nominee) => (
                      <div
                        key={nominee.nom_id}
                        className="p-4 rounded-lg bg-background/40 border border-border/50 hover:bg-background/60 transition-colors flex items-center justify-between group"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <div className="w-2 h-2 rounded-full bg-primary" />
                            <div>
                              <h4 className="font-semibold text-sm">{nominee.nominee_name}</h4>
                              <p className="text-xs text-muted-foreground">
                                {nominee.relation} • {nominee.share_percent}% share
                              </p>
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => handleDeleteNominee(nominee.nom_id)}
                          disabled={deleting === nominee.nom_id}
                          className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50"
                          title="Remove beneficiary"
                        >
                          {deleting === nominee.nom_id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
