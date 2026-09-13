import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  listDepartmentsApi,
  getDepartmentTreeApi,
  listJobRolesApi,
  getJobRoleApi,
  listSkillsApi,
  getSkillGraphApi,
  listCandidatesApi,
  getCandidateApi,
  previewCandidateConversionApi,
  convertCandidateApi,
  listEmployeesApi,
  getEmployeeTwinApi,
  listGoalsForEmployeeApi,
  listFeedbackForEmployeeApi,
  listAttendanceForEmployeeApi,
  listPoliciesApi,
  createPolicyVersionApi,
  getDataQualitySummaryApi,
  resolveDataQualityIssueApi,
} from "@/lib/api/workforce";

describe("Workforce API Client Wrapper", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("fetches departments and department hierarchy tree", async () => {
    const mockDepts = [{ id: "dept-1", code: "ENG", name: "Engineering" }];
    const mockTree = [{ id: "dept-1", code: "ENG", name: "Engineering", children: [] }];

    global.fetch = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers(),
        json: async () => mockDepts,
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers(),
        json: async () => mockTree,
      });

    const depts = await listDepartmentsApi();
    expect(depts).toEqual(mockDepts);

    const tree = await getDepartmentTreeApi();
    expect(tree).toEqual(mockTree);
  });

  it("fetches job roles catalog and individual role details", async () => {
    const mockRoles = [{ id: "role-1", code: "SWE-III", title: "Senior Software Engineer" }];
    const mockRole = { id: "role-1", code: "SWE-III", title: "Senior Software Engineer", required_skills: [] };

    global.fetch = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers(),
        json: async () => mockRoles,
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers(),
        json: async () => mockRole,
      });

    const roles = await listJobRolesApi("dept-1");
    expect(roles).toEqual(mockRoles);

    const role = await getJobRoleApi("role-1");
    expect(role.code).toBe("SWE-III");
  });

  it("fetches skill taxonomy and skill graph nodes/edges", async () => {
    const mockSkills = [{ id: "sk-1", code: "PYTHON", name: "Python", category: "backend" }];
    const mockGraph = {
      nodes: [{ id: "sk-1", label: "Python", category: "backend", node_type: "skill" }],
      edges: [{ id: "e-1", source: "sk-1", target: "sk-2", relationship_type: "ADJACENT_TO", weight: 0.8, label: "Adjacent" }],
      total_nodes: 1,
      total_edges: 1,
    };

    global.fetch = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers(),
        json: async () => mockSkills,
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers(),
        json: async () => mockGraph,
      });

    const skills = await listSkillsApi({ search: "Python" });
    expect(skills).toEqual(mockSkills);

    const graph = await getSkillGraphApi({ query: "Python" });
    expect(graph.nodes).toHaveLength(1);
    expect(graph.edges).toHaveLength(1);
  });

  it("manages candidate lifecycle and transactional conversion", async () => {
    const mockCandidates = [{ id: "cand-1", full_name: "Sarah Lin", stage: "offer" }];
    const mockPreview = {
      candidate_id: "cand-1",
      candidate_name: "Sarah Lin",
      candidate_email: "sarah@example.com",
      target_role_id: "role-1",
      target_role_title: "Staff Distributed Systems Engineer",
      suggested_department_id: "dept-1",
      suggested_department_name: "Engineering",
      skills_to_carry_forward: ["Distributed Systems", "Go"],
      evidence_items_to_carry_forward: 3,
      is_eligible: true,
      eligibility_message: "Ready for conversion",
    };
    const mockConverted = {
      success: true,
      message: "Candidate converted successfully",
      conversion_id: "conv-1",
      candidate_id: "cand-1",
      employee_id: "emp-100",
      employee_code: "EMP-100",
      carried_skill_count: 5,
      carried_evidence_count: 3,
    };

    global.fetch = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers(),
        json: async () => mockCandidates,
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers(),
        json: async () => mockCandidates[0],
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers(),
        json: async () => mockPreview,
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 201,
        headers: new Headers(),
        json: async () => mockConverted,
      });

    const candidates = await listCandidatesApi();
    expect(candidates).toEqual(mockCandidates);

    const cand = await getCandidateApi("cand-1");
    expect(cand.full_name).toBe("Sarah Lin");

    const preview = await previewCandidateConversionApi("cand-1");
    expect(preview.is_eligible).toBe(true);

    const conversion = await convertCandidateApi("cand-1", {
      department_id: "dept-1",
      job_role_id: "role-1",
      employee_code: "EMP-100",
      start_date: "2026-10-01",
    });
    expect(conversion.employee_id).toBe("emp-100");
    expect(conversion.employee_code).toBe("EMP-100");
  });

  it("fetches employee directory and twin projection", async () => {
    const mockEmployees = [{ id: "emp-1", full_name: "David Kim", job_title: "VP of Engineering" }];
    const mockTwin = {
      employee: {
        id: "emp-1",
        organization_id: "org-1",
        profile_id: "p-1",
        email: "david@example.com",
        full_name: "David Kim",
        employee_code: "EMP-001",
        department_id: "dept-1",
        job_role_id: "role-1",
        job_title: "VP of Engineering",
        employment_type: "full_time",
        status: "active" as const,
        joined_at: "2024-01-01",
      },
      manager: null,
      direct_reports: [],
      skills: [],
      goals: [],
      feedback: [],
      attendance: null,
      assignment_history: [],
    };

    global.fetch = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers(),
        json: async () => mockEmployees,
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers(),
        json: async () => mockTwin,
      });

    const employees = await listEmployeesApi();
    expect(employees).toEqual(mockEmployees);

    const twin = await getEmployeeTwinApi("emp-1");
    expect(twin.employee.full_name).toBe("David Kim");
  });

  it("fetches performance goals, feedback records, and attendance aggregation", async () => {
    const mockGoals = [{ id: "g-1", title: "Deliver Core Data Layer", progress_percentage: 100 }];
    const mockFeedback = [{ id: "fb-1", reviewer_type: "peer", visibility: "public" }];
    const mockAttendance = [
      {
        employee_id: "emp-1",
        total_recorded_days: 22,
        present_days: 21,
        remote_days: 10,
        sick_leave_days: 1,
        vacation_days: 0,
        late_check_ins: 0,
        attendance_rate: 95.4,
      },
    ];

    global.fetch = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers(),
        json: async () => mockGoals,
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers(),
        json: async () => mockFeedback,
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers(),
        json: async () => mockAttendance,
      });

    const goals = await listGoalsForEmployeeApi("emp-1");
    expect(goals).toHaveLength(1);

    const feedback = await listFeedbackForEmployeeApi("emp-1");
    expect(feedback).toHaveLength(1);

    const attendance = await listAttendanceForEmployeeApi("emp-1");
    expect(attendance).toHaveLength(1);
    expect(attendance[0].present_days).toBe(21);
  });

  it("handles policy versioning and data quality audit engine", async () => {
    const mockPolicies = [{ id: "pol-1", code: "REMOTE-WORK", title: "Remote Work Policy", active_version: null }];
    const mockVersion = {
      id: "ver-2",
      policy_id: "pol-1",
      version_number: "2.0",
      document_url: "https://example.com/doc.pdf",
      summary: "Updated remote policy",
      effective_date: "2026-09-01",
      status: "active" as const,
      created_at: "2026-09-01",
    };
    const mockAudit = {
      scanned_at: "2026-09-01T00:00:00Z",
      total: 1,
      critical_count: 0,
      warning_count: 1,
      info_count: 0,
      issues: [
        {
          id: "issue-1",
          organization_id: "org-1",
          rule_id: "orphaned_skill",
          rule_name: "Orphaned Skill Check",
          severity: "WARNING" as const,
          entity_type: "skill",
          entity_id: "skill-1",
          description: "Orphaned skill detected",
          suggested_action: "Link to ontology",
          status: "open" as const,
          detected_at: "2026-09-01T00:00:00Z",
        },
      ],
    };
    const mockResolvedIssue = { success: true, message: "Issue resolved successfully" };

    global.fetch = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers(),
        json: async () => mockPolicies,
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 201,
        headers: new Headers(),
        json: async () => mockVersion,
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers(),
        json: async () => mockAudit,
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers(),
        json: async () => mockResolvedIssue,
      });

    const policies = await listPoliciesApi();
    expect(policies).toHaveLength(1);

    const version = await createPolicyVersionApi("pol-1", {
      version_number: "2.0",
      effective_date: "2026-09-01",
      file_name: "remote_policy_v2.pdf",
      storage_path: "/policies/remote_v2.pdf",
      sha256_hash: "abcd1234efgh5678",
    });
    expect(version.version_number).toBe("2.0");

    const audit = await getDataQualitySummaryApi();
    expect(audit.total).toBe(1);
    expect(audit.issues).toHaveLength(1);

    const resolved = await resolveDataQualityIssueApi("issue-1");
    expect(resolved.success).toBe(true);
  });
});
