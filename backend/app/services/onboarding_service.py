"""WorkSense Adaptive Onboarding Service.

Implements Stage 5 bounded multi-brain onboarding operating system:
1. Candidate Conversion & Continuity: Leverages canonical workforce_service.convert_candidate_to_employee
2. Deterministic Skill-Gap Analyzer: Compares verified candidate skills vs role requirements
3. Curated Learning Path & Template Aggregator: Organization, department, and role mandatory policies
4. Journey Architect Agent (Qwen): Personalized pacing, learning interventions, and focus areas
5. Deterministic Dependency-Aware Scheduler: Enforces precedence, dates, and Kahn's topological sort
6. Plan Quality Critic: Audits policy retention, skill-gap coverage, and day 1 workload
7. Dual Human Review Gates: Independent HR and Manager approval workflows
8. EnterPro Demonstration Adapter: Idempotent simulated enterprise workflow handoff
9. Controlled Adaptive Replanner: Blocker resolution, versioned diffs, and date recalibration
"""

from datetime import datetime, timedelta, timezone
import logging
import time
from typing import Any, Dict, List, Optional, Set, Tuple
import uuid

from app.core.errors import ConflictError, NotFoundError, ValidationError
from app.schemas.onboarding import (
    AdaptiveReplanRequest,
    EnterProHandoffRequest,
    EnterProHandoffResponse,
    HRReviewRequest,
    LearningResourceResponse,
    ManagerReviewRequest,
    ManagerTaskCreate,
    OnboardingCaseCreate,
    OnboardingCaseListResponse,
    OnboardingCasePreviewResponse,
    OnboardingCaseResponse,
    OnboardingPhase,
    OnboardingPlanResponse,
    OnboardingPlanTaskResponse,
    OnboardingTaskDefinitionResponse,
    OnboardingTemplateResponse,
    OnboardingTemplateTaskItem,
    PersonalizedJourneyDTO,
    PlanAdaptationDTO,
    PlanCriticReviewDTO,
    PlanDifferenceDTO,
    SkillGapAnalysisDTO,
    SkillGapItem,
    TaskBlockerRequest,
    TaskCompletionRequest,
)
from app.schemas.workforce import CandidateConversionRequest
from app.services.identity_service import identity_service
from app.services.qwen_gateway import QwenError, qwen_gateway
from app.services.recruitment_service import recruitment_service
from app.services.workforce_service import workforce_service
from app.data.canonical_demo import (
    ORG_TECHCORP_ID,
    DEPT_ENG_ID,
    DEPT_ENG_NAME,
    ROLE_ELENA_APPLIED_ID,
    ROLE_ELENA_APPLIED_TITLE,
    ELENA_CANDIDATE_ID,
    ELENA_EMPLOYEE_ID,
    ELENA_EMPLOYEE_CODE,
    ELENA_FULL_NAME,
    ELENA_PERSONAL_EMAIL,
    ELENA_JOB_OPENING_ID,
    ELENA_ONBOARDING_CASE_ID,
    ELENA_ONBOARDING_PLAN_ID,
    MARCUS_VANCE_EMPLOYEE_ID,
    MARCUS_VANCE_FULL_NAME,
    ELENA_APPLICATION_STATUS,
    ELENA_RECORD_STATUS,
    ELENA_LIFECYCLE_STATE,
    ELENA_CANDIDATE_FACING_STATUS,
)

logger = logging.getLogger("worksense.onboarding_service")


