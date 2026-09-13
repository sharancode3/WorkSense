"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
} from "lucide-react";
import {
  getCandidateApi,
  previewCandidateConversionApi,
  convertCandidateApi,
  listDepartmentsApi,
  listJobRolesApi,
  listEmployeesApi,
} from "@/lib/api/workforce";
import {
  CandidateProfile,
  Department,
  JobRole,
  Employee,
  CandidateConversionResponse,
} from "@/types/workforce";

export default function CandidateConversionWizard() {
  const params = useParams();
  const router = useRouter();
  const candId = params.id as string;

  const [candidate, setCandidate] = useState<CandidateProfile | null>(null);
  const [preview, setPreview] = useState<{
    candidate_id: string;
    candidate_name: string;
    candidate_email: string;
    target_role_id?: string | null;
    target_role_title?: string | null;
    suggested_department_id?: string | null;
    suggested_department_name?: string | null;
    skills_to_carry_forward: string[];
    evidence_items_to_carry_forward: number;
    is_eligible: boolean;
    eligibility_message: string;
  } | null>(null);

  const [departments, setDepartments] = useState<Department[]>([]);
  const [jobRoles, setJobRoles] = useState<JobRole[]>([]);
  const [managers, setManagers] = useState<Employee[]>([]);

  // Form inputs
  const [deptId, setDeptId] = useState("");
  const [roleId, setRoleId] = useState("");
  const [managerId, setManagerId] = useState("");
  const [empCode, setEmpCode] = useState("");
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CandidateConversionResponse | null>(null);

  useEffect(() => {
    if (!candId) return;

    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        const [cData, pData, dData, rData, eData] = await Promise.all([
          getCandidateApi(candId),
          previewCandidateConversionApi(candId),
          listDepartmentsApi(),
          listJobRolesApi(),
          listEmployeesApi(),
        ]);

        setCandidate(cData);
        setPreview(pData);
        setDepartments(dData);
        setJobRoles(rData);
        setManagers(eData);

        // Pre-fill smart defaults from preview
        if (pData.suggested_department_id) {
          setDeptId(pData.suggested_department_id);
        } else if (dData.length > 0) {
          setDeptId(dData[0].id);
        }

        if (pData.target_role_id) {
          setRoleId(pData.target_role_id);
        } else if (rData.length > 0) {
          setRoleId(rData[0].id);
        }

        // Auto-generate candidate employee code
        const cleanName = cData.full_name
          ? cData.full_name.split(" ").pop()?.toUpperCase() || "EMP"
          : "EMP";
        const randomNum = Math.floor(100 + Math.random() * 900);
        setEmpCode(`TC-${cleanName}-${randomNum}`);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Failed to load conversion prerequisites";
        setError(msg);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [candId]);

  const handleConvert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deptId || !roleId || !empCode) {
      setError("Please select Department, Job Role, and specify an Employee Code.");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      const res = await convertCandidateApi(candId, {
        department_id: deptId,
        job_role_id: roleId,
        manager_employee_id: managerId || null,
        employee_code: empCode.trim(),
        start_date: startDate,
      });
      setResult(res);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Conversion failed";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 space-y-6">
        <div className="h-44 bg-surface-secondary animate-pulse rounded-lg border border-boundary-subtle" />
        <div className="h-64 bg-surface-secondary animate-pulse rounded-lg border border-boundary-subtle" />
      </div>
    );
  }

  if (result) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-6">
        <div className="p-8 rounded-lg border border-green-200 bg-green-50/50 space-y-4">
          <div className="h-12 w-12 rounded-full bg-green-100 text-green-700 flex items-center justify-center mx-auto border border-green-200">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <h2 className="text-xl font-bold text-content-primary">Conversion Completed Successfully</h2>
          <p className="text-xs text-content-secondary max-w-md mx-auto">{result.message}</p>

          <div className="p-4 rounded-md bg-surface border border-boundary-subtle text-left text-xs space-y-2 max-w-md mx-auto">
            <div className="flex justify-between">
              <span className="text-content-muted">Employee Code:</span>
              <span className="font-mono font-bold text-content-primary">{result.employee_code}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-content-muted">Carried Forward Skills:</span>
              <span className="font-semibold text-content-primary">{result.carried_skill_count} skills</span>
            </div>
            <div className="flex justify-between">
              <span className="text-content-muted">Preserved Evidence Artifacts:</span>
              <span className="font-semibold text-content-primary">{result.carried_evidence_count} items</span>
            </div>
          </div>

          <div className="pt-4 flex items-center justify-center gap-3">
            <Link
              href={`/workforce/employees/${result.employee_id}`}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand-primary text-white text-xs font-semibold rounded hover:bg-opacity-90"
            >
              <span>View Employee Twin</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/workforce/candidates"
              className="px-4 py-2 border border-boundary-subtle bg-surface text-xs font-semibold rounded hover:bg-surface-secondary"
            >
              Back to Candidates
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-xs font-semibold text-content-muted uppercase tracking-wider">
        <Link href="/workforce/candidates" className="hover:text-content-primary">
          Candidates
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <Link href={`/workforce/candidates/${candId}`} className="hover:text-content-primary">
          {candidate?.full_name || "Candidate"}
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-content-primary">Conversion Wizard</span>
      </div>

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-content-primary">Candidate-to-Employee Conversion</h1>
        <p className="text-sm text-content-secondary mt-1">
          Perform atomic, idempotent transition carrying verified skills and evidence lineage into an active employee profile.
        </p>
      </div>

      {/* Pre-flight Eligibility Banner */}
      {preview && (
        <div className="p-4 rounded-lg border border-boundary-subtle bg-surface flex items-start gap-3">
          <ShieldCheck className="h-5 w-5 text-brand-primary flex-shrink-0 mt-0.5" />
          <div className="space-y-1 text-xs">
            <div className="font-bold text-content-primary">Pre-flight Verification Summary</div>
            <p className="text-content-secondary">{preview.eligibility_message}</p>
            <div className="flex flex-wrap gap-4 pt-1 font-medium text-content-muted">
              <span>
                &bull; Skills to carry forward:{" "}
                <strong className="text-content-primary">{preview.skills_to_carry_forward.length}</strong>
              </span>
              <span>
                &bull; Evidence items preserved:{" "}
                <strong className="text-content-primary">{preview.evidence_items_to_carry_forward}</strong>
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div className="p-4 rounded-lg border border-error-subtle bg-error-subtle/10 text-error text-xs flex items-center gap-2">
          <AlertTriangle className="h-4 w-4" />
          <span>{error}</span>
        </div>
      )}

      {/* Conversion Form */}
      <form onSubmit={handleConvert} className="p-6 rounded-lg border border-boundary-subtle bg-surface space-y-5">
        <h2 className="text-sm font-bold uppercase tracking-wider text-content-muted">Employment Configuration</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-content-primary mb-1">
              Department <span className="text-error">*</span>
            </label>
            <select
              required
              value={deptId}
              onChange={(e) => setDeptId(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-boundary-subtle rounded bg-surface focus:outline-none focus:border-brand-primary"
            >
              <option value="">— Select Target Department —</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.code})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-content-primary mb-1">
              Job Role <span className="text-error">*</span>
            </label>
            <select
              required
              value={roleId}
              onChange={(e) => setRoleId(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-boundary-subtle rounded bg-surface focus:outline-none focus:border-brand-primary"
            >
              <option value="">— Select Job Role —</option>
              {jobRoles.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.title} ({r.code})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-content-primary mb-1">Assign Manager</label>
            <select
              value={managerId}
              onChange={(e) => setManagerId(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-boundary-subtle rounded bg-surface focus:outline-none focus:border-brand-primary"
            >
              <option value="">— Unassigned (Reporting to Head) —</option>
              {managers.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.full_name} ({m.employee_code})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-content-primary mb-1">
              Employee Code <span className="text-error">*</span>
            </label>
            <input
              type="text"
              required
              value={empCode}
              onChange={(e) => setEmpCode(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-boundary-subtle rounded bg-surface focus:outline-none focus:border-brand-primary uppercase font-mono"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-content-primary mb-1">Start Date / Hire Date</label>
          <input
            type="date"
            required
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full sm:w-1/2 px-3 py-2 text-xs border border-boundary-subtle rounded bg-surface focus:outline-none focus:border-brand-primary"
          />
        </div>

        {/* Idempotent Guarantee Notice */}
        <div className="p-3 bg-surface-secondary/40 rounded border border-boundary-subtle text-[11px] text-content-secondary space-y-1">
          <div className="font-semibold text-content-primary">Idempotent Execution Guarantee</div>
          <p>
            Re-running conversion for this candidate safely returns the existing employee profile without duplicate records
            or broken foreign key linkages.
          </p>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-boundary-subtle">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2 text-xs font-medium text-content-secondary hover:text-content-primary"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-5 py-2.5 bg-brand-primary text-white text-xs font-bold rounded hover:bg-opacity-90 transition-colors disabled:opacity-50"
          >
            {submitting ? "Executing Conversion..." : "Confirm & Convert"}
          </button>
        </div>
      </form>
    </div>
  );
}
