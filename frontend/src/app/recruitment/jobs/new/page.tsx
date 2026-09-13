"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, Plus, Trash2, AlertTriangle, CheckCircle2, Sliders } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { InlineAlert } from "@/components/feedback/inline-alert";
import { Spinner } from "@/components/ui/spinner";
import { createJobOpeningApi } from "@/lib/api/recruitment";
import { listDepartmentsApi, listJobRolesApi, listSkillsApi } from "@/lib/api/workforce";
import { Department, JobRole, Skill } from "@/types/workforce";
import { JobRequirementSkillItem } from "@/types/recruitment";

const QUALITY_AUDIT_PATTERNS = [
  { term: "young", reason: "Age bias risk: 'young' (discourages older qualified candidates)" },
  { term: "recent graduate", reason: "Age bias risk: 'recent graduate' (discourages experienced candidates)" },
  { term: "digital native", reason: "Age bias risk: 'digital native' (use 'proficient with modern digital platforms')" },
  { term: "rockstar", reason: "Ambiguous non-standard expectation: 'rockstar' (use specific technical competencies)" },
  { term: "ninja", reason: "Ambiguous non-standard expectation: 'ninja' (use specific skills)" },
  { term: "guru", reason: "Ambiguous role scope: 'guru'" },
  { term: "native speaker", reason: "National origin bias risk: 'native speaker' (use 'fluent' or 'CEFR C1/C2 proficiency')" },
];

