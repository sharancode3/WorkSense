"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Users, ChevronRight, Filter, Search } from "lucide-react";
import { listEmployeesApi, listDepartmentsApi } from "@/lib/api/workforce";
import { Employee, Department } from "@/types/workforce";

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDept, setSelectedDept] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [eData, dData] = await Promise.all([
        listEmployeesApi({
          department_id: selectedDept || undefined,
        }),
        listDepartmentsApi(),
      ]);
      setEmployees(eData);
      setDepartments(dData);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load employee directory";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedDept]);

  const filteredEmployees = employees.filter((e) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      e.full_name.toLowerCase().includes(q) ||
      e.email?.toLowerCase().includes(q) ||
      e.employee_code.toLowerCase().includes(q)
    );
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-boundary-subtle pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-content-muted uppercase tracking-wider">
            <span>Workforce Foundation</span>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="text-content-primary">Organization Directory</span>
          </div>
          <h1 className="text-2xl font-bold text-content-primary mt-1">Employee Directory & Temporal Twins</h1>
          <p className="text-sm text-content-secondary mt-1">
            Authoritative staff registry with temporal assignment history, continuous skill profiles, and goals.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3 bg-surface p-3 border border-boundary-subtle rounded-lg">
        <div className="relative flex-1 w-full">
          <Search className="h-4 w-4 absolute left-3 top-2.5 text-content-muted" />
          <input
            type="text"
            placeholder="Search by employee name, code (e.g. EMP-10492), or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-boundary-subtle rounded bg-surface focus:outline-none focus:border-brand-primary"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="h-4 w-4 text-content-muted" />
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="text-xs px-3 py-1.5 border border-boundary-subtle rounded bg-surface focus:outline-none focus:border-brand-primary w-full sm:w-auto"
          >
            <option value="">All Departments</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-4 rounded-md border border-error-subtle bg-error-subtle/10 text-error text-sm">
          {error}
        </div>
      )}

      {/* Employees Table */}
      {loading ? (
        <div className="h-64 bg-surface-secondary animate-pulse rounded-lg border border-boundary-subtle" />
      ) : filteredEmployees.length === 0 ? (
        <div className="text-center py-16 bg-surface rounded-lg border border-boundary-subtle">
          <Users className="h-10 w-10 text-content-muted mx-auto mb-3" />
          <p className="text-sm font-semibold text-content-primary">No employees found</p>
          <p className="text-xs text-content-secondary mt-1">Try resetting your department filter or search criteria.</p>
        </div>
      ) : (
        <div className="border border-boundary-subtle rounded-lg bg-surface overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-secondary border-b border-boundary-subtle text-content-muted uppercase font-semibold">
                <tr>
                  <th className="px-4 py-3">Code</th>
                  <th className="px-4 py-3">Employee Name</th>
                  <th className="px-4 py-3">Role Title</th>
                  <th className="px-4 py-3">Department</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-boundary-subtle">
                {filteredEmployees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-surface-secondary/30 transition-colors">
                    <td className="px-4 py-3 font-mono font-semibold text-content-primary">{emp.employee_code}</td>
                    <td className="px-4 py-3">
                      <div className="font-bold text-content-primary">{emp.full_name}</div>
                      <div className="text-[11px] text-content-muted">{emp.email}</div>
                    </td>
                    <td className="px-4 py-3 font-medium text-content-primary">
                      {emp.job_role_title || "Engineer"}
                    </td>
                    <td className="px-4 py-3 text-content-secondary">{emp.department_name || "Engineering"}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded bg-green-100 text-green-800 font-semibold text-[10px] uppercase">
                        {emp.status || "Active"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/workforce/employees/${emp.id}`}
                        className="px-3 py-1 bg-brand-primary text-white text-[11px] font-semibold rounded hover:bg-opacity-90 inline-block"
                      >
                        View Twin
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
