"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Building2, ChevronRight, Plus, Users, FolderTree, List } from "lucide-react";
import { listDepartmentsApi, createDepartmentApi } from "@/lib/api/workforce";
import { Department } from "@/types/workforce";
import { useAuth } from "@/context/auth-context";

export default function DepartmentsPage() {
  const { roles } = useAuth();
  const canManage = roles.some((r) => ["administrator", "hr"].includes(r));

  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"tree" | "table">("tree");

  // Create Department Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newCode, setNewCode] = useState("");
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newParentId, setNewParentId] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await listDepartmentsApi();
      setDepartments(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load departments";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!newCode || !newName) {
      setFormError("Code and Name are required.");
      return;
    }

    try {
      setSubmitting(true);
      await createDepartmentApi({
        code: newCode.toUpperCase().trim(),
        name: newName.trim(),
        description: newDesc.trim() || undefined,
        parent_department_id: newParentId || null,
      });
      setIsModalOpen(false);
      setNewCode("");
      setNewName("");
      setNewDesc("");
      setNewParentId("");
      fetchDepartments();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to create department";
      setFormError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  // Build hierarchy tree
  const rootDepts = departments.filter((d) => !d.parent_department_id);
  const getChildren = (parentId: string) => departments.filter((d) => d.parent_department_id === parentId);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-boundary-subtle pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-content-muted uppercase tracking-wider">
            <span>Workforce Foundation</span>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="text-content-primary">Organization Structure</span>
          </div>
          <h1 className="text-2xl font-bold text-content-primary mt-1">Departments & Hierarchy</h1>
          <p className="text-sm text-content-secondary mt-1">
            Authoritative departmental topology, leadership assignments, and reporting units.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="inline-flex rounded-md border border-boundary-subtle bg-surface p-1">
            <button
              onClick={() => setViewMode("tree")}
              className={`px-3 py-1.5 text-xs font-medium rounded ${
                viewMode === "tree"
                  ? "bg-brand-primary text-white"
                  : "text-content-secondary hover:text-content-primary"
              }`}
              title="Tree View"
            >
              <FolderTree className="h-3.5 w-3.5 inline mr-1" />
              Hierarchy
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`px-3 py-1.5 text-xs font-medium rounded ${
                viewMode === "table"
                  ? "bg-brand-primary text-white"
                  : "text-content-secondary hover:text-content-primary"
              }`}
              title="Table View"
            >
              <List className="h-3.5 w-3.5 inline mr-1" />
              Directory
            </button>
          </div>

          {canManage && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-brand-primary text-white text-xs font-semibold rounded-md hover:bg-opacity-90 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Add Department
            </button>
          )}
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-4 rounded-md border border-error-subtle bg-error-subtle/10 text-error text-sm">
          {error}
        </div>
      )}

      {/* Loading Skeleton */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-surface-secondary animate-pulse rounded-md border border-boundary-subtle" />
          ))}
        </div>
      ) : departments.length === 0 ? (
        <div className="text-center py-16 bg-surface rounded-md border border-boundary-subtle">
          <Building2 className="h-10 w-10 text-content-muted mx-auto mb-3" />
          <p className="text-sm font-semibold text-content-primary">No departments found</p>
          <p className="text-xs text-content-secondary mt-1">Get started by adding your first departmental unit.</p>
        </div>
      ) : viewMode === "tree" ? (
        /* Tree Hierarchy View */
        <div className="space-y-4">
          {rootDepts.map((root) => {
            const children = getChildren(root.id);
            return (
              <div key={root.id} className="border border-boundary-subtle rounded-lg bg-surface overflow-hidden">
                {/* Root Dept Header */}
                <div className="p-5 bg-surface-secondary/40 border-b border-boundary-subtle flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="p-2.5 rounded bg-brand-primary/10 text-brand-primary border border-brand-primary/20">
                      <Building2 className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono px-2 py-0.5 rounded bg-surface border border-boundary-subtle font-semibold">
                          {root.code}
                        </span>
                        <h2 className="text-base font-bold text-content-primary">{root.name}</h2>
                      </div>
                      {root.description && (
                        <p className="text-xs text-content-secondary mt-1 max-w-2xl">{root.description}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-content-secondary">
                    <div>
                      <span className="text-content-muted">Head: </span>
                      <span className="font-medium text-content-primary">{root.head_name || "Unassigned"}</span>
                    </div>
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-surface border border-boundary-subtle">
                      <Users className="h-3.5 w-3.5 text-content-muted" />
                      <span className="font-semibold text-content-primary">{children.length} sub-units</span>
                    </div>
                  </div>
                </div>

                {/* Sub-departments */}
                {children.length > 0 && (
                  <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3 bg-surface">
                    {children.map((child) => (
                      <div
                        key={child.id}
                        className="p-4 rounded-md border border-boundary-subtle bg-surface-secondary/20 hover:border-brand-primary/40 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-surface border border-boundary-subtle font-semibold">
                                {child.code}
                              </span>
                              <h3 className="text-sm font-semibold text-content-primary">{child.name}</h3>
                            </div>
                            {child.description && (
                              <p className="text-xs text-content-secondary mt-1 line-clamp-2">{child.description}</p>
                            )}
                          </div>
                        </div>

                        <div className="mt-3 pt-3 border-t border-boundary-subtle flex items-center justify-between text-xs text-content-muted">
                          <span>Head: {child.head_name || "Unassigned"}</span>
                          <Link
                            href={`/workforce/roles?department_id=${child.id}`}
                            className="text-brand-primary hover:underline font-medium text-[11px]"
                          >
                            View Job Roles &rarr;
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        /* Flat Directory Table */
        <div className="border border-boundary-subtle rounded-lg bg-surface overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-secondary border-b border-boundary-subtle text-content-muted uppercase font-semibold">
                <tr>
                  <th className="px-4 py-3">Code</th>
                  <th className="px-4 py-3">Department Name</th>
                  <th className="px-4 py-3">Parent Division</th>
                  <th className="px-4 py-3">Department Head</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-boundary-subtle">
                {departments.map((dept) => {
                  const parent = departments.find((d) => d.id === dept.parent_department_id);
                  return (
                    <tr key={dept.id} className="hover:bg-surface-secondary/30 transition-colors">
                      <td className="px-4 py-3 font-mono font-semibold text-content-primary">{dept.code}</td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-content-primary">{dept.name}</div>
                        {dept.description && (
                          <div className="text-content-muted text-[11px] truncate max-w-xs">{dept.description}</div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-content-secondary">{parent ? parent.name : "— Top Level —"}</td>
                      <td className="px-4 py-3 text-content-primary font-medium">{dept.head_name || "Unassigned"}</td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          href={`/workforce/roles?department_id=${dept.id}`}
                          className="text-brand-primary hover:underline font-semibold"
                        >
                          Roles
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create Department Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-surface border border-boundary-subtle rounded-lg max-w-md w-full p-6 space-y-4 shadow-none">
            <h3 className="text-lg font-bold text-content-primary">Create Department</h3>
            <p className="text-xs text-content-secondary">
              Define a functional unit or division within the organization hierarchy.
            </p>

            {formError && (
              <div className="p-3 bg-error-subtle/10 border border-error-subtle text-error text-xs rounded">
                {formError}
              </div>
            )}

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-content-primary mb-1">
                  Department Code <span className="text-error">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. ENG-SRE"
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-boundary-subtle rounded bg-surface focus:outline-none focus:border-brand-primary uppercase"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-content-primary mb-1">
                  Department Name <span className="text-error">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Site Reliability Engineering"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-boundary-subtle rounded bg-surface focus:outline-none focus:border-brand-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-content-primary mb-1">Parent Department</label>
                <select
                  value={newParentId}
                  onChange={(e) => setNewParentId(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-boundary-subtle rounded bg-surface focus:outline-none focus:border-brand-primary"
                >
                  <option value="">— None (Top-Level Department) —</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.code} - {d.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-content-primary mb-1">Description</label>
                <textarea
                  rows={3}
                  placeholder="Mission and operational scope..."
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-boundary-subtle rounded bg-surface focus:outline-none focus:border-brand-primary"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-boundary-subtle">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-1.5 text-xs font-medium text-content-secondary hover:text-content-primary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 text-xs font-semibold bg-brand-primary text-white rounded hover:bg-opacity-90 disabled:opacity-50"
                >
                  {submitting ? "Creating..." : "Save Department"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
