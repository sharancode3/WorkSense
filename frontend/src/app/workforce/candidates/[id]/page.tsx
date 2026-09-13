"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ChevronRight,
  ExternalLink,
  ShieldCheck,
  Clock,
  ArrowRight,
  FileCheck2,
} from "lucide-react";
import { getCandidateTwinApi } from "@/lib/api/workforce";
import { CandidateTwin } from "@/types/workforce";
import { useAuth } from "@/context/auth-context";

export default function CandidateTwinPage() {
  const params = useParams();
  const candId = params.id as string;
  const { roles } = useAuth();
  const canConvert = roles.some((r) => ["administrator", "hr", "recruiter"].includes(r));

  const [twin, setTwin] = useState<CandidateTwin | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"skills" | "evidence" | "timeline">("skills");

  useEffect(() => {
    if (!candId) return;
    const fetchTwin = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getCandidateTwinApi(candId);
        setTwin(data);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Failed to load Candidate Twin";
        setError(msg);
      } finally {
        setLoading(false);
      }
    };
    fetchTwin();
  }, [candId]);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-12 space-y-6">
        <div className="h-40 bg-surface-secondary animate-pulse rounded-lg border border-boundary-subtle" />
        <div className="h-64 bg-surface-secondary animate-pulse rounded-lg border border-boundary-subtle" />
      </div>
    );
  }

  if (error || !twin) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center">
        <div className="p-6 bg-surface rounded-lg border border-error-subtle text-error">
          <p className="font-semibold">{error || "Candidate profile not found."}</p>
          <Link href="/workforce/candidates" className="text-xs text-brand-primary underline mt-3 inline-block">
            &larr; Return to Candidate Directory
          </Link>
        </div>
      </div>
    );
  }

  const { candidate, skills = [], evidence = [], timeline = [], completeness_score = 0 } = twin;
  const completenessPct = Math.round(completeness_score > 1 ? completeness_score : completeness_score * 100);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-xs font-semibold text-content-muted uppercase tracking-wider">
        <Link href="/workforce/candidates" className="hover:text-content-primary">
          Candidates
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-content-primary">Candidate Digital Twin</span>
      </div>

      {/* Hero Profile Header */}
      <div className="p-6 rounded-lg border border-boundary-subtle bg-surface flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="h-16 w-16 rounded-full bg-brand-primary/10 text-brand-primary flex items-center justify-center font-bold text-2xl border border-brand-primary/20">
            {candidate.full_name?.charAt(0) || "C"}
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-bold text-content-primary">{candidate.full_name}</h1>
              <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-brand-primary/10 text-brand-primary border border-brand-primary/20">
                {candidate.status?.replace("_", " ")}
              </span>
            </div>
            <p className="text-xs text-content-secondary mt-1">{candidate.email}</p>
            {candidate.applied_role_title && (
              <p className="text-xs font-semibold text-brand-primary mt-1">
                Target Role: {candidate.applied_role_title}
              </p>
            )}
          </div>
        </div>

        {/* Profile Completeness & Actions */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 border-t sm:border-t-0 pt-4 sm:pt-0 border-boundary-subtle">
          <div className="space-y-1 w-44">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-content-muted">Completeness</span>
              <span className="text-brand-primary">{completenessPct}%</span>
            </div>
            <div className="h-2 w-full bg-surface-secondary rounded-full overflow-hidden border border-boundary-subtle">
              <div
                className="h-full bg-brand-primary rounded-full transition-all duration-500"
                style={{ width: `${completenessPct}%` }}
              />
            </div>
            <span className="text-[10px] text-content-muted">Evidence grounded</span>
          </div>

          {canConvert && candidate.status !== "converted" && (
            <Link
              href={`/workforce/candidates/${candidate.id}/convert`}
              className="inline-flex items-center gap-2 px-4 py-2 bg-brand-primary text-white text-xs font-semibold rounded-md hover:bg-opacity-90 transition-colors shadow-none"
            >
              <span>Convert to Employee</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-boundary-subtle space-x-6 text-xs font-semibold">
        <button
          onClick={() => setActiveTab("skills")}
          className={`pb-3 transition-colors ${
            activeTab === "skills"
              ? "border-b-2 border-brand-primary text-brand-primary font-bold"
              : "text-content-secondary hover:text-content-primary"
          }`}
        >
          Verified Skills ({skills.length})
        </button>
        <button
          onClick={() => setActiveTab("evidence")}
          className={`pb-3 transition-colors ${
            activeTab === "evidence"
              ? "border-b-2 border-brand-primary text-brand-primary font-bold"
              : "text-content-secondary hover:text-content-primary"
          }`}
        >
          Evidence Ledger ({evidence.length})
        </button>
        <button
          onClick={() => setActiveTab("timeline")}
          className={`pb-3 transition-colors ${
            activeTab === "timeline"
              ? "border-b-2 border-brand-primary text-brand-primary font-bold"
              : "text-content-secondary hover:text-content-primary"
          }`}
        >
          Audit Timeline ({timeline.length})
        </button>
      </div>

      {/* Tab Panels */}
      {activeTab === "skills" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {skills.length === 0 ? (
            <p className="text-xs text-content-muted italic col-span-2 py-8 text-center bg-surface border border-boundary-subtle rounded-lg">
              No verified skills on record yet.
            </p>
          ) : (
            skills.map((skill) => (
              <div
                key={skill.id}
                className="p-4 rounded-lg border border-boundary-subtle bg-surface flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-content-primary">{skill.skill_name}</h3>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-surface-secondary text-content-secondary border border-boundary-subtle">
                      {skill.skill_category}
                    </span>
                  </div>

                  {/* Level meter */}
                  <div className="mt-3 flex items-center gap-2">
                    <span className="text-xs text-content-muted font-medium">Proficiency:</span>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((lvl) => (
                        <span
                          key={lvl}
                          className={`h-2.5 w-6 rounded-sm border ${
                            lvl <= skill.proficiency_level
                              ? "bg-brand-primary border-brand-primary"
                              : "bg-surface-secondary border-boundary-subtle"
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-xs font-bold text-content-primary font-mono ml-1">
                      {skill.proficiency_level}/5
                    </span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-boundary-subtle flex items-center justify-between text-xs text-content-muted">
                  <span className="flex items-center gap-1.5 text-green-700 font-medium">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    {skill.verification_status || "Verified"}
                  </span>
                  <span>{skill.evidence_count || 1} linked artifacts</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === "evidence" && (
        <div className="space-y-3">
          {evidence.length === 0 ? (
            <p className="text-xs text-content-muted italic py-8 text-center bg-surface border border-boundary-subtle rounded-lg">
              No evidence records captured.
            </p>
          ) : (
            evidence.map((item) => (
              <div key={item.id} className="p-4 rounded-lg border border-boundary-subtle bg-surface space-y-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <FileCheck2 className="h-4 w-4 text-brand-primary" />
                    <span className="text-xs font-bold text-content-primary">{item.source_name}</span>
                    <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded bg-surface-secondary text-content-secondary border border-boundary-subtle">
                      {item.source_type}
                    </span>
                  </div>
                  <span className="text-[11px] text-content-muted">
                    Observed: {new Date(item.observed_at).toLocaleDateString()}
                  </span>
                </div>

                {item.extracted_claim && (
                  <p className="text-xs text-content-primary bg-surface-secondary/40 p-2.5 rounded border border-boundary-subtle font-mono">
                    &quot;{item.extracted_claim}&quot;
                  </p>
                )}

                {item.uri && (
                  <div className="pt-2 flex items-center justify-between text-xs">
                    <a
                      href={item.uri}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-brand-primary hover:underline font-medium text-[11px]"
                    >
                      <span>{item.uri}</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === "timeline" && (
        <div className="p-6 rounded-lg border border-boundary-subtle bg-surface space-y-4">
          {timeline.length === 0 ? (
            <p className="text-xs text-content-muted italic text-center py-4">No chronological events logged.</p>
          ) : (
            <div className="relative pl-6 border-l-2 border-boundary-subtle space-y-6">
              {timeline.map((evt) => (
                <div key={evt.id} className="relative">
                  <div className="absolute -left-[31px] top-0.5 h-3.5 w-3.5 rounded-full bg-brand-primary border-2 border-surface" />
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-content-primary">{evt.title}</span>
                      <span className="text-[10px] text-content-muted flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(evt.occurred_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-xs text-content-secondary mt-1">{evt.description}</p>
                    {evt.actor_name && (
                      <p className="text-[11px] text-brand-primary font-medium mt-0.5">By: {evt.actor_name}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
