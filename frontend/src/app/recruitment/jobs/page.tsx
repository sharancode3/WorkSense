"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { Plus, Search, Filter, Users, FileText, ArrowRight, Sparkles } from "lucide-react";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SearchInput } from "@/components/ui/search-input";
import { Select } from "@/components/ui/select";
import { EmptyState } from "@/components/feedback/empty-state";
import { InlineAlert } from "@/components/feedback/inline-alert";
import { Spinner } from "@/components/ui/spinner";
import { listJobOpeningsApi } from "@/lib/api/recruitment";
import { JobOpening } from "@/types/recruitment";
import { useAuth } from "@/context/auth-context";

export default function JobOpeningsPage() {
  const { roles } = useAuth();
  const [jobs, setJobs] = useState<JobOpening[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const canCreate = roles.some((r) => ["recruiter", "hr", "administrator"].includes(r));

  useEffect(() => {
    async function loadJobs() {
      try {
        setIsLoading(true);
        setError(null);
        const data = await listJobOpeningsApi();
        setJobs(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load job openings");
      } finally {
        setIsLoading(false);
      }
    }
    loadJobs();
  }, []);

  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      const matchesSearch =
        searchQuery.trim() === "" ||
        job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.requisition_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (job.department_name && job.department_name.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesStatus = statusFilter === "all" || job.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [jobs, searchQuery, statusFilter]);

  return (
    <ProtectedRoute allowedRoles={["recruiter", "hr", "manager", "leadership", "administrator"]}>
      <div className="space-y-6">
        <PageHeader
          title="Job Requisitions"
          description="Manage active talent openings, review extracted candidate evidence, and inspect match rankings."
          actions={
            canCreate ? (
              <Link href="/recruitment/jobs/new">
                <Button variant="primary" size="sm" className="gap-1.5">
                  <Plus className="h-4 w-4" />
                  New Job Opening
                </Button>
              </Link>
            ) : undefined
          }
        />

        {error && (
          <InlineAlert variant="danger" title="Error Loading Openings">
            {error}
          </InlineAlert>
        )}

        {/* Filter bar */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="flex-1 max-w-md">
            <SearchInput
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by requisition code, title, or department..."
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-content-muted" />
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              options={[
                { value: "all", label: "All Statuses" },
                { value: "active", label: "Active" },
                { value: "draft", label: "Draft" },
                { value: "paused", label: "Paused" },
                { value: "closed", label: "Closed" },
              ]}
              className="w-40"
            />
          </div>
        </div>

        {/* Requisitions List */}
        {isLoading ? (
          <div className="flex justify-center items-center py-24">
            <Spinner size="lg" />
          </div>
        ) : filteredJobs.length === 0 ? (
          <EmptyState
            icon={<Search className="h-6 w-6" />}
            title="No job requisitions found"
            description={
              searchQuery || statusFilter !== "all"
                ? "Try adjusting your search criteria or filter."
                : "Create your first job opening to begin deterministic candidate evaluation."
            }
            action={
              canCreate && (searchQuery || statusFilter !== "all") ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearchQuery("");
                    setStatusFilter("all");
                  }}
                >
                  Clear Filters
                </Button>
              ) : canCreate ? (
                <Link href="/recruitment/jobs/new">
                  <Button variant="primary" size="sm">
                    Create Job Opening
                  </Button>
                </Link>
              ) : undefined
            }
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredJobs.map((job) => (
              <Card
                key={job.id}
                className="p-5 border border-boundary-subtle hover:border-interactive transition-colors space-y-4"
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs px-2 py-0.5 rounded bg-surface-subtle text-content-primary font-semibold border border-boundary-subtle">
                        {job.requisition_code}
                      </span>
                      <Badge
                        variant={
                          job.status === "active"
                            ? "success"
                            : job.status === "draft"
                            ? "warning"
                            : "muted"
                        }
                        size="sm"
                      >
                        {job.status.toUpperCase()}
                      </Badge>
                      <span className="text-xs px-2 py-0.5 rounded bg-brand-primary/10 text-brand-primary font-medium">
                        Req Version v{job.current_requirement_version}
                      </span>
                    </div>

                    <h3 className="text-lg font-semibold text-content-primary">
                      {job.title}
                    </h3>

                    <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-content-muted">
                      {job.department_name && (
                        <span>Dept: {job.department_name}</span>
                      )}
                      <span>Location: {job.location || "Remote"}</span>
                      <span>Type: {job.employment_type}</span>
                      <span>Target Headcount: {job.target_headcount}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 pt-2 lg:pt-0 border-t lg:border-t-0 border-boundary-subtle">
                    <Link href={`/recruitment/jobs/${job.id}`}>
                      <Button variant="outline" size="sm" className="gap-1 text-xs">
                        <FileText className="h-3.5 w-3.5" />
                        Criteria & Version
                      </Button>
                    </Link>

                    <Link href={`/recruitment/jobs/${job.id}/upload`}>
                      <Button variant="outline" size="sm" className="gap-1 text-xs">
                        <Users className="h-3.5 w-3.5" />
                        Upload Resumes
                      </Button>
                    </Link>

                    <Link href={`/recruitment/jobs/${job.id}/ranking`}>
                      <Button variant="primary" size="sm" className="gap-1 text-xs">
                        <Sparkles className="h-3.5 w-3.5" />
                        Rankings & Evidence
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
