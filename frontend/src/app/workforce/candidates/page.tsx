"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { UserSearch, ChevronRight, ArrowRight, CheckCircle2 } from "lucide-react";
import { listCandidatesApi } from "@/lib/api/workforce";
import { CandidateProfile } from "@/types/workforce";
import { useAuth } from "@/context/auth-context";

export default function CandidatesPage() {
  const { roles } = useAuth();
  const canConvert = roles.some((r) => ["administrator", "hr", "recruiter"].includes(r));

  const [candidates, setCandidates] = useState<CandidateProfile[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCandidates = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await listCandidatesApi({
        status: statusFilter || undefined,
      });
      setCandidates(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load candidates";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCandidates();
  }, [statusFilter]);

  const filteredCandidates = candidates.filter((c) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return c.full_name?.toLowerCase().includes(q) || c.email?.toLowerCase().includes(q);
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "offer_accepted":
        return "bg-brand-primary/10 text-brand-primary border-brand-primary/20";
      case "converted":
        return "bg-green-100 text-green-800 border-green-200";
      case "interviewing":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "offered":
        return "bg-purple-100 text-purple-800 border-purple-200";
      default:
        return "bg-surface-secondary text-content-secondary border-boundary-subtle";
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
            <span className="text-content-primary">Talent Pipeline</span>
          </div>
          <h1 className="text-2xl font-bold text-content-primary mt-1">Candidate Profiles & Digital Twins</h1>
          <p className="text-sm text-content-secondary mt-1">
            Auditable pre-employment profiles with skill evidence ledger and single-click idempotent employee conversion.
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3 bg-surface p-3 border border-boundary-subtle rounded-lg">
        <div className="relative flex-1 w-full">
          <input
            type="text"
            placeholder="Search by candidate name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3 py-1.5 text-xs border border-boundary-subtle rounded bg-surface focus:outline-none focus:border-brand-primary"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-semibold text-content-primary whitespace-nowrap">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs px-3 py-1.5 border border-boundary-subtle rounded bg-surface focus:outline-none focus:border-brand-primary w-full sm:w-auto"
          >
            <option value="">All Statuses</option>
            <option value="offer_accepted">Offer Accepted</option>
            <option value="interviewing">Interviewing</option>
            <option value="offered">Offered</option>
            <option value="converted">Converted</option>
          </select>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-4 rounded-md border border-error-subtle bg-error-subtle/10 text-error text-sm">
          {error}
        </div>
      )}

      {/* Candidates List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-surface-secondary animate-pulse rounded-lg border border-boundary-subtle" />
          ))}
        </div>
      ) : filteredCandidates.length === 0 ? (
        <div className="text-center py-16 bg-surface rounded-lg border border-boundary-subtle">
          <UserSearch className="h-10 w-10 text-content-muted mx-auto mb-3" />
          <p className="text-sm font-semibold text-content-primary">No candidates found</p>
          <p className="text-xs text-content-secondary mt-1">Try adjusting your filters or search keywords.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredCandidates.map((candidate) => (
            <div
              key={candidate.id}
              className="p-5 rounded-lg border border-boundary-subtle bg-surface hover:border-brand-primary transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-full bg-brand-primary/10 text-brand-primary flex items-center justify-center font-bold text-sm border border-brand-primary/20">
                  {candidate.full_name?.charAt(0) || "C"}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-content-primary">{candidate.full_name}</h3>
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${getStatusBadge(
                        candidate.status
                      )}`}
                    >
                      {candidate.status?.replace("_", " ")}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-content-secondary mt-1">
                    <span>{candidate.email}</span>
                    {candidate.applied_role_title && (
                      <span className="text-brand-primary font-medium">Role: {candidate.applied_role_title}</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 self-end md:self-auto">
                <Link
                  href={`/workforce/candidates/${candidate.id}`}
                  className="px-3 py-1.5 border border-boundary-subtle bg-surface text-content-primary text-xs font-semibold rounded hover:bg-surface-secondary transition-colors"
                >
                  View Digital Twin
                </Link>

                {canConvert && candidate.status !== "converted" && (
                  <Link
                    href={`/workforce/candidates/${candidate.id}/convert`}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-brand-primary text-white text-xs font-semibold rounded hover:bg-opacity-90 transition-colors"
                  >
                    <span>Convert to Employee</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                )}

                {candidate.status === "converted" && (
                  <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-green-50 text-green-700 text-xs font-medium rounded border border-green-200">
                    <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                    Converted
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
