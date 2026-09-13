import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  listOnboardingTaskDefinitionsApi,
  listOnboardingTemplatesApi,
  previewOnboardingCaseApi,
  createOnboardingCaseApi,
  hrReviewPlanApi,
  managerReviewPlanApi,
  completeOnboardingTaskApi,
  reportTaskBlockerApi,
  addManagerTaskApi,
  proposeAdaptiveReplanApi,
  getOnboardingCaseDiffsApi,
  dispatchToEnterProApi,
} from "@/lib/api/onboarding";

describe("Adaptive Onboarding API Client", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("fetches task definitions and templates", async () => {
    const mockTasks = [{ id: "task-1", code: "POL-SEC-01", title: "InfoSec Policy" }];
    const mockTemplates = [{ id: "tmpl-1", scope: "organization", name: "Global Standard" }];

    global.fetch = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers(),
        json: async () => mockTasks,
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers(),
        json: async () => mockTemplates,
      });

    const tasks = await listOnboardingTaskDefinitionsApi();
    expect(tasks).toEqual(mockTasks);

    const templates = await listOnboardingTemplatesApi();
    expect(templates).toEqual(mockTemplates);
  });

  it("previews candidate conversion and eligibility", async () => {
    const mockPreview = {
      candidate_id: "cand-1",
      candidate_name: "Elena Rostova",
      job_role_title: "Staff Machine Learning Engineer",
      is_eligible: true,
      eligibility_message: "Eligible for onboarding",
      skill_gaps: [
        {
          skill_id: "sk-1",
          skill_name: "Triton Inference Server",
          required_level: 4,
          current_level: 2,
          gap_magnitude: 2,
          gap_size: 2,
          priority: "high",
        },
      ],
      mandatory_tasks_count: 5,
      learning_resources_count: 2,
    };

    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: new Headers(),
      json: async () => mockPreview,
    });

    const preview = await previewOnboardingCaseApi("cand-1", "job-1");
    expect(preview.candidate_name).toBe("Elena Rostova");
    expect(preview.is_eligible).toBe(true);
    expect(preview.skill_gaps).toHaveLength(1);
    expect(preview.skill_gaps[0].gap_size).toBe(2);
  });

  it("creates an onboarding case and triggers multi-brain journey generation", async () => {
    const mockCreatedCase = {
      id: "case-1",
      candidate_id: "cand-1",
      employee_id: "emp-1",
      status: "pending_review",
      total_tasks_count: 12,
      current_plan_id: "plan-1",
    };

    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      status: 201,
      headers: new Headers(),
      json: async () => mockCreatedCase,
    });

    const res = await createOnboardingCaseApi({
      candidate_id: "cand-1",
      job_opening_id: "job-1",
      department_id: "dept-1",
      job_role_id: "role-1",
      employee_code: "EMP-99001",
      hire_date: "2026-10-15",
      manager_employee_id: "mgr-1",
      work_location: "San Francisco, CA",
    });

    expect(res.id).toBe("case-1");
    expect(res.status).toBe("pending_review");
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/v1/onboarding/cases"),
      expect.objectContaining({
        method: "POST",
      })
    );
  });

  it("submits HR and Manager review decisions", async () => {
    const mockHRReview = {
      id: "rev-1",
      plan_id: "plan-1",
      reviewer_type: "hr",
      decision: "approve",
      hr_review_status: "approved",
      notes: "HR policy compliance approved.",
    };

    const mockManagerReview = {
      id: "rev-2",
      plan_id: "plan-1",
      reviewer_type: "manager",
      decision: "approve",
      manager_review_status: "approved",
      notes: "Team technical roadmap aligned.",
    };

    global.fetch = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers(),
        json: async () => mockHRReview,
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers(),
        json: async () => mockManagerReview,
      });

    const hrRes = await hrReviewPlanApi("plan-1", { decision: "approve", notes: "HR policy compliance approved." });
    expect(hrRes.hr_review_status).toBe("approved");

    const mgrRes = await managerReviewPlanApi("plan-1", { decision: "approve", notes: "Team technical roadmap aligned." });
    expect(mgrRes.manager_review_status).toBe("approved");
  });

  it("supports task completion with evidence and blocker reporting", async () => {
    const mockCompletedTask = {
      id: "task-1",
      status: "completed",
      completed_at: "2026-10-16T10:00:00Z",
      evidence_url: "https://worksense.internal/artifacts/elena-cert.pdf",
    };

    const mockBlockedTask = {
      id: "task-2",
      status: "blocked",
      blocker_reason: "GPU development cluster provisioning delayed by IT.",
    };

    global.fetch = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers(),
        json: async () => mockCompletedTask,
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers(),
        json: async () => mockBlockedTask,
      });

    const completed = await completeOnboardingTaskApi("task-1", {
      evidence_url: "https://worksense.internal/artifacts/elena-cert.pdf",
    });
    expect(completed.status).toBe("completed");

    const blocked = await reportTaskBlockerApi("task-2", {
      blocker_reason: "GPU development cluster provisioning delayed by IT.",
    });
    expect(blocked.status).toBe("blocked");
    expect(blocked.blocker_reason).toContain("GPU development cluster");
  });

  it("handles manager custom task addition and adaptive replanning", async () => {
    const mockAddedTask = {
      id: "task-custom-1",
      title: "1:1 AI Infrastructure Deep Dive",
      category: "team_integration",
      phase: "week_1",
    };

    const mockReplanCase = {
      id: "case-1",
      plan_version: 2,
      version_number: 2,
      status: "active",
      change_summary: "Adaptive replan executed: shifted 3 downstream tasks by 3 days.",
    };

    global.fetch = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 201,
        headers: new Headers(),
        json: async () => mockAddedTask,
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers(),
        json: async () => mockReplanCase,
      });

    const added = await addManagerTaskApi("case-1", {
      title: "1:1 AI Infrastructure Deep Dive",
      description: "Manager 1:1 infrastructure alignment",
      category: "team_integration",
      phase: "week_1",
      scheduled_day_offset: 3,
      reasoning: "Manager assigned priority 1:1 sync",
    });
    expect(added.title).toBe("1:1 AI Infrastructure Deep Dive");

    const replanned = await proposeAdaptiveReplanApi("case-1", {
      trigger: "task_blocked",
      explanation: "Shifting downstream dependent tasks due to cluster setup delay",
      suggested_day_shift: 3,
    });
    expect(replanned.version_number).toBe(2);
  });

  it("dispatches to EnterPro simulated enterprise adapter and fetches audit diffs", async () => {
    const mockEnterProResponse = {
      id: "ep-1",
      case_id: "case-1",
      correlation_id: "EP-TEST-CORR-12345",
      acknowledged_at: "2026-10-15T12:00:00Z",
      status: "SIMULATED_ACKNOWLEDGEMENT" as const,
      simulated_external_workflow_id: "ENTERPRO-WF-SIM-99",
      dispatched_tasks_count: 8,
      disclaimer: "Simulated demonstration adapter",
    };

    const mockDiffs = [
      {
        id: "diff-1",
        case_id: "case-1",
        from_plan_id: "plan-1",
        to_plan_id: "plan-2",
        adaptation_trigger: "task_blocked" as const,
        summary: "Plan shifted",
        task_diff: {
          shifted_tasks: [
            {
              title: "Task 1",
              old_due_date: "2026-10-01",
              new_due_date: "2026-10-04",
              shift_days: 3,
            },
          ],
        },
        created_at: "2026-10-01T00:00:00Z",
      },
    ];

    global.fetch = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers(),
        json: async () => mockEnterProResponse,
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers(),
        json: async () => mockDiffs,
      });

    const enterPro = await dispatchToEnterProApi("case-1", { correlation_id: "EP-TEST-CORR-12345" });
    expect(enterPro.correlation_id).toBe("EP-TEST-CORR-12345");
    expect(enterPro.status).toBe("SIMULATED_ACKNOWLEDGEMENT");

    const diffs = await getOnboardingCaseDiffsApi("case-1");
    expect(diffs).toHaveLength(1);
    expect(diffs[0].task_diff.shifted_tasks).toHaveLength(1);
  });
});
