"""Authoritative Canonical Golden Demo Dataset for WorkSense.

Establishes a single, un-compromised source of truth for:
- Elena Rostova (Senior Distributed Systems Engineer, EMP-10550, CAN-10550)
- Marcus Chen (Senior Infrastructure Engineer, EMP-10492, 72% Retention Risk)
- Marcus Vance (Engineering Manager, EMP-10021)
- TechCorp International (Org ID: 00000000-0000-0000-0000-000000000001)
- Target Mobility Role: "Principal Distributed Systems Architect — AI Fraud Detection Initiative"
"""

from typing import Any, Dict

# ==============================================================================
# 1. Organization & Tenants
# ==============================================================================
ORG_TECHCORP_ID = "00000000-0000-0000-0000-000000000001"
ORG_TECHCORP_NAME = "TechCorp International"
ORG_TECHCORP_SLUG = "techcorp"

ORG_ACMECORP_ID = "00000000-0000-0000-0000-000000000002"
ORG_ACMECORP_NAME = "AcmeCorp Global"
ORG_ACMECORP_SLUG = "acmecorp"

# ==============================================================================
# 2. Canonical Departments
# ==============================================================================
DEPT_ENG_ID = "60000000-0000-0000-0000-000000000001"
DEPT_ENG_CODE = "ENG"
DEPT_ENG_NAME = "Engineering Division"

DEPT_INFRA_ID = "60000000-0000-0000-0000-000000000002"
DEPT_INFRA_CODE = "ENG-INFRA"
DEPT_INFRA_NAME = "Platform Infrastructure"

DEPT_AI_ID = "60000000-0000-0000-0000-000000000003"
DEPT_AI_CODE = "ENG-AI"
DEPT_AI_NAME = "AI Research & Fraud Detection"

DEPT_PEOPLE_ID = "60000000-0000-0000-0000-000000000004"
DEPT_PEOPLE_CODE = "PEOPLE"
DEPT_PEOPLE_NAME = "People Operations"

# ==============================================================================
# 3. Canonical Job Roles & Requisitions
# ==============================================================================
# Elena's Applied & Hired Role
ROLE_ELENA_APPLIED_ID = "61000000-0000-0000-0000-000000000001"
ROLE_ELENA_APPLIED_CODE = "ROLE-DIST-SR"
ROLE_ELENA_APPLIED_TITLE = "Senior Distributed Systems Engineer"

# Marcus Chen's Current Role
ROLE_MARCUS_CURRENT_ID = "61000000-0000-0000-0000-000000000002"
ROLE_MARCUS_CURRENT_CODE = "ROLE-INFRA-SR"
ROLE_MARCUS_CURRENT_TITLE = "Senior Infrastructure Engineer"

# Lead Talent Acquisition Specialist
ROLE_TA_LEAD_ID = "61000000-0000-0000-0000-000000000003"
ROLE_TA_LEAD_CODE = "ROLE-TA-LEAD"
ROLE_TA_LEAD_TITLE = "Lead Talent Acquisition Specialist"

# Senior People Partner
ROLE_HRBP_SR_ID = "61000000-0000-0000-0000-000000000004"
ROLE_HRBP_SR_CODE = "ROLE-HRBP-SR"
ROLE_HRBP_SR_TITLE = "Senior People Partner (HRBP)"

# Marcus Chen's Target Mobility Role (Exact string everywhere)
ROLE_MARCUS_TARGET_ID = "61000000-0000-0000-0000-000000000005"
ROLE_MARCUS_TARGET_CODE = "ROLE-ARCH-PRIN"
ROLE_MARCUS_TARGET_TITLE = "Principal Distributed Systems Architect — AI Fraud Detection Initiative"

# Marcus Vance's Manager Title
ROLE_VANCE_MANAGER_TITLE = "Engineering Manager"

# ==============================================================================
# 4. Authoritative Candidate-to-Employee Lifecycle State Machine
# ==============================================================================
LIFECYCLE_APPLICATION_SUBMITTED = "application_submitted"
LIFECYCLE_EVALUATION_COMPLETE = "evaluation_complete"
LIFECYCLE_OFFER_EXTENDED = "offer_extended"
LIFECYCLE_OFFER_ACCEPTED = "offer_accepted"
LIFECYCLE_PREBOARDING_ACTIVE = "preboarding_active"
LIFECYCLE_EMPLOYEE_CONVERTED = "employee_converted"
LIFECYCLE_ONBOARDING_ACTIVE = "onboarding_active"