export default function NewJobOpeningPage() {
  const router = useRouter();

  // Reference data
  const [departments, setDepartments] = useState<Department[]>([]);
  const [jobRoles, setJobRoles] = useState<JobRole[]>([]);
  const [skillsCatalog, setSkillsCatalog] = useState<Skill[]>([]);
  const [isLoadingRefs, setIsLoadingRefs] = useState(true);

  // Form state
  const [departmentId, setDepartmentId] = useState("");
  const [jobRoleId, setJobRoleId] = useState("");
  const [requisitionCode, setRequisitionCode] = useState("");
  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("Remote / Hybrid");
  const [employmentType, setEmploymentType] = useState("full_time");
  const [targetHeadcount, setTargetHeadcount] = useState(1);
  const [responsibilities, setResponsibilities] = useState("");
  const [minYearsExp, setMinYearsExp] = useState(5.0);

  // Skills
  const [selectedSkillId, setSelectedSkillId] = useState("");
  const [selectedImportance, setSelectedImportance] = useState<"required" | "preferred">("required");
  const [selectedProficiency, setSelectedProficiency] = useState(4);
  const selectedSkillWeight = 1.0;

  const [requiredSkills, setRequiredSkills] = useState<JobRequirementSkillItem[]>([]);
  const [preferredSkills, setPreferredSkills] = useState<JobRequirementSkillItem[]>([]);

  // Weights
  const [weightRequired, setWeightRequired] = useState(0.45);
  const [weightPreferred, setWeightPreferred] = useState(0.20);
  const [weightEvidence, setWeightEvidence] = useState(0.20);
  const [weightExperience, setWeightExperience] = useState(0.15);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Load departments, roles, skills
  useEffect(() => {
    async function loadRefs() {
      try {
        setIsLoadingRefs(true);
        const [depts, roles, skills] = await Promise.all([
          listDepartmentsApi(),
          listJobRolesApi(),
          listSkillsApi(),
        ]);
        setDepartments(depts);
        setJobRoles(roles);
        setSkillsCatalog(skills);

        if (depts.length > 0) setDepartmentId(depts[0].id);
        if (roles.length > 0) {
          setJobRoleId(roles[0].id);
          setTitle(roles[0].title);
        }
        if (skills.length > 0) setSelectedSkillId(skills[0].id);

        const codeSuffix = Math.floor(1000 + Math.random() * 9000);
        setRequisitionCode(`REQ-2026-${codeSuffix}`);
      } catch (err) {
        console.error("Failed to load reference data", err);
      } finally {
        setIsLoadingRefs(false);
      }
    }
    loadRefs();
  }, []);

  // Sync title when job role changes
  const handleRoleChange = (roleId: string) => {
    setJobRoleId(roleId);
    const found = jobRoles.find((r) => r.id === roleId);
    if (found) {
      setTitle(found.title);
      if (found.department_id) setDepartmentId(found.department_id);
    }
  };

  // Real-time quality audit of responsibilities text
  const qualityAuditWarnings = useMemo(() => {
    if (!responsibilities.trim()) return [];
    const textLower = responsibilities.toLowerCase();
    const warnings: string[] = [];
    QUALITY_AUDIT_PATTERNS.forEach(({ term, reason }) => {
      const regex = new RegExp(`\\b${term}\\b`, "i");
      if (regex.test(textLower)) {
        warnings.push(reason);
      }
    });
    return warnings;
  }, [responsibilities]);

  // Total weight check
  const totalWeight = useMemo(() => {
    return parseFloat((weightRequired + weightPreferred + weightEvidence + weightExperience).toFixed(2));
  }, [weightRequired, weightPreferred, weightEvidence, weightExperience]);

  // Add skill to criteria
  const handleAddSkill = () => {
    if (!selectedSkillId) return;
    const skillObj = skillsCatalog.find((s) => s.id === selectedSkillId);
    if (!skillObj) return;

    const newItem: JobRequirementSkillItem = {
      skill_id: skillObj.id,
      skill_name: skillObj.name,
      min_proficiency: selectedProficiency,
      weight: selectedSkillWeight,
      importance: selectedImportance,
    };

    if (selectedImportance === "required") {
      if (!requiredSkills.some((s) => s.skill_id === newItem.skill_id)) {
        setRequiredSkills([...requiredSkills, newItem]);
      }
    } else {
      if (!preferredSkills.some((s) => s.skill_id === newItem.skill_id)) {
        setPreferredSkills([...preferredSkills, newItem]);
      }
    }
  };

  const handleRemoveSkill = (skillId: string, importance: "required" | "preferred") => {
    if (importance === "required") {
      setRequiredSkills(requiredSkills.filter((s) => s.skill_id !== skillId));
    } else {
      setPreferredSkills(preferredSkills.filter((s) => s.skill_id !== skillId));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !requisitionCode.trim() || !departmentId || !jobRoleId) {
      setSubmitError("Please fill out all required fields.");
      return;
    }
    if (requiredSkills.length === 0) {
      setSubmitError("Please configure at least one required skill from the catalog.");
      return;
    }
    if (Math.abs(totalWeight - 1.0) > 0.01) {
      setSubmitError("Criterion weights must sum to exactly 1.00 (100%).");
      return;
    }

    try {
      setIsSubmitting(true);
      setSubmitError(null);

      const payload = {
        department_id: departmentId,
        job_role_id: jobRoleId,
        requisition_code: requisitionCode.trim(),
        title: title.trim(),
        location,
        employment_type: employmentType,
        target_headcount: Number(targetHeadcount),
        responsibilities: responsibilities.trim() || `Deliver high-quality outcomes for ${title}`,
        required_skills: requiredSkills,
        preferred_skills: preferredSkills,
        min_years_experience: Number(minYearsExp),
        weights: {
          required_skills: weightRequired,
          preferred_skills: weightPreferred,
          evidence_strength: weightEvidence,
          experience_alignment: weightExperience,
        },
      };

      const created = await createJobOpeningApi(payload);
      router.push(`/recruitment/jobs/${created.id}`);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Failed to create job opening");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingRefs) {
    return (
      <AppShell>
        <div className="flex justify-center items-center py-32">
          <Spinner size="lg" />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-2">
          <Link href="/recruitment/jobs">
            <Button variant="ghost" size="sm" className="gap-1 text-content-muted">
              <ArrowLeft className="h-4 w-4" />
              Back to Requisitions
            </Button>
          </Link>
        </div>

        <PageHeader
          title="Create Job Requisition"
          description="Define role criteria, canonical skills, and transparent deterministic weights"
        />

        {submitError && (
          <InlineAlert variant="danger" title="Submission Error">
            {submitError}
          </InlineAlert>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section 1: Role Context */}
          <Card className="p-6 space-y-4 border border-boundary-subtle">
            <h3 className="text-base font-semibold text-content-primary">
              1. Organizational Context & Position
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-content-muted uppercase mb-1">
                  Department *
                </label>
                <Select
                  value={departmentId}
                  onChange={(e) => setDepartmentId(e.target.value)}
                  options={departments.map((d) => ({ value: d.id, label: `${d.name} (${d.code})` }))}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-content-muted uppercase mb-1">
                  Job Role Template *
                </label>
                <Select
                  value={jobRoleId}
                  onChange={(e) => handleRoleChange(e.target.value)}
                  options={jobRoles.map((r) => ({ value: r.id, label: `${r.title} (${r.level})` }))}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-content-muted uppercase mb-1">
                  Requisition Code *
                </label>
                <Input
                  value={requisitionCode}
                  onChange={(e) => setRequisitionCode(e.target.value)}
                  placeholder="REQ-2026-ENG-01"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-content-muted uppercase mb-1">
                  Requisition Title *
                </label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Staff Distributed Systems Engineer"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-content-muted uppercase mb-1">
                  Employment Type
                </label>
                <Select
                  value={employmentType}
                  onChange={(e) => setEmploymentType(e.target.value)}
                  options={[
                    { value: "full_time", label: "Full Time" },
                    { value: "part_time", label: "Part Time" },
                    { value: "contract", label: "Contract" },
                  ]}
                  className="w-full"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-content-muted uppercase mb-1">
                    Location
                  </label>
                  <Input
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Remote / City"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-content-muted uppercase mb-1">
                    Headcount
                  </label>
                  <Input
                    type="number"
                    min="1"
                    value={targetHeadcount}
                    onChange={(e) => setTargetHeadcount(Number(e.target.value))}
                  />
                </div>
              </div>
            </div>
          </Card>

          {/* Section 2: Responsibilities & Quality Audit */}
          <Card className="p-6 space-y-4 border border-boundary-subtle">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-content-primary">
                2. Responsibilities & Job Quality Audit
              </h3>
              <span className="text-xs text-content-muted">
                Audited against age, gender, and ambiguity bias patterns
              </span>
            </div>

            <div>
              <Textarea
                rows={4}
                value={responsibilities}
                onChange={(e) => setResponsibilities(e.target.value)}
                placeholder="Detail core engineering mandates and domain scope. Avoid non-standard buzzwords or demographic assumptions..."
                className="font-sans text-sm"
              />
            </div>

            {qualityAuditWarnings.length > 0 ? (
              <div className="p-3 bg-status-warning/10 border border-status-warning/30 rounded-md space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-status-warning">
                  <AlertTriangle className="h-4 w-4" />
                  Quality Audit Flags Detected ({qualityAuditWarnings.length})
                </div>
                <ul className="text-xs text-content-primary space-y-1 pl-5 list-disc">
                  {qualityAuditWarnings.map((w, idx) => (
                    <li key={idx}>{w}</li>
                  ))}
                </ul>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-xs text-status-success font-medium">
                <CheckCircle2 className="h-4 w-4" />
                Responsibilities pass baseline inclusive language and clarity criteria.
              </div>
            )}

            <div className="pt-2">
              <label className="block text-xs font-semibold text-content-muted uppercase mb-1">
                Target Minimum Years of Experience
              </label>
              <div className="flex items-center gap-3">
                <Input
                  type="number"
                  step="0.5"
                  min="0"
                  max="25"
                  value={minYearsExp}
                  onChange={(e) => setMinYearsExp(parseFloat(e.target.value) || 0)}
                  className="w-32"
                />
                <span className="text-xs text-content-muted">
                  Used for experience alignment score (ratio against verified tenure)
                </span>
              </div>
            </div>
          </Card>

          {/* Section 3: Skill Graph Requirements */}
          <Card className="p-6 space-y-4 border border-boundary-subtle">
            <h3 className="text-base font-semibold text-content-primary">
              3. Canonical Skill Requirements (Stage 3 Skill Graph)
            </h3>
            <p className="text-xs text-content-muted">
              Select verified skills from the enterprise graph. Required skills evaluate exact & adjacent graph matches; preferred skills award extra coverage.
            </p>

            {/* Add skill row */}
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 p-3 bg-surface-subtle border border-boundary-subtle rounded-md items-end">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-content-muted uppercase mb-1">
                  Skill from Catalog
                </label>
                <Select
                  value={selectedSkillId}
                  onChange={(e) => setSelectedSkillId(e.target.value)}
                  options={skillsCatalog.map((s) => ({ value: s.id, label: `${s.name} (${s.category})` }))}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-content-muted uppercase mb-1">
                  Importance
                </label>
                <Select
                  value={selectedImportance}
                  onChange={(e) => setSelectedImportance(e.target.value as "required" | "preferred")}
                  options={[
                    { value: "required", label: "Required" },
                    { value: "preferred", label: "Preferred" },
                  ]}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-content-muted uppercase mb-1">
                  Min Level (1-5)
                </label>
                <Select
                  value={String(selectedProficiency)}
                  onChange={(e) => setSelectedProficiency(Number(e.target.value))}
                  options={[
                    { value: "1", label: "1 - Novice" },
                    { value: "2", label: "2 - Developing" },
                    { value: "3", label: "3 - Proficient" },
                    { value: "4", label: "4 - Advanced" },
                    { value: "5", label: "5 - Expert" },
                  ]}
                  className="w-full"
                />
              </div>

              <div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddSkill}
                  className="w-full gap-1"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add Skill
                </Button>
              </div>
            </div>

            {/* Selected Skills Lists */}
            <div className="space-y-3">
              <div>
                <h4 className="text-xs font-semibold text-content-primary uppercase mb-2">
                  Required Competencies ({requiredSkills.length})
                </h4>
                {requiredSkills.length === 0 ? (
                  <p className="text-xs text-status-danger italic">
                    At least 1 required skill must be configured.
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {requiredSkills.map((s) => (
                      <div
                        key={s.skill_id}
                        className="flex items-center gap-2 px-3 py-1 bg-surface-base border border-boundary-subtle rounded text-xs text-content-primary"
                      >
                        <span className="font-medium">{s.skill_name}</span>
                        <Badge variant="muted">Level {s.min_proficiency}+</Badge>
                        <button
                          type="button"
                          onClick={() => handleRemoveSkill(s.skill_id, "required")}
                          className="text-content-muted hover:text-status-danger transition-colors"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {preferredSkills.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-content-primary uppercase mb-2">
                    Preferred Competencies ({preferredSkills.length})
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {preferredSkills.map((s) => (
                      <div
                        key={s.skill_id}
                        className="flex items-center gap-2 px-3 py-1 bg-surface-base border border-boundary-subtle rounded text-xs text-content-primary"
                      >
                        <span className="font-medium">{s.skill_name}</span>
                        <Badge variant="outline">Level {s.min_proficiency}+</Badge>
                        <button
                          type="button"
                          onClick={() => handleRemoveSkill(s.skill_id, "preferred")}
                          className="text-content-muted hover:text-status-danger transition-colors"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Section 4: Transparent Scoring Weights */}
          <Card className="p-6 space-y-4 border border-boundary-subtle">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sliders className="h-4 w-4 text-brand-primary" />
                <h3 className="text-base font-semibold text-content-primary">
                  4. Transparent Deterministic Weights
                </h3>
              </div>
              <Badge variant={Math.abs(totalWeight - 1.0) <= 0.01 ? "success" : "danger"}>
                Sum: {(totalWeight * 100).toFixed(0)}%
              </Badge>
            </div>

            <p className="text-xs text-content-muted">
              These weights directly govern match score arithmetic (0-100). Qwen strictly cannot fabricate or modify these weights.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-semibold text-content-muted mb-1">
                  Required Skills ({(weightRequired * 100).toFixed(0)}%)
                </label>
                <Input
                  type="number"
                  step="0.05"
                  min="0"
                  max="1"
                  value={weightRequired}
                  onChange={(e) => setWeightRequired(parseFloat(e.target.value) || 0)}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-content-muted mb-1">
                  Preferred Skills ({(weightPreferred * 100).toFixed(0)}%)
                </label>
                <Input
                  type="number"
                  step="0.05"
                  min="0"
                  max="1"
                  value={weightPreferred}
                  onChange={(e) => setWeightPreferred(parseFloat(e.target.value) || 0)}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-content-muted mb-1">
                  Evidence Strength ({(weightEvidence * 100).toFixed(0)}%)
                </label>
                <Input
                  type="number"
                  step="0.05"
                  min="0"
                  max="1"
                  value={weightEvidence}
                  onChange={(e) => setWeightEvidence(parseFloat(e.target.value) || 0)}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-content-muted mb-1">
                  Experience Alignment ({(weightExperience * 100).toFixed(0)}%)
                </label>
                <Input
                  type="number"
                  step="0.05"
                  min="0"
                  max="1"
                  value={weightExperience}
                  onChange={(e) => setWeightExperience(parseFloat(e.target.value) || 0)}
                />
              </div>
            </div>
          </Card>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <Link href="/recruitment/jobs">
              <Button variant="outline" type="button">
                Cancel
              </Button>
            </Link>
            <Button
              variant="primary"
              type="submit"
              disabled={isSubmitting || requiredSkills.length === 0 || Math.abs(totalWeight - 1.0) > 0.01}
              className="gap-1.5"
            >
              {isSubmitting ? (
                <>
                  <Spinner size="sm" />
                  Creating Opening...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Create Job Opening
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </AppShell>
  );
}
