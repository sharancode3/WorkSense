"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { BookOpen, ChevronRight, Plus, Filter, CheckCircle2 } from "lucide-react";
import { listJobRolesApi, listDepartmentsApi, createJobRoleApi, getJobRoleApi } from "@/lib/api/workforce";
import { JobRole, Department } from "@/types/workforce";
import { useAuth } from "@/context/auth-context";

export default function JobRolesPage() {
  const { roles } = useAuth();
  const searchParams = useSearchParams();
  const initialDept = searchParams.get("department_id") || "";

  const canManage = roles.some((r) => ["administrator", "hr", "recruiter"].includes(r));

  const [jobRoles, setJobRoles] = useState<JobRole[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDept, setSelectedDept] = useState<string>(initialDept);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Selected role detail modal
  const [detailRole, setDetailRole] = useState<JobRole | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Create Job Role Modal
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [formDeptId, setFormDeptId] = useState("");
  const [formCode, setFormCode] = useState("");
  const [formTitle, setFormTitle] = useState("");
  const [formFamily, setFormFamily] = useState("Engineering");
  const [formLevel, setFormLevel] = useState("L5");
  const [formSummary, setFormSummary] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [rData, dData] = await Promise.all([
        listJobRolesApi(selectedDept || undefined),
        listDepartmentsApi(),
      ]);
      setJobRoles(rData);
      setDepartments(dData);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load roles catalog";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedDept]);

  const handleSelectRole = async (role: JobRole) => {
    try {
      setLoadingDetail(true);
      const fullRole = await getJobRoleApi(role.id);
      setDetailRole(fullRole);
    } catch (err) {
      setDetailRole(role);
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!formDeptId || !formCode || !formTitle || !formSummary) {
      setFormError("All required fields must be completed.");
      return;
    }

    try {
      setSubmitting(true);
      await createJobRoleApi({
        department_id: formDeptId,
        code: formCode.toUpperCase().trim(),
        title: formTitle.trim(),
        role_family: formFamily,
        seniority_level: formLevel,
        summary: formSummary.trim(),
      });
      setIsCreateOpen(false);
      setFormCode("");
      setFormTitle("");
      setFormSummary("");
      loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to create job role";
      setFormError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const deptMap = useMemo(() => {
    const map = new Map<string, string>();
    departments.forEach((d) => map.set(d.id, d.name));
    return map;
  }, [departments]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-boundary-subtle pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-content-muted uppercase tracking-wider">
            <span>Workforce Foundation</span>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="text-content-primary">Catalog</span>
          </div>
          <h1 className="text-2xl font-bold text-content-primary mt-1">Job Role Catalog & Requirements</h1>
          <p className="text-sm text-content-secondary mt-1">
            Standardized competencies, seniority bands, and required capabilities per role.
          </p>
        </div>

        {canManage && (
          <button
            onClick={() => {
              setFormDeptId(selectedDept || (departments[0]?.id ?? ""));
              setIsCreateOpen(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-brand-primary text-white text-xs font-semibold rounded-md hover:bg-opacity-90 transition-colors self-start sm:self-auto"
          >
            <Plus className="h-4 w-4" />
            Define Job Role
          </button>
        )}
      </div>

      {/* Filter Toolbar */}
      <div className="flex items-center gap-3 bg-surface p-3 border border-boundary-subtle rounded-lg">
        <Filter className="h-4 w-4 text-content-muted" />
        <span className="text-xs font-semibold text-content-primary">Filter Department:</span>
        <select
          value={selectedDept}
          onChange={(e) => setSelectedDept(e.target.value)}
          className="text-xs px-3 py-1.5 border border-boundary-subtle rounded bg-surface focus:outline-none focus:border-brand-primary"
        >
          <option value="">All Departments ({jobRoles.length})</option>
          {departments.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name} ({d.code})
            </option>
          ))}
        </select>
        {selectedDept && (
          <button
            onClick={() => setSelectedDept("")}
            className="text-xs text-brand-primary hover:underline font-medium"
          >
            Clear Filter
          </button>
        )}
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-4 rounded-md border border-error-subtle bg-error-subtle/10 text-error text-sm">
          {error}
        </div>
      )}

      {/* Job Roles Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-44 bg-surface-secondary animate-pulse rounded-lg border border-boundary-subtle" />
          ))}
        </div>
      ) : jobRoles.length === 0 ? (
        <div className="text-center py-16 bg-surface rounded-lg border border-boundary-subtle">
          <BookOpen className="h-10 w-10 text-content-muted mx-auto mb-3" />
          <p className="text-sm font-semibold text-content-primary">No job roles found</p>
          <p className="text-xs text-content-secondary mt-1">
            {selectedDept ? "Try clearing the department filter." : "Create your first role profile."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {jobRoles.map((role) => (
            <div
              key={role.id}
              onClick={() => handleSelectRole(role)}
              className="p-5 rounded-lg border border-boundary-subtle bg-surface hover:border-brand-primary cursor-pointer transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded bg-surface-secondary text-content-secondary border border-boundary-subtle">
                    {role.code}
                  </span>
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-brand-primary/10 text-brand-primary">
                    {role.level || "L5"}
                  </span>
                </div>

                <h3 className="text-base font-bold text-content-primary mt-2">{role.title}</h3>
                <p className="text-xs text-brand-primary font-medium mt-0.5">
                  {role.department_name || deptMap.get(role.department_id) || "Department"}
                </p>

                {role.description && (
                  <p className="text-xs text-content-secondary mt-2 line-clamp-2">{role.description}</p>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-boundary-subtle flex items-center justify-between text-xs text-content-muted">
                <span>View Skill Profile</span>
                <span className="text-brand-primary font-semibold">&rarr;</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Role Detail Modal */}
      {detailRole && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-surface border border-boundary-subtle rounded-lg max-w-xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-surface-secondary border border-boundary-subtle">
                    {detailRole.code}
                  </span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-brand-primary/10 text-brand-primary">
                    Level {detailRole.level}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-content-primary mt-1.5">{detailRole.title}</h3>
                <p className="text-xs text-content-secondary">
                  {detailRole.department_name || deptMap.get(detailRole.department_id)}
                </p>
              </div>

              <button
                onClick={() => setDetailRole(null)}
                className="text-content-muted hover:text-content-primary text-sm p-1"
              >
                &times;
              </button>
            </div>

            {detailRole.description && (
              <div className="p-3 bg-surface-secondary/40 rounded border border-boundary-subtle text-xs text-content-secondary">
                {detailRole.description}
              </div>
            )}

            {/* Skill Requirements */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-content-muted">
                Required Competencies & Skills
              </h4>

              {loadingDetail ? (
                <div className="h-20 bg-surface-secondary animate-pulse rounded" />
              ) : !detailRole.required_skills || detailRole.required_skills.length === 0 ? (
                <p className="text-xs text-content-muted italic">No specific skill requirements defined.</p>
              ) : (
                <div className="space-y-2">
                  {detailRole.required_skills.map((req) => (
                    <div
                      key={req.id}
                      className="p-3 rounded border border-boundary-subtle bg-surface flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <CheckCircle2
                          className={`h-4 w-4 ${
                            req.importance === "required" ? "text-brand-primary" : "text-content-muted"
                          }`}
                        />
                        <div>
                          <div className="font-semibold text-content-primary">{req.skill_name}</div>
                          <div className="text-[11px] text-content-muted">{req.skill_category}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            req.importance === "required"
                              ? "bg-error-subtle/10 text-error border border-error-subtle"
                              : "bg-surface-secondary text-content-secondary"
                          }`}
                        >
                          {req.importance}
                        </span>
                        <span className="font-mono font-bold text-content-primary">
                          Min Level: {req.minimum_level}/5
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-boundary-subtle flex justify-end">
              <button
                onClick={() => setDetailRole(null)}
                className="px-4 py-2 text-xs font-semibold bg-surface-secondary hover:bg-surface-secondary/80 rounded"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Job Role Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-surface border border-boundary-subtle rounded-lg max-w-md w-full p-6 space-y-4">
            <h3 className="text-lg font-bold text-content-primary">Define New Job Role</h3>
            <p className="text-xs text-content-secondary">
              Create a standardized job specification with compensation band and requirements.
            </p>

            {formError && (
              <div className="p-3 bg-error-subtle/10 border border-error-subtle text-error text-xs rounded">
                {formError}
              </div>
            )}

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-content-primary mb-1">
                  Department <span className="text-error">*</span>
                </label>
                <select
                  required
                  value={formDeptId}
                  onChange={(e) => setFormDeptId(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-boundary-subtle rounded bg-surface focus:outline-none focus:border-brand-primary"
                >
                  <option value="">— Select Department —</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.code} - {d.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-content-primary mb-1">
                    Role Code <span className="text-error">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. ROLE-ENG-05"
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-boundary-subtle rounded bg-surface focus:outline-none focus:border-brand-primary uppercase"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-content-primary mb-1">Seniority Level</label>
                  <select
                    value={formLevel}
                    onChange={(e) => setFormLevel(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-boundary-subtle rounded bg-surface focus:outline-none focus:border-brand-primary"
                  >
                    <option value="L3">L3 - Associate</option>
                    <option value="L4">L4 - Mid-Level</option>
                    <option value="L5">L5 - Senior</option>
                    <option value="L6">L6 - Staff / Principal</option>
                    <option value="L7">L7 - Director / Fellow</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-content-primary mb-1">
                  Role Title <span className="text-error">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Principal Distributed Systems Engineer"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-boundary-subtle rounded bg-surface focus:outline-none focus:border-brand-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-content-primary mb-1">Role Family</label>
                <select
                  value={formFamily}
                  onChange={(e) => setFormFamily(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-boundary-subtle rounded bg-surface focus:outline-none focus:border-brand-primary"
                >
                  <option value="Engineering">Engineering</option>
                  <option value="Machine Learning">Machine Learning</option>
                  <option value="Product">Product</option>
                  <option value="Design">Design</option>
                  <option value="Human Resources">Human Resources</option>
                  <option value="Talent Acquisition">Talent Acquisition</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-content-primary mb-1">
                  Summary & Scope <span className="text-error">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Core accountability and business impact..."
                  value={formSummary}
                  onChange={(e) => setFormSummary(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-boundary-subtle rounded bg-surface focus:outline-none focus:border-brand-primary"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-boundary-subtle">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-3 py-1.5 text-xs font-medium text-content-secondary hover:text-content-primary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 text-xs font-semibold bg-brand-primary text-white rounded hover:bg-opacity-90 disabled:opacity-50"
                >
                  {submitting ? "Saving..." : "Create Role"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