LIFECYCLE_SEQUENCE = [
    LIFECYCLE_APPLICATION_SUBMITTED,
    LIFECYCLE_EVALUATION_COMPLETE,
    LIFECYCLE_OFFER_EXTENDED,
    LIFECYCLE_OFFER_ACCEPTED,
    LIFECYCLE_PREBOARDING_ACTIVE,
    LIFECYCLE_EMPLOYEE_CONVERTED,
    LIFECYCLE_ONBOARDING_ACTIVE,
]

LIFECYCLE_DISPLAY_LABELS = {
    LIFECYCLE_APPLICATION_SUBMITTED: "Application Submitted",
    LIFECYCLE_EVALUATION_COMPLETE: "Evaluation Complete",
    LIFECYCLE_OFFER_EXTENDED: "Offer Extended",
    LIFECYCLE_OFFER_ACCEPTED: "Offer Accepted",
    LIFECYCLE_PREBOARDING_ACTIVE: "Preboarding Active",
    LIFECYCLE_EMPLOYEE_CONVERTED: "Employee Converted",
    LIFECYCLE_ONBOARDING_ACTIVE: "Onboarding Active",
}

# ==============================================================================
# 5. Canonical Personas & Identifiers
# ==============================================================================

# --- Elena Rostova (Candidate -> Employee Twin) ---
ELENA_PROFILE_ID = "30000000-0000-0000-0000-000000000001"
ELENA_CANDIDATE_ID = "30000000-0000-0000-0000-000000000001"
ELENA_EMPLOYEE_ID = "69000000-0000-0000-0000-000000000003"
ELENA_EMPLOYEE_CODE = "EMP-10550"
ELENA_FULL_NAME = "Elena Rostova"
ELENA_EMAIL = "candidate@worksense.local"
ELENA_PERSONAL_EMAIL = "elena.rostova@example.com"
ELENA_APPLIED_ROLE_TITLE = ROLE_ELENA_APPLIED_TITLE
ELENA_APPLICATION_STATUS = "offer_accepted"
ELENA_RECORD_STATUS = "offer_accepted"
ELENA_LIFECYCLE_STATE = LIFECYCLE_PREBOARDING_ACTIVE
ELENA_CANDIDATE_FACING_STATUS = "Preboarding Active"
ELENA_INTERVIEW_SCORE = 92.0
ELENA_JOB_OPENING_ID = "40000000-0000-0000-0000-000000000001"
ELENA_REQUIREMENT_VERSION_ID = "40000000-0000-0000-0000-000000000002"
ELENA_RESUME_ID = "40000000-0000-0000-0000-000000000010"
ELENA_INTERVIEW_KIT_ID = "50000000-0000-0000-0000-000000000001"
ELENA_INTERVIEW_SESSION_ID = "50000000-0000-0000-0000-000000000002"
ELENA_APPLICATION_ID = "50000000-0000-0000-0000-000000000001"
ELENA_ONBOARDING_CASE_ID = "55000000-0000-0000-0000-000000000001"
ELENA_ONBOARDING_PLAN_ID = "56000000-0000-0000-0000-000000000001"
ELENA_RECOMMENDATION_ID = "80000000-0000-0000-0000-000000000002"
ELENA_ONBOARDING_RECOMMENDATION_ID = ELENA_RECOMMENDATION_ID

# --- Marcus Chen (Key Person Retention & Internal Mobility) ---
MARCUS_CHEN_PROFILE_ID = "30000000-0000-0000-0000-000000000002"
MARCUS_CHEN_EMPLOYEE_ID = "69000000-0000-0000-0000-000000000002"
MARCUS_CHEN_EMPLOYEE_CODE = "EMP-10492"
MARCUS_CHEN_FULL_NAME = "Marcus Chen"
MARCUS_CHEN_EMAIL = "employee@techcorp.local"
MARCUS_CHEN_CURRENT_ROLE = ROLE_MARCUS_CURRENT_TITLE
MARCUS_CHEN_TENURE_YEARS = 3.5
MARCUS_CHEN_SENIORITY_BAND = "L5"
MARCUS_CHEN_RETENTION_RISK_SCORE = 0.720
MARCUS_CHEN_RETENTION_RISK_PERCENT = 72.0
MARCUS_CHEN_RISK_BAND = "priority_review"
MARCUS_CHEN_TARGET_ROLE = ROLE_MARCUS_TARGET_TITLE
MARCUS_CHEN_MOBILITY_MATCH_SCORE = 88.0
MARCUS_CHEN_RECOMMENDATION_ID = "80000000-0000-0000-0000-000000000001"

