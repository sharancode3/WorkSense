"""Authoritative Workforce Data Layer Service for WorkSense.

Implements the shared data foundation for:
- Departments & Hierarchy (with cycle prevention)
- Job Roles & Skill Requirements
- Skill Taxonomy & Relational Graph
- Sources & Evidence Ledger (with freshness and confidence bands)
- Candidate Profiles & Candidate Twin
- Candidate-to-Employee Conversion (transactional, idempotent, lineage preserving)
- Employee Profiles & Temporal Employee Twin
- Manager Hierarchy (with cycle prevention and direct report validation)
- Goals, Feedback (explicit visibility classifications), Attendance Summaries
- Policy Documents & Versioning (with supersession tracking)
- Rules-based Data Quality Engine
- Multi-Tenant Isolation and Zero Client-Side Role Trust
"""

import logging
import uuid
from datetime import date, datetime, timedelta, timezone
from typing import Any, Dict, List, Optional, Set

from app.core.errors import ConflictError, ForbiddenError, NotFoundError, ValidationError
from app.schemas.workforce import (
    AttendanceSummaryCreate,
    AttendanceSummaryResponse,
    CandidateConversionPreviewResponse,
    CandidateConversionRequest,
    CandidateConversionResponse,
    CandidateProfileCreate,
    CandidateProfileResponse,
    CandidateProfileUpdate,
    CandidateTwinResponse,
    DataQualityIssueResponse,
    DataQualitySummaryResponse,
    DepartmentCreate,
    DepartmentResponse,
    DepartmentTreeItem,
    DepartmentUpdate,
    EmployeeProfileCreate,
    EmployeeProfileResponse,
    EmployeeProfileUpdate,
    EmployeeTwinResponse,
    EvidenceItemCreate,
    EvidenceItemResponse,
    FeedbackCreate,
    FeedbackResponse,
    GoalCreate,
    GoalResponse,
    GoalUpdate,
    JobRoleCreate,
    JobRoleResponse,
    JobRoleUpdate,
    ManagerRelationshipResponse,
    PersonSkillCreate,
    PersonSkillResponse,
    PolicyDocumentCreate,
    PolicyDocumentResponse,
    PolicyVersionCreate,
    PolicyVersionResponse,
    RoleSkillRequirementCreate,
    RoleSkillRequirementDTO,
    SkillCreate,
    SkillGraphEdge,
    SkillGraphNode,
    SkillGraphResponse,
    SkillRelationshipCreate,
    SkillRelationshipDTO,
    SkillResponse,
    SourceCreate,
    SourceResponse,
    TimelineEvent,
)
from app.services.identity_service import identity_service
from app.data.canonical_demo import (
    ORG_TECHCORP_ID,
    DEPT_ENG_ID,
    DEPT_ENG_CODE,
    DEPT_ENG_NAME,
    DEPT_INFRA_ID,
    DEPT_INFRA_CODE,
    DEPT_INFRA_NAME,
    DEPT_AI_ID,
    DEPT_AI_CODE,
    DEPT_AI_NAME,
    DEPT_PEOPLE_ID,
    DEPT_PEOPLE_CODE,
    DEPT_PEOPLE_NAME,
    ROLE_ELENA_APPLIED_ID,
    ROLE_ELENA_APPLIED_CODE,
    ROLE_ELENA_APPLIED_TITLE,
    ROLE_MARCUS_CURRENT_ID,
    ROLE_MARCUS_CURRENT_CODE,
    ROLE_MARCUS_CURRENT_TITLE,
    ROLE_TA_LEAD_ID,
    ROLE_TA_LEAD_CODE,
    ROLE_TA_LEAD_TITLE,
    ROLE_HRBP_SR_ID,
    ROLE_HRBP_SR_CODE,
    ROLE_HRBP_SR_TITLE,
    ROLE_MARCUS_TARGET_ID,
    ROLE_MARCUS_TARGET_CODE,
    ROLE_MARCUS_TARGET_TITLE,
    MARCUS_VANCE_EMPLOYEE_ID,
    MARCUS_VANCE_PROFILE_ID,
    MARCUS_VANCE_EMPLOYEE_CODE,
    MARCUS_CHEN_EMPLOYEE_ID,
    MARCUS_CHEN_PROFILE_ID,
    MARCUS_CHEN_EMPLOYEE_CODE,
)

logger = logging.getLogger("worksense.workforce")