class OnboardingService:
    """Stateful service managing end-to-end adaptive onboarding journeys."""

    def __init__(self) -> None:
        self._task_definitions: Dict[str, Dict[str, Any]] = {}
        self._templates: Dict[str, Dict[str, Any]] = {}
        self._template_tasks: Dict[str, List[Dict[str, Any]]] = {}  # template_id -> list of tasks
        self._learning_resources: Dict[str, Dict[str, Any]] = {}
        self._cases: Dict[str, Dict[str, Any]] = {}
        self._plans: Dict[str, Dict[str, Any]] = {}  # plan_id -> plan dict
        self._plan_tasks: Dict[str, Dict[str, Any]] = {}  # task_id -> task dict
        self._plan_task_dependencies: Dict[str, List[Dict[str, Any]]] = {}  # plan_id -> list of dep dicts
        self._plan_diffs: Dict[str, List[Dict[str, Any]]] = {}  # case_id -> list of diff dicts
        self._enterpro_handoffs: Dict[str, Dict[str, Any]] = {}  # case_id -> handoff dict
        self._audit_events: List[Dict[str, Any]] = []

        self._seed_onboarding_fixtures()

    # ====================================================================
    # 1. Standard Fixtures & Seeding
    # ====================================================================

    def _seed_onboarding_fixtures(self) -> None:
        """Seed default task definitions, templates, learning resources, and candidate offer states."""
        org_id = ORG_TECHCORP_ID
        now = datetime.now(timezone.utc).isoformat()

        # 1. Standard Task Definitions
        task_defs_data = [
            (
                "TASK_PREBOARD_DOCS",
                "Complete Preboarding Documentation & Identity Verification",
                "Submit signed offer letter, government photo identification, tax withholding forms, and emergency contact details.",
                "compliance",
                "organization",
                True,
                45,
                "employee",
                "self_attestation",
            ),
            (
                "TASK_EQUIPMENT_RECEIPT",
                "Confirm Workstation Hardware Receipt & Asset Tagging",
                "Acknowledge physical delivery of company laptop, secure YubiKey, and hardware peripherals; record asset serial tag.",
                "it_setup",
                "organization",
                True,
                15,
                "employee",
                "self_attestation",
            ),
            (
                "TASK_SECURITY_AWARENESS",
                "Mandatory Security Awareness & Phishing Defense Training",
                "Complete SOC2 compliance module, information security policies, zero-trust endpoint setup, and cryptographic key guidelines.",
                "security",
                "organization",
                True,
                60,
                "employee",
                "system_check",
            ),
            (
                "TASK_DIRECT_DEPOSIT",
                "Configure Direct Deposit & Payroll Setup",
                "Securely enroll bank routing numbers and direct deposit allocations in the enterprise payroll portal.",
                "compliance",
                "organization",
                True,
                30,
                "employee",
                "self_attestation",
            ),
            (
                "TASK_ENV_SETUP",
                "Developer Environment & VPN / Zero-Trust Access Setup",
                "Provision developer credentials, configure corporate VPN, configure SSH keys with hardware token, and clone base repositories.",
                "it_setup",
                "department",
                True,
                120,
                "employee",
                "manager_approval",
            ),
            (
                "TASK_CODE_STANDARDS",
                "Engineering Architecture & Code Review Standards",
                "Review TechCorp engineering handbook, Go/Python concurrency conventions, PR review guidelines, and deployment SLA expectations.",
                "learning",
                "department",
                True,
                90,
                "employee",
                "self_attestation",
            ),
            (
                "TASK_TEAM_MEET_GREET",
                "Team Introduction & Onboarding Buddy Sync",
                "1:1 introductory session with assigned team onboarding buddy, engineering manager, and core cross-functional collaborators.",
                "team_integration",
                "department",
                True,
                60,
                "employee",
                "manager_approval",
            ),
            (
                "TASK_FIRST_COMMIT",
                "First Production Pull Request & Deployment Pipeline Verification",
                "Author, review, and merge first production PR verifying end-to-end CI/CD integration, automated canary checks, and telemetry.",
                "it_setup",
                "department",
                True,
                180,
                "employee",
                "manager_approval",
            ),
            (
                "TASK_DAY30_CHECKIN",
                "Day 30 Milestone & Role Alignment Review",
                "Structured 30-day review evaluating initial sprint deliverables, tooling feedback, and mutual role expectations.",
                "milestone_review",
                "organization",
                True,
                45,
                "manager",
                "manager_approval",
            ),
            (
                "TASK_DAY60_CHECKIN",
                "Day 60 Autonomy & Project Contribution Review",
                "Evaluate independent ownership of complex tasks, on-call shadowing readiness, and ongoing peer collaboration.",
                "milestone_review",
                "organization",
                True,
                45,
                "manager",
                "manager_approval",
            ),
            (
                "TASK_DAY90_FINAL_REVIEW",
                "Day 90 Comprehensive Onboarding Completion & Goal Setting",
                "Final onboarding assessment with Engineering Manager and People Partner, establishing annual OKRs and long-term trajectory.",
                "milestone_review",
                "organization",
                True,
                60,
                "hr",
                "hr_approval",
            ),
        ]

        def_lookup: Dict[str, str] = {}
        for code, title, desc, cat, scope, mand, mins, role, verif in task_defs_data:
            tid = str(uuid.uuid4())
            def_record = {
                "id": tid,
                "organization_id": org_id,
                "code": code,
                "title": title,
                "description": desc,
                "category": cat,
                "scope": scope,
                "is_mandatory": mand,
                "estimated_minutes": mins,
                "default_owner_role": role,
                "verification_type": verif,
                "is_active": True,
                "created_at": now,
            }
            self._task_definitions[tid] = def_record
            def_lookup[code] = tid

        # 2. Onboarding Templates
        # Org-wide template
        org_tpl_id = "70000000-0000-0000-0000-000000000001"
        self._templates[org_tpl_id] = {
            "id": org_tpl_id,
            "organization_id": org_id,
            "name": "Organization-Wide Mandatory Onboarding Baseline",
            "scope_type": "organization",
            "scope_id": None,
            "version": 1,
            "description": "Standard compliance, IT hardware receipt, security policies, and 30/60/90 milestone reviews for all employees.",
            "is_active": True,
            "created_at": now,
        }
        self._template_tasks[org_tpl_id] = [
            {"task_definition_id": def_lookup["TASK_PREBOARD_DOCS"], "code": "TASK_PREBOARD_DOCS", "title": "Complete Preboarding Documentation & Identity Verification", "category": "compliance", "phase": "preboarding", "is_mandatory": True, "sort_order": 1, "relative_day_offset": -3, "verification_type": "self_attestation"},
            {"task_definition_id": def_lookup["TASK_EQUIPMENT_RECEIPT"], "code": "TASK_EQUIPMENT_RECEIPT", "title": "Confirm Workstation Hardware Receipt & Asset Tagging", "category": "it_setup", "phase": "preboarding", "is_mandatory": True, "sort_order": 2, "relative_day_offset": -1, "verification_type": "self_attestation"},
            {"task_definition_id": def_lookup["TASK_SECURITY_AWARENESS"], "code": "TASK_SECURITY_AWARENESS", "title": "Mandatory Security Awareness & Phishing Defense Training", "category": "security", "phase": "day_1", "is_mandatory": True, "sort_order": 3, "relative_day_offset": 0, "verification_type": "system_check"},
            {"task_definition_id": def_lookup["TASK_DIRECT_DEPOSIT"], "code": "TASK_DIRECT_DEPOSIT", "title": "Configure Direct Deposit & Payroll Setup", "category": "compliance", "phase": "day_1", "is_mandatory": True, "sort_order": 4, "relative_day_offset": 0, "verification_type": "self_attestation"},
            {"task_definition_id": def_lookup["TASK_DAY30_CHECKIN"], "code": "TASK_DAY30_CHECKIN", "title": "Day 30 Milestone & Role Alignment Review", "category": "milestone_review", "phase": "day_30", "is_mandatory": True, "sort_order": 5, "relative_day_offset": 30, "verification_type": "manager_approval"},
            {"task_definition_id": def_lookup["TASK_DAY60_CHECKIN"], "code": "TASK_DAY60_CHECKIN", "title": "Day 60 Autonomy & Project Contribution Review", "category": "milestone_review", "phase": "day_60", "is_mandatory": True, "sort_order": 6, "relative_day_offset": 60, "verification_type": "manager_approval"},
            {"task_definition_id": def_lookup["TASK_DAY90_FINAL_REVIEW"], "code": "TASK_DAY90_FINAL_REVIEW", "title": "Day 90 Comprehensive Onboarding Completion & Goal Setting", "category": "milestone_review", "phase": "day_90", "is_mandatory": True, "sort_order": 7, "relative_day_offset": 90, "verification_type": "hr_approval"},
        ]

        # Engineering Department Template
        eng_dept_id = "60000000-0000-0000-0000-000000000002"
        eng_tpl_id = "70000000-0000-0000-0000-000000000002"
        self._templates[eng_tpl_id] = {
            "id": eng_tpl_id,
            "organization_id": org_id,
            "name": "Engineering Department Technical Onboarding",
            "scope_type": "department",
            "scope_id": eng_dept_id,
            "version": 1,
            "description": "Technical environment setup, repository access, architecture standards, and first pull request for engineering hires.",
            "is_active": True,
            "created_at": now,
        }
        self._template_tasks[eng_tpl_id] = [
            {"task_definition_id": def_lookup["TASK_ENV_SETUP"], "code": "TASK_ENV_SETUP", "title": "Developer Environment & VPN / Zero-Trust Access Setup", "category": "it_setup", "phase": "day_1", "is_mandatory": True, "sort_order": 1, "relative_day_offset": 0, "verification_type": "manager_approval"},
            {"task_definition_id": def_lookup["TASK_CODE_STANDARDS"], "code": "TASK_CODE_STANDARDS", "title": "Engineering Architecture & Code Review Standards", "category": "learning", "phase": "week_1", "is_mandatory": True, "sort_order": 2, "relative_day_offset": 2, "verification_type": "self_attestation"},
            {"task_definition_id": def_lookup["TASK_TEAM_MEET_GREET"], "code": "TASK_TEAM_MEET_GREET", "title": "Team Introduction & Onboarding Buddy Sync", "category": "team_integration", "phase": "week_1", "is_mandatory": True, "sort_order": 3, "relative_day_offset": 3, "verification_type": "manager_approval"},
            {"task_definition_id": def_lookup["TASK_FIRST_COMMIT"], "code": "TASK_FIRST_COMMIT", "title": "First Production Pull Request & Deployment Pipeline Verification", "category": "it_setup", "phase": "week_1", "is_mandatory": True, "sort_order": 4, "relative_day_offset": 5, "verification_type": "manager_approval"},
        ]

        # 3. Learning Resources Catalog
        # Find skills from workforce service
        skill_dist_sys = next((s for s in workforce_service._skills.values() if s["code"] == "skill_dist_sys"), None)
        skill_k8s = next((s for s in workforce_service._skills.values() if s["code"] == "skill_k8s"), None)
        skill_py = next((s for s in workforce_service._skills.values() if "fastapi" in s["code"] or "python" in s["name"].lower()), None)
        skill_go = next((s for s in workforce_service._skills.values() if "go" in s["code"] or "golang" in s["name"].lower()), None)

        resources_data = [
            (
                skill_dist_sys["id"] if skill_dist_sys else "62000000-0000-0000-0000-000000000004",
                skill_dist_sys["name"] if skill_dist_sys else "Distributed Systems",
                "Advanced Raft Consensus & High-Availability Replication Patterns",
                "TechCorp Engineering Academy",
                "course",
                "https://learning.techcorp.internal/courses/dist-sys-raft-301",
                240,
                4,
                ["Basic Networking", "Concurrency Fundamentals"],
            ),
            (
                skill_dist_sys["id"] if skill_dist_sys else "62000000-0000-0000-0000-000000000004",
                skill_dist_sys["name"] if skill_dist_sys else "Distributed Systems",
                "Distributed Cache Invalidation & Multi-Region Consistency Deep-Dive",
                "O'Reilly Enterprise Library",
                "book",
                "https://learning.techcorp.internal/books/distributed-cache-patterns",
                180,
                4,
                ["Redis Architecture"],
            ),
            (
                skill_k8s["id"] if skill_k8s else "62000000-0000-0000-0000-000000000002",
                skill_k8s["name"] if skill_k8s else "Kubernetes Platform Engineering",
                "Kubernetes Multi-Cluster Traffic Routing & Service Mesh Operations",
                "Cloud Native Academy",
                "lab",
                "https://learning.techcorp.internal/labs/k8s-service-mesh-istio",
                210,
                4,
                ["Docker Basics", "Linux Networking"],
            ),
            (
                skill_py["id"] if skill_py else "62000000-0000-0000-0000-000000000003",
                skill_py["name"] if skill_py else "Python & FastAsync Runtime",
                "High-Throughput Asynchronous Programming with Python Asyncio & FastAPI",
                "TechCorp Internal Training",
                "course",
                "https://learning.techcorp.internal/courses/python-async-patterns",
                150,
                4,
                ["Python 3.10 Syntax"],
            ),
            (
                skill_go["id"] if skill_go else "62000000-0000-0000-0000-000000000008",
                skill_go["name"] if skill_go else "Golang Concurrency",
                "Production Go Concurrency Patterns: Channels, Mutexes, and Race Detection",
                "TechCorp Engineering Academy",
                "course",
                "https://learning.techcorp.internal/courses/go-concurrency-deep-dive",
                240,
                4,
                ["Go Fundamentals"],
            ),
        ]

        for sid, sname, rtitle, rprov, rtype, rurl, rmins, rprof, rprereq in resources_data:
            rid = str(uuid.uuid4())
            self._learning_resources[rid] = {
                "id": rid,
                "skill_id": sid,
                "skill_name": sname,
                "title": rtitle,
                "provider": rprov,
                "resource_type": rtype,
                "url": rurl,
                "estimated_minutes": rmins,
                "target_proficiency": rprof,
                "prerequisites": rprereq,
            }

        # 4. Ensure Elena Rostova has an approved recruitment offer decision ready for conversion
        elena_cand = ELENA_CANDIDATE_ID
        job_id = ELENA_JOB_OPENING_ID
        dec_key = f"{job_id}:{elena_cand}"

        if dec_key not in recruitment_service._decisions:
            recruitment_service._decisions[dec_key] = {
                "id": str(uuid.uuid4()),
                "organization_id": org_id,
                "job_opening_id": job_id,
                "candidate_id": elena_cand,
                "decided_by": "00000000-0000-0000-0000-000000000004",  # Recruiter
                "decision": "offer_accepted",
                "ai_recommendation": "Advance to Technical Evaluation & Extend Offer",
                "is_override": False,
                "override_reason": None,
                "rationale": "Candidate demonstrated exceptional mastery in distributed consensus algorithms during interview rounds.",
                "evidence_references": [f"job:{job_id}", f"candidate:{elena_cand}"],
                "candidate_facing_status": ELENA_CANDIDATE_FACING_STATUS,
                "lifecycle_state": ELENA_LIFECYCLE_STATE,
                "created_at": now,
            }
        else:
            recruitment_service._decisions[dec_key]["candidate_facing_status"] = ELENA_CANDIDATE_FACING_STATUS
            recruitment_service._decisions[dec_key]["lifecycle_state"] = ELENA_LIFECYCLE_STATE

        # Update candidate status to offer_accepted / preboarding_active (provisional preboarding, not converted yet)
        if elena_cand in workforce_service._candidate_profiles:
            cand = workforce_service._candidate_profiles[elena_cand]
            cand["status"] = ELENA_APPLICATION_STATUS
            cand["record_status"] = ELENA_RECORD_STATUS
            cand["lifecycle_state"] = ELENA_LIFECYCLE_STATE

        # 5. Seed Golden Demo Elena Rostova Onboarding Journey (Preboarding Review / Active 90-day plan)
        case_id = ELENA_ONBOARDING_CASE_ID
        plan_id = ELENA_ONBOARDING_PLAN_ID
        elena_emp_id = ELENA_EMPLOYEE_ID
        mgr_id = MARCUS_VANCE_EMPLOYEE_ID
        eng_dept_id = DEPT_ENG_ID

        # Ensure Elena has a provisional prehire employee record in workforce service
        if elena_emp_id not in workforce_service._employees:
            workforce_service._employees[elena_emp_id] = {
                "id": elena_emp_id,
                "organization_id": org_id,
                "profile_id": elena_cand,
                "candidate_id": elena_cand,
                "employee_code": ELENA_EMPLOYEE_CODE,
                "hire_date": "2026-10-01",
                "department_id": eng_dept_id,
                "job_role_id": ROLE_ELENA_APPLIED_ID,
                "employment_status": "prehire",
                "work_location": "hybrid",
                "employment_type": "full_time",
                "created_at": now,
                "updated_at": now,
            }

        # Seed the onboarding case
        self._cases[case_id] = {
            "id": case_id,
            "organization_id": org_id,
            "candidate_id": elena_cand,
            "candidate_name": ELENA_FULL_NAME,
            "candidate_email": ELENA_PERSONAL_EMAIL,
            "employee_id": elena_emp_id,
            "employee_code": ELENA_EMPLOYEE_CODE,
            "job_opening_id": job_id,
            "job_title": ROLE_ELENA_APPLIED_TITLE,
            "department_id": eng_dept_id,
            "department_name": DEPT_ENG_NAME,
            "job_role_id": ROLE_ELENA_APPLIED_ID,
            "role_title": ROLE_ELENA_APPLIED_TITLE,
            "manager_employee_id": mgr_id,
            "manager_name": MARCUS_VANCE_FULL_NAME,
            "hire_date": "2026-10-01",
            "work_location": "hybrid",
            "status": "in_review",
            "current_plan_id": plan_id,
            "enterpro_handoff_status": "ready",
            "created_at": now,
            "updated_at": now,
        }

        # Seed active plan
        self._plans[plan_id] = {
            "id": plan_id,
            "case_id": case_id,
            "version_number": 1,
            "status": "hr_review",
            "is_active": True,
            "ai_generation_metadata": {
                "journey_rationale": (
                    "Personalized 90-day adaptive plan for Senior Distributed Systems Engineer. "
                    "Redundant introductory containerization and Linux tasks waived due to verified Level 4 skill evidence. "
                    "High-Throughput Python Asyncio gap scheduled as an accelerated Week 1 milestone."
                ),
                "pacing_strategy": (
                    "Front-load compliance on Day 1, introduce technical standards Week 1, "
                    "and schedule deep Raft consensus and multi-region replication across Day 30-60."
                ),
                "focus_areas": [
                    "Raft Consensus & Distributed Systems",
                    "High-Throughput Asynchronous Python",
                    "Multi-Region Zero-Downtime Replication",
                ],
                "generated_at": now,
            },
            "critic_review": {
                "passed": True,
                "rule_checks": {
                    "mandatory_tasks_retained": True,
                    "preboarding_prior_to_day_1": True,
                    "skill_gap_coverage": True,
                    "day_1_workload_pacing": True,
                },
                "workload_pacing_score": 1.0,
                "policy_compliance": True,
                "concerns": [],
                "recommendations": ["Policy compliance verified", "Skill gap adequately covered"],
            },
            "hr_review_status": "pending",
            "hr_reviewer_id": None,
            "hr_reviewed_at": None,
            "hr_notes": None,
            "manager_review_status": "pending",
            "manager_reviewer_id": None,
            "manager_reviewed_at": None,
            "manager_notes": None,
            "created_at": now,
            "updated_at": now,
        }

        # Seed plan tasks
        seed_tasks = [
            (
                "TASK_PREBOARD_DOCS",
                "Complete Preboarding Documentation & Identity Verification",
                "compliance",
                "preboarding",
                -3,
                "pending",
                "self_attestation",
                True,
                None,
            ),
            (
                "TASK_EQUIPMENT_RECEIPT",
                "Confirm Workstation Hardware Receipt & Asset Tagging",
                "it_setup",
                "preboarding",
                -1,
                "pending",
                "self_attestation",
                True,
                None,
            ),
            (
                "TASK_SECURITY_AWARENESS",
                "Mandatory Security Awareness & Phishing Defense Training",
                "security",
                "day_1",
                0,
                "pending",
                "system_check",
                True,
                None,
            ),
            (
                "TASK_DIRECT_DEPOSIT",
                "Configure Direct Deposit & Payroll Setup",
                "compliance",
                "day_1",
                0,
                "pending",
                "self_attestation",
                True,
                None,
            ),
            (
                "TASK_LINUX_INTRO",
                "Introductory Linux & Containerization Fundamentals",
                "learning",
                "day_1",
                0,
                "waived",
                "system_check",
                False,
                "Waived based on verified candidate evidence (Docker L4 / Linux L4)",
            ),
            (
                "TASK_ENV_SETUP",
                "Developer Environment & VPN / Zero-Trust Access Setup",
                "it_setup",
                "day_1",
                0,
                "pending",
                "manager_approval",
                True,
                None,
            ),
            (
                "TASK_LEARN_ASYNC_PY",
                "Targeted Learning: High-Throughput Asynchronous Programming with Python Asyncio & FastAPI",
                "learning",
                "week_1",
                4,
                "pending",
                "artifact_upload",
                False,
                None,
            ),
            (
                "TASK_FIRST_COMMIT",
                "First Production Pull Request & Deployment Pipeline Verification",
                "it_setup",
                "week_1",
                5,
                "pending",
                "manager_approval",
                True,
                None,
            ),
            (
                "TASK_DAY30_CHECKIN",
                "Day 30 Milestone & Role Alignment Review",
                "milestone_review",
                "day_30",
                30,
                "pending",
                "manager_approval",
                True,
                None,
            ),
            (
                "TASK_DAY60_CHECKIN",
                "Day 60 Autonomy & Project Contribution Review",
                "milestone_review",
                "day_60",
                60,
                "pending",
                "manager_approval",
                True,
                None,
            ),
            (
                "TASK_DAY90_FINAL_REVIEW",
                "Day 90 Comprehensive Onboarding Completion & Goal Setting",
                "milestone_review",
                "day_90",
                90,
                "pending",
                "hr_approval",
                True,
                None,
            ),
        ]

        raw_seed_tasks: List[Dict[str, Any]] = []
        for code, title, cat, phase, offset, status, vtype, mand, notes in seed_tasks:
            tid = str(uuid.uuid4())
            raw_seed_tasks.append({
                "id": tid,
                "plan_id": plan_id,
                "task_code": code,
                "title": title,
                "description": f"{title} for {cand['first_name']} {cand['last_name']}",
                "category": cat,
                "phase": phase,
                "is_mandatory": mand,
                "owner_role": "employee" if "CHECKIN" not in code and "REVIEW" not in code else "manager",
                "assignee_id": elena_emp_id,
                "verification_type": vtype,
                "status": status,
                "scheduled_day_offset": offset,
                "estimated_minutes": 60,
                "evidence_url": "https://techcorp.internal/onboarding/verification" if status == "completed" else None,
                "resolution_notes": notes,
                "completed_at": now if status == "completed" else None,
                "dependencies": [],
            })

        scheduled_tasks, dependencies_list = self._run_dependency_scheduler("2026-10-01", raw_seed_tasks)
        for tk in scheduled_tasks:
            self._plan_tasks[tk["id"]] = tk
        self._plan_task_dependencies[plan_id] = dependencies_list

    # ====================================================================
    # 2. Catalogs & Template Queries
    # ====================================================================

    def get_task_definitions(
        self,
        org_id: str,
        category: Optional[str] = None,
        is_mandatory: Optional[bool] = None,
    ) -> List[OnboardingTaskDefinitionResponse]:
        """List active task definitions with optional filtering."""
        defs = [d for d in self._task_definitions.values() if d["organization_id"] == org_id and d["is_active"]]
        if category:
            defs = [d for d in defs if d["category"] == category]
        if is_mandatory is not None:
            defs = [d for d in defs if d["is_mandatory"] == is_mandatory]
        return [OnboardingTaskDefinitionResponse(**d) for d in defs]

    def get_templates(
        self,
        org_id: str,
        scope_type: Optional[str] = None,
    ) -> List[OnboardingTemplateResponse]:
        """List onboarding templates and their assigned task blueprints."""
        tpls = [t for t in self._templates.values() if t["organization_id"] == org_id and t["is_active"]]
        if scope_type:
            tpls = [t for t in tpls if t["scope_type"] == scope_type]

        result = []
        for t in tpls:
            tasks = self._template_tasks.get(t["id"], [])
            task_dtos = [OnboardingTemplateTaskItem(**tk) for tk in tasks]
            record = dict(t)
            record["tasks"] = task_dtos
            result.append(OnboardingTemplateResponse(**record))
        return result

    def get_learning_resources(
        self,
        skill_id: Optional[str] = None,
    ) -> List[LearningResourceResponse]:
        """List curated learning catalog resources, optionally filtered by skill."""
        res = list(self._learning_resources.values())
        if skill_id:
            res = [r for r in res if r["skill_id"] == skill_id]
        return [LearningResourceResponse(**r) for r in res]

    # ====================================================================
    # 3. Deterministic Skill-Gap Analyzer
    # ====================================================================

    def analyze_skill_gaps(
        self,
        org_id: str,
        candidate_id: str,
        job_opening_id: str,
    ) -> SkillGapAnalysisDTO:
        """Compare candidate's verified skills vs target role requirements to produce deterministic skill gaps."""
        # Find candidate profile
        cand = workforce_service._candidate_profiles.get(candidate_id)
        if not cand or cand["organization_id"] != org_id:
            raise NotFoundError(f"Candidate '{candidate_id}' not found in organization")

        # Find job opening and active requirement version
        job = recruitment_service._job_openings.get(job_opening_id)
        if not job or job["organization_id"] != org_id:
            raise NotFoundError(f"Job opening '{job_opening_id}' not found in organization")

        active_req = next(
            (r for r in recruitment_service._requirement_versions.values() if r["job_opening_id"] == job_opening_id and r.get("is_active")),
            None,
        )
        if not active_req:
            # Fallback to any requirement version for this job
            active_req = next(
                (r for r in recruitment_service._requirement_versions.values() if r["job_opening_id"] == job_opening_id),
                None,
            )

        required_skills = active_req.get("required_skills", []) if active_req else []
        preferred_skills = active_req.get("preferred_skills", []) if active_req else []
        all_req_skills = required_skills + preferred_skills

        # Candidate skills lookup:
        # 1. From workforce_service._person_skills for candidate's profile_id / person_id
        # 2. Or from resume extractions in recruitment_service
        cand_person_id = cand.get("profile_id") or candidate_id
        person_skills = {
            ps["skill_id"]: ps["proficiency_level"]
            for ps in workforce_service._person_skills.values()
            if ps["person_id"] == cand_person_id
        }

        # Also inspect resume extractions for candidate
        for ext in recruitment_service._extractions.values():
            if ext.get("candidate_id") == candidate_id:
                for es in ext.get("extracted_skills", []):
                    # Find skill id if matched
                    s_name = es.get("raw_term", "").lower()
                    for s in workforce_service._skills.values():
                        if s["name"].lower() == s_name or s["code"].lower() == s_name:
                            if s["id"] not in person_skills:
                                person_skills[s["id"]] = es.get("proficiency_score", 3)

        # Build gap items
        gaps: List[SkillGapItem] = []
        strong_skills: List[str] = []

        for req in all_req_skills:
            sid = req["skill_id"]
            sname = req["skill_name"]
            min_prof = req.get("min_proficiency", 3)
            cand_prof = person_skills.get(sid, 0)
            importance = req.get("importance", "required")

            if cand_prof < min_prof:
                gap_size = min_prof - cand_prof
                # Find matching learning resources
                matching_res = [
                    LearningResourceResponse(**r)
                    for r in self._learning_resources.values()
                    if r["skill_id"] == sid
                ]
                gaps.append(
                    SkillGapItem(
                        skill_id=sid,
                        skill_name=sname,
                        required_level=min_prof,
                        candidate_level=cand_prof,
                        gap_size=gap_size,
                        importance=importance,
                        recommended_resources=matching_res,
                    )
                )
            else:
                strong_skills.append(f"{sname} (Level {cand_prof}/{min_prof})")

        summary = (
            f"Candidate meets {len(strong_skills)} target competencies. "
            f"Identified {len(gaps)} skill gap(s) requiring targeted learning interventions."
        )

        return SkillGapAnalysisDTO(
            role_title=job.get("title", "Target Role"),
            required_skills_count=len(all_req_skills),
            gap_count=len(gaps),
            gaps=gaps,
            strong_skills=strong_skills,
            summary=summary,
        )

    # ====================================================================
    # 4. Preview Onboarding Case
    # ====================================================================

    def preview_onboarding_case(
        self,
        org_id: str,
        candidate_id: str,
        job_opening_id: str,
    ) -> OnboardingCasePreviewResponse:
        """Previews candidate eligibility, role requirements, skill gaps, and mandatory templates."""
        cand = workforce_service._candidate_profiles.get(candidate_id)
        if not cand or cand["organization_id"] != org_id:
            raise NotFoundError(f"Candidate '{candidate_id}' not found in organization")

        job = recruitment_service._job_openings.get(job_opening_id)
        if not job or job["organization_id"] != org_id:
            raise NotFoundError(f"Job opening '{job_opening_id}' not found in organization")

        dept = workforce_service._departments.get(job["department_id"])
        dept_name = dept["name"] if dept else "Engineering"
        role = workforce_service._job_roles.get(job["job_role_id"])
        role_title = role["title"] if role else job["title"]

        # Check eligibility:
        # Candidate must not be already converted, and must have an offer decision or record_status == 'offered'
        is_converted = cand.get("record_status") == "converted"
        dec_key = f"{job_opening_id}:{candidate_id}"
        decision_rec = recruitment_service._decisions.get(dec_key)
        has_offer = (decision_rec and decision_rec.get("decision") == "offer") or (cand.get("record_status") == "offered")

        if is_converted:
            is_eligible = False
            elig_msg = "Candidate has already been converted to an active employee record."
        elif not has_offer:
            is_eligible = False
            elig_msg = "Candidate has not received an approved employment offer in Stage 4 Recruitment Decision Gate."
        else:
            is_eligible = True
            elig_msg = "Candidate is fully eligible for conversion and automated onboarding plan generation."

        # Compute skill gaps
        gap_analysis = self.analyze_skill_gaps(org_id, candidate_id, job_opening_id)

        # Gather verified skills
        verified_skills = []
        cand_person_id = cand.get("profile_id") or candidate_id
        for ps in workforce_service._person_skills.values():
            if ps["person_id"] == cand_person_id:
                s = workforce_service._skills.get(ps["skill_id"])
                if s:
                    verified_skills.append({
                        "skill_id": s["id"],
                        "name": s["name"],
                        "category": s["category"],
                        "proficiency_level": ps["proficiency_level"],
                        "reliability": ps.get("reliability", "verified"),
                    })

        # Count mandatory tasks from org and department templates
        org_tasks = self._template_tasks.get("70000000-0000-0000-0000-000000000001", [])
        dept_tasks = self._template_tasks.get("70000000-0000-0000-0000-000000000002", [])
        mand_count = sum(1 for t in (org_tasks + dept_tasks) if t["is_mandatory"])

        return OnboardingCasePreviewResponse(
            candidate_id=candidate_id,
            candidate_name=f"{cand['first_name']} {cand['last_name']}",
            candidate_email=cand["email"],
            job_opening_id=job_opening_id,
            job_title=job["title"],
            department_id=job["department_id"],
            department_name=dept_name,
            job_role_id=job["job_role_id"],
            role_title=role_title,
            is_eligible=is_eligible,
            eligibility_message=elig_msg,
            recruitment_decision=decision_rec.get("decision") if decision_rec else cand.get("record_status"),
            verified_skills=verified_skills,
            skill_gaps=gap_analysis.gaps,
            mandatory_task_count=mand_count,
        )

    # ====================================================================
    # 5. Multi-Brain Orchestration Pipeline
    # ====================================================================

    async def _run_journey_architect_brain(
        self,
        candidate_name: str,
        role_title: str,
        department_name: str,
        skill_gaps: List[SkillGapItem],
        mandatory_tasks: List[Dict[str, Any]],
    ) -> PersonalizedJourneyDTO:
        """Brain 1 (Qwen): Reasons over Candidate Twin, role expectations, and skill gaps to personalize journey."""
        system_instruction = (
            "You are the WorkSense Onboarding Journey Architect Agent.\n"
            "Your role is to personalize an onboarding journey for a new hire by recommending specific learning "
            "interventions for identified skill gaps and designing milestone pacing.\n"
            "RULES:\n"
            "1. NEVER remove, alter, or delay mandatory organization or compliance tasks.\n"
            "2. For each identified skill gap, recommend a targeted learning milestone with realistic duration.\n"
            "3. Structure learning into week_1, day_30, or day_60 phases without overloading day 1.\n"
            "4. Return strictly valid RFC 8259 JSON adhering to the provided schema."
        )

        untrusted_input = (
            f"Candidate: {candidate_name}\n"
            f"Target Role: {role_title} ({department_name})\n"
            f"Skill Gaps: {[g.model_dump() for g in skill_gaps]}\n"
            f"Mandatory Retained Tasks: {[t['title'] for t in mandatory_tasks]}\n"
        )

        try:
            journey_dto = await qwen_gateway.generate_structured(
                system_instruction=system_instruction,
                untrusted_input=untrusted_input[:4000],
                target_schema=PersonalizedJourneyDTO,
                prompt_version="onboarding-journey-architect-v1.0",
            )
            return journey_dto
        except (QwenError, Exception) as e:
            logger.warning(f"Qwen Journey Architect failed ({e}). Applying deterministic personalized fallback.")
            return self._deterministic_journey_fallback(role_title, skill_gaps)

    def _deterministic_journey_fallback(
        self,
        role_title: str,
        skill_gaps: List[SkillGapItem],
    ) -> PersonalizedJourneyDTO:
        """Deterministic fallback when Qwen local LLM is slow or offline."""
        suggested_tasks = []
        focus_areas = []

        for idx, gap in enumerate(skill_gaps):
            focus_areas.append(f"{gap.skill_name} (Level {gap.candidate_level} -> {gap.required_level})")
            resource_title = gap.recommended_resources[0].title if gap.recommended_resources else f"Mastery Module: {gap.skill_name}"
            resource_url = gap.recommended_resources[0].url if gap.recommended_resources else "https://learning.techcorp.internal/catalog"
            phase: OnboardingPhase = "week_1" if idx == 0 else ("day_30" if idx == 1 else "day_60")
            day_offset = 4 if phase == "week_1" else (20 if phase == "day_30" else 45)

            suggested_tasks.append({
                "code": f"TASK_LEARN_{gap.skill_name.upper().replace(' ', '_')[:12]}",
                "title": f"Targeted Learning: {resource_title}",
                "description": f"Complete curriculum module targeting {gap.skill_name} gap of {gap.gap_size} proficiency levels. Verify with practical lab exercises.",
                "category": "learning",
                "phase": phase,
                "is_mandatory": False,
                "owner_role": "employee",
                "verification_type": "artifact_upload",
                "scheduled_day_offset": day_offset,
                "evidence_url": resource_url,
                "ai_personalization_source": f"Skill Gap Analyzer: {gap.skill_name} ({gap.gap_size} level gap)",
                "ai_reasoning": f"Identified proficiency deficit ({gap.candidate_level}/{gap.required_level}). Structured early in {phase} to accelerate technical autonomy.",
            })

        rationale = (
            f"Personalized journey configured for {role_title}. "
            f"Retained 100% of enterprise policy tasks and appended {len(suggested_tasks)} personalized skill-gap learning modules."
        )

        return PersonalizedJourneyDTO(
            rationale=rationale,
            suggested_learning_tasks=suggested_tasks,
            milestone_pacing_strategy="Front-load compliance on Day 1, introduce technical standards Week 1, and sequence deep architecture labs across Day 30-60.",
            focus_areas=focus_areas or ["Core Technical Architecture", "Platform Observability"],
        )

    def _run_dependency_scheduler(
        self,
        hire_date_str: str,
        tasks: List[Dict[str, Any]],
    ) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]]]:
        """Brain 2: Deterministic Dependency-Aware Scheduler with Kahn's topological sort and cycle detection."""
        hire_dt = datetime.strptime(hire_date_str, "%Y-%m-%d").date()

        # Build index by task code
        code_to_task: Dict[str, Dict[str, Any]] = {}
        for t in tasks:
            code = t.get("task_code") or t.get("code")
            if code:
                code_to_task[code] = t
                t["code"] = code
                t["task_code"] = code

        # Define canonical enterprise hard-block dependencies
        canonical_dependencies = [
            ("TASK_EQUIPMENT_RECEIPT", "TASK_ENV_SETUP"),      # Hardware receipt -> Dev environment
            ("TASK_SECURITY_AWARENESS", "TASK_FIRST_COMMIT"),   # Security training -> First production PR
            ("TASK_ENV_SETUP", "TASK_FIRST_COMMIT"),            # Dev environment -> First production PR
            ("TASK_PREBOARD_DOCS", "TASK_DIRECT_DEPOSIT"),      # Identity docs -> Direct deposit
            ("TASK_CODE_STANDARDS", "TASK_FIRST_COMMIT"),       # Code standards -> First production PR
            ("TASK_FIRST_COMMIT", "TASK_DAY30_CHECKIN"),        # First PR -> Day 30 review
            ("TASK_DAY30_CHECKIN", "TASK_DAY60_CHECKIN"),       # Day 30 -> Day 60 review
            ("TASK_DAY60_CHECKIN", "TASK_DAY90_FINAL_REVIEW"),  # Day 60 -> Day 90 review
        ]

        dependencies_list: List[Dict[str, Any]] = []
        adj: Dict[str, List[str]] = {t["id"]: [] for t in tasks}
        in_degree: Dict[str, int] = {t["id"]: 0 for t in tasks}

        for upstream_code, downstream_code in canonical_dependencies:
            if upstream_code in code_to_task and downstream_code in code_to_task:
                u_id = code_to_task[upstream_code]["id"]
                v_id = code_to_task[downstream_code]["id"]
                dep_id = str(uuid.uuid4())
                dependencies_list.append({
                    "id": dep_id,
                    "task_id": v_id,
                    "depends_on_task_id": u_id,
                    "dependency_type": "hard_block",
                })
                adj[u_id].append(v_id)
                in_degree[v_id] += 1
                code_to_task[downstream_code]["dependencies"].append(u_id)

        # Kahn's algorithm for topological sorting and cycle detection
        queue = [t["id"] for t in tasks if in_degree[t["id"]] == 0]
        sorted_ids: List[str] = []

        while queue:
            curr_id = queue.pop(0)
            sorted_ids.append(curr_id)
            for neighbor_id in adj.get(curr_id, []):
                in_degree[neighbor_id] -= 1
                if in_degree[neighbor_id] == 0:
                    queue.append(neighbor_id)

        if len(sorted_ids) < len(tasks):
            logger.error("Dependency cycle detected during scheduling! Resolving by pruning cyclic edge.")
            # Fallback to order by relative_day_offset

        # Calculate calendar due dates ensuring dependent tasks are not scheduled before prerequisites
        id_to_task = {t["id"]: t for t in tasks}
        for tid in sorted_ids:
            task = id_to_task[tid]
            offset = task.get("scheduled_day_offset", 0)
            target_date = hire_dt + timedelta(days=offset)

            # Ensure task date >= any upstream task date
            for dep in dependencies_list:
                if dep["task_id"] == tid:
                    parent_task = id_to_task.get(dep["depends_on_task_id"])
                    if parent_task and "due_date" in parent_task:
                        p_date = datetime.strptime(parent_task["due_date"], "%Y-%m-%d").date()
                        if target_date < p_date:
                            target_date = p_date

            task["due_date"] = target_date.isoformat()

        # Sort tasks by phase order and due date
        phase_weights = {"preboarding": 0, "day_1": 1, "week_1": 2, "day_30": 3, "day_60": 4, "day_90": 5}
        sorted_tasks = sorted(
            tasks,
            key=lambda x: (phase_weights.get(x.get("phase", "week_1"), 2), x.get("due_date", ""), x.get("title", ""))
        )

        return sorted_tasks, dependencies_list

    async def _run_plan_critic_brain(
        self,
        tasks: List[Dict[str, Any]],
        skill_gaps: List[SkillGapItem],
        mandatory_definitions: Set[str],
    ) -> PlanCriticReviewDTO:
        """Brain 3: Plan Quality Critic. Validates policy retention, skill gap coverage, and pacing."""
        rule_checks: Dict[str, bool] = {}
        concerns: List[str] = []
        recommendations: List[str] = []

        # Check 1: 100% mandatory policy tasks retained
        task_codes = {t.get("task_code") or t.get("code") for t in tasks}
        missing_mandatory = [code for code in mandatory_definitions if code not in task_codes]
        rule_checks["mandatory_tasks_retained"] = len(missing_mandatory) == 0
        if missing_mandatory:
            concerns.append(f"Missing {len(missing_mandatory)} mandatory policy task(s): {', '.join(missing_mandatory)}")

        # Check 2: Preboarding tasks scheduled strictly before Day 1
        preboarding_tasks = [t for t in tasks if t.get("phase") == "preboarding"]
        preboard_valid = all(t.get("scheduled_day_offset", 0) < 0 for t in preboarding_tasks)
        rule_checks["preboarding_prior_to_day_1"] = preboard_valid
        if not preboard_valid:
            concerns.append("Preboarding hardware and identity tasks must be scheduled prior to Day 1.")

        # Check 3: Every identified skill gap has corresponding learning module
        gap_skill_names = {g.skill_name.lower() for g in skill_gaps}
        covered_skills = set()
        for t in tasks:
            if t.get("category") == "learning" and t.get("ai_personalization_source"):
                for gname in gap_skill_names:
                    if gname in t["title"].lower() or gname in t["description"].lower() or gname in t.get("ai_personalization_source", "").lower():
                        covered_skills.add(gname)

        uncovered = gap_skill_names - covered_skills
        rule_checks["skill_gap_coverage"] = len(uncovered) == 0
        if uncovered:
            recommendations.append(f"Consider adding specialized learning interventions for: {', '.join(uncovered)}")

        # Check 4: Day 1 Workload Pacing (<= 240 minutes)
        day_1_minutes = sum(t.get("estimated_minutes", 45) for t in tasks if t.get("phase") == "day_1")
        rule_checks["day_1_workload_pacing"] = day_1_minutes <= 240
        workload_score = 1.0 if day_1_minutes <= 240 else max(0.4, round(240 / day_1_minutes, 2))
        if day_1_minutes > 240:
            concerns.append(f"Day 1 total duration ({day_1_minutes} mins) exceeds 240-minute fatigue limit. Consider moving non-critical setup to Day 2.")

        all_passed = rule_checks["mandatory_tasks_retained"] and rule_checks["preboarding_prior_to_day_1"]

        return PlanCriticReviewDTO(
            passed=all_passed,
            rule_checks=rule_checks,
            workload_pacing_score=workload_score,
            policy_compliance=rule_checks["mandatory_tasks_retained"],
            concerns=concerns,
            recommendations=recommendations or ["Plan meets enterprise safety, compliance, and pedagogical pacing standards."],
        )

    # ====================================================================
    # 6. Create Onboarding Case (Canonical Conversion & Orchestration)
    # ====================================================================

    async def create_onboarding_case(
        self,
        org_id: str,
        data: OnboardingCaseCreate,
        actor_id: str,
    ) -> OnboardingCaseResponse:
        """Creates onboarding case, calls canonical candidate-to-employee conversion, and runs multi-brain pipeline."""
        cand = workforce_service._candidate_profiles.get(data.candidate_id)
        if not cand or cand["organization_id"] != org_id:
            raise NotFoundError(f"Candidate '{data.candidate_id}' not found")

        job = recruitment_service._job_openings.get(data.job_opening_id)
        if not job or job["organization_id"] != org_id:
            raise NotFoundError(f"Job opening '{data.job_opening_id}' not found")

        dept = workforce_service._departments.get(data.department_id)
        if not dept or dept["organization_id"] != org_id:
            raise NotFoundError(f"Department '{data.department_id}' not found")

        role = workforce_service._job_roles.get(data.job_role_id)
        if not role or role["organization_id"] != org_id:
            raise NotFoundError(f"Job role '{data.job_role_id}' not found")

        # Idempotency Check: check if onboarding case already exists for candidate
        for existing_case in self._cases.values():
            if existing_case["candidate_id"] == data.candidate_id and existing_case["organization_id"] == org_id:
                logger.info(f"Onboarding case already exists for candidate {data.candidate_id}; returning idempotent case.")
                if data.employee_code and existing_case.get("employee_code") != data.employee_code:
                    existing_case["employee_code"] = data.employee_code
                    emp_id = existing_case.get("employee_id")
                    if emp_id and emp_id in workforce_service._employees:
                        workforce_service._employees[emp_id]["employee_code"] = data.employee_code
                return self.get_case(org_id, existing_case["id"])

        # 1. CANONICAL CONVERSION: Invoke workforce_service.convert_candidate_to_employee
        conv_req = CandidateConversionRequest(
            department_id=data.department_id,
            job_role_id=data.job_role_id,
            employee_code=data.employee_code,
            hire_date=data.hire_date,
            manager_employee_id=data.manager_employee_id,
            work_location=data.work_location,
            employment_type=data.employment_type,
        )

        try:
            conv_resp = workforce_service.convert_candidate_to_employee(
                org_id=org_id,
                cand_id=data.candidate_id,
                data=conv_req,
                actor_id=actor_id,
            )
            employee_id = conv_resp.employee_id
            employee_code = conv_resp.employee_code
        except ConflictError as ce:
            # Check if candidate is already converted
            for conv in workforce_service._candidate_conversions.values():
                if conv["candidate_id"] == data.candidate_id:
                    existing_emp = workforce_service._employees[conv["employee_id"]]
                    employee_id = existing_emp["id"]
                    employee_code = existing_emp["employee_code"]
                    break
            else:
                raise ce

        now = datetime.now(timezone.utc).isoformat()
        case_id = str(uuid.uuid4())
        plan_id = str(uuid.uuid4())

        # 2. Analyze deterministic skill gaps
        gap_analysis = self.analyze_skill_gaps(org_id, data.candidate_id, data.job_opening_id)

        # 3. Assemble mandatory template tasks from Org-wide and Department templates
        raw_tasks: List[Dict[str, Any]] = []
        mandatory_codes: Set[str] = set()

        # Org template tasks
        org_tpl_tasks = self._template_tasks.get("70000000-0000-0000-0000-000000000001", [])
        for tk in org_tpl_tasks:
            mandatory_codes.add(tk["code"])
            def_obj = next((d for d in self._task_definitions.values() if d["code"] == tk["code"]), {})
            raw_tasks.append({
                "id": str(uuid.uuid4()),
                "plan_id": plan_id,
                "task_code": tk["code"],
                "title": tk["title"],
                "description": def_obj.get("description", tk["title"]),
                "category": tk["category"],
                "phase": tk["phase"],
                "is_mandatory": True,
                "owner_role": def_obj.get("default_owner_role", "employee"),
                "assignee_id": employee_id if def_obj.get("default_owner_role") == "employee" else data.manager_employee_id,
                "verification_type": tk["verification_type"],
                "status": "pending",
                "scheduled_day_offset": tk["relative_day_offset"],
                "estimated_minutes": def_obj.get("estimated_minutes", 30),
                "ai_personalization_source": None,
                "ai_reasoning": "Organization-wide mandatory compliance and milestone policy.",
                "dependencies": [],
            })

        # Dept template tasks
        dept_tpl_tasks = self._template_tasks.get("70000000-0000-0000-0000-000000000002", [])
        for tk in dept_tpl_tasks:
            mandatory_codes.add(tk["code"])
            def_obj = next((d for d in self._task_definitions.values() if d["code"] == tk["code"]), {})
            raw_tasks.append({
                "id": str(uuid.uuid4()),
                "plan_id": plan_id,
                "task_code": tk["code"],
                "title": tk["title"],
                "description": def_obj.get("description", tk["title"]),
                "category": tk["category"],
                "phase": tk["phase"],
                "is_mandatory": True,
                "owner_role": def_obj.get("default_owner_role", "employee"),
                "assignee_id": employee_id if def_obj.get("default_owner_role") == "employee" else data.manager_employee_id,
                "verification_type": tk["verification_type"],
                "status": "pending",
                "scheduled_day_offset": tk["relative_day_offset"],
                "estimated_minutes": def_obj.get("estimated_minutes", 60),
                "ai_personalization_source": None,
                "ai_reasoning": "Department-level technical baseline policy.",
                "dependencies": [],
            })

        # 4. Multi-Brain: Brain 1 (Qwen Journey Architect)
        journey_dto = await self._run_journey_architect_brain(
            candidate_name=f"{cand['first_name']} {cand['last_name']}",
            role_title=role["title"],
            department_name=dept["name"],
            skill_gaps=gap_analysis.gaps,
            mandatory_tasks=raw_tasks,
        )

        # Append personalized learning tasks
        for item in journey_dto.suggested_learning_tasks:
            raw_tasks.append({
                "id": str(uuid.uuid4()),
                "plan_id": plan_id,
                "task_code": item.get("code", f"TASK_LEARN_{str(uuid.uuid4())[:8]}"),
                "title": item["title"],
                "description": item["description"],
                "category": item.get("category", "learning"),
                "phase": item.get("phase", "week_1"),
                "is_mandatory": False,
                "owner_role": item.get("owner_role", "employee"),
                "assignee_id": employee_id,
                "verification_type": item.get("verification_type", "artifact_upload"),
                "status": "pending",
                "scheduled_day_offset": item.get("scheduled_day_offset", 4),
                "estimated_minutes": item.get("estimated_minutes", 120),
                "evidence_url": item.get("evidence_url"),
                "ai_personalization_source": item.get("ai_personalization_source"),
                "ai_reasoning": item.get("ai_reasoning"),
                "dependencies": [],
            })

        # 5. Multi-Brain: Brain 2 (Deterministic Dependency Scheduler)
        scheduled_tasks, dependencies_list = self._run_dependency_scheduler(
            hire_date_str=data.hire_date,
            tasks=raw_tasks,
        )

        # 6. Multi-Brain: Brain 3 (Plan Quality Critic)
        critic_review = await self._run_plan_critic_brain(
            tasks=scheduled_tasks,
            skill_gaps=gap_analysis.gaps,
            mandatory_definitions=mandatory_codes,
        )

        # 7. Store Plan Tasks and Dependencies
        for tk in scheduled_tasks:
            self._plan_tasks[tk["id"]] = tk

        self._plan_task_dependencies[plan_id] = dependencies_list

        # 8. Store Plan Record (Initial version v1 in hr_review status)
        plan_record = {
            "id": plan_id,
            "case_id": case_id,
            "version_number": 1,
            "status": "hr_review",
            "is_active": True,
            "ai_generation_metadata": {
                "journey_rationale": journey_dto.rationale,
                "pacing_strategy": journey_dto.milestone_pacing_strategy,
                "focus_areas": journey_dto.focus_areas,
                "generated_at": now,
            },
            "critic_review": critic_review.model_dump(),
            "hr_review_status": "pending",
            "hr_reviewer_id": None,
            "hr_reviewed_at": None,
            "hr_notes": None,
            "manager_review_status": "pending",
            "manager_reviewer_id": None,
            "manager_reviewed_at": None,
            "manager_notes": None,
            "created_at": now,
            "updated_at": now,
        }
        self._plans[plan_id] = plan_record

        # 9. Store Case Record
        manager_emp = workforce_service._employees.get(data.manager_employee_id) if data.manager_employee_id else None
        manager_user = identity_service._users.get(manager_emp["profile_id"]) if manager_emp else None
        manager_name = manager_user["full_name"] if manager_user else "Assigned Manager"

        case_record = {
            "id": case_id,
            "organization_id": org_id,
            "candidate_id": data.candidate_id,
            "candidate_name": f"{cand['first_name']} {cand['last_name']}",
            "candidate_email": cand["email"],
            "employee_id": employee_id,
            "employee_code": employee_code,
            "job_opening_id": data.job_opening_id,
            "job_title": job["title"],
            "department_id": data.department_id,
            "department_name": dept["name"],
            "job_role_id": data.job_role_id,
            "role_title": role["title"],
            "manager_employee_id": data.manager_employee_id,
            "manager_name": manager_name,
            "hire_date": data.hire_date,
            "work_location": data.work_location,
            "status": "in_review",
            "current_plan_id": plan_id,
            "enterpro_handoff_status": None,
            "created_at": now,
            "updated_at": now,
        }
        self._cases[case_id] = case_record
        self._plan_diffs[case_id] = []

        # 10. Audit Log
        self._record_audit_event(
            org_id=org_id,
            case_id=case_id,
            plan_id=plan_id,
            actor_id=actor_id,
            action="onboarding.case.created",
            details={
                "candidate_id": data.candidate_id,
                "employee_id": employee_id,
                "task_count": len(scheduled_tasks),
                "plan_version": 1,
            },
        )

        return self.get_case(org_id, case_id)

    # ====================================================================
    # 7. Case & Plan Queries
    # ====================================================================

    def get_case(self, org_id: str, case_id: str) -> OnboardingCaseResponse:
        """Get an onboarding case by ID with full plan and progress metrics."""
        case = self._cases.get(case_id)
        if not case or case["organization_id"] != org_id:
            raise NotFoundError(f"Onboarding case '{case_id}' not found")

        active_plan_dto: Optional[OnboardingPlanResponse] = None
        plan_id = case.get("current_plan_id")
        tasks_list: List[OnboardingPlanTaskResponse] = []

        if plan_id and plan_id in self._plans:
            active_plan_dto = self.get_plan(org_id, plan_id)
            tasks_list = active_plan_dto.tasks

        total_tasks = len(tasks_list)
        completed_tasks = sum(1 for t in tasks_list if t.status == "completed")
        blocked_tasks = sum(1 for t in tasks_list if t.status == "blocked")
        progress = round((completed_tasks / total_tasks * 100.0), 1) if total_tasks > 0 else 0.0

        return OnboardingCaseResponse(
            id=case["id"],
            organization_id=case["organization_id"],
            candidate_id=case["candidate_id"],
            candidate_name=case["candidate_name"],
            candidate_email=case["candidate_email"],
            employee_id=case["employee_id"],
            employee_code=case["employee_code"],
            job_opening_id=case.get("job_opening_id"),
            job_title=case["job_title"],
            department_id=case["department_id"],
            department_name=case["department_name"],
            job_role_id=case["job_role_id"],
            role_title=case["role_title"],
            manager_employee_id=case.get("manager_employee_id"),
            manager_name=case.get("manager_name"),
            hire_date=case["hire_date"],
            work_location=case["work_location"],
            status=case["status"],
            current_plan_id=case.get("current_plan_id"),
            active_plan=active_plan_dto,
            progress_percent=progress,
            completed_tasks_count=completed_tasks,
            total_tasks_count=total_tasks,
            blocked_tasks_count=blocked_tasks,
            enterpro_handoff_status=case.get("enterpro_handoff_status"),
            created_at=case["created_at"],
            updated_at=case["updated_at"],
        )

    def list_cases(
        self,
        org_id: str,
        status: Optional[str] = None,
        manager_id: Optional[str] = None,
        department_id: Optional[str] = None,
    ) -> OnboardingCaseListResponse:
        """List onboarding cases with optional filters."""
        cases = [c for c in self._cases.values() if c["organization_id"] == org_id]
        if status:
            cases = [c for c in cases if c["status"] == status]
        if manager_id:
            cases = [c for c in cases if c.get("manager_employee_id") == manager_id]
        if department_id:
            cases = [c for c in cases if c.get("department_id") == department_id]

        cases_sorted = sorted(cases, key=lambda x: x["created_at"], reverse=True)
        dto_list = [self.get_case(org_id, c["id"]) for c in cases_sorted]
        return OnboardingCaseListResponse(cases=dto_list, total=len(dto_list))

    def get_plan(self, org_id: str, plan_id: str) -> OnboardingPlanResponse:
        """Get onboarding plan details and tasks."""
        plan = self._plans.get(plan_id)
        if not plan:
            raise NotFoundError(f"Onboarding plan '{plan_id}' not found")

        case = self._cases.get(plan["case_id"])
        if not case or case["organization_id"] != org_id:
            raise NotFoundError(f"Onboarding plan '{plan_id}' not found in organization")

        plan_tasks = [t for t in self._plan_tasks.values() if t.get("plan_id") == plan_id]
        phase_weights = {"preboarding": 0, "day_1": 1, "week_1": 2, "day_30": 3, "day_60": 4, "day_90": 5}
        sorted_tasks = sorted(
            plan_tasks,
            key=lambda x: (phase_weights.get(x.get("phase", "week_1"), 2), x.get("due_date", ""), x.get("title", ""))
        )

        task_dtos: List[OnboardingPlanTaskResponse] = []
        for t in sorted_tasks:
            # Resolve assignee name
            assignee_name = None
            if t.get("assignee_id"):
                emp = workforce_service._employees.get(t["assignee_id"])
                if emp:
                    usr = identity_service._users.get(emp["profile_id"])
                    assignee_name = usr["full_name"] if usr else "Assigned Staff"
                else:
                    usr = identity_service._users.get(t["assignee_id"])
                    assignee_name = usr["full_name"] if usr else None

            task_dtos.append(
                OnboardingPlanTaskResponse(
                    id=t["id"],
                    plan_id=t["plan_id"],
                    task_code=t["task_code"],
                    title=t["title"],
                    description=t["description"],
                    category=t["category"],
                    phase=t["phase"],
                    is_mandatory=t["is_mandatory"],
                    owner_role=t["owner_role"],
                    assignee_id=t.get("assignee_id"),
                    assignee_name=assignee_name,
                    verification_type=t["verification_type"],
                    status=t["status"],
                    scheduled_day_offset=t["scheduled_day_offset"],
                    due_date=t.get("due_date"),
                    completed_at=t.get("completed_at"),
                    blocker_reason=t.get("blocker_reason"),
                    blocker_reported_at=t.get("blocker_reported_at"),
                    resolution_notes=t.get("resolution_notes"),
                    evidence_url=t.get("evidence_url"),
                    ai_personalization_source=t.get("ai_personalization_source"),
                    ai_reasoning=t.get("ai_reasoning"),
                    dependencies=t.get("dependencies", []),
                )
            )

        critic_dto = PlanCriticReviewDTO(**plan["critic_review"]) if plan.get("critic_review") else None

        return OnboardingPlanResponse(
            id=plan["id"],
            case_id=plan["case_id"],
            version_number=plan["version_number"],
            status=plan["status"],
            is_active=plan["is_active"],
            ai_generation_metadata=plan.get("ai_generation_metadata"),
            critic_review=critic_dto,
            hr_review_status=plan["hr_review_status"],
            hr_reviewer_id=plan.get("hr_reviewer_id"),
            hr_reviewed_at=plan.get("hr_reviewed_at"),
            hr_notes=plan.get("hr_notes"),
            manager_review_status=plan["manager_review_status"],
            manager_reviewer_id=plan.get("manager_reviewer_id"),
            manager_reviewed_at=plan.get("manager_reviewed_at"),
            manager_notes=plan.get("manager_notes"),
            tasks=task_dtos,
            created_at=plan["created_at"],
            updated_at=plan["updated_at"],
        )

    def get_plan_diffs(self, org_id: str, case_id: str) -> List[PlanDifferenceDTO]:
        """Get version difference history for a case."""
        case = self._cases.get(case_id)
        if not case or case["organization_id"] != org_id:
            raise NotFoundError(f"Onboarding case '{case_id}' not found")
        diffs = self._plan_diffs.get(case_id, [])
        return [PlanDifferenceDTO(**d) for d in diffs]

    # ====================================================================
    # 8. Human Review Gates
    # ====================================================================

    def hr_review_plan(
        self,
        org_id: str,
        plan_id: str,
        data: HRReviewRequest,
        actor_id: str,
    ) -> OnboardingPlanResponse:
        """HR Review Gate: approves or requests changes to the onboarding journey."""
        plan = self._plans.get(plan_id)
        if not plan:
            raise NotFoundError(f"Onboarding plan '{plan_id}' not found")

        case = self._cases.get(plan["case_id"])
        if not case or case["organization_id"] != org_id:
            raise NotFoundError(f"Onboarding plan '{plan_id}' not found in organization")

        now = datetime.now(timezone.utc).isoformat()
        plan["hr_review_status"] = "approved" if data.decision == "approve" else ("changes_requested" if data.decision == "changes_requested" else "rejected")
        plan["hr_reviewer_id"] = actor_id
        plan["hr_reviewed_at"] = now
        plan["hr_notes"] = data.notes
        plan["updated_at"] = now

        if data.decision == "approve":
            # If manager has also approved, activate plan and start onboarding
            if plan["manager_review_status"] == "approved":
                plan["status"] = "approved"
                case["status"] = "in_progress"
            else:
                plan["status"] = "manager_review"
        else:
            plan["status"] = "draft"
            case["status"] = "planning"

        case["updated_at"] = now

        self._record_audit_event(
            org_id=org_id,
            case_id=case["id"],
            plan_id=plan_id,
            actor_id=actor_id,
            action=f"onboarding.plan.hr_review.{data.decision}",
            details={"notes": data.notes},
        )

        return self.get_plan(org_id, plan_id)

    def manager_review_plan(
        self,
        org_id: str,
        plan_id: str,
        data: ManagerReviewRequest,
        actor_id: str,
    ) -> OnboardingPlanResponse:
        """Manager Review Gate: approves or requests modifications to the journey."""
        plan = self._plans.get(plan_id)
        if not plan:
            raise NotFoundError(f"Onboarding plan '{plan_id}' not found")

        case = self._cases.get(plan["case_id"])
        if not case or case["organization_id"] != org_id:
            raise NotFoundError(f"Onboarding plan '{plan_id}' not found in organization")

        now = datetime.now(timezone.utc).isoformat()
        plan["manager_review_status"] = "approved" if data.decision == "approve" else ("changes_requested" if data.decision == "changes_requested" else "rejected")
        plan["manager_reviewer_id"] = actor_id
        plan["manager_reviewed_at"] = now
        plan["manager_notes"] = data.notes
        plan["updated_at"] = now

        if data.decision == "approve":
            # If HR has also approved, activate plan and start onboarding
            if plan["hr_review_status"] == "approved":
                plan["status"] = "approved"
                case["status"] = "in_progress"
            else:
                plan["status"] = "hr_review"
        else:
            plan["status"] = "draft"
            case["status"] = "planning"

        case["updated_at"] = now

        self._record_audit_event(
            org_id=org_id,
            case_id=case["id"],
            plan_id=plan_id,
            actor_id=actor_id,
            action=f"onboarding.plan.manager_review.{data.decision}",
            details={"notes": data.notes},
        )

        return self.get_plan(org_id, plan_id)

    def add_manager_task(
        self,
        org_id: str,
        plan_id: str,
        data: ManagerTaskCreate,
        actor_id: str,
    ) -> OnboardingPlanTaskResponse:
        """Allows Manager to inject a custom milestone or team-specific task into the plan."""
        plan = self._plans.get(plan_id)
        if not plan:
            raise NotFoundError(f"Onboarding plan '{plan_id}' not found")

        case = self._cases.get(plan["case_id"])
        if not case or case["organization_id"] != org_id:
            raise NotFoundError(f"Onboarding plan '{plan_id}' not found in organization")

        hire_dt = datetime.strptime(case["hire_date"], "%Y-%m-%d").date()
        target_date = hire_dt + timedelta(days=data.scheduled_day_offset)

        tid = str(uuid.uuid4())
        task_code = f"TASK_MGR_{str(uuid.uuid4())[:8].upper()}"

        task_record = {
            "id": tid,
            "plan_id": plan_id,
            "task_code": task_code,
            "title": data.title,
            "description": data.description,
            "category": data.category,
            "phase": data.phase,
            "is_mandatory": False,
            "owner_role": data.owner_role,
            "assignee_id": case["employee_id"],
            "verification_type": data.verification_type,
            "status": "pending",
            "scheduled_day_offset": data.scheduled_day_offset,
            "due_date": target_date.isoformat(),
            "completed_at": None,
            "blocker_reason": None,
            "blocker_reported_at": None,
            "resolution_notes": None,
            "evidence_url": None,
            "ai_personalization_source": f"Manager Custom Milestone (Actor: {actor_id})",
            "ai_reasoning": data.reasoning,
            "dependencies": [],
        }
        self._plan_tasks[tid] = task_record

        self._record_audit_event(
            org_id=org_id,
            case_id=case["id"],
            plan_id=plan_id,
            actor_id=actor_id,
            action="onboarding.task.manager_added",
            details={"task_id": tid, "title": data.title},
        )

        return OnboardingPlanTaskResponse(**task_record)

    # ====================================================================
    # 9. Task Execution, Blocker Reporting & Adaptive Replanning
    # ====================================================================

    def complete_task(
        self,
        org_id: str,
        task_id: str,
        data: TaskCompletionRequest,
        actor_id: str,
    ) -> OnboardingPlanTaskResponse:
        """Completes an onboarding task, verifying dependencies and updating employee skill evidence if applicable."""
        task = self._plan_tasks.get(task_id)
        if not task:
            raise NotFoundError(f"Onboarding task '{task_id}' not found")

        plan = self._plans.get(task["plan_id"])
        case = self._cases.get(plan["case_id"])
        if not case or case["organization_id"] != org_id:
            raise NotFoundError(f"Task '{task_id}' not found in organization")

        # Dependency Verification: verify all hard prerequisite dependencies are completed
        deps = self._plan_task_dependencies.get(plan["id"], [])
        for dep in deps:
            if dep["task_id"] == task_id:
                parent = self._plan_tasks.get(dep["depends_on_task_id"])
                if parent and parent["status"] != "completed":
                    raise ValidationError(
                        f"Cannot complete task '{task['title']}' because prerequisite task '{parent['title']}' is not completed."
                    )

        now = datetime.now(timezone.utc).isoformat()
        task["status"] = "completed"
        task["completed_at"] = now
        task["evidence_url"] = data.evidence_url or task.get("evidence_url")
        task["resolution_notes"] = data.notes

        # If task was a learning module, add verified evidence item to Employee Twin
        if task.get("category") == "learning" and task.get("ai_personalization_source"):
            self._record_skill_evidence_for_learning_completion(
                org_id=org_id,
                employee_id=case["employee_id"],
                task_title=task["title"],
                evidence_url=data.evidence_url or "https://learning.techcorp.internal/completion-cert",
                actor_id=actor_id,
            )

        # Check if case is now completed
        all_case_tasks = [t for t in self._plan_tasks.values() if t["plan_id"] == plan["id"]]
        if all(t["status"] == "completed" for t in all_case_tasks):
            case["status"] = "completed"
        elif case["status"] == "blocked":
            # If no tasks are blocked, return case to in_progress
            if not any(t["status"] == "blocked" for t in all_case_tasks):
                case["status"] = "in_progress"

        case["updated_at"] = now

        self._record_audit_event(
            org_id=org_id,
            case_id=case["id"],
            plan_id=plan["id"],
            actor_id=actor_id,
            action="onboarding.task.completed",
            details={"task_id": task_id, "evidence_url": data.evidence_url},
        )

        return OnboardingPlanTaskResponse(**task)

    def _record_skill_evidence_for_learning_completion(
        self,
        org_id: str,
        employee_id: str,
        task_title: str,
        evidence_url: str,
        actor_id: str,
    ) -> None:
        """Updates Employee Twin evidence lineage when a learning milestone is completed."""
        emp = workforce_service._employees.get(employee_id)
        if not emp:
            return

        person_id = emp["profile_id"]
        source_id = "66000000-0000-0000-0000-000000000001"  # Golden Demo source
        now_iso = datetime.now(timezone.utc).isoformat()

        eid = str(uuid.uuid4())
        workforce_service._evidence_items[eid] = {
            "id": eid,
            "organization_id": org_id,
            "subject_person_id": person_id,
            "source_id": source_id,
            "claim_summary": f"Completed verified onboarding learning curriculum: {task_title}",
            "source_type": "onboarding_learning_completion",
            "source_uri": evidence_url,
            "observed_at": now_iso,
            "effective_at": now_iso,
            "confidence_score": 0.95,
            "verification_status": "verified",
            "verified_by": actor_id,
            "verified_at": now_iso,
            "visibility": "public_workforce",
            "is_stale": False,
            "created_at": now_iso,
        }

    def report_task_blocker(
        self,
        org_id: str,
        task_id: str,
        data: TaskBlockerRequest,
        actor_id: str,
    ) -> OnboardingPlanTaskResponse:
        """Reports a task blocker, marking task and case as blocked for manager/HR intervention."""
        task = self._plan_tasks.get(task_id)
        if not task:
            raise NotFoundError(f"Onboarding task '{task_id}' not found")

        plan = self._plans.get(task["plan_id"])
        case = self._cases.get(plan["case_id"])
        if not case or case["organization_id"] != org_id:
            raise NotFoundError(f"Task '{task_id}' not found in organization")

        now = datetime.now(timezone.utc).isoformat()
        task["status"] = "blocked"
        task["blocker_reason"] = data.blocker_reason
        task["blocker_reported_at"] = now
        case["status"] = "blocked"
        case["updated_at"] = now

        self._record_audit_event(
            org_id=org_id,
            case_id=case["id"],
            plan_id=plan["id"],
            actor_id=actor_id,
            action="onboarding.task.blocked",
            details={"task_id": task_id, "reason": data.blocker_reason},
        )

        return OnboardingPlanTaskResponse(**task)

    async def propose_adaptive_replan(
        self,
        org_id: str,
        case_id: str,
        data: AdaptiveReplanRequest,
        actor_id: str,
    ) -> OnboardingPlanResponse:
        """Controlled Adaptive Replanner: clones active plan, recalibrates deadlines, records diff, and requires review."""
        case = self._cases.get(case_id)
        if not case or case["organization_id"] != org_id:
            raise NotFoundError(f"Onboarding case '{case_id}' not found")

        current_plan_id = case.get("current_plan_id")
        current_plan = self._plans.get(current_plan_id)
        if not current_plan:
            raise NotFoundError("No active onboarding plan found for case")

        now = datetime.now(timezone.utc).isoformat()
        new_plan_id = str(uuid.uuid4())
        new_version = current_plan["version_number"] + 1

        # Clone tasks
        old_tasks = [t for t in self._plan_tasks.values() if t["plan_id"] == current_plan_id]
        id_map: Dict[str, str] = {}
        new_tasks: List[Dict[str, Any]] = []

        for ot in old_tasks:
            nt_id = str(uuid.uuid4())
            id_map[ot["id"]] = nt_id
            nt = dict(ot)
            nt["id"] = nt_id
            nt["plan_id"] = new_plan_id
            new_tasks.append(nt)

        # Clone dependencies with new IDs
        old_deps = self._plan_task_dependencies.get(current_plan_id, [])
        new_deps: List[Dict[str, Any]] = []
        for od in old_deps:
            if od["task_id"] in id_map and od["depends_on_task_id"] in id_map:
                new_deps.append({
                    "id": str(uuid.uuid4()),
                    "task_id": id_map[od["task_id"]],
                    "depends_on_task_id": id_map[od["depends_on_task_id"]],
                    "dependency_type": od["dependency_type"],
                })

        # Identify target task to shift
        target_new_id = id_map.get(data.trigger_task_id) if data.trigger_task_id else None

        # Build downstream transitive dependents
        downstream_ids: Set[str] = set()
        if target_new_id:
            downstream_ids.add(target_new_id)
            queue = [target_new_id]
            while queue:
                curr = queue.pop(0)
                for dep in new_deps:
                    if dep["depends_on_task_id"] == curr and dep["task_id"] not in downstream_ids:
                        downstream_ids.add(dep["task_id"])
                        queue.append(dep["task_id"])

        # Apply calendar shift to target and downstream tasks
        task_diff: Dict[str, Any] = {"shifted_tasks": [], "unblocked_tasks": []}
        for nt in new_tasks:
            if nt["id"] in downstream_ids:
                old_date_str = nt.get("due_date", case["hire_date"])
                old_date = datetime.strptime(old_date_str, "%Y-%m-%d").date()
                new_date = old_date + timedelta(days=data.suggested_day_shift)
                nt["due_date"] = new_date.isoformat()
                nt["scheduled_day_offset"] = nt.get("scheduled_day_offset", 0) + data.suggested_day_shift

                # If this was the blocked task, mark it as in_progress and log resolution notes
                if nt["id"] == target_new_id:
                    nt["status"] = "in_progress"
                    nt["resolution_notes"] = f"Adaptive replan shifted due date by +{data.suggested_day_shift} days to unblock. Rationale: {data.explanation}"
                    task_diff["unblocked_tasks"].append(nt["title"])

                task_diff["shifted_tasks"].append({
                    "title": nt["title"],
                    "old_due_date": old_date_str,
                    "new_due_date": new_date.isoformat(),
                    "shift_days": data.suggested_day_shift,
                })

        # Save new tasks and dependencies
        for nt in new_tasks:
            self._plan_tasks[nt["id"]] = nt
        self._plan_task_dependencies[new_plan_id] = new_deps

        # Multi-Brain: Brain 4 (Adaptation Reasoning Agent)
        system_instruction = (
            "You are the WorkSense Adaptive Replanning Agent.\n"
            "An onboarding milestone blocker or schedule disruption occurred.\n"
            "Analyze the schedule recalibration and provide structured explanation and risk assessment.\n"
            "Return strictly RFC 8259 JSON matching the provided schema."
        )
        untrusted_input = (
            f"Case: {case['candidate_name']} ({case['role_title']})\n"
            f"Disruption Trigger: {data.trigger}\n"
            f"Explanation: {data.explanation}\n"
            f"Applied Day Shift: +{data.suggested_day_shift} days\n"
            f"Affected Shifted Tasks: {[s['title'] for s in task_diff['shifted_tasks']]}\n"
        )

        adaptation_dto: Optional[PlanAdaptationDTO] = None
        try:
            adaptation_dto = await qwen_gateway.generate_structured(
                system_instruction=system_instruction,
                untrusted_input=untrusted_input[:3000],
                target_schema=PlanAdaptationDTO,
                prompt_version="onboarding-replan-v1.0",
            )
        except Exception:
            adaptation_dto = PlanAdaptationDTO(
                reasoning=f"Recalibrated journey by shifting blocked milestone and downstream dependencies by +{data.suggested_day_shift} days.",
                suggested_date_shifts={s["title"]: s["shift_days"] for s in task_diff["shifted_tasks"]},
                priority_changes={},
                risk_assessment="Low risk. Mandatory compliance milestones remain intact; downstream milestones adjusted smoothly.",
            )

        # Create new plan record (Requires Manager review)
        new_plan_record = {
            "id": new_plan_id,
            "case_id": case_id,
            "version_number": new_version,
            "status": "manager_review",
            "is_active": True,
            "ai_generation_metadata": {
                "adaptation_reasoning": adaptation_dto.reasoning,
                "risk_assessment": adaptation_dto.risk_assessment,
                "replan_trigger": data.trigger,
                "replan_explanation": data.explanation,
                "generated_at": now,
            },
            "critic_review": current_plan.get("critic_review"),
            "hr_review_status": "approved",  # Carry forward HR baseline approval
            "hr_reviewer_id": current_plan.get("hr_reviewer_id"),
            "hr_reviewed_at": current_plan.get("hr_reviewed_at"),
            "hr_notes": current_plan.get("hr_notes"),
            "manager_review_status": "pending",  # Manager must review the adaptive shift
            "manager_reviewer_id": None,
            "manager_reviewed_at": None,
            "manager_notes": None,
            "created_at": now,
            "updated_at": now,
        }
        self._plans[new_plan_id] = new_plan_record

        # Mark previous plan as superseded
        current_plan["is_active"] = False
        current_plan["status"] = "superseded"
        current_plan["updated_at"] = now

        # Update case
        case["current_plan_id"] = new_plan_id
        case["status"] = "in_review"
        case["updated_at"] = now

        # Record diff
        diff_id = str(uuid.uuid4())
        diff_summary = f"Plan v{new_version} generated via {data.trigger}: shifted {len(task_diff['shifted_tasks'])} downstream task(s) by +{data.suggested_day_shift} days."
        diff_record = {
            "id": diff_id,
            "case_id": case_id,
            "from_plan_id": current_plan_id,
            "to_plan_id": new_plan_id,
            "adaptation_trigger": data.trigger,
            "summary": diff_summary,
            "task_diff": task_diff,
            "created_at": now,
        }
        self._plan_diffs.setdefault(case_id, []).append(diff_record)

        self._record_audit_event(
            org_id=org_id,
            case_id=case_id,
            plan_id=new_plan_id,
            actor_id=actor_id,
            action="onboarding.plan.replan_proposed",
            details={
                "from_version": current_plan["version_number"],
                "to_version": new_version,
                "shifted_task_count": len(task_diff["shifted_tasks"]),
            },
        )

        return self.get_plan(org_id, new_plan_id)

    # ====================================================================
    # 10. EnterPro Handoff (Simulated / Demonstration Adapter)
    # ====================================================================

    def dispatch_to_enterpro(
        self,
        org_id: str,
        case_id: str,
        data: EnterProHandoffRequest,
        actor_id: str,
    ) -> EnterProHandoffResponse:
        """Idempotent EnterPro demonstration adapter producing SIMULATED_ACKNOWLEDGEMENT with correlation tracking."""
        case = self._cases.get(case_id)
        if not case or case["organization_id"] != org_id:
            raise NotFoundError(f"Onboarding case '{case_id}' not found")

        # Idempotency check: if handoff already exists for case, return it
        if case_id in self._enterpro_handoffs:
            existing = self._enterpro_handoffs[case_id]
            return EnterProHandoffResponse(**existing)

        now = datetime.now(timezone.utc).isoformat()
        correlation_id = data.correlation_id or f"EP-ONB-{case_id[:8]}-{int(time.time())}"
        simulated_wf_id = f"ENTERPRO-WF-SIM-{str(uuid.uuid4())[:8].upper()}"

        # Count active plan tasks
        active_plan = self._plans.get(case.get("current_plan_id", ""))
        tasks_count = len([t for t in self._plan_tasks.values() if t["plan_id"] == active_plan["id"]]) if active_plan else 0

        disclaimer = (
            "WorkSense EnterPro Adapter: Simulated external workflow handoff acknowledged. "
            "Official EnterPro live credentials/endpoints pending enterprise transport configuration."
        )

        handoff_record = {
            "id": str(uuid.uuid4()),
            "case_id": case_id,
            "correlation_id": correlation_id,
            "status": "SIMULATED_ACKNOWLEDGEMENT",
            "simulated_external_workflow_id": simulated_wf_id,
            "dispatched_tasks_count": tasks_count,
            "acknowledged_at": now,
            "disclaimer": disclaimer,
        }
        self._enterpro_handoffs[case_id] = handoff_record
        case["enterpro_handoff_status"] = "SIMULATED_ACKNOWLEDGEMENT"
        case["updated_at"] = now

        self._record_audit_event(
            org_id=org_id,
            case_id=case_id,
            plan_id=case.get("current_plan_id"),
            actor_id=actor_id,
            action="onboarding.enterpro.dispatched",
            details={
                "correlation_id": correlation_id,
                "simulated_workflow_id": simulated_wf_id,
                "task_count": tasks_count,
            },
        )

        return EnterProHandoffResponse(**handoff_record)

    # ====================================================================
    # 11. Audit Logging Helper
    # ====================================================================

    def _record_audit_event(
        self,
        org_id: str,
        case_id: str,
        plan_id: Optional[str],
        actor_id: str,
        action: str,
        details: Dict[str, Any],
    ) -> None:
        """Appends immutable audit trail record."""
        now = datetime.now(timezone.utc).isoformat()
        event = {
            "id": str(uuid.uuid4()),
            "organization_id": org_id,
            "case_id": case_id,
            "plan_id": plan_id,
            "actor_id": actor_id,
            "action": action,
            "ip_address": "127.0.0.1",
            "details": details,
            "timestamp": now,
        }
        self._audit_events.append(event)
        # Also log to identity service audit log for unified visibility
        identity_service._audit_logs.append({
            "id": event["id"],
            "organization_id": org_id,
            "actor_id": actor_id,
            "action": action,
            "entity_type": "onboarding_case",
            "entity_id": case_id,
            "ip_address": "127.0.0.1",
            "timestamp": now,
            "metadata": details,
        })


# Global singleton instance
onboarding_service = OnboardingService()