# --- Marcus Vance (Manager of Engineering & Onboarding) ---
MARCUS_VANCE_PROFILE_ID = "30000000-0000-0000-0000-000000000003"
MARCUS_VANCE_EMPLOYEE_ID = "69000000-0000-0000-0000-000000000001"
MARCUS_VANCE_EMPLOYEE_CODE = "EMP-10021"
MARCUS_VANCE_FULL_NAME = "Marcus Vance"
MARCUS_VANCE_EMAIL = "manager@techcorp.local"
MARCUS_VANCE_ROLE_TITLE = ROLE_VANCE_MANAGER_TITLE

# --- Suspended Demo Account ---
SUSPENDED_USER_PROFILE_ID = "30000000-0000-0000-0000-000000000009"
SUSPENDED_USER_EMAIL = "suspended@techcorp.local"
SUSPENDED_USER_FULL_NAME = "David Wallace"

# ==============================================================================
# 6. Accessor Functions
# ==============================================================================


def get_canonical_elena() -> Dict[str, Any]:
    """Returns canonical Elena Rostova record."""
    return {
        "profile_id": ELENA_PROFILE_ID,
        "candidate_id": ELENA_CANDIDATE_ID,
        "employee_id": ELENA_EMPLOYEE_ID,
        "employee_code": ELENA_EMPLOYEE_CODE,
        "full_name": ELENA_FULL_NAME,
        "email": ELENA_EMAIL,
        "personal_email": ELENA_PERSONAL_EMAIL,
        "applied_role_title": ELENA_APPLIED_ROLE_TITLE,
        "status": ELENA_APPLICATION_STATUS,
        "record_status": ELENA_RECORD_STATUS,
        "lifecycle_state": ELENA_LIFECYCLE_STATE,
        "candidate_facing_status": ELENA_CANDIDATE_FACING_STATUS,
        "interview_score": ELENA_INTERVIEW_SCORE,
        "job_opening_id": ELENA_JOB_OPENING_ID,
        "requirement_version_id": ELENA_REQUIREMENT_VERSION_ID,
        "resume_id": ELENA_RESUME_ID,
        "interview_kit_id": ELENA_INTERVIEW_KIT_ID,
        "interview_session_id": ELENA_INTERVIEW_SESSION_ID,
        "application_id": ELENA_APPLICATION_ID,
        "onboarding_case_id": ELENA_ONBOARDING_CASE_ID,
        "onboarding_plan_id": ELENA_ONBOARDING_PLAN_ID,
        "recommendation_id": ELENA_RECOMMENDATION_ID,
        "manager_profile_id": MARCUS_VANCE_PROFILE_ID,
        "manager_name": MARCUS_VANCE_FULL_NAME,
    }


def get_canonical_marcus_chen() -> Dict[str, Any]:
    """Returns canonical Marcus Chen record."""
    return {
        "profile_id": MARCUS_CHEN_PROFILE_ID,
        "employee_id": MARCUS_CHEN_EMPLOYEE_ID,
        "employee_code": MARCUS_CHEN_EMPLOYEE_CODE,
        "full_name": MARCUS_CHEN_FULL_NAME,
        "email": MARCUS_CHEN_EMAIL,
        "current_role": MARCUS_CHEN_CURRENT_ROLE,
        "tenure_years": MARCUS_CHEN_TENURE_YEARS,
        "seniority_band": MARCUS_CHEN_SENIORITY_BAND,
        "retention_risk_score": MARCUS_CHEN_RETENTION_RISK_SCORE,
        "retention_risk_percent": MARCUS_CHEN_RETENTION_RISK_PERCENT,
        "risk_band": MARCUS_CHEN_RISK_BAND,
        "target_role": MARCUS_CHEN_TARGET_ROLE,
        "mobility_match_score": MARCUS_CHEN_MOBILITY_MATCH_SCORE,
        "recommendation_id": MARCUS_CHEN_RECOMMENDATION_ID,
        "manager_profile_id": MARCUS_VANCE_PROFILE_ID,
        "manager_name": MARCUS_VANCE_FULL_NAME,
    }
