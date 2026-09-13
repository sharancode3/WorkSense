"use client";

import React, { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, RefreshCw, ShieldAlert } from "lucide-react";
import { getDataQualitySummaryApi, resolveDataQualityIssueApi } from "@/lib/api/workforce";
import { DataQualityAuditResponse, DataQualityIssue } from "@/types/workforce";
import { useAuth } from "@/context/auth-context";

export default function DataQualityPage() {
  const { roles } = useAuth();
  const canResolve = roles.some((r) => ["administrator", "hr"].includes(r));

  const [auditData, setAuditData] = useState<DataQualityAuditResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Resolve Modal
  const [selectedIssue, setSelectedIssue] = useState<DataQualityIssue | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [resolving, setResolving] = useState(false);

  const fetchAudit = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getDataQualitySummaryApi();
      setAuditData(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to run data quality audit";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAudit();
  }, []);

  const handleResolve = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIssue) return;

    try {
      setResolving(true);
      await resolveDataQualityIssueApi(selectedIssue.id);
      setSelectedIssue(null);
      setResolutionNotes("");
      fetchAudit();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to resolve issue");
    } finally {
      setResolving(false);
    }
  };

  const issues = auditData?.issues || [];
  const openIssues = issues.filter((i) => i.status !== "resolved");

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-boundary-subtle pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-content-muted uppercase tracking-wider">
            <span>Workforce Foundation</span>
            <span>&bull;</span>
            <span className="text-content-primary">Automated Governance</span>
          </div>
          <h1 className="text-2xl font-bold text-content-primary mt-1">Data Quality & Health Engine</h1>
          <p className="text-sm text-content-secondary mt-1">
            Rules-based deterministic integrity engine detecting orphaned nodes, unverified claims, and hierarchy cycles.
          </p>
        </div>

        <button
          onClick={fetchAudit}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 bg-surface border border-boundary-subtle text-content-primary text-xs font-semibold rounded-md hover:bg-surface-secondary transition-colors self-start sm:self-auto disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          Run Audit Scan
        </button>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-4 rounded-md border border-error-subtle bg-error-subtle/10 text-error text-sm">
          {error}
        </div>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-lg border border-boundary-subtle bg-surface">
          <span className="text-[10px] uppercase font-semibold text-content-muted block">Total Issues</span>
          <span className="text-2xl font-bold text-content-primary font-mono mt-1 block">
            {auditData?.total || 0}
          </span>
        </div>

        <div className="p-4 rounded-lg border border-error-subtle/30 bg-error-subtle/5">
          <span className="text-[10px] uppercase font-semibold text-error block">Critical Violations</span>
          <span className="text-2xl font-bold text-error font-mono mt-1 block">
            {auditData?.critical_count || 0}
          </span>
        </div>

        <div className="p-4 rounded-lg border border-amber-200 bg-amber-50/40">
          <span className="text-[10px] uppercase font-semibold text-amber-700 block">Warnings</span>
          <span className="text-2xl font-bold text-amber-700 font-mono mt-1 block">
            {auditData?.warning_count || 0}
          </span>
        </div>

        <div className="p-4 rounded-lg border border-blue-200 bg-blue-50/40">
          <span className="text-[10px] uppercase font-semibold text-blue-700 block">Advisories</span>
          <span className="text-2xl font-bold text-blue-700 font-mono mt-1 block">
            {auditData?.info_count || 0}
          </span>
        </div>
      </div>

      {/* Issues Table */}
      {loading ? (
        <div className="h-64 bg-surface-secondary animate-pulse rounded-lg border border-boundary-subtle" />
      ) : openIssues.length === 0 ? (
        <div className="text-center py-16 bg-surface rounded-lg border border-boundary-subtle">
          <CheckCircle2 className="h-10 w-10 text-green-600 mx-auto mb-3" />
          <p className="text-sm font-bold text-content-primary">Workforce Data Layer is 100% Healthy</p>
          <p className="text-xs text-content-secondary mt-1">
            Zero orphaned entities, cyclical hierarchies, or ungrounded evidence claims detected.
          </p>
        </div>
      ) : (
        <div className="border border-boundary-subtle rounded-lg bg-surface overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-secondary border-b border-boundary-subtle text-content-muted uppercase font-semibold">
                <tr>
                  <th className="px-4 py-3">Severity</th>
                  <th className="px-4 py-3">Rule Violation</th>
                  <th className="px-4 py-3">Affected Target</th>
                  <th className="px-4 py-3">Diagnostic Description</th>
                  <th className="px-4 py-3">Recommended Remediation</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-boundary-subtle">
                {openIssues.map((issue) => {
                  const isCrit = issue.severity?.toLowerCase() === "critical";
                  const isWarn = issue.severity?.toLowerCase() === "warning";

                  return (
                    <tr key={issue.id} className="hover:bg-surface-secondary/30 transition-colors">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                            isCrit
                              ? "bg-error-subtle/10 text-error border-error-subtle"
                              : isWarn
                              ? "bg-amber-50 text-amber-800 border-amber-200"
                              : "bg-blue-50 text-blue-800 border-blue-200"
                          }`}
                        >
                          {isCrit ? (
                            <ShieldAlert className="h-3 w-3" />
                          ) : (
                            <AlertTriangle className="h-3 w-3" />
                          )}
                          {issue.severity}
                        </span>
                      </td>

                      <td className="px-4 py-3 font-semibold text-content-primary whitespace-nowrap">
                        {issue.rule_name || issue.rule_id}
                      </td>

                      <td className="px-4 py-3">
                        <span className="font-mono text-[11px] text-content-secondary">
                          {issue.entity_type}:{issue.entity_id.slice(0, 8)}...
                        </span>
                      </td>

                      <td className="px-4 py-3 text-content-primary max-w-xs">{issue.description}</td>

                      <td className="px-4 py-3 text-content-secondary max-w-xs font-mono text-[11px]">
                        {issue.suggested_action}
                      </td>

                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        {canResolve && (
                          <button
                            onClick={() => setSelectedIssue(issue)}
                            className="px-3 py-1 bg-brand-primary text-white text-[11px] font-semibold rounded hover:bg-opacity-90"
                          >
                            Resolve
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Resolve Issue Modal */}
      {selectedIssue && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-surface border border-boundary-subtle rounded-lg max-w-md w-full p-6 space-y-4">
            <h3 className="text-lg font-bold text-content-primary">Resolve Data Quality Discrepancy</h3>
            <p className="text-xs text-content-secondary">
              Acknowledge and mark this data discrepancy as remediated with an audit note.
            </p>

            <div className="p-3 rounded bg-surface-secondary/40 border border-boundary-subtle text-xs space-y-1">
              <div>
                <strong>Rule:</strong> {selectedIssue.rule_name || selectedIssue.rule_id}
              </div>
              <div>
                <strong>Target:</strong> {selectedIssue.entity_type} ({selectedIssue.entity_id})
              </div>
              <p className="text-content-secondary">{selectedIssue.description}</p>
            </div>

            <form onSubmit={handleResolve} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-content-primary mb-1">
                  Resolution Audit Notes
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Describe corrective actions taken..."
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-boundary-subtle rounded bg-surface focus:outline-none focus:border-brand-primary"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-boundary-subtle">
                <button
                  type="button"
                  onClick={() => setSelectedIssue(null)}
                  className="px-3 py-1.5 text-xs font-medium text-content-secondary hover:text-content-primary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={resolving}
                  className="px-4 py-2 text-xs font-semibold bg-brand-primary text-white rounded hover:bg-opacity-90 disabled:opacity-50"
                >
                  {resolving ? "Resolving..." : "Confirm Resolution"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