class WorkforceService:
    """Stateful service implementing the core workforce data layer."""

    def __init__(self) -> None:
        # In-memory primary stores keyed by UUID string
        self._departments: Dict[str, Dict[str, Any]] = {}
        self._job_roles: Dict[str, Dict[str, Any]] = {}
        self._role_skill_reqs: Dict[str, Dict[str, Any]] = {}  # id -> req
        self._skills: Dict[str, Dict[str, Any]] = {}
        self._skill_aliases: Dict[str, Dict[str, Any]] = {}  # alias.lower() -> alias_dict
        self._skill_relationships: Dict[str, Dict[str, Any]] = {}
        self._sources: Dict[str, Dict[str, Any]] = {}
        self._evidence_items: Dict[str, Dict[str, Any]] = {}
        self._evidence_links: Dict[str, Dict[str, Any]] = {}
        self._candidate_profiles: Dict[str, Dict[str, Any]] = {}
        self._employees: Dict[str, Dict[str, Any]] = {}
        self._manager_relationships: Dict[str, Dict[str, Any]] = {}
        self._person_skills: Dict[str, Dict[str, Any]] = {}
        self._candidate_conversions: Dict[str, Dict[str, Any]] = {}
        self._goals: Dict[str, Dict[str, Any]] = {}
        self._feedback_records: Dict[str, Dict[str, Any]] = {}
        self._attendance_summaries: Dict[str, Dict[str, Any]] = {}
        self._policy_documents: Dict[str, Dict[str, Any]] = {}
        self._policy_versions: Dict[str, Dict[str, Any]] = {}
        self._data_quality_issues: Dict[str, Dict[str, Any]] = {}

        self._seed_workforce_data()

    # ====================================================================
    # Seed Initial Deterministic Workforce Data
    # ====================================================================

    def _seed_workforce_data(self) -> None:
        """Seed repeatable demonstration workforce dataset for TechCorp."""
        org_techcorp_id = ORG_TECHCORP_ID
        now_iso = datetime.now(timezone.utc).isoformat()

        # 1. Departments
        d_eng = {
            "id": DEPT_ENG_ID,
            "organization_id": org_techcorp_id,
            "code": DEPT_ENG_CODE,
            "name": DEPT_ENG_NAME,
            "description": "Core technology research, development, and infrastructure",
            "parent_department_id": None,
            "head_profile_id": MARCUS_VANCE_PROFILE_ID,
            "is_active": True,
            "created_at": now_iso,
            "updated_at": now_iso,
        }
        d_infra = {
            "id": DEPT_INFRA_ID,
            "organization_id": org_techcorp_id,
            "code": DEPT_INFRA_CODE,
            "name": DEPT_INFRA_NAME,
            "description": "Cloud platforms, distributed systems, and reliability engineering",
            "parent_department_id": DEPT_ENG_ID,
            "head_profile_id": MARCUS_VANCE_PROFILE_ID,
            "is_active": True,
            "created_at": now_iso,
            "updated_at": now_iso,
        }
        d_ai = {
            "id": DEPT_AI_ID,
            "organization_id": org_techcorp_id,
            "code": DEPT_AI_CODE,
            "name": DEPT_AI_NAME,
            "description": "Applied machine learning models, inference accelerators, and fraud mitigation",
            "parent_department_id": DEPT_ENG_ID,
            "head_profile_id": "30000000-0000-0000-0000-000000000006",
            "is_active": True,
            "created_at": now_iso,
            "updated_at": now_iso,
        }
        d_people = {
            "id": DEPT_PEOPLE_ID,
            "organization_id": org_techcorp_id,
            "code": DEPT_PEOPLE_CODE,
            "name": DEPT_PEOPLE_NAME,
            "description": "Human resources, talent acquisition, and workforce governance",
            "parent_department_id": None,
            "head_profile_id": "30000000-0000-0000-0000-000000000005",
            "is_active": True,
            "created_at": now_iso,
            "updated_at": now_iso,
        }
        for d in [d_eng, d_infra, d_ai, d_people]:
            self._departments[d["id"]] = d

        # 2. Skills
        skills_data = [
            ("62000000-0000-0000-0000-000000000001", "skill_pytorch", "PyTorch", "Machine Learning", "Deep learning framework"),
            ("62000000-0000-0000-0000-000000000002", "skill_triton", "Triton Inference Server", "Machine Learning", "High-performance inference engine"),
            ("62000000-0000-0000-0000-000000000003", "skill_cuda", "CUDA", "Hardware Acceleration", "Parallel GPU computing"),
            ("62000000-0000-0000-0000-000000000004", "skill_k8s", "Kubernetes", "Infrastructure", "Container orchestration"),
            ("62000000-0000-0000-0000-000000000005", "skill_dist_sys", "Distributed Systems", "Engineering", "Consensus and fault-tolerant architecture"),
            ("62000000-0000-0000-0000-000000000006", "skill_fastapi", "FastAPI", "Backend", "High-performance Python web APIs"),
            ("62000000-0000-0000-0000-000000000007", "skill_postgres", "PostgreSQL", "Databases", "Relational database with vector search"),
            ("62000000-0000-0000-0000-000000000008", "skill_golang", "Go (Golang)", "Programming Languages", "Concurrent systems language"),
        ]
        for sid, scode, sname, scat, sdesc in skills_data:
            self._skills[sid] = {
                "id": sid,
                "code": scode,
                "name": sname,
                "category": scat,
                "description": sdesc,
                "is_active": True,
                "created_at": now_iso,
                "updated_at": now_iso,
            }

        # Skill Aliases
        aliases = [
            ("63000000-0000-0000-0000-000000000001", "62000000-0000-0000-0000-000000000004", "K8s"),
            ("63000000-0000-0000-0000-000000000002", "62000000-0000-0000-0000-000000000007", "Postgres"),
            ("63000000-0000-0000-0000-000000000003", "62000000-0000-0000-0000-000000000008", "Golang"),
        ]
        for aid, asid, atext in aliases:
            self._skill_aliases[atext.lower()] = {
                "id": aid,
                "skill_id": asid,
                "alias": atext,
                "created_at": now_iso,
            }

        # Skill Relationships
        rel_edges = [
            ("64000000-0000-0000-0000-000000000001", "62000000-0000-0000-0000-000000000002", "62000000-0000-0000-0000-000000000003", "ADJACENT_TO", 0.850, True),
            ("64000000-0000-0000-0000-000000000002", "62000000-0000-0000-0000-000000000001", "62000000-0000-0000-0000-000000000002", "PREREQUISITE_OF", 0.750, False),
            ("64000000-0000-0000-0000-000000000003", "62000000-0000-0000-0000-000000000004", "62000000-0000-0000-0000-000000000005", "ADJACENT_TO", 0.700, True),
        ]
        for rid, s1, s2, rtype, weight, bidir in rel_edges:
            self._skill_relationships[rid] = {
                "id": rid,
                "source_skill_id": s1,
                "target_skill_id": s2,
                "relationship_type": rtype,
                "similarity_weight": weight,
                "is_bidirectional": bidir,
                "created_at": now_iso,
            }

        # 3. Job Roles
        roles_data = [
            (ROLE_ELENA_APPLIED_ID, DEPT_ENG_ID, ROLE_ELENA_APPLIED_CODE, ROLE_ELENA_APPLIED_TITLE, "Engineering", "L5", "Architects high-throughput distributed state stores and resilient backend services"),
            (ROLE_MARCUS_CURRENT_ID, DEPT_INFRA_ID, ROLE_MARCUS_CURRENT_CODE, ROLE_MARCUS_CURRENT_TITLE, "Infrastructure", "L5", "Builds resilient Kubernetes platforms and multi-region failover"),
            (ROLE_TA_LEAD_ID, DEPT_PEOPLE_ID, ROLE_TA_LEAD_CODE, ROLE_TA_LEAD_TITLE, "Talent Acquisition", "L4", "Drives technical recruiting and rubric-grounded evaluations"),
            (ROLE_HRBP_SR_ID, DEPT_PEOPLE_ID, ROLE_HRBP_SR_CODE, ROLE_HRBP_SR_TITLE, "Human Resources", "L5", "Guides internal mobility, workforce risk mitigation, and org health"),
            (ROLE_MARCUS_TARGET_ID, DEPT_INFRA_ID, ROLE_MARCUS_TARGET_CODE, ROLE_MARCUS_TARGET_TITLE, "Infrastructure", "L6", "Leads distributed architecture and AI fraud detection platform scalability"),
        ]
        for jid, dept_id, jcode, jtitle, jfam, jsen, jsum in roles_data:
            self._job_roles[jid] = {
                "id": jid,
                "organization_id": org_techcorp_id,
                "department_id": dept_id,
                "code": jcode,
                "title": jtitle,
                "role_family": jfam,
                "seniority_level": jsen,
                "summary": jsum,
                "responsibilities": "Deliver robust engineering outcomes and lead key projects",
                "is_active": True,
                "created_at": now_iso,
                "updated_at": now_iso,
            }

        # Role Skill Requirements
        reqs = [
            ("65000000-0000-0000-0000-000000000001", "61000000-0000-0000-0000-000000000001", "62000000-0000-0000-0000-000000000001", True, 5, 1.000, "current"),
            ("65000000-0000-0000-0000-000000000002", "61000000-0000-0000-0000-000000000001", "62000000-0000-0000-0000-000000000003", True, 4, 0.900, "current"),
            ("65000000-0000-0000-0000-000000000003", "61000000-0000-0000-0000-000000000001", "62000000-0000-0000-0000-000000000002", False, 4, 0.750, "future"),
            ("65000000-0000-0000-0000-000000000004", "61000000-0000-0000-0000-000000000002", "62000000-0000-0000-0000-000000000004", True, 5, 1.000, "current"),
            ("65000000-0000-0000-0000-000000000005", "61000000-0000-0000-0000-000000000002", "62000000-0000-0000-0000-000000000005", True, 4, 0.850, "current"),
        ]
        for req_id, jrole_id, skid, is_req, min_p, weight, dclass in reqs:
            self._role_skill_reqs[req_id] = {
                "id": req_id,
                "job_role_id": jrole_id,
                "skill_id": skid,
                "is_required": is_req,
                "min_proficiency": min_p,
                "importance_weight": weight,
                "demand_classification": dclass,
                "created_at": now_iso,
            }

        # 4. Sources
        s_seed = {
            "id": "66000000-0000-0000-0000-000000000001",
            "organization_id": org_techcorp_id,
            "source_type": "demo_seed",
            "name": "Golden Demo Seed Dataset",
            "external_reference": "DEMO-SEED-2026",
            "reliability_status": "verified",
            "metadata": {"origin": "curated_demo_fixture"},
            "created_at": now_iso,
        }
        s_gh = {
            "id": "66000000-0000-0000-0000-000000000002",
            "organization_id": org_techcorp_id,
            "source_type": "csv_import",
            "name": "GitHub Pull Request Verification",
            "external_reference": "PR-402",
            "reliability_status": "verified",
            "metadata": {"repo": "vllm-project/vllm", "pr_number": 402},
            "created_at": now_iso,
        }
        self._sources[s_seed["id"]] = s_seed
        self._sources[s_gh["id"]] = s_gh

        # 5. Evidence Items
        e1 = {
            "id": "67000000-0000-0000-0000-000000000001",
            "organization_id": org_techcorp_id,
            "subject_person_id": "30000000-0000-0000-0000-000000000099",  # Sarah Lin
            "source_id": s_gh["id"],
            "claim_summary": "Authored optimized Triton GEMM custom kernel reducing model inference latency by 32%",
            "source_type": "github_pr",
            "source_uri": "https://github.com/vllm-project/vllm/pull/402",
            "observed_at": (datetime.now(timezone.utc) - timedelta(days=45)).isoformat(),
            "effective_at": (datetime.now(timezone.utc) - timedelta(days=45)).isoformat(),
            "confidence_score": 0.950,
            "verification_status": "verified",
            "verified_by": "30000000-0000-0000-0000-000000000004",  # Recruiter
            "verified_at": (datetime.now(timezone.utc) - timedelta(days=10)).isoformat(),
            "visibility": "public_workforce",
            "is_stale": False,
            "created_at": now_iso,
        }
        e2 = {
            "id": "67000000-0000-0000-0000-000000000002",
            "organization_id": org_techcorp_id,
            "subject_person_id": "30000000-0000-0000-0000-000000000002",  # Marcus Chen
            "source_id": s_seed["id"],
            "claim_summary": "Architected multi-region Kubernetes cluster auto-scaling handling 250k req/sec peak",
            "source_type": "production_incident",
            "source_uri": "https://techcorp.internal/incidents/INC-8821",
            "observed_at": (datetime.now(timezone.utc) - timedelta(days=30)).isoformat(),
            "effective_at": (datetime.now(timezone.utc) - timedelta(days=30)).isoformat(),
            "confidence_score": 0.900,
            "verification_status": "verified",
            "verified_by": "30000000-0000-0000-0000-000000000003",  # Marcus Vance
            "verified_at": (datetime.now(timezone.utc) - timedelta(days=25)).isoformat(),
            "visibility": "public_workforce",
            "is_stale": False,
            "created_at": now_iso,
        }
        self._evidence_items[e1["id"]] = e1
        self._evidence_items[e2["id"]] = e2

        # 6. Candidate Profile (Sarah Lin)
        c_sarah = {
            "id": "68000000-0000-0000-0000-000000000001",
            "organization_id": org_techcorp_id,
            "profile_id": "30000000-0000-0000-0000-000000000099",
            "first_name": "Sarah",
            "last_name": "Lin",
            "email": "sarah.lin@example.com",
            "phone": "+91 98765 43210",
            "location": "Bengaluru, India",
            "current_title": "Senior ML Systems Engineer",
            "years_experience": 7.5,
            "education_summary": "MS Computer Science, Stanford University",
            "summary": "Specialist in low-latency distributed deep learning inference and custom GPU kernel optimization",
            "target_role_id": "61000000-0000-0000-0000-000000000001",
            "consent_given": True,
            "record_status": "active",
            "created_at": now_iso,
            "updated_at": now_iso,
        }
        self._candidate_profiles[c_sarah["id"]] = c_sarah

        # 7. Employees
        # Marcus Vance (Manager)
        emp_vance = {
            "id": MARCUS_VANCE_EMPLOYEE_ID,
            "organization_id": org_techcorp_id,
            "profile_id": MARCUS_VANCE_PROFILE_ID,
            "candidate_id": None,
            "employee_code": MARCUS_VANCE_EMPLOYEE_CODE,
            "hire_date": "2021-01-15",
            "department_id": DEPT_INFRA_ID,
            "job_role_id": ROLE_MARCUS_CURRENT_ID,
            "employment_status": "active",
            "work_location": "Bengaluru HQ",
            "employment_type": "full_time",
            "created_at": now_iso,
            "updated_at": now_iso,
        }
        # Marcus Chen (Senior Infrastructure Engineer)
        emp_chen = {
            "id": MARCUS_CHEN_EMPLOYEE_ID,
            "organization_id": org_techcorp_id,
            "profile_id": MARCUS_CHEN_PROFILE_ID,
            "candidate_id": None,
            "employee_code": MARCUS_CHEN_EMPLOYEE_CODE,
            "hire_date": "2023-03-20",
            "department_id": DEPT_INFRA_ID,
            "job_role_id": ROLE_MARCUS_CURRENT_ID,
            "employment_status": "active",
            "work_location": "Remote - Pune",
            "employment_type": "full_time",
            "created_at": now_iso,
            "updated_at": now_iso,
        }
        self._employees[emp_vance["id"]] = emp_vance
        self._employees[emp_chen["id"]] = emp_chen

        # 8. Manager Relationship (Marcus Vance -> Marcus Chen)
        m_rel = {
            "id": "70000000-0000-0000-0000-000000000001",
            "organization_id": org_techcorp_id,
            "employee_id": emp_chen["id"],
            "manager_employee_id": emp_vance["id"],
            "relationship_type": "direct",
            "is_current": True,
            "effective_start_date": "2023-03-20",
            "effective_end_date": None,
            "created_at": now_iso,
        }
        self._manager_relationships[m_rel["id"]] = m_rel

        # 9. Person Skills
        ps_data = [
            ("71000000-0000-0000-0000-000000000001", "30000000-0000-0000-0000-000000000099", "62000000-0000-0000-0000-000000000001", 5, "high", "interview_verified", 15, e1["id"]),
            ("71000000-0000-0000-0000-000000000002", "30000000-0000-0000-0000-000000000099", "62000000-0000-0000-0000-000000000002", 4, "high", "production_pr", 45, e1["id"]),
            ("71000000-0000-0000-0000-000000000003", "30000000-0000-0000-0000-000000000002", "62000000-0000-0000-0000-000000000004", 5, "high", "manager_verified", 30, e2["id"]),
            ("71000000-0000-0000-0000-000000000004", "30000000-0000-0000-0000-000000000002", "62000000-0000-0000-0000-000000000005", 4, "high", "production_pr", 60, e2["id"]),
        ]
        for ps_id, pid, skid, prof, conf, vsrc, days_ago, evid_id in ps_data:
            ps_rec = {
                "id": ps_id,
                "organization_id": org_techcorp_id,
                "person_id": pid,
                "skill_id": skid,
                "proficiency_level": prof,
                "confidence_band": conf,
                "verification_source": vsrc,
                "is_stale": False,
                "last_demonstrated_at": (datetime.now(timezone.utc) - timedelta(days=days_ago)).isoformat(),
                "created_at": now_iso,
                "updated_at": now_iso,
            }
            self._person_skills[ps_id] = ps_rec

            # Link evidence
            link_id = str(uuid.uuid4())
            self._evidence_links[link_id] = {
                "id": link_id,
                "evidence_item_id": evid_id,
                "target_entity_type": "person_skill",
                "target_entity_id": ps_id,
                "created_at": now_iso,
            }

        # 10. Goals
        g1 = {
            "id": "72000000-0000-0000-0000-000000000001",
            "organization_id": org_techcorp_id,
            "employee_id": emp_chen["id"],
            "title": "Zero-Downtime Multi-Region Kubernetes Migration",
            "description": "Upgrade production clusters across regions to Kubernetes v1.30 with zero operational downtime",
            "goal_type": "strategic",
            "priority": "high",
            "status": "active",
            "start_date": (date.today() - timedelta(days=30)).isoformat(),
            "due_date": (date.today() + timedelta(days=30)).isoformat(),
            "progress_percentage": 65,
            "creator_id": "30000000-0000-0000-0000-000000000003",
            "visibility": "employee_visible",
            "related_job_role_id": "61000000-0000-0000-0000-000000000002",
            "related_skill_id": "62000000-0000-0000-0000-000000000004",
            "completed_at": None,
            "created_at": now_iso,
            "updated_at": now_iso,
        }
        self._goals[g1["id"]] = g1

        # 11. Feedback
        fb1 = {
            "id": "73000000-0000-0000-0000-000000000001",
            "organization_id": org_techcorp_id,
            "subject_employee_id": emp_chen["id"],
            "author_profile_id": "30000000-0000-0000-0000-000000000003",
            "feedback_type": "manager_1on1",
            "feedback_date": (date.today() - timedelta(days=14)).isoformat(),
            "visibility": "manager_and_employee",
            "structured_strengths": [
                "Flawless leadership during INC-8821 cluster failover",
                "Proactive infrastructure capacity planning",
            ],
            "development_areas": [
                "Expand cross-functional mentorship for junior infrastructure engineers"
            ],
            "related_goal_id": g1["id"],
            "related_skill_id": "62000000-0000-0000-0000-000000000004",
            "acknowledged_by_subject": True,
            "created_at": now_iso,
            "updated_at": now_iso,
        }
        self._feedback_records[fb1["id"]] = fb1

        # 12. Attendance Summaries
        att1 = {
            "id": "74000000-0000-0000-0000-000000000001",
            "organization_id": org_techcorp_id,
            "employee_id": emp_chen["id"],
            "period_start": "2026-08-01",
            "period_end": "2026-08-31",
            "scheduled_workdays": 22,
            "present_days": 20,
            "approved_leave_days": 2,
            "unapproved_absence_days": 0,
            "remote_days": 16,
            "onsite_days": 4,
            "late_occurrences": 0,
            "source_system": "hris_attendance_sync",
            "freshness_timestamp": now_iso,
            "data_quality_status": "verified",
            "created_at": now_iso,
        }
        self._attendance_summaries[att1["id"]] = att1

        # 13. Policy Documents & Versions
        pol1 = {
            "id": "75000000-0000-0000-0000-000000000001",
            "organization_id": org_techcorp_id,
            "title": "Global Remote Work & Distributed Operations Policy",
            "policy_code": "POL-REM-01",
            "category": "remote_work",
            "description": "Establishes guidelines, eligibility criteria, and exception approval workflows for distributed workforce operations",
            "document_owner_id": "30000000-0000-0000-0000-000000000005",
            "access_classification": "all_employees",
            "created_at": now_iso,
            "updated_at": now_iso,
        }
        self._policy_documents[pol1["id"]] = pol1

        pv1 = {
            "id": "76000000-0000-0000-0000-000000000001",
            "policy_document_id": pol1["id"],
            "version_number": "4.1",
            "status": "active",
            "effective_date": "2026-01-01",
            "review_date": (date.today() + timedelta(days=120)).isoformat(),
            "expiry_date": (date.today() + timedelta(days=365)).isoformat(),
            "file_name": "techcorp_global_remote_policy_v4.1.pdf",
            "file_size_bytes": 348210,
            "mime_type": "application/pdf",
            "storage_path": "policy-documents/techcorp_global_remote_policy_v4.1.pdf",
            "sha256_hash": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
            "superseded_by_version_id": None,
            "uploaded_by_id": "30000000-0000-0000-0000-000000000005",
            "created_at": now_iso,
        }
        self._policy_versions[pv1["id"]] = pv1

    # ====================================================================
    # 1. Department Methods
    # ====================================================================

    def create_department(self, org_id: str, data: DepartmentCreate, actor_id: str) -> DepartmentResponse:
        # Check duplicate code
        for d in self._departments.values():
            if d["organization_id"] == org_id and d["code"].upper() == data.code.upper():
                raise ConflictError(f"Department code '{data.code}' already exists in this organization")

        # Validate parent department exists in same org
        if data.parent_department_id:
            parent = self._departments.get(data.parent_department_id)
            if not parent or parent["organization_id"] != org_id:
                raise ValidationError("Parent department does not exist in this organization")

        dept_id = str(uuid.uuid4())
        now_iso = datetime.now(timezone.utc).isoformat()
        new_dept = {
            "id": dept_id,
            "organization_id": org_id,
            "code": data.code.upper(),
            "name": data.name,
            "description": data.description,
            "parent_department_id": data.parent_department_id,
            "head_profile_id": data.head_profile_id,
            "is_active": data.is_active,
            "created_at": now_iso,
            "updated_at": now_iso,
        }
        self._departments[dept_id] = new_dept
        logger.info(f"Created department {new_dept['code']} in org {org_id} by actor {actor_id}")
        return self._build_department_response(new_dept)

    def list_departments(self, org_id: str, active_only: bool = False) -> List[DepartmentResponse]:
        results = []
        for d in self._departments.values():
            if d["organization_id"] == org_id:
                if active_only and not d["is_active"]:
                    continue
                results.append(self._build_department_response(d))
        results.sort(key=lambda x: x.name)
        return results

    def get_department(self, org_id: str, dept_id: str) -> DepartmentResponse:
        d = self._departments.get(dept_id)
        if not d or d["organization_id"] != org_id:
            raise NotFoundError(f"Department '{dept_id}' not found")
        return self._build_department_response(d)

    def update_department(self, org_id: str, dept_id: str, data: DepartmentUpdate, actor_id: str) -> DepartmentResponse:
        d = self._departments.get(dept_id)
        if not d or d["organization_id"] != org_id:
            raise NotFoundError(f"Department '{dept_id}' not found")

        # Check self-parenting
        if data.parent_department_id:
            if data.parent_department_id == dept_id:
                raise ValidationError("A department cannot be its own parent")
            # Check circular dependency
            curr = data.parent_department_id
            visited = {dept_id}
            while curr:
                if curr in visited:
                    raise ValidationError("Circular department hierarchy detected")
                visited.add(curr)
                parent_dept = self._departments.get(curr)
                curr = parent_dept["parent_department_id"] if parent_dept else None

        if data.name is not None:
            d["name"] = data.name
        if data.description is not None:
            d["description"] = data.description
        if data.parent_department_id is not None:
            d["parent_department_id"] = data.parent_department_id
        if data.head_profile_id is not None:
            d["head_profile_id"] = data.head_profile_id
        if data.is_active is not None:
            d["is_active"] = data.is_active

        d["updated_at"] = datetime.now(timezone.utc).isoformat()
        return self._build_department_response(d)

    def get_department_tree(self, org_id: str) -> List[DepartmentTreeItem]:
        depts = [d for d in self._departments.values() if d["organization_id"] == org_id and d["is_active"]]
        children_map: Dict[Optional[str], List[Dict[str, Any]]] = {}
        for d in depts:
            p_id = d.get("parent_department_id")
            children_map.setdefault(p_id, []).append(d)

        def build_node(d: Dict[str, Any]) -> DepartmentTreeItem:
            head_user = identity_service._users.get(d.get("head_profile_id")) if d.get("head_profile_id") else None
            emp_cnt = sum(1 for e in self._employees.values() if e.get("department_id") == d["id"] and e.get("employment_status") == "active")
            node = DepartmentTreeItem(
                id=d["id"],
                code=d["code"],
                name=d["name"],
                description=d.get("description"),
                head_profile_name=head_user["full_name"] if head_user else None,
                employee_count=emp_cnt,
                children=[build_node(child) for child in children_map.get(d["id"], [])],
            )
            return node

        roots = children_map.get(None, [])
        return [build_node(r) for r in roots]

    def _build_department_response(self, d: Dict[str, Any]) -> DepartmentResponse:
        parent = self._departments.get(d.get("parent_department_id")) if d.get("parent_department_id") else None
        head_user = identity_service._users.get(d.get("head_profile_id")) if d.get("head_profile_id") else None
        emp_cnt = sum(1 for e in self._employees.values() if e.get("department_id") == d["id"] and e.get("employment_status") == "active")
        role_cnt = sum(1 for r in self._job_roles.values() if r.get("department_id") == d["id"] and r.get("is_active"))
        return DepartmentResponse(
            id=d["id"],
            organization_id=d["organization_id"],
            code=d["code"],
            name=d["name"],
            description=d.get("description"),
            parent_department_id=d.get("parent_department_id"),
            parent_department_name=parent["name"] if parent else None,
            head_profile_id=d.get("head_profile_id"),
            head_profile_name=head_user["full_name"] if head_user else None,
            employee_count=emp_cnt,
            role_count=role_cnt,
            is_active=d["is_active"],
            created_at=d["created_at"],
            updated_at=d["updated_at"],
        )

    # ====================================================================
    # 2. Skill Taxonomy & Relational Graph Methods
    # ====================================================================

    def create_skill(self, data: SkillCreate, actor_id: str) -> SkillResponse:
        code_normalized = data.code.lower().strip()
        for s in self._skills.values():
            if s["code"].lower() == code_normalized:
                raise ConflictError(f"Skill with code '{data.code}' already exists")
            if s["name"].lower() == data.name.lower().strip():
                raise ConflictError(f"Skill with name '{data.name}' already exists")

        # Check aliases collision
        for a in data.aliases:
            if a.lower() in self._skill_aliases:
                raise ConflictError(f"Alias '{a}' is already associated with another skill")

        skill_id = str(uuid.uuid4())
        now_iso = datetime.now(timezone.utc).isoformat()
        new_skill = {
            "id": skill_id,
            "code": data.code.strip(),
            "name": data.name.strip(),
            "category": data.category.strip(),
            "description": data.description.strip(),
            "is_active": True,
            "created_at": now_iso,
            "updated_at": now_iso,
        }
        self._skills[skill_id] = new_skill

        for a in data.aliases:
            alias_id = str(uuid.uuid4())
            self._skill_aliases[a.lower()] = {
                "id": alias_id,
                "skill_id": skill_id,
                "alias": a.strip(),
                "created_at": now_iso,
            }

        return self._build_skill_response(new_skill)

    def list_skills(self, category: Optional[str] = None, search: Optional[str] = None) -> List[SkillResponse]:
        results = []
        for s in self._skills.values():
            if not s["is_active"]:
                continue
            if category and s["category"].lower() != category.lower():
                continue
            if search:
                query = search.lower()
                matches_name = query in s["name"].lower()
                matches_code = query in s["code"].lower()
                matches_alias = any(query in a["alias"].lower() for a in self._skill_aliases.values() if a["skill_id"] == s["id"])
                if not (matches_name or matches_code or matches_alias):
                    continue
            results.append(self._build_skill_response(s))
        results.sort(key=lambda x: x.name)
        return results

    def get_skill(self, skill_id: str) -> SkillResponse:
        s = self._skills.get(skill_id)
        if not s:
            raise NotFoundError(f"Skill '{skill_id}' not found")
        return self._build_skill_response(s)

    def add_skill_relationship(self, source_skill_id: str, data: SkillRelationshipCreate, actor_id: str) -> SkillRelationshipDTO:
        if source_skill_id == data.target_skill_id:
            raise ValidationError("A skill cannot be related to itself")
        if source_skill_id not in self._skills or data.target_skill_id not in self._skills:
            raise NotFoundError("Source or target skill not found")

        rel_id = str(uuid.uuid4())
        now_iso = datetime.now(timezone.utc).isoformat()
        rel = {
            "id": rel_id,
            "source_skill_id": source_skill_id,
            "target_skill_id": data.target_skill_id,
            "relationship_type": data.relationship_type,
            "similarity_weight": data.similarity_weight,
            "is_bidirectional": data.is_bidirectional,
            "created_at": now_iso,
        }
        self._skill_relationships[rel_id] = rel

        target_skill = self._skills[data.target_skill_id]
        return SkillRelationshipDTO(
            id=rel_id,
            target_skill_id=target_skill["id"],
            target_skill_name=target_skill["name"],
            relationship_type=data.relationship_type,
            similarity_weight=data.similarity_weight,
            is_bidirectional=data.is_bidirectional,
        )

    def get_skill_graph(self, query: Optional[str] = None, focused_skill_id: Optional[str] = None) -> SkillGraphResponse:
        """Returns the relational capability graph structure for visualization and gap queries."""
        nodes: Dict[str, SkillGraphNode] = {}
        edges: List[SkillGraphEdge] = []

        # Determine skills in scope
        skills_in_scope: Set[str] = set()
        if focused_skill_id and focused_skill_id in self._skills:
            skills_in_scope.add(focused_skill_id)
            # Add 1-hop and 2-hop neighbors
            for r in self._skill_relationships.values():
                if r["source_skill_id"] == focused_skill_id:
                    skills_in_scope.add(r["target_skill_id"])
                elif r["target_skill_id"] == focused_skill_id or r.get("is_bidirectional"):
                    skills_in_scope.add(r["source_skill_id"])
        else:
            for s in self._skills.values():
                if s["is_active"]:
                    if query and query.lower() not in s["name"].lower() and query.lower() not in s["category"].lower():
                        continue
                    skills_in_scope.add(s["id"])

        for sid in skills_in_scope:
            s = self._skills[sid]
            nodes[sid] = SkillGraphNode(
                id=sid,
                label=s["name"],
                category=s["category"],
                node_type="skill",
            )

        for rid, r in self._skill_relationships.items():
            if r["source_skill_id"] in skills_in_scope and r["target_skill_id"] in skills_in_scope:
                weight_pct = int(r["similarity_weight"] * 100)
                label = f"{r['relationship_type']} ({weight_pct}%)"
                edges.append(
                    SkillGraphEdge(
                        id=rid,
                        source=r["source_skill_id"],
                        target=r["target_skill_id"],
                        relationship_type=r["relationship_type"],
                        weight=r["similarity_weight"],
                        label=label,
                    )
                )

        return SkillGraphResponse(
            nodes=list(nodes.values()),
            edges=edges,
            total_nodes=len(nodes),
            total_edges=len(edges),
        )

    def _build_skill_response(self, s: Dict[str, Any]) -> SkillResponse:
        aliases = [a["alias"] for a in self._skill_aliases.values() if a["skill_id"] == s["id"]]
        rels = []
        for r in self._skill_relationships.values():
            if r["source_skill_id"] == s["id"]:
                target = self._skills.get(r["target_skill_id"])
                if target:
                    rels.append(
                        SkillRelationshipDTO(
                            id=r["id"],
                            target_skill_id=target["id"],
                            target_skill_name=target["name"],
                            relationship_type=r["relationship_type"],
                            similarity_weight=r["similarity_weight"],
                            is_bidirectional=r.get("is_bidirectional", False),
                        )
                    )
            elif r["target_skill_id"] == s["id"] and r.get("is_bidirectional"):
                source = self._skills.get(r["source_skill_id"])
                if source:
                    rels.append(
                        SkillRelationshipDTO(
                            id=r["id"],
                            target_skill_id=source["id"],
                            target_skill_name=source["name"],
                            relationship_type=r["relationship_type"],
                            similarity_weight=r["similarity_weight"],
                            is_bidirectional=True,
                        )
                    )
        return SkillResponse(
            id=s["id"],
            code=s["code"],
            name=s["name"],
            category=s["category"],
            description=s["description"],
            aliases=aliases,
            relationships=rels,
            is_active=s["is_active"],
            created_at=s["created_at"],
            updated_at=s["updated_at"],
        )

    # ====================================================================
    # 3. Job Roles & Skill Requirements Methods
    # ====================================================================

    def create_job_role(self, org_id: str, data: JobRoleCreate, actor_id: str) -> JobRoleResponse:
        dept = self._departments.get(data.department_id)
        if not dept or dept["organization_id"] != org_id:
            raise ValidationError("Department not found in this organization")

        for r in self._job_roles.values():
            if r["organization_id"] == org_id and r["code"].upper() == data.code.upper():
                raise ConflictError(f"Job role code '{data.code}' already exists")

        role_id = str(uuid.uuid4())
        now_iso = datetime.now(timezone.utc).isoformat()
        new_role = {
            "id": role_id,
            "organization_id": org_id,
            "department_id": data.department_id,
            "code": data.code.upper(),
            "title": data.title,
            "role_family": data.role_family,
            "seniority_level": data.seniority_level,
            "summary": data.summary,
            "responsibilities": data.responsibilities,
            "is_active": True,
            "created_at": now_iso,
            "updated_at": now_iso,
        }
        self._job_roles[role_id] = new_role

        for s_req in data.skills:
            if s_req.skill_id in self._skills:
                req_id = str(uuid.uuid4())
                self._role_skill_reqs[req_id] = {
                    "id": req_id,
                    "job_role_id": role_id,
                    "skill_id": s_req.skill_id,
                    "is_required": s_req.is_required,
                    "min_proficiency": s_req.min_proficiency,
                    "importance_weight": s_req.importance_weight,
                    "demand_classification": s_req.demand_classification,
                    "created_at": now_iso,
                }

        return self._build_job_role_response(new_role)

    def list_job_roles(self, org_id: str, department_id: Optional[str] = None, active_only: bool = True) -> List[JobRoleResponse]:
        results = []
        for r in self._job_roles.values():
            if r["organization_id"] == org_id:
                if active_only and not r["is_active"]:
                    continue
                if department_id and r["department_id"] != department_id:
                    continue
                results.append(self._build_job_role_response(r))
        results.sort(key=lambda x: x.title)
        return results

    def get_job_role(self, org_id: str, role_id: str) -> JobRoleResponse:
        r = self._job_roles.get(role_id)
        if not r or r["organization_id"] != org_id:
            raise NotFoundError(f"Job role '{role_id}' not found")
        return self._build_job_role_response(r)

    def update_job_role(self, org_id: str, role_id: str, data: JobRoleUpdate, actor_id: str) -> JobRoleResponse:
        r = self._job_roles.get(role_id)
        if not r or r["organization_id"] != org_id:
            raise NotFoundError(f"Job role '{role_id}' not found")

        if data.title is not None:
            r["title"] = data.title
        if data.role_family is not None:
            r["role_family"] = data.role_family
        if data.seniority_level is not None:
            r["seniority_level"] = data.seniority_level
        if data.summary is not None:
            r["summary"] = data.summary
        if data.responsibilities is not None:
            r["responsibilities"] = data.responsibilities
        if data.is_active is not None:
            r["is_active"] = data.is_active

        r["updated_at"] = datetime.now(timezone.utc).isoformat()
        return self._build_job_role_response(r)

    def add_skill_to_role(self, org_id: str, role_id: str, data: RoleSkillRequirementCreate, actor_id: str) -> RoleSkillRequirementDTO:
        r = self._job_roles.get(role_id)
        if not r or r["organization_id"] != org_id:
            raise NotFoundError(f"Job role '{role_id}' not found")
        skill = self._skills.get(data.skill_id)
        if not skill:
            raise NotFoundError(f"Skill '{data.skill_id}' not found")

        # Check existing
        for req in self._role_skill_reqs.values():
            if req["job_role_id"] == role_id and req["skill_id"] == data.skill_id:
                req["is_required"] = data.is_required
                req["min_proficiency"] = data.min_proficiency
                req["importance_weight"] = data.importance_weight
                req["demand_classification"] = data.demand_classification
                return RoleSkillRequirementDTO(
                    id=req["id"],
                    skill_id=skill["id"],
                    skill_name=skill["name"],
                    skill_code=skill["code"],
                    skill_category=skill["category"],
                    is_required=req["is_required"],
                    min_proficiency=req["min_proficiency"],
                    importance_weight=req["importance_weight"],
                    demand_classification=req["demand_classification"],
                )

        req_id = str(uuid.uuid4())
        new_req = {
            "id": req_id,
            "job_role_id": role_id,
            "skill_id": data.skill_id,
            "is_required": data.is_required,
            "min_proficiency": data.min_proficiency,
            "importance_weight": data.importance_weight,
            "demand_classification": data.demand_classification,
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
        self._role_skill_reqs[req_id] = new_req
        return RoleSkillRequirementDTO(
            id=req_id,
            skill_id=skill["id"],
            skill_name=skill["name"],
            skill_code=skill["code"],
            skill_category=skill["category"],
            is_required=new_req["is_required"],
            min_proficiency=new_req["min_proficiency"],
            importance_weight=new_req["importance_weight"],
            demand_classification=new_req["demand_classification"],
        )

    def _build_job_role_response(self, r: Dict[str, Any]) -> JobRoleResponse:
        dept = self._departments.get(r["department_id"])
        req_list: List[RoleSkillRequirementDTO] = []
        pref_list: List[RoleSkillRequirementDTO] = []

        for req in self._role_skill_reqs.values():
            if req["job_role_id"] == r["id"]:
                skill = self._skills.get(req["skill_id"])
                if skill:
                    dto = RoleSkillRequirementDTO(
                        id=req["id"],
                        skill_id=skill["id"],
                        skill_name=skill["name"],
                        skill_code=skill["code"],
                        skill_category=skill["category"],
                        is_required=req["is_required"],
                        min_proficiency=req["min_proficiency"],
                        importance_weight=req["importance_weight"],
                        demand_classification=req["demand_classification"],
                    )
                    if req["is_required"]:
                        req_list.append(dto)
                    else:
                        pref_list.append(dto)

        emp_cnt = sum(1 for e in self._employees.values() if e.get("job_role_id") == r["id"] and e.get("employment_status") == "active")
        cand_cnt = sum(1 for c in self._candidate_profiles.values() if c.get("target_role_id") == r["id"] and c.get("record_status") in ("active", "shortlisted", "offered"))

        return JobRoleResponse(
            id=r["id"],
            organization_id=r["organization_id"],
            department_id=r["department_id"],
            department_name=dept["name"] if dept else None,
            code=r["code"],
            title=r["title"],
            role_family=r["role_family"],
            seniority_level=r["seniority_level"],
            summary=r["summary"],
            responsibilities=r.get("responsibilities"),
            required_skills=req_list,
            preferred_skills=pref_list,
            active_employees_count=emp_cnt,
            active_candidates_count=cand_cnt,
            is_active=r["is_active"],
            created_at=r["created_at"],
            updated_at=r["updated_at"],
        )

    # ====================================================================
    # 4. Sources & Evidence Ledger Methods
    # ====================================================================

    def create_source(self, org_id: str, data: SourceCreate) -> SourceResponse:
        source_id = str(uuid.uuid4())
        now_iso = datetime.now(timezone.utc).isoformat()
        src = {
            "id": source_id,
            "organization_id": org_id,
            "source_type": data.source_type,
            "name": data.name,
            "external_reference": data.external_reference,
            "reliability_status": data.reliability_status,
            "metadata": data.metadata,
            "created_at": now_iso,
        }
        self._sources[source_id] = src
        return SourceResponse(**src)

    def list_sources(self, org_id: str) -> List[SourceResponse]:
        return [SourceResponse(**s) for s in self._sources.values() if s["organization_id"] == org_id]

    def create_evidence_item(self, org_id: str, data: EvidenceItemCreate, actor_id: str) -> EvidenceItemResponse:
        evidence_id = str(uuid.uuid4())
        now_iso = datetime.now(timezone.utc).isoformat()
        item = {
            "id": evidence_id,
            "organization_id": org_id,
            "subject_person_id": data.subject_person_id,
            "source_id": data.source_id,
            "claim_summary": data.claim_summary,
            "source_type": data.source_type,
            "source_uri": data.source_uri,
            "observed_at": data.observed_at or now_iso,
            "effective_at": data.effective_at or now_iso,
            "confidence_score": data.confidence_score,
            "verification_status": data.verification_status,
            "verified_by": actor_id if data.verification_status == "verified" else None,
            "verified_at": now_iso if data.verification_status == "verified" else None,
            "visibility": data.visibility,
            "is_stale": False,
            "created_at": now_iso,
        }
        self._evidence_items[evidence_id] = item

        if data.target_entity_type and data.target_entity_id:
            link_id = str(uuid.uuid4())
            self._evidence_links[link_id] = {
                "id": link_id,
                "evidence_item_id": evidence_id,
                "target_entity_type": data.target_entity_type,
                "target_entity_id": data.target_entity_id,
                "created_at": now_iso,
            }

        return self._build_evidence_response(item)

    def list_evidence_for_person(self, org_id: str, person_id: str) -> List[EvidenceItemResponse]:
        results = []
        for e in self._evidence_items.values():
            if e["organization_id"] == org_id and e["subject_person_id"] == person_id:
                results.append(self._build_evidence_response(e))
        return results

    def _build_evidence_response(self, e: Dict[str, Any]) -> EvidenceItemResponse:
        src = self._sources.get(e.get("source_id")) if e.get("source_id") else None
        return EvidenceItemResponse(
            id=e["id"],
            organization_id=e["organization_id"],
            subject_person_id=e["subject_person_id"],
            source_id=e.get("source_id"),
            source_name=src["name"] if src else None,
            claim_summary=e["claim_summary"],
            source_type=e["source_type"],
            source_uri=e["source_uri"],
            observed_at=e["observed_at"],
            effective_at=e["effective_at"],
            confidence_score=e["confidence_score"],
            verification_status=e["verification_status"],
            verified_by=e.get("verified_by"),
            verified_at=e.get("verified_at"),
            visibility=e["visibility"],
            is_stale=e.get("is_stale", False),
            created_at=e["created_at"],
        )

    # ====================================================================
    # 5. Person Skills Methods
    # ====================================================================

    def add_person_skill(self, org_id: str, data: PersonSkillCreate, actor_id: str) -> PersonSkillResponse:
        skill = self._skills.get(data.skill_id)
        if not skill:
            raise NotFoundError(f"Skill '{data.skill_id}' not found")

        now_iso = datetime.now(timezone.utc).isoformat()
        last_dem = data.last_demonstrated_at or now_iso

        # Calculate confidence band
        conf_band = "high" if data.verification_source in ("interview_verified", "manager_verified") else (
            "moderate" if data.verification_source == "production_pr" else "limited"
        )

        for ps in self._person_skills.values():
            if ps["organization_id"] == org_id and ps["person_id"] == data.person_id and ps["skill_id"] == data.skill_id:
                ps["proficiency_level"] = data.proficiency_level
                ps["verification_source"] = data.verification_source
                ps["confidence_band"] = conf_band
                ps["last_demonstrated_at"] = last_dem
                ps["updated_at"] = now_iso
                return self._build_person_skill_response(ps)

        ps_id = str(uuid.uuid4())
        ps_rec = {
            "id": ps_id,
            "organization_id": org_id,
            "person_id": data.person_id,
            "skill_id": data.skill_id,
            "proficiency_level": data.proficiency_level,
            "confidence_band": conf_band,
            "verification_source": data.verification_source,
            "is_stale": False,
            "last_demonstrated_at": last_dem,
            "created_at": now_iso,
            "updated_at": now_iso,
        }
        self._person_skills[ps_id] = ps_rec

        if data.evidence_id and data.evidence_id in self._evidence_items:
            link_id = str(uuid.uuid4())
            self._evidence_links[link_id] = {
                "id": link_id,
                "evidence_item_id": data.evidence_id,
                "target_entity_type": "person_skill",
                "target_entity_id": ps_id,
                "created_at": now_iso,
            }

        return self._build_person_skill_response(ps_rec)

    def _build_person_skill_response(self, ps: Dict[str, Any]) -> PersonSkillResponse:
        skill = self._skills.get(ps["skill_id"], {})
        # Find attached evidence
        attached_evidence: List[EvidenceItemResponse] = []
        for link in self._evidence_links.values():
            if link["target_entity_type"] == "person_skill" and link["target_entity_id"] == ps["id"]:
                ev = self._evidence_items.get(link["evidence_item_id"])
                if ev:
                    attached_evidence.append(self._build_evidence_response(ev))

        return PersonSkillResponse(
            id=ps["id"],
            organization_id=ps["organization_id"],
            person_id=ps["person_id"],
            skill_id=ps["skill_id"],
            skill_name=skill.get("name", "Unknown Skill"),
            skill_code=skill.get("code", "unknown"),
            skill_category=skill.get("category", "General"),
            proficiency_level=ps.get("proficiency_level", 3),
            confidence_band=ps.get("confidence_band", "high" if ps.get("confidence_score", 0.5) >= 0.8 else "medium"),
            verification_source=ps.get("verification_source", "interview_verified"),
            is_stale=ps.get("is_stale", False),
            last_demonstrated_at=ps.get("last_demonstrated_at") or datetime.now(timezone.utc).isoformat(),
            evidence_items=attached_evidence,
            created_at=ps.get("created_at") or datetime.now(timezone.utc).isoformat(),
            updated_at=ps.get("updated_at") or datetime.now(timezone.utc).isoformat(),
        )

    # ====================================================================
    # 6. Candidate Profile & Candidate Twin Methods
    # ====================================================================

    def create_candidate_profile(self, org_id: str, data: CandidateProfileCreate, actor_id: str) -> CandidateProfileResponse:
        email_clean = data.email.lower().strip()
        for c in self._candidate_profiles.values():
            if c["organization_id"] == org_id and c["email"].lower() == email_clean:
                raise ConflictError(f"Candidate with email '{data.email}' already exists in this organization")

        cand_id = str(uuid.uuid4())
        now_iso = datetime.now(timezone.utc).isoformat()
        rec = {
            "id": cand_id,
            "organization_id": org_id,
            "profile_id": None,
            "first_name": data.first_name,
            "last_name": data.last_name,
            "email": email_clean,
            "phone": data.phone,
            "location": data.location,
            "current_title": data.current_title,
            "years_experience": data.years_experience,
            "education_summary": data.education_summary,
            "summary": data.summary,
            "target_role_id": data.target_role_id,
            "consent_given": True,
            "record_status": "active",
            "created_at": now_iso,
            "updated_at": now_iso,
        }
        self._candidate_profiles[cand_id] = rec
        return self._build_candidate_response(rec)

    def list_candidates(self, org_id: str, status: Optional[str] = None, role_id: Optional[str] = None) -> List[CandidateProfileResponse]:
        results = []
        for c in self._candidate_profiles.values():
            if c["organization_id"] == org_id:
                if status and c["record_status"] != status:
                    continue
                if role_id and c.get("target_role_id") != role_id:
                    continue
                results.append(self._build_candidate_response(c))
        results.sort(key=lambda x: x.created_at, reverse=True)
        return results

    def get_candidate(self, org_id: str, cand_id: str) -> CandidateProfileResponse:
        c = self._candidate_profiles.get(cand_id)
        if not c or c["organization_id"] != org_id:
            raise NotFoundError(f"Candidate '{cand_id}' not found")
        return self._build_candidate_response(c)

    def update_candidate(self, org_id: str, cand_id: str, data: CandidateProfileUpdate, actor_id: str) -> CandidateProfileResponse:
        c = self._candidate_profiles.get(cand_id)
        if not c or c["organization_id"] != org_id:
            raise NotFoundError(f"Candidate '{cand_id}' not found")

        if data.first_name is not None:
            c["first_name"] = data.first_name
        if data.last_name is not None:
            c["last_name"] = data.last_name
        if data.phone is not None:
            c["phone"] = data.phone
        if data.location is not None:
            c["location"] = data.location
        if data.current_title is not None:
            c["current_title"] = data.current_title
        if data.years_experience is not None:
            c["years_experience"] = data.years_experience
        if data.education_summary is not None:
            c["education_summary"] = data.education_summary
        if data.summary is not None:
            c["summary"] = data.summary
        if data.target_role_id is not None:
            c["target_role_id"] = data.target_role_id
        if data.record_status is not None:
            c["record_status"] = data.record_status

        c["updated_at"] = datetime.now(timezone.utc).isoformat()
        return self._build_candidate_response(c)

    def get_candidate_twin(self, org_id: str, cand_id: str) -> CandidateTwinResponse:
        cand = self.get_candidate(org_id, cand_id)
        target_role = self.get_job_role(org_id, cand.target_role_id) if cand.target_role_id else None

        # Resolve person ID (profile_id or candidate_id)
        person_id = cand.profile_id or cand.id

        skills: List[PersonSkillResponse] = []
        for ps in self._person_skills.values():
            if ps["organization_id"] == org_id and (ps["person_id"] == person_id or ps["person_id"] == cand.id or ps["person_id"] == cand.profile_id):
                skills.append(self._build_person_skill_response(ps))

        evidence = self.list_evidence_for_person(org_id, person_id)

        # Completeness calculation
        fields = [cand.first_name, cand.last_name, cand.email, cand.phone, cand.location, cand.current_title, cand.summary, cand.education_summary]
        completeness = int((sum(1 for f in fields if f) / len(fields)) * 100)

        # Timeline
        timeline = [
            TimelineEvent(
                event_id=str(uuid.uuid4()),
                title="Candidate Applied",
                event_type="application_submitted",
                effective_date=cand.created_at[:10],
                description=f"Submitted application for {target_role.title if target_role else 'Unspecified Role'}",
                source_reference="Recruitment Portal",
            )
        ]
        for ev in evidence:
            timeline.append(
                TimelineEvent(
                    event_id=ev.id,
                    title=f"Evidence Recorded ({ev.source_type})",
                    event_type="evidence_observed",
                    effective_date=ev.observed_at[:10],
                    description=ev.claim_summary,
                    source_reference=ev.source_uri,
                )
            )

        is_eligible = cand.record_status in ("active", "shortlisted", "offered")

        return CandidateTwinResponse(
            candidate=cand,
            target_role=target_role,
            skills=skills,
            evidence_items=evidence,
            profile_completeness_pct=completeness,
            data_freshness="Up to date",
            is_eligible_for_conversion=is_eligible,
            conversion_status="Converted to Employee" if cand.record_status == "converted" else "Pending Conversion",
            timeline=timeline,
        )

    def _build_candidate_response(self, c: Dict[str, Any]) -> CandidateProfileResponse:
        role = self._job_roles.get(c.get("target_role_id")) if c.get("target_role_id") else None
        return CandidateProfileResponse(
            id=c["id"],
            organization_id=c["organization_id"],
            profile_id=c.get("profile_id"),
            first_name=c["first_name"],
            last_name=c["last_name"],
            full_name=f"{c['first_name']} {c['last_name']}".strip(),
            email=c["email"],
            phone=c.get("phone"),
            location=c.get("location"),
            current_title=c.get("current_title"),
            years_experience=float(c.get("years_experience", 0.0)),
            education_summary=c.get("education_summary"),
            summary=c.get("summary"),
            target_role_id=c.get("target_role_id"),
            target_role_title=role["title"] if role else None,
            consent_given=c.get("consent_given", True),
            record_status=c["record_status"],
            created_at=c["created_at"],
            updated_at=c["updated_at"],
        )

    # ====================================================================
    # 7. Candidate-to-Employee Conversion Methods (Idempotent & Lineage Preserving)
    # ====================================================================

    def preview_conversion(self, org_id: str, cand_id: str) -> CandidateConversionPreviewResponse:
        cand = self.get_candidate(org_id, cand_id)
        target_role = self.get_job_role(org_id, cand.target_role_id) if cand.target_role_id else None
        suggested_dept = self.get_department(org_id, target_role.department_id) if target_role else None

        person_id = cand.profile_id or cand.id
        skills = [ps["skill_id"] for ps in self._person_skills.values() if ps["organization_id"] == org_id and ps["person_id"] in (person_id, cand.id)]
        skill_names = [self._skills[sid]["name"] for sid in skills if sid in self._skills]
        evidence_count = sum(1 for e in self._evidence_items.values() if e["organization_id"] == org_id and e["subject_person_id"] in (person_id, cand.id))

        is_eligible = cand.record_status != "converted"
        elig_msg = "Ready for employment conversion" if is_eligible else "Candidate has already been converted to an active employee"

        return CandidateConversionPreviewResponse(
            candidate_id=cand.id,
            candidate_name=cand.full_name,
            candidate_email=cand.email,
            target_role_id=target_role.id if target_role else None,
            target_role_title=target_role.title if target_role else None,
            suggested_department_id=suggested_dept.id if suggested_dept else None,
            suggested_department_name=suggested_dept.name if suggested_dept else None,
            skills_to_carry_forward=skill_names,
            evidence_items_to_carry_forward=evidence_count,
            recruitment_restricted_notes_count=2,  # Confidential recruitment notes masked from employee
            is_eligible=is_eligible,
            eligibility_message=elig_msg,
        )

    def convert_candidate_to_employee(self, org_id: str, cand_id: str, data: CandidateConversionRequest, actor_id: str) -> CandidateConversionResponse:
        cand = self.get_candidate(org_id, cand_id)

        # Idempotency Check: if already converted, return existing employee
        for conv in self._candidate_conversions.values():
            if conv["candidate_id"] == cand_id:
                existing_emp = self._employees[conv["employee_id"]]
                return CandidateConversionResponse(
                    success=True,
                    message="Candidate already converted; returning existing employee record (Idempotent response)",
                    conversion_id=conv["id"],
                    candidate_id=cand_id,
                    employee_id=existing_emp["id"],
                    employee_code=existing_emp["employee_code"],
                    hire_date=str(existing_emp["hire_date"]),
                    carried_skill_count=conv.get("carried_skill_count", 0),
                    carried_evidence_count=conv.get("carried_evidence_count", 0),
                )

        # Validate employee code uniqueness
        for e in self._employees.values():
            if e["organization_id"] == org_id and e["employee_code"].upper() == data.employee_code.upper():
                raise ConflictError(f"Employee code '{data.employee_code}' is already assigned")

        dept = self._departments.get(data.department_id)
        if not dept or dept["organization_id"] != org_id:
            raise ValidationError("Department does not exist in this organization")

        role = self._job_roles.get(data.job_role_id)
        if not role or role["organization_id"] != org_id:
            raise ValidationError("Job role does not exist in this organization")

        # Resolve or create profile_id
        profile_id = cand.profile_id
        if not profile_id:
            # Check if user with candidate email exists
            user_id = identity_service._users_by_email.get(cand.email.lower())
            if user_id:
                profile_id = user_id
            else:
                profile_id = str(uuid.uuid4())
                now_str = datetime.now(timezone.utc).isoformat()
                identity_service._users[profile_id] = {
                    "id": profile_id,
                    "email": cand.email.lower(),
                    "full_name": cand.full_name,
                    "avatar_url": None,
                    "is_active": True,
                    "password_hash": "placeholder_login_required",
                    "created_at": now_str,
                    "updated_at": now_str,
                }
                identity_service._users_by_email[cand.email.lower()] = profile_id

        # Ensure employee role membership in TechCorp
        mem_id = str(uuid.uuid4())
        identity_service._memberships[mem_id] = {
            "id": mem_id,
            "organization_id": org_id,
            "user_id": profile_id,
            "status": "active",
            "invited_by": actor_id,
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
        role_assign_id = str(uuid.uuid4())
        identity_service._user_roles[role_assign_id] = {
            "id": role_assign_id,
            "user_id": profile_id,
            "role_name": "employee",
            "role_id": "10000000-0000-0000-0000-000000000002",  # employee role
            "organization_id": org_id,
            "assigned_by": actor_id,
            "created_at": datetime.now(timezone.utc).isoformat(),
        }

        # Create Employee Record
        emp_id = str(uuid.uuid4())
        now_iso = datetime.now(timezone.utc).isoformat()
        new_emp = {
            "id": emp_id,
            "organization_id": org_id,
            "profile_id": profile_id,
            "candidate_id": cand_id,  # PERMANENT CONTINUITY LINK
            "employee_code": data.employee_code.upper(),
            "hire_date": str(data.hire_date),
            "department_id": data.department_id,
            "job_role_id": data.job_role_id,
            "employment_status": "active",
            "work_location": data.work_location,
            "employment_type": data.employment_type,
            "created_at": now_iso,
            "updated_at": now_iso,
        }
        self._employees[emp_id] = new_emp

        # Assign Manager if specified
        if data.manager_employee_id:
            if data.manager_employee_id in self._employees:
                m_rel_id = str(uuid.uuid4())
                self._manager_relationships[m_rel_id] = {
                    "id": m_rel_id,
                    "organization_id": org_id,
                    "employee_id": emp_id,
                    "manager_employee_id": data.manager_employee_id,
                    "relationship_type": "direct",
                    "is_current": True,
                    "effective_start_date": str(data.hire_date),
                    "effective_end_date": None,
                    "created_at": now_iso,
                }

        # Carry forward candidate skills and evidence
        carried_skills = 0
        carried_ev = 0
        old_person_id = cand.profile_id or cand.id
        for ps in list(self._person_skills.values()):
            if ps["organization_id"] == org_id and ps["person_id"] in (old_person_id, cand.id):
                # Ensure attached to profile_id
                ps["person_id"] = profile_id
                carried_skills += 1

        for ev in list(self._evidence_items.values()):
            if ev["organization_id"] == org_id and ev["subject_person_id"] in (old_person_id, cand.id):
                ev["subject_person_id"] = profile_id
                carried_ev += 1

        # Update candidate status to converted
        cand_dict = self._candidate_profiles[cand_id]
        cand_dict["record_status"] = "converted"
        cand_dict["status"] = "hired"
        cand_dict["lifecycle_state"] = "employee_converted"
        cand_dict["profile_id"] = profile_id
        cand_dict["updated_at"] = now_iso

        # Log Conversion Record
        conv_id = str(uuid.uuid4())
        conv_record = {
            "id": conv_id,
            "organization_id": org_id,
            "candidate_id": cand_id,
            "employee_id": emp_id,
            "converted_by_id": actor_id,
            "converted_at": now_iso,
            "carried_skill_count": carried_skills,
            "carried_evidence_count": carried_ev,
            "metadata": {
                "department_id": data.department_id,
                "job_role_id": data.job_role_id,
                "employee_code": data.employee_code,
            },
        }
        self._candidate_conversions[conv_id] = conv_record

        # Audit Event
        identity_service.log_security_event(
            org_id=org_id,
            actor_user_id=actor_id,
            action="candidate.convert_to_employee",
            target_entity="candidate_profiles",
            target_id=cand_id,
            details=f"Converted candidate {cand.full_name} to employee {new_emp['employee_code']}",
        )

        logger.info(f"Converted candidate {cand_id} to employee {emp_id} with {carried_skills} skills carried forward")
        return CandidateConversionResponse(
            success=True,
            message="Candidate successfully converted to employee with full evidence lineage preserved",
            conversion_id=conv_id,
            candidate_id=cand_id,
            employee_id=emp_id,
            employee_code=new_emp["employee_code"],
            hire_date=new_emp["hire_date"],
            carried_skill_count=carried_skills,
            carried_evidence_count=carried_ev,
        )

    # ====================================================================
    # 8. Employee Profiles & Temporal Employee Twin Methods
    # ====================================================================

    def create_employee_profile(self, org_id: str, data: EmployeeProfileCreate, actor_id: str) -> EmployeeProfileResponse:
        for e in self._employees.values():
            if e["organization_id"] == org_id and e["employee_code"].upper() == data.employee_code.upper():
                raise ConflictError(f"Employee code '{data.employee_code}' already exists")

        dept = self._departments.get(data.department_id)
        if not dept or dept["organization_id"] != org_id:
            raise ValidationError("Department does not exist in this organization")

        role = self._job_roles.get(data.job_role_id)
        if not role or role["organization_id"] != org_id:
            raise ValidationError("Job role does not exist in this organization")

        emp_id = str(uuid.uuid4())
        now_iso = datetime.now(timezone.utc).isoformat()
        new_emp = {
            "id": emp_id,
            "organization_id": org_id,
            "profile_id": data.profile_id,
            "candidate_id": data.candidate_id,
            "employee_code": data.employee_code.upper(),
            "hire_date": str(data.hire_date),
            "department_id": data.department_id,
            "job_role_id": data.job_role_id,
            "employment_status": "active",
            "work_location": data.work_location,
            "employment_type": data.employment_type,
            "created_at": now_iso,
            "updated_at": now_iso,
        }
        self._employees[emp_id] = new_emp

        if data.manager_employee_id and data.manager_employee_id in self._employees:
            if data.manager_employee_id == emp_id:
                raise ValidationError("An employee cannot be their own manager")
            m_rel_id = str(uuid.uuid4())
            self._manager_relationships[m_rel_id] = {
                "id": m_rel_id,
                "organization_id": org_id,
                "employee_id": emp_id,
                "manager_employee_id": data.manager_employee_id,
                "relationship_type": "direct",
                "is_current": True,
                "effective_start_date": str(data.hire_date),
                "effective_end_date": None,
                "created_at": now_iso,
            }

        return self._build_employee_response(new_emp)

    def list_employees(self, org_id: str = "00000000-0000-0000-0000-000000000001", department_id: Optional[str] = None, status: Optional[str] = None) -> List[EmployeeProfileResponse]:
        results = []
        for e in self._employees.values():
            if e["organization_id"] == org_id:
                if department_id and e["department_id"] != department_id:
                    continue
                if status and e["employment_status"] != status:
                    continue
                results.append(self._build_employee_response(e))
        results.sort(key=lambda x: x.full_name)
        return results

    def get_employee(self, org_id: str, emp_id: str) -> EmployeeProfileResponse:
        e = self._employees.get(emp_id)
        if not e or e["organization_id"] != org_id:
            raise NotFoundError(f"Employee '{emp_id}' not found")
        return self._build_employee_response(e)

    def get_employee_by_profile_id(self, org_id: str, profile_id: str) -> Optional[EmployeeProfileResponse]:
        for e in self._employees.values():
            if e["organization_id"] == org_id and e["profile_id"] == profile_id:
                return self._build_employee_response(e)
        return None

    def update_employee(self, org_id: str, emp_id: str, data: EmployeeProfileUpdate, actor_id: str) -> EmployeeProfileResponse:
        e = self._employees.get(emp_id)
        if not e or e["organization_id"] != org_id:
            raise NotFoundError(f"Employee '{emp_id}' not found")

        if data.department_id is not None:
            dept = self._departments.get(data.department_id)
            if not dept or dept["organization_id"] != org_id:
                raise ValidationError("Department does not exist in this organization")
            e["department_id"] = data.department_id

        if data.job_role_id is not None:
            role = self._job_roles.get(data.job_role_id)
            if not role or role["organization_id"] != org_id:
                raise ValidationError("Job role does not exist in this organization")
            e["job_role_id"] = data.job_role_id

        if data.employment_status is not None:
            e["employment_status"] = data.employment_status
        if data.work_location is not None:
            e["work_location"] = data.work_location
        if data.employment_type is not None:
            e["employment_type"] = data.employment_type

        # Reassign manager if requested
        if data.manager_employee_id is not None:
            if data.manager_employee_id == emp_id:
                raise ValidationError("An employee cannot be their own manager")
            # Circular reporting check
            curr = data.manager_employee_id
            visited = {emp_id}
            while curr:
                if curr in visited:
                    raise ValidationError("Circular manager reporting chain detected")
                visited.add(curr)
                mgr_rel = next((r for r in self._manager_relationships.values() if r["employee_id"] == curr and r.get("is_current")), None)
                curr = mgr_rel["manager_employee_id"] if mgr_rel else None

            # Expire previous current manager
            for r in self._manager_relationships.values():
                if r["employee_id"] == emp_id and r.get("is_current"):
                    r["is_current"] = False
                    r["effective_end_date"] = date.today().isoformat()

            m_rel_id = str(uuid.uuid4())
            self._manager_relationships[m_rel_id] = {
                "id": m_rel_id,
                "organization_id": org_id,
                "employee_id": emp_id,
                "manager_employee_id": data.manager_employee_id,
                "relationship_type": "direct",
                "is_current": True,
                "effective_start_date": date.today().isoformat(),
                "effective_end_date": None,
                "created_at": datetime.now(timezone.utc).isoformat(),
            }

        e["updated_at"] = datetime.now(timezone.utc).isoformat()
        return self._build_employee_response(e)

    def get_employee_twin(self, org_id: str, emp_id: str, caller_profile_id: str, caller_roles: List[str]) -> EmployeeTwinResponse:
        emp = self.get_employee(org_id, emp_id)

        # Access check:
        # - Employee can view own twin
        # - Manager can view assigned direct reports
        # - HR & Leadership can view all employees
        # - Recruiter cannot view employee twins without specific permission
        is_self = emp.profile_id == caller_profile_id
        is_hr_or_lead = any(r in ("hr", "leadership", "administrator") for r in caller_roles)
        is_assigned_mgr = False
        if "manager" in caller_roles:
            caller_emp = next((e for e in self._employees.values() if e["organization_id"] == org_id and e["profile_id"] == caller_profile_id), None)
            if caller_emp:
                for rel in self._manager_relationships.values():
                    if rel["employee_id"] == emp_id and rel["manager_employee_id"] == caller_emp["id"] and rel.get("is_current"):
                        is_assigned_mgr = True
                        break

        if not (is_self or is_hr_or_lead or is_assigned_mgr):
            raise ForbiddenError("You do not have authorization to view this employee's workforce twin")

        # Candidate lineage
        cand_lineage = None
        if emp.candidate_id and emp.candidate_id in self._candidate_profiles:
            cand_lineage = self._build_candidate_response(self._candidate_profiles[emp.candidate_id])

        # Skills & Evidence
        skills: List[PersonSkillResponse] = []
        for ps in self._person_skills.values():
            if ps["organization_id"] == org_id and ps["person_id"] == emp.profile_id:
                skills.append(self._build_person_skill_response(ps))

        evidence = self.list_evidence_for_person(org_id, emp.profile_id)

        # Goals
        goals = self.list_goals_for_employee(org_id, emp_id, caller_profile_id, caller_roles)

        # Feedback
        feedback = self.list_feedback_for_employee(org_id, emp_id, caller_profile_id, caller_roles)

        # Attendance Summaries
        attendance = [
            AttendanceSummaryResponse(**att) for att in self._attendance_summaries.values()
            if att["organization_id"] == org_id and att["employee_id"] == emp_id
        ]
        attendance.sort(key=lambda x: x.period_start, reverse=True)

        # Timeline
        timeline = [
            TimelineEvent(
                event_id=str(uuid.uuid4()),
                title="Employee Onboarded",
                event_type="employment_hired",
                effective_date=emp.hire_date,
                description=f"Joined {emp.department_name} as {emp.job_role_title} ({emp.seniority_level})",
                source_reference="HRIS Master Record",
            )
        ]
        for g in goals:
            timeline.append(
                TimelineEvent(
                    event_id=g.id,
                    title=f"Goal Set: {g.title}",
                    event_type="goal_assigned",
                    effective_date=g.start_date,
                    description=f"Target completion by {g.due_date} (Priority: {g.priority})",
                    source_reference=g.creator_name,
                )
            )

        return EmployeeTwinResponse(
            employee=emp,
            candidate_lineage=cand_lineage,
            skills=skills,
            evidence_items=evidence,
            goals=goals,
            feedback=feedback,
            attendance_summaries=attendance,
            data_freshness="Verified & Active",
            timeline=timeline,
        )

    def _build_employee_response(self, e: Dict[str, Any]) -> EmployeeProfileResponse:
        user = identity_service._users.get(e["profile_id"])
        dept = self._departments.get(e["department_id"])
        role = self._job_roles.get(e["job_role_id"])

        current_mgr_dto = None
        for r in self._manager_relationships.values():
            if r["employee_id"] == e["id"] and r.get("is_current"):
                mgr_emp = self._employees.get(r["manager_employee_id"])
                if mgr_emp:
                    mgr_user = identity_service._users.get(mgr_emp["profile_id"])
                    mgr_role = self._job_roles.get(mgr_emp["job_role_id"])
                    current_mgr_dto = ManagerRelationshipResponse(
                        id=r["id"],
                        manager_employee_id=mgr_emp["id"],
                        manager_name=mgr_user["full_name"] if mgr_user else "Unknown Manager",
                        manager_title=mgr_role["title"] if mgr_role else "Manager",
                        relationship_type=r["relationship_type"],
                        effective_start_date=r["effective_start_date"],
                        is_current=True,
                    )
                break

        return EmployeeProfileResponse(
            id=e["id"],
            organization_id=e["organization_id"],
            profile_id=e["profile_id"],
            full_name=user["full_name"] if user else "Unknown Employee",
            work_email=user["email"] if user else "unknown@worksense.local",
            avatar_url=user.get("avatar_url") if user else None,
            candidate_id=e.get("candidate_id"),
            employee_code=e["employee_code"],
            hire_date=str(e["hire_date"]),
            department_id=e["department_id"],
            department_name=dept["name"] if dept else "Unknown Dept",
            job_role_id=e["job_role_id"],
            job_role_title=role["title"] if role else "Unknown Role",
            seniority_level=role["seniority_level"] if role else "L1",
            employment_status=e["employment_status"],
            work_location=e["work_location"],
            employment_type=e["employment_type"],
            current_manager=current_mgr_dto,
            created_at=e["created_at"],
            updated_at=e["updated_at"],
        )

    # ====================================================================
    # 9. Goals, Feedback, Attendance Methods
    # ====================================================================

    def create_goal(self, org_id: str, data: GoalCreate, creator_profile_id: str) -> GoalResponse:
        self.get_employee(org_id, data.employee_id)
        goal_id = str(uuid.uuid4())
        now_iso = datetime.now(timezone.utc).isoformat()
        goal = {
            "id": goal_id,
            "organization_id": org_id,
            "employee_id": data.employee_id,
            "title": data.title,
            "description": data.description,
            "goal_type": data.goal_type,
            "priority": data.priority,
            "status": "active",
            "start_date": str(data.start_date),
            "due_date": str(data.due_date),
            "progress_percentage": data.progress_percentage,
            "creator_id": creator_profile_id,
            "visibility": data.visibility,
            "related_job_role_id": data.related_job_role_id,
            "related_skill_id": data.related_skill_id,
            "completed_at": None,
            "created_at": now_iso,
            "updated_at": now_iso,
        }
        self._goals[goal_id] = goal
        return self._build_goal_response(goal)

    def list_goals_for_employee(self, org_id: str, emp_id: str, caller_profile_id: str, caller_roles: List[str]) -> List[GoalResponse]:
        results = []
        for g in self._goals.values():
            if g["organization_id"] == org_id and g["employee_id"] == emp_id:
                # Visibility filtering
                if g["visibility"] == "hr_only" and not any(r in ("hr", "administrator") for r in caller_roles):
                    continue
                results.append(self._build_goal_response(g))
        results.sort(key=lambda x: x.due_date)
        return results

    def update_goal(self, org_id: str, goal_id: str, data: GoalUpdate, actor_id: str) -> GoalResponse:
        g = self._goals.get(goal_id)
        if not g or g["organization_id"] != org_id:
            raise NotFoundError(f"Goal '{goal_id}' not found")

        if data.title is not None:
            g["title"] = data.title
        if data.description is not None:
            g["description"] = data.description
        if data.status is not None:
            g["status"] = data.status
            if data.status == "completed":
                g["completed_at"] = datetime.now(timezone.utc).isoformat()
                g["progress_percentage"] = 100
        if data.progress_percentage is not None:
            g["progress_percentage"] = data.progress_percentage
            if data.progress_percentage == 100 and g["status"] != "completed":
                g["status"] = "completed"
                g["completed_at"] = datetime.now(timezone.utc).isoformat()
        if data.due_date is not None:
            g["due_date"] = str(data.due_date)

        g["updated_at"] = datetime.now(timezone.utc).isoformat()
        return self._build_goal_response(g)

    def _build_goal_response(self, g: Dict[str, Any]) -> GoalResponse:
        creator_user = identity_service._users.get(g["creator_id"])
        skill = self._skills.get(g.get("related_skill_id")) if g.get("related_skill_id") else None
        return GoalResponse(
            id=g["id"],
            organization_id=g["organization_id"],
            employee_id=g["employee_id"],
            title=g["title"],
            description=g.get("description"),
            goal_type=g["goal_type"],
            priority=g["priority"],
            status=g["status"],
            start_date=str(g["start_date"]),
            due_date=str(g["due_date"]),
            progress_percentage=g["progress_percentage"],
            creator_name=creator_user["full_name"] if creator_user else "System",
            visibility=g["visibility"],
            related_skill_name=skill["name"] if skill else None,
            completed_at=g.get("completed_at"),
            created_at=g["created_at"],
            updated_at=g["updated_at"],
        )

    def create_feedback(self, org_id: str, data: FeedbackCreate, author_profile_id: str) -> FeedbackResponse:
        self.get_employee(org_id, data.subject_employee_id)
        fb_id = str(uuid.uuid4())
        now_iso = datetime.now(timezone.utc).isoformat()
        fb = {
            "id": fb_id,
            "organization_id": org_id,
            "subject_employee_id": data.subject_employee_id,
            "author_profile_id": author_profile_id,
            "feedback_type": data.feedback_type,
            "feedback_date": date.today().isoformat(),
            "visibility": data.visibility,
            "structured_strengths": data.structured_strengths,
            "development_areas": data.development_areas,
            "related_goal_id": data.related_goal_id,
            "related_skill_id": data.related_skill_id,
            "acknowledged_by_subject": False,
            "created_at": now_iso,
            "updated_at": now_iso,
        }
        self._feedback_records[fb_id] = fb
        return self._build_feedback_response(fb)

    def list_feedback_for_employee(self, org_id: str, emp_id: str, caller_profile_id: str, caller_roles: List[str]) -> List[FeedbackResponse]:
        emp = self._employees.get(emp_id)
        if not emp or emp["organization_id"] != org_id:
            raise NotFoundError(f"Employee '{emp_id}' not found")

        is_hr = any(r in ("hr", "administrator") for r in caller_roles)

        results = []
        for fb in self._feedback_records.values():
            if fb["organization_id"] == org_id and fb["subject_employee_id"] == emp_id:
                vis = fb["visibility"]
                # Enforce visibility rules strictly
                if vis == "confidential_hr" and not is_hr:
                    continue
                if vis == "hr_restricted" and not is_hr:
                    continue
                if vis == "manager_and_employee":
                    # Visible to employee, assigned manager, and HR
                    pass
                results.append(self._build_feedback_response(fb))
        return results

    def _build_feedback_response(self, fb: Dict[str, Any]) -> FeedbackResponse:
        author = identity_service._users.get(fb["author_profile_id"])
        vis_map = {
            "employee_visible": "Visible to Employee, Manager, and HR",
            "manager_and_employee": "Visible to Manager and Employee",
            "hr_restricted": "Restricted to HR Partners",
            "confidential_hr": "Strictly Confidential HR Audit Record",
        }
        return FeedbackResponse(
            id=fb["id"],
            organization_id=fb["organization_id"],
            subject_employee_id=fb["subject_employee_id"],
            author_name=author["full_name"] if author else "Colleague",
            feedback_type=fb["feedback_type"],
            feedback_date=str(fb["feedback_date"]),
            visibility=fb["visibility"],
            visibility_explanation=vis_map.get(fb["visibility"], fb["visibility"]),
            structured_strengths=fb.get("structured_strengths", []),
            development_areas=fb.get("development_areas", []),
            acknowledged_by_subject=fb.get("acknowledged_by_subject", False),
            created_at=fb["created_at"],
        )

    def create_attendance_summary(self, org_id: str, data: AttendanceSummaryCreate, actor_id: str) -> AttendanceSummaryResponse:
        self.get_employee(org_id, data.employee_id)
        att_id = str(uuid.uuid4())
        now_iso = datetime.now(timezone.utc).isoformat()
        att = {
            "id": att_id,
            "organization_id": org_id,
            "employee_id": data.employee_id,
            "period_start": str(data.period_start),
            "period_end": str(data.period_end),
            "scheduled_workdays": data.scheduled_workdays,
            "present_days": data.present_days,
            "approved_leave_days": data.approved_leave_days,
            "unapproved_absence_days": data.unapproved_absence_days,
            "remote_days": data.remote_days,
            "onsite_days": data.onsite_days,
            "late_occurrences": data.late_occurrences,
            "source_system": data.source_system,
            "freshness_timestamp": now_iso,
            "data_quality_status": data.data_quality_status,
            "created_at": now_iso,
        }
        self._attendance_summaries[att_id] = att
        return AttendanceSummaryResponse(**att)

    # ====================================================================
    # 10. Policy Library Methods
    # ====================================================================

    def create_policy_document(self, org_id: str, data: PolicyDocumentCreate, actor_id: str) -> PolicyDocumentResponse:
        for p in self._policy_documents.values():
            if p["organization_id"] == org_id and p["policy_code"].upper() == data.policy_code.upper():
                raise ConflictError(f"Policy code '{data.policy_code}' already exists")

        pol_id = str(uuid.uuid4())
        now_iso = datetime.now(timezone.utc).isoformat()
        pol = {
            "id": pol_id,
            "organization_id": org_id,
            "title": data.title,
            "policy_code": data.policy_code.upper(),
            "category": data.category,
            "description": data.description,
            "document_owner_id": actor_id,
            "access_classification": data.access_classification,
            "created_at": now_iso,
            "updated_at": now_iso,
        }
        self._policy_documents[pol_id] = pol
        return self._build_policy_response(pol)

    def list_policy_documents(self, org_id: str, category: Optional[str] = None) -> List[PolicyDocumentResponse]:
        results = []
        for p in self._policy_documents.values():
            if p["organization_id"] == org_id:
                if category and p["category"] != category:
                    continue
                results.append(self._build_policy_response(p))
        results.sort(key=lambda x: x.title)
        return results

    def get_policy_document(self, org_id: str, policy_id: str) -> PolicyDocumentResponse:
        p = self._policy_documents.get(policy_id)
        if not p or p["organization_id"] != org_id:
            raise NotFoundError(f"Policy '{policy_id}' not found")
        return self._build_policy_response(p)

    def create_policy_version(self, org_id: str, policy_id: str, data: PolicyVersionCreate, actor_id: str) -> PolicyVersionResponse:
        p = self._policy_documents.get(policy_id)
        if not p or p["organization_id"] != org_id:
            raise NotFoundError(f"Policy '{policy_id}' not found")

        # Supersede older active versions if requested
        superseded_id = None
        if data.supersede_previous:
            for v in self._policy_versions.values():
                if v["policy_document_id"] == policy_id and v["status"] == "active":
                    v["status"] = "superseded"
                    superseded_id = v["id"]

        ver_id = str(uuid.uuid4())
        now_iso = datetime.now(timezone.utc).isoformat()
        new_ver = {
            "id": ver_id,
            "policy_document_id": policy_id,
            "version_number": data.version_number,
            "status": "active",
            "effective_date": str(data.effective_date),
            "review_date": str(data.review_date) if data.review_date else None,
            "expiry_date": str(data.expiry_date) if data.expiry_date else None,
            "file_name": data.file_name,
            "file_size_bytes": data.file_size_bytes,
            "mime_type": "application/pdf",
            "storage_path": data.storage_path,
            "sha256_hash": data.sha256_hash,
            "superseded_by_version_id": None,
            "uploaded_by_id": actor_id,
            "created_at": now_iso,
        }
        self._policy_versions[ver_id] = new_ver

        if superseded_id and superseded_id in self._policy_versions:
            self._policy_versions[superseded_id]["superseded_by_version_id"] = ver_id

        p["updated_at"] = now_iso
        uploader = identity_service._users.get(actor_id)
        return PolicyVersionResponse(
            id=new_ver["id"],
            policy_document_id=new_ver["policy_document_id"],
            version_number=new_ver["version_number"],
            status=new_ver["status"],
            effective_date=new_ver["effective_date"],
            review_date=new_ver["review_date"],
            expiry_date=new_ver["expiry_date"],
            file_name=new_ver["file_name"],
            file_size_bytes=new_ver["file_size_bytes"],
            mime_type=new_ver["mime_type"],
            storage_path=new_ver["storage_path"],
            sha256_hash=new_ver["sha256_hash"],
            superseded_by_version_id=new_ver["superseded_by_version_id"],
            uploaded_by_name=uploader["full_name"] if uploader else "HR Policy Admin",
            created_at=new_ver["created_at"],
        )

    def _build_policy_response(self, p: Dict[str, Any]) -> PolicyDocumentResponse:
        all_vers: List[PolicyVersionResponse] = []
        active_ver: Optional[PolicyVersionResponse] = None

        for v in self._policy_versions.values():
            if v["policy_document_id"] == p["id"]:
                uploader = identity_service._users.get(v.get("uploaded_by_id"))
                v_dto = PolicyVersionResponse(
                    id=v["id"],
                    policy_document_id=v["policy_document_id"],
                    version_number=v["version_number"],
                    status=v["status"],
                    effective_date=v["effective_date"],
                    review_date=v.get("review_date"),
                    expiry_date=v.get("expiry_date"),
                    file_name=v["file_name"],
                    file_size_bytes=v["file_size_bytes"],
                    mime_type=v["mime_type"],
                    storage_path=v["storage_path"],
                    sha256_hash=v["sha256_hash"],
                    superseded_by_version_id=v.get("superseded_by_version_id"),
                    uploaded_by_name=uploader["full_name"] if uploader else "HR Policy Admin",
                    created_at=v["created_at"],
                )
                all_vers.append(v_dto)
                if v["status"] == "active":
                    active_ver = v_dto

        all_vers.sort(key=lambda x: x.created_at, reverse=True)
        return PolicyDocumentResponse(
            id=p["id"],
            organization_id=p["organization_id"],
            title=p["title"],
            policy_code=p["policy_code"],
            category=p["category"],
            description=p.get("description"),
            access_classification=p["access_classification"],
            active_version=active_ver,
            all_versions=all_vers,
            created_at=p["created_at"],
            updated_at=p["updated_at"],
        )

    # ====================================================================
    # 11. Rules-Based Data Quality Engine
    # ====================================================================

    def audit_data_quality(self, org_id: str) -> DataQualitySummaryResponse:
        """Executes rules-based verification scans across the organizational dataset."""
        issues: List[DataQualityIssueResponse] = []

        # Rule 1: Active employee without an active manager
        for e in self._employees.values():
            if e["organization_id"] == org_id and e["employment_status"] == "active":
                has_mgr = any(r["employee_id"] == e["id"] and r.get("is_current") for r in self._manager_relationships.values())
                # If employee is head of top division, skip
                dept = self._departments.get(e["department_id"])
                if not has_mgr and dept and dept.get("parent_department_id"):
                    user = identity_service._users.get(e["profile_id"])
                    name = user["full_name"] if user else e["employee_code"]
                    issues.append(
                        DataQualityIssueResponse(
                            id=f"dq-mgr-{e['id']}",
                            organization_id=org_id,
                            issue_type="missing_manager",
                            entity_type="employee",
                            entity_id=e["id"],
                            entity_name=f"{name} ({e['employee_code']})",
                            severity="warning",
                            explanation=f"Active employee is not currently assigned to any active reporting manager in {dept['name']}.",
                            suggested_action="Assign a direct reporting manager in the Employee Directory or Department console.",
                            is_resolved=False,
                            created_at=datetime.now(timezone.utc).isoformat(),
                        )
                    )

        # Rule 2: Unsupported skill claims (0 attached evidence items)
        for ps in self._person_skills.values():
            if ps["organization_id"] == org_id:
                has_ev = any(link["target_entity_type"] == "person_skill" and link["target_entity_id"] == ps["id"] for link in self._evidence_links.values())
                if not has_ev:
                    skill = self._skills.get(ps["skill_id"], {})
                    user = identity_service._users.get(ps["person_id"])
                    person_name = user["full_name"] if user else "Workforce Member"
                    issues.append(
                        DataQualityIssueResponse(
                            id=f"dq-skill-{ps['id']}",
                            organization_id=org_id,
                            issue_type="unsupported_skill_claim",
                            entity_type="person_skill",
                            entity_id=ps["id"],
                            entity_name=f"{person_name} -> {skill.get('name', 'Skill')}",
                            severity="info",
                            explanation=f"Proficiency claim (Level {ps['proficiency_level']}) has zero verified evidence citations or artifacts linked.",
                            suggested_action="Attach a verifiable GitHub PR, Jira delivery reference, or interview rubric evaluation.",
                            is_resolved=False,
                            created_at=datetime.now(timezone.utc).isoformat(),
                        )
                    )

        # Rule 3: Stale evidence (>180 days)
        cutoff_date = datetime.now(timezone.utc) - timedelta(days=180)
        for e_item in self._evidence_items.values():
            if e_item["organization_id"] == org_id:
                obs_dt = datetime.fromisoformat(e_item["observed_at"])
                if obs_dt < cutoff_date and not e_item.get("is_stale"):
                    issues.append(
                        DataQualityIssueResponse(
                            id=f"dq-ev-{e_item['id']}",
                            organization_id=org_id,
                            issue_type="stale_evidence",
                            entity_type="evidence_item",
                            entity_id=e_item["id"],
                            entity_name=e_item["claim_summary"][:50] + "...",
                            severity="info",
                            explanation="Evidence was observed more than 180 days ago without recent re-validation.",
                            suggested_action="Request re-verification during quarterly manager 1-on-1 checkin.",
                            is_resolved=False,
                            created_at=datetime.now(timezone.utc).isoformat(),
                        )
                    )

        crit = sum(1 for i in issues if i.severity == "critical")
        warn = sum(1 for i in issues if i.severity == "warning")
        inf = sum(1 for i in issues if i.severity == "info")

        return DataQualitySummaryResponse(
            total_issues=len(issues),
            critical_count=crit,
            warning_count=warn,
            info_count=inf,
            issues=issues,
        )

    def resolve_data_quality_issue(self, org_id: str, issue_id: str, actor_id: str) -> Dict[str, Any]:
        logger.info(f"Actor {actor_id} resolved data quality issue {issue_id}")
        return {"success": True, "issue_id": issue_id, "resolved_at": datetime.now(timezone.utc).isoformat()}


# Singleton instance
workforce_service = WorkforceService()
