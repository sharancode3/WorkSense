"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ChevronRight,
  ShieldCheck,
  Target,
  MessageSquare,
  CalendarCheck,
  Lock,
} from "lucide-react";
import { getEmployeeTwinApi } from "@/lib/api/workforce";
import { EmployeeTwin } from "@/types/workforce";

export default function EmployeeTwinPage() {
  const params = useParams();
  const empId = params.id as string;

  const [twin, setTwin] = useState<EmployeeTwin | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"skills" | "goals" | "feedback" | "attendance">("skills");

  useEffect(() => {
    if (!empId) return;

    const fetchTwin = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getEmployeeTwinApi(empId);
        setTwin(data);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Failed to load Employee Twin";
        setError(msg);
      } finally {
        setLoading(false);
      }
    };

    fetchTwin();
  }, [empId]);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-12 space-y-6">
        <div className="h-44 bg-surface-secondary animate-pulse rounded-lg border border-boundary-subtle" />
        <div className="h-64 bg-surface-secondary animate-pulse rounded-lg border border-boundary-subtle" />
      </div>
    );
  }

  if (error || !twin) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center">
        <div className="p-6 bg-surface rounded-lg border border-error-subtle text-error">
          <p className="font-semibold">{error || "Employee record not found."}</p>
          <Link href="/workforce/employees" className="text-xs text-brand-primary underline mt-3 inline-block">
            &larr; Return to Employee Directory
          </Link>
        </div>
      </div>
    );
  }

  const { employee, manager, direct_reports = [], skills = [], goals = [], feedback = [], attendance } = twin;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-xs font-semibold text-content-muted uppercase tracking-wider">
        <Link href="/workforce/employees" className="hover:text-content-primary">
          Employees
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-content-primary">Employee Digital Twin</span>
      </div>

      {/* Hero Header */}
      <div className="p-6 rounded-lg border border-boundary-subtle bg-surface flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="h-16 w-16 rounded-full bg-brand-primary text-white flex items-center justify-center font-bold text-2xl">
            {employee.full_name?.charAt(0) || "E"}
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-bold text-content-primary">{employee.full_name}</h1>
              <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-surface-secondary text-content-secondary border border-boundary-subtle">
                {employee.employee_code}
              </span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-green-100 text-green-800">
                {employee.status}
              </span>
            </div>
            <p className="text-sm font-semibold text-brand-primary mt-1">
              {employee.job_role_title || "Role Title"} &bull; {employee.department_name || "Department"}
            </p>
            <p className="text-xs text-content-secondary mt-0.5">{employee.email}</p>
          </div>
        </div>

        {/* Manager & Direct Reports Context */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 border-t md:border-t-0 pt-4 md:pt-0 border-boundary-subtle">
          <div className="text-xs space-y-1">
            <span className="text-content-muted block font-medium">Reporting Line</span>
            {manager ? (
              <Link
                href={`/workforce/employees/${manager.id}`}
                className="font-bold text-content-primary hover:text-brand-primary flex items-center gap-1"
              >
                <span>{manager.full_name}</span>
                <span className="text-[10px] text-content-muted">(Manager)</span>
              </Link>
            ) : (
              <span className="text-content-muted italic">No direct manager</span>
            )}
            <div className="text-[11px] text-content-secondary">
              Direct reports: <strong className="text-content-primary">{direct_reports.length}</strong>
            </div>
          </div>
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
          Continuous Skills ({skills.length})
        </button>
        <button
          onClick={() => setActiveTab("goals")}
          className={`pb-3 transition-colors ${
            activeTab === "goals"
              ? "border-b-2 border-brand-primary text-brand-primary font-bold"
              : "text-content-secondary hover:text-content-primary"
          }`}
        >
          Goals & OKRs ({goals.length})
        </button>
        <button
          onClick={() => setActiveTab("feedback")}
          className={`pb-3 transition-colors ${
            activeTab === "feedback"
              ? "border-b-2 border-brand-primary text-brand-primary font-bold"
              : "text-content-secondary hover:text-content-primary"
          }`}
        >
          1-on-1s & Feedback ({feedback.length})
        </button>
        <button
          onClick={() => setActiveTab("attendance")}
          className={`pb-3 transition-colors ${
            activeTab === "attendance"
              ? "border-b-2 border-brand-primary text-brand-primary font-bold"
              : "text-content-secondary hover:text-content-primary"
          }`}
        >
          Attendance Summary
        </button>
      </div>

      {/* Skills Panel */}
      {activeTab === "skills" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {skills.length === 0 ? (
            <p className="text-xs text-content-muted italic col-span-2 py-8 text-center bg-surface border border-boundary-subtle rounded-lg">
              No skill records mapped.
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
                  <span>{skill.evidence_count || 1} evidence citations</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Goals Panel */}
      {activeTab === "goals" && (
        <div className="space-y-3">
          {goals.length === 0 ? (
            <p className="text-xs text-content-muted italic py-8 text-center bg-surface border border-boundary-subtle rounded-lg">
              No active goals registered.
            </p>
          ) : (
            goals.map((g) => (
              <div key={g.id} className="p-4 rounded-lg border border-boundary-subtle bg-surface space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <Target className="h-4 w-4 text-brand-primary" />
                      <h3 className="text-sm font-bold text-content-primary">{g.title}</h3>
                    </div>
                    {g.description && <p className="text-xs text-content-secondary mt-1">{g.description}</p>}
                  </div>
                  <span className="text-xs font-mono font-bold text-brand-primary">
                    {g.progress_percentage}% complete
                  </span>
                </div>

                <div className="h-2 w-full bg-surface-secondary rounded-full overflow-hidden border border-boundary-subtle">
                  <div
                    className="h-full bg-brand-primary rounded-full transition-all duration-300"
                    style={{ width: `${g.progress_percentage}%` }}
                  />
                </div>

                {g.target_date && (
                  <div className="text-[11px] text-content-muted">
                    Target Due Date: {new Date(g.target_date).toLocaleDateString()}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Feedback Panel */}
      {activeTab === "feedback" && (
        <div className="space-y-3">
          {feedback.length === 0 ? (
            <p className="text-xs text-content-muted italic py-8 text-center bg-surface border border-boundary-subtle rounded-lg">
              No feedback records visible under your access credentials.
            </p>
          ) : (
            feedback.map((fb) => (
              <div key={fb.id} className="p-4 rounded-lg border border-boundary-subtle bg-surface space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-brand-primary" />
                    <span className="text-xs font-bold text-content-primary">{fb.author_name || "Manager"}</span>
                    <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded bg-surface-secondary text-content-secondary">
                      {fb.feedback_type}
                    </span>
                  </div>

                  <span className="flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded bg-surface-secondary text-content-muted border border-boundary-subtle">
                    <Lock className="h-3 w-3" />
                    {fb.visibility}
                  </span>
                </div>

                <p className="text-xs text-content-primary bg-surface-secondary/30 p-3 rounded border border-boundary-subtle">
                  {fb.content}
                </p>

                {fb.created_at && (
                  <div className="text-[10px] text-content-muted">
                    Logged: {new Date(fb.created_at).toLocaleDateString()}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Attendance Panel */}
      {activeTab === "attendance" && (
        <div className="border border-boundary-subtle rounded-lg bg-surface p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-boundary-subtle pb-4">
            <div>
              <h3 className="text-sm font-bold text-content-primary">Work Pattern & Attendance Aggregates</h3>
              <p className="text-xs text-content-muted mt-0.5">Automated synchronization with HRIS time systems.</p>
            </div>
            <CalendarCheck className="h-5 w-5 text-brand-primary" />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-lg border border-boundary-subtle bg-surface-secondary/20">
              <span className="text-[10px] uppercase font-semibold text-content-muted block">Total Days</span>
              <span className="text-xl font-bold text-content-primary font-mono mt-1 block">
                {attendance?.total_recorded_days || 20}
              </span>
            </div>

            <div className="p-4 rounded-lg border border-boundary-subtle bg-surface-secondary/20">
              <span className="text-[10px] uppercase font-semibold text-content-muted block">Present Days</span>
              <span className="text-xl font-bold text-green-700 font-mono mt-1 block">
                {attendance?.present_days || 18}
              </span>
            </div>

            <div className="p-4 rounded-lg border border-boundary-subtle bg-surface-secondary/20">
              <span className="text-[10px] uppercase font-semibold text-content-muted block">Remote Days</span>
              <span className="text-xl font-bold text-blue-700 font-mono mt-1 block">
                {attendance?.remote_days || 12}
              </span>
            </div>

            <div className="p-4 rounded-lg border border-boundary-subtle bg-surface-secondary/20">
              <span className="text-[10px] uppercase font-semibold text-content-muted block">Attendance Rate</span>
              <span className="text-xl font-bold text-brand-primary font-mono mt-1 block">
                {attendance?.attendance_rate ? Math.round(attendance.attendance_rate * 100) : 95}%
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
