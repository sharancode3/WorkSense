import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  queryPolicyApi,
  listPolicyChunksApi,
  requestPolicyActionApi,
} from "@/lib/api/policy";
import {
  getEmployeeAttritionRiskApi,
  getAttritionOverviewApi,
  getPerformanceInsightsApi,
  listInternalMobilityMatchesApi,
} from "@/lib/api/intelligence";
import { getDashboardSummaryApi } from "@/lib/api/dashboard";
import {
  listRecommendationsApi,
  getRecommendationApi,
  reviewRecommendationApi,
  executeRecommendationApi,
} from "@/lib/api/recommendation";
import { demoApi } from "@/lib/api/demo";

describe("Stage 6-10 Decision Intelligence & Workflow API Clients", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("Stage 6: Policy Reasoning & RAG API", () => {
    it("queries HR policy catalog with grounded citations", async () => {
      const mockResponse = {
        query_id: "q-1",
        query_text: "What is the remote work equipment stipend?",
        direct_answer: "According to POL-REM-01, employees receive $1,000 USD stipend.",
        reasoning_summary: "Based on Section 3 Equipment Stipend",
        applicable_clauses: ["14 days advance notice", "Manager sign-off"],
        confidence_band: "high",
        is_authoritative: true,
        citations: [
          {
            policy_title: "Global Remote Work Policy",
            policy_code: "POL-REM-01",
            version_number: "4.1",
            page_number: 1,
            section_heading: "Section 3. Equipment Stipend",
            verbatim_quote: "Employees receive up to $1,000 USD for verified home office setup.",
            relevance_score: 0.95,
          },
        ],
        escalation_required: false,
        qwen_assisted: true,
        created_at: "2026-09-13T00:00:00Z",
      };

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers(),
        json: async () => mockResponse,
      });

      const res = await queryPolicyApi({
        query_text: "What is the remote work equipment stipend?",
      });

      expect(res.confidence_band).toBe("high");
      expect(res.citations.length).toBe(1);
      expect(res.citations[0].policy_code).toBe("POL-REM-01");
    });

    it("fetches transparent policy chunks for auditing", async () => {
      const mockChunks = [
        {
          id: "chk-1",
          policy_document_id: "pol-1",
          policy_title: "Global Remote Work Policy",
          policy_code: "POL-REM-01",
          version_number: "4.1",
          page_number: 1,
          section_heading: "Section 1. Scope",
          chunk_text: "Applies to all full-time employees.",
        },
      ];

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers(),
        json: async () => mockChunks,
      });

      const chunks = await listPolicyChunksApi("POL-REM-01");
      expect(chunks.length).toBe(1);
      expect(chunks[0].section_heading).toBe("Section 1. Scope");
    });

    it("submits action request based on grounded policy guidance", async () => {
      const mockAction = {
        id: "act-1",
        policy_code: "POL-REM-01",
        action_type: "submit_remote_request",
        requested_by_employee_id: "emp-1",
        status: "pending_review" as const,
        justification: "Home office remote work",
        created_at: "2026-09-13T00:00:00Z",
      };

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        status: 201,
        headers: new Headers(),
        json: async () => mockAction,
      });

      const res = await requestPolicyActionApi({
        policy_code: "POL-REM-01",
        action_type: "submit_remote_request",
        requested_by_employee_id: "emp-1",
        justification: "Home office remote work",
        payload: { days_per_week: 3 },
      });

      expect(res.id).toBe("act-1");
      expect(res.status).toBe("pending_review");
    });
  });

  describe("Stage 7: Workforce Intelligence API", () => {
    it("retrieves ethical individual attrition risk with contributing factors", async () => {
      const mockRisk = {
        id: "risk-1",
        organization_id: "org-1",
        employee_id: "emp-1",
        employee_name: "Marcus Chen",
        employee_code: "EMP-1001",
        department_name: "Engineering",
        role_title: "Senior Distributed Systems Engineer",
        risk_score: 0.62,
        risk_band: "priority_review" as const,
        risk_factors: [
          {
            signal_name: "Tenure in Band L5 without Mobility",
            signal_category: "career_progression",
            weight: 0.35,
            raw_value: "3.5 years in current L5 band",
            score_contribution: 0.28,
            direction: "increases_risk" as const,
            evidence_source: "workforce_tenure_ledger",
            data_freshness: "verified_today",
          },
        ],
        missing_signals: [],
        supportive_interventions: ["Internal Mobility to Principal Role"],
        explanation: "Tenure stagnation in band L5",
        is_mitigated: false,
        evaluated_at: "2026-09-13T00:00:00Z",
      };

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers(),
        json: async () => mockRisk,
      });

      const res = await getEmployeeAttritionRiskApi("emp-1");
      expect(res.employee_name).toBe("Marcus Chen");
      expect(res.risk_band).toBe("priority_review");
      expect(res.risk_factors?.length).toBe(1);
    });

    it("retrieves cohort attrition overview with leadership privacy protection", async () => {
      const mockOverview = {
        total_evaluated: 48,
        band_distribution: { priority_review: 4, review: 12, monitor: 32 },
        department_aggregates: [
          {
            department_id: "dept-1",
            department_name: "Engineering",
            cohort_size: 24,
            is_suppressed: false,
            average_risk_score: 0.38,
          },
        ],
        top_contributing_signals: [
          { signal: "Tenure Stagnation in Band L5", prevalence_pct: 28 },
        ],
      };

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers(),
        json: async () => mockOverview,
      });

      const res = await getAttritionOverviewApi();
      expect(res.total_evaluated).toBe(48);
      expect(res.band_distribution.priority_review).toBe(4);
    });

    it("retrieves synthesized performance insights", async () => {
      const mockPerf = {
        employee_id: "emp-1",
        employee_name: "Marcus Chen",
        goal_summary: {
          total_goals: 3,
          completed_goals: 2,
          on_track_goals: 1,
          behind_goals: 0,
          average_progress_pct: 91.5,
        },
        demonstrated_strengths: ["Consistent architectural delivery"],
        growth_opportunities: ["Cross-organization AI initiative leadership"],
        manager_coaching_prompts: ["How can we best align next quarter goals?"],
      };

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers(),
        json: async () => mockPerf,
      });

      const res = await getPerformanceInsightsApi("emp-1");
      expect(res.goal_summary.average_progress_pct).toBe(91.5);
      expect(res.demonstrated_strengths.length).toBe(1);
    });

    it("lists internal mobility matches with transferability graph evidence", async () => {
      const mockMobility = [
        {
          id: "mob-1",
          organization_id: "org-1",
          employee_id: "emp-1",
          employee_name: "Marcus Chen",
          current_role_title: "Senior Engineer",
          target_job_role_id: "role-2",
          target_role_title: "Principal Distributed Systems Architect",
          target_department_name: "Architecture",
          fit_score: 94.0,
          fit_percentage: 94.0,
          verified_skills_count: 8,
          adjacent_transferable_skills: [
            { skill_name: "Go", level: 4, transfers_to: "Core Systems" },
          ],
          remaining_skill_gaps: [
            { skill_name: "Cloud Economics", required_level: 4, current_level: 2, gap: 2 },
          ],
          suggested_learning_path: [
            { title: "Cloud Architecture Cost Optimization", provider: "Internal Academy", hours: 12 },
          ],
          status: "recommended" as const,
          created_at: "2026-09-13T00:00:00Z",
        },
      ];

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers(),
        json: async () => mockMobility,
      });

      const matches = await listInternalMobilityMatchesApi();
      expect(matches.length).toBe(1);
      expect(matches[0].fit_percentage).toBe(94.0);
    });
  });

  describe("Stage 8: HR Decision Dashboard API", () => {
    it("fetches dynamic multi-module operational metrics", async () => {
      const mockDashboard = {
        organization_name: "TechCorp Global",
        recruitment_funnel: {
          applications_total: 12,
          processing_total: 4,
          shortlisted_total: 3,
          interviewed_total: 2,
          offered_total: 1,
          converted_total: 2,
          average_candidate_score: 84.5,
        },
        attendance: {
          average_attendance_rate_pct: 94.2,
          total_onsite_days: 340,
          total_remote_days: 210,
          unapproved_absence_total: 2,
        },
        onboarding: {
          upcoming_joiners_count: 3,
          active_cases_count: 2,
          completed_cases_count: 5,
          blocked_cases_count: 0,
          average_progress_pct: 72.0,
          ready_for_enterpro_count: 1,
        },
        attrition_overview: {
          total_evaluated: 48,
          priority_review_count: 4,
          review_count: 12,
          monitor_count: 32,
        },
        priority_alerts: [
          {
            alert_id: "alt-1",
            level: "high",
            title: "Tenure Stagnation Notice",
            message: "Key engineering contributors approaching 4-year mark without role mobility.",
            source_module: "workforce_intelligence",
          },
        ],
        skill_heatmap: [
          {
            skill_name: "Distributed Systems",
            proficiency_level: 4,
            headcount_demonstrated: 14,
            demand_level: "critical",
          },
        ],
      };

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers(),
        json: async () => mockDashboard,
      });

      const res = await getDashboardSummaryApi();
      expect(res.organization_name).toBe("TechCorp Global");
      expect(res.recruitment_funnel.applications_total).toBe(12);
      expect(res.priority_alerts.length).toBe(1);
    });
  });

  describe("Stage 9: Recommendation-to-Action API", () => {
    it("lists canonical recommendations with supporting evidence", async () => {
      const mockRecs = [
        {
          id: "rec-1",
          source_module: "workforce_intelligence",
          recommendation_type: "internal_mobility",
          subject_name: "Marcus Chen",
          title: "Internal Mobility to Principal Systems Architect",
          status: "pending_review",
          requires_human_approval: true,
          confidence_score: 0.94,
        },
      ];

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers(),
        json: async () => mockRecs,
      });

      const recs = await listRecommendationsApi();
      expect(recs.length).toBe(1);
      expect(recs[0].subject_name).toBe("Marcus Chen");
    });

    it("submits human review decision with written reasoning", async () => {
      const mockApproval = {
        approval_id: "app-1",
        recommendation_id: "rec-1",
        decision: "approved" as const,
        notes: "Aligned with headcount and retention strategy.",
        approver_id: "user-1",
        approver_name: "Sarah Jenkins",
        decided_at: "2026-09-13T00:00:00Z",
      };

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers(),
        json: async () => mockApproval,
      });

      const res = await reviewRecommendationApi("rec-1", {
        decision: "approved",
        notes: "Aligned with headcount and retention strategy.",
      });

      expect(res.decision).toBe("approved");
    });

    it("dispatches approved recommendation to simulated EnterPro adapter", async () => {
      const mockExec = {
        recommendation_id: "rec-1",
        correlation_id: "EP-ACT-7B4F92A1",
        adapter_type: "enterpro_demonstration",
        status: "SIMULATED_ACKNOWLEDGEMENT",
        message: "Successfully orchestrated via EnterPro adapter.",
      };

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers(),
        json: async () => mockExec,
      });

      const res = await executeRecommendationApi("rec-1");
      expect(res.status).toBe("SIMULATED_ACKNOWLEDGEMENT");
      expect(res.correlation_id).toContain("EP-ACT-");
    });
  });

  describe("Stage 10: Demo Experience & Golden Path API", () => {
    it("fetches curated demo personas for role switching", async () => {
      const mockPersonas = [
        { id: "persona-hr", name: "Sarah Jenkins", role: "hr", title: "People Ops" },
        { id: "persona-employee", name: "Marcus Chen", role: "employee", title: "Senior Engineer" },
      ];

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers(),
        json: async () => mockPersonas,
      });

      const personas = await demoApi.getPersonas();
      expect(personas.length).toBe(2);
      expect(personas[0].name).toBe("Sarah Jenkins");
    });

    it("resets demo state to seed baseline", async () => {
      const mockReset = {
        status: "reset_completed",
        message: "Reset completed successfully.",
        entities_reset: { employees: 6, recommendations: 3 },
      };

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers(),
        json: async () => mockReset,
      });

      const res = await demoApi.resetDemoState();
      expect(res.status).toBe("reset_completed");
      expect(res.entities_reset.employees).toBe(6);
    });

    it("fetches Marcus Chen and Elena Rostova golden paths", async () => {
      const mockMarcus = {
        persona: { name: "Marcus Chen" },
        stage_7a_attrition_risk: { risk_score: 0.62 },
        stage_7c_internal_mobility: { skill_match_percentage: 94.0 },
      };
      const mockElena = {
        persona: { name: "Elena Rostova" },
        stage_4_recruitment: { match_score: 88.5 },
      };

      global.fetch = vi
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          headers: new Headers(),
          json: async () => mockMarcus,
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          headers: new Headers(),
          json: async () => mockElena,
        });

      const marcus = await demoApi.getMarcusChenGoldenPath();
      expect(marcus.persona).toBeDefined();

      const elena = await demoApi.getElenaRostovaGoldenPath();
      expect(elena.persona).toBeDefined();
    });
  });
});
