"use client";

import React, { useEffect, useState } from "react";
import { FileText, ChevronRight, Plus, History, ExternalLink } from "lucide-react";
import { listPoliciesApi, createPolicyVersionApi } from "@/lib/api/workforce";
import { PolicyDocument } from "@/types/workforce";
import { useAuth } from "@/context/auth-context";

export default function PoliciesPage() {
  const { roles } = useAuth();
  const canPublish = roles.some((r) => ["administrator", "hr"].includes(r));

  const [policies, setPolicies] = useState<PolicyDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // History Drawer / Modal
  const [selectedPolicy, setSelectedPolicy] = useState<PolicyDocument | null>(null);

  // Upload New Version Modal
  const [isVersionModalOpen, setIsVersionModalOpen] = useState(false);
  const [targetPolicyId, setTargetPolicyId] = useState("");
  const [versionNumber, setVersionNumber] = useState("");
  const [effectiveDate, setEffectiveDate] = useState(new Date().toISOString().split("T")[0]);
  const [documentUrl, setDocumentUrl] = useState("");
  const [summary, setSummary] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [versionError, setVersionError] = useState<string | null>(null);

  const fetchPolicies = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await listPoliciesApi();
      setPolicies(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load policies";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPolicies();
  }, []);

  const handleCreateVersion = async (e: React.FormEvent) => {
    e.preventDefault();
    setVersionError(null);
    if (!targetPolicyId || !versionNumber) {
      setVersionError("Policy and version number are required.");
      return;
    }

    try {
      setSubmitting(true);
      await createPolicyVersionApi(targetPolicyId, {
        version_number: versionNumber.trim(),
        effective_date: effectiveDate,
        file_name: `policy-v${versionNumber}.pdf`,
        storage_path: documentUrl.trim() || `policies/doc-v${versionNumber}.pdf`,
        sha256_hash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
        supersede_previous: true,
      });
      setIsVersionModalOpen(false);
      setVersionNumber("");
      setDocumentUrl("");
      setSummary("");
      fetchPolicies();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to publish policy version";
      setVersionError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-boundary-subtle pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-content-muted uppercase tracking-wider">
            <span>Workforce Foundation</span>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="text-content-primary">Governance</span>
          </div>
          <h1 className="text-2xl font-bold text-content-primary mt-1">Policy Governance & Version Ledger</h1>
          <p className="text-sm text-content-secondary mt-1">
            Centrally governed compliance documents, audit-tracked version supersessions, and effective date registries.
          </p>
        </div>

        {canPublish && (
          <button
            onClick={() => {
              setTargetPolicyId(policies[0]?.id || "");
              setIsVersionModalOpen(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-brand-primary text-white text-xs font-semibold rounded-md hover:bg-opacity-90 transition-colors self-start sm:self-auto"
          >
            <Plus className="h-4 w-4" />
            Publish Version
          </button>
        )}
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-4 rounded-md border border-error-subtle bg-error-subtle/10 text-error text-sm">
          {error}
        </div>
      )}

      {/* Policy Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-40 bg-surface-secondary animate-pulse rounded-lg border border-boundary-subtle" />
          ))}
        </div>
      ) : policies.length === 0 ? (
        <div className="text-center py-16 bg-surface rounded-lg border border-boundary-subtle">
          <FileText className="h-10 w-10 text-content-muted mx-auto mb-3" />
          <p className="text-sm font-semibold text-content-primary">No policy documents found</p>
          <p className="text-xs text-content-secondary mt-1">Upload an enterprise workforce policy to begin.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {policies.map((policy) => {
            const activeVer = policy.active_version;
            return (
              <div
                key={policy.id}
                className="p-5 rounded-lg border border-boundary-subtle bg-surface flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-brand-primary flex-shrink-0" />
                      <h2 className="text-base font-bold text-content-primary">{policy.title}</h2>
                    </div>
                    {activeVer && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-green-100 text-green-800 border border-green-200 uppercase whitespace-nowrap">
                        v{activeVer.version_number} &bull; {activeVer.status}
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-brand-primary font-medium mt-1">Category: {policy.category}</p>
                  {policy.description && (
                    <p className="text-xs text-content-secondary mt-2 line-clamp-2">{policy.description}</p>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-boundary-subtle flex items-center justify-between text-xs">
                  <span className="text-content-muted text-[11px]">
                    {activeVer ? `Effective: ${activeVer.effective_date}` : "No active version"}
                  </span>

                  <button
                    onClick={() => setSelectedPolicy(policy)}
                    className="inline-flex items-center gap-1.5 text-brand-primary hover:underline font-semibold text-xs"
                  >
                    <History className="h-3.5 w-3.5" />
                    <span>Version History ({policy.versions?.length || 1})</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Version History Modal */}
      {selectedPolicy && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-surface border border-boundary-subtle rounded-lg max-w-lg w-full p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-bold text-content-primary">{selectedPolicy.title}</h3>
                <p className="text-xs text-content-secondary">Complete auditable revision history</p>
              </div>
              <button
                onClick={() => setSelectedPolicy(null)}
                className="text-content-muted hover:text-content-primary text-sm p-1"
              >
                &times;
              </button>
            </div>

            <div className="divide-y divide-boundary-subtle max-h-80 overflow-y-auto">
              {(selectedPolicy.versions || [selectedPolicy.active_version].filter(Boolean)).map((v, idx) => (
                <div key={v?.id || idx} className="py-3 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-content-primary font-mono">Version {v?.version_number}</span>
                    <span
                      className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${
                        v?.status === "active"
                          ? "bg-green-100 text-green-800"
                          : "bg-surface-secondary text-content-muted"
                      }`}
                    >
                      {v?.status}
                    </span>
                  </div>
                  <div className="text-content-muted text-[11px]">Effective Date: {v?.effective_date}</div>
                  {v?.summary && <div className="text-content-secondary mt-1">{v.summary}</div>}
                  {v?.document_url && (
                    <a
                      href={v.document_url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-brand-primary hover:underline text-[11px] pt-1"
                    >
                      <span>Download Artifact</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-boundary-subtle flex justify-end">
              <button
                onClick={() => setSelectedPolicy(null)}
                className="px-4 py-2 text-xs font-semibold bg-surface-secondary hover:bg-surface-secondary/80 rounded"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Publish New Version Modal */}
      {isVersionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-surface border border-boundary-subtle rounded-lg max-w-md w-full p-6 space-y-4">
            <h3 className="text-lg font-bold text-content-primary">Publish New Policy Version</h3>
            <p className="text-xs text-content-secondary">
              Upload an updated revision. The existing version will automatically transition to superseded status.
            </p>

            {versionError && (
              <div className="p-3 bg-error-subtle/10 border border-error-subtle text-error text-xs rounded">
                {versionError}
              </div>
            )}

            <form onSubmit={handleCreateVersion} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-content-primary mb-1">Select Policy</label>
                <select
                  required
                  value={targetPolicyId}
                  onChange={(e) => setTargetPolicyId(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-boundary-subtle rounded bg-surface focus:outline-none focus:border-brand-primary"
                >
                  {policies.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title} ({p.category})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-content-primary mb-1">Version Number</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 4.2"
                    value={versionNumber}
                    onChange={(e) => setVersionNumber(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-boundary-subtle rounded bg-surface focus:outline-none focus:border-brand-primary font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-content-primary mb-1">Effective Date</label>
                  <input
                    type="date"
                    required
                    value={effectiveDate}
                    onChange={(e) => setEffectiveDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-boundary-subtle rounded bg-surface focus:outline-none focus:border-brand-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-content-primary mb-1">Document URL / Storage Path</label>
                <input
                  type="text"
                  placeholder="https://vault.company.local/policies/v4.2.pdf"
                  value={documentUrl}
                  onChange={(e) => setDocumentUrl(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-boundary-subtle rounded bg-surface focus:outline-none focus:border-brand-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-content-primary mb-1">Revision Summary</label>
                <textarea
                  rows={3}
                  placeholder="Key changes introduced in this release..."
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-boundary-subtle rounded bg-surface focus:outline-none focus:border-brand-primary"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-boundary-subtle">
                <button
                  type="button"
                  onClick={() => setIsVersionModalOpen(false)}
                  className="px-3 py-1.5 text-xs font-medium text-content-secondary hover:text-content-primary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 text-xs font-semibold bg-brand-primary text-white rounded hover:bg-opacity-90 disabled:opacity-50"
                >
                  {submitting ? "Publishing..." : "Publish Version"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
